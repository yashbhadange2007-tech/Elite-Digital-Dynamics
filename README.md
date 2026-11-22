# Elite-Digital-Dynamics
Elite-Digital-Dynamics Website

## Sculpture media

The moving sculpture behind the page is pre-rendered video, not real-time 3D.

- Originals: `source-media/desktop.mp4` and `source-media/phone.mp4` (never shipped).
- Shipped files: `public/sculpture/` (190 desktop frames, the phone loop, two posters).
- Rebuild after changing an original: `python3 scripts/build-sculpture.py` (needs ffmpeg, numpy and Pillow).
- Icons and share image: `node scripts/make-icons.mjs` and `node scripts/capture-og.mjs`.
