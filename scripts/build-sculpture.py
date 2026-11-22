#!/usr/bin/env python3
"""Builds the shipped sculpture media in public/sculpture/ from the originals in source-media/.

  python3 scripts/build-sculpture.py            # everything
  python3 scripts/build-sculpture.py desktop    # only the desktop frame sequence and poster
  python3 scripts/build-sculpture.py phone      # only the phone loop and poster

Needs ffmpeg, numpy and Pillow. Nothing here runs on Vercel; the outputs are committed.

Desktop: every frame of desktop.mp4 as a WebP, with the generator's sparkle watermark removed.
The sparkle sits on the lower ring, so it cannot be cropped. It is a fixed, semi-transparent
overlay: its shape is measured on phone.mp4 (where it lies on plain black), its strength is fitted
on desktop.mp4, the blend is reversed, and the thin bright outline is filled from its neighbours.

Phone: the calm first part of phone.mp4 (before the zoom and the particle burst), cropped to the
sculpture (which leaves the watermark out), played forward then reversed so the loop has no jump.
"""
import os, subprocess, sys
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'source-media')
OUT = os.path.join(ROOT, 'public', 'sculpture')

DESKTOP = dict(w=1920, h=1080, out_w=1440, out_h=810, quality=46, poster_w=1600, poster_q=80)
PHONE = dict(w=1080, h=1920, last_frame=64, crop=(1080, 1200, 0, 380), out_w=720, out_h=800, crf=27)
CORNER = 240  # the watermark lives inside this bottom-right box


def raw(path, w, h, vf=None):
    cmd = ['ffmpeg', '-v', 'error', '-i', path, '-an']
    if vf:
        cmd += ['-vf', vf, '-fps_mode', 'passthrough']
    cmd += ['-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']
    data = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(data, np.uint8).reshape(-1, h, w, 3)


def morph(mask, n, kind):
    image = Image.fromarray((mask * 255).astype(np.uint8))
    return np.asarray(image.filter(kind(2 * n + 1))) > 127


def blur(x, sigma):
    r = int(3 * sigma)
    k = np.exp(-0.5 * (np.arange(-r, r + 1) / sigma) ** 2)
    k /= k.sum()
    for axis in (0, 1):
        pad = [(0, 0)] * x.ndim
        pad[axis] = (r, r)
        xp = np.pad(x, pad, mode='edge')
        n = x.shape[axis]
        x = sum(k[i] * np.take(xp, range(i, i + n), axis=axis) for i in range(2 * r + 1))
    return x


def watermark_model():
    """Shape from the phone clip, strength from the desktop clip."""
    c = CORNER
    phone = raw(f'{SRC}/phone.mp4', c, c, f'crop={c}:{c}:{PHONE["w"] - c}:{PHONE["h"] - c}').astype(np.float32)
    median = np.median(phone, axis=0)  # drifting sparkles in the scene drop out
    mark = median.mean(axis=2)
    mark[mark < 3] = 0
    star = mark > 3
    core = morph(star, 4, ImageFilter.MinFilter)
    near = morph(star, 6, ImageFilter.MaxFilter) & ~morph(star, 3, ImageFilter.MaxFilter)
    shape = mark / np.median(mark[core])

    desk = raw(f'{SRC}/desktop.mp4', c, c, f'crop={c}:{c}:{DESKTOP["w"] - c}:{DESKTOP["h"] - c}').astype(np.float32)
    inside, around = desk[:, core].mean(axis=1), desk[:, near].mean(axis=1)
    fit = np.array([np.polyfit(around[:, ch], inside[:, ch], 1) for ch in range(3)])  # seen = keep*bg + add
    alpha = (shape[..., None] * (1 - fit[:, 0])).clip(0, 0.9)
    add = shape[..., None] * fit[:, 1]
    band = morph(star, 3, ImageFilter.MaxFilter) & ~morph(star, 3, ImageFilter.MinFilter)
    return alpha, add, band


def remove_watermark(frame, model):
    alpha, add, band = model
    c = CORNER
    box = frame[-c:, -c:].astype(np.float32)
    box = ((box - add) / (1 - alpha)).clip(0, 255)
    valid = (~band).astype(np.float32)[..., None]
    filled = blur(box * valid, 3) / (blur(valid, 3) + 1e-6)
    box = np.where(band[..., None], filled, box)
    out = frame.copy()
    out[-c:, -c:] = box.round().astype(np.uint8)
    return out


def build_desktop():
    d = DESKTOP
    os.makedirs(f'{OUT}/d', exist_ok=True)
    model = watermark_model()
    proc = subprocess.Popen(
        ['ffmpeg', '-v', 'error', '-i', f'{SRC}/desktop.mp4', '-an', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
        stdout=subprocess.PIPE,
    )
    size, total, n = d['w'] * d['h'] * 3, 0, 0
    while True:
        buf = proc.stdout.read(size)
        if len(buf) < size:
            break
        frame = remove_watermark(np.frombuffer(buf, np.uint8).reshape(d['h'], d['w'], 3), model)
        image = Image.fromarray(frame)
        if n == 0:
            poster = image.resize((d['poster_w'], d['poster_w'] * d['h'] // d['w']), Image.LANCZOS)
            poster.save(f'{OUT}/desktop-poster.webp', quality=d['poster_q'], method=6)
        path = f'{OUT}/d/{n:03d}.webp'
        image.resize((d['out_w'], d['out_h']), Image.LANCZOS).save(path, quality=d['quality'], method=6)
        total += os.path.getsize(path)
        n += 1
    print(f'desktop: {n} frames {d["out_w"]}x{d["out_h"]}, {total / 1e6:.2f} MB total, '
          f'poster {os.path.getsize(f"{OUT}/desktop-poster.webp") / 1e3:.0f} KB')


def build_phone():
    p = PHONE
    os.makedirs(OUT, exist_ok=True)
    cw, ch, cx, cy = p['crop']
    last = p['last_frame']
    chain = (f"[0:v]trim=end_frame={last + 1},setpts=PTS-STARTPTS,crop={cw}:{ch}:{cx}:{cy},"
             f"scale={p['out_w']}:{p['out_h']}:flags=lanczos,split[a][b];"
             f"[b]reverse,trim=start_frame=1:end_frame={last},setpts=PTS-STARTPTS[r];[a][r]concat=n=2:v=1[v]")
    base = ['ffmpeg', '-v', 'error', '-y', '-i', f'{SRC}/phone.mp4', '-filter_complex', chain, '-map', '[v]', '-an']
    subprocess.run(base + ['-c:v', 'libx264', '-preset', 'veryslow', '-crf', str(p['crf']), '-pix_fmt', 'yuv420p',
                           '-profile:v', 'main', '-movflags', '+faststart', f'{OUT}/phone.mp4'], check=True)
    # A VP9 WebM of the same loop came out larger than the H.264 file (559 KB against 503 KB), so only MP4 ships.
    first = raw(f'{SRC}/phone.mp4', cw, ch, f"select='eq(n,0)',crop={cw}:{ch}:{cx}:{cy}")[0]
    Image.fromarray(first).resize((p['out_w'], p['out_h']), Image.LANCZOS).save(f'{OUT}/phone-poster.webp', quality=82, method=6)
    for name in ('phone.mp4', 'phone-poster.webp'):
        print(f'{name}: {os.path.getsize(f"{OUT}/{name}") / 1e3:.0f} KB')


if __name__ == '__main__':
    what = sys.argv[1] if len(sys.argv) > 1 else 'all'
    if what in ('all', 'desktop'):
        build_desktop()
    if what in ('all', 'phone'):
        build_phone()
