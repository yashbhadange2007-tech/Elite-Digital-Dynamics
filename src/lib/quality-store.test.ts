import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Store = typeof import('./quality-store');

/** The few DOM pieces the store touches: <html> attributes, localStorage, one media query. */
function installDom(options: { reduced?: boolean; stored?: string | null; storageBlocked?: boolean } = {}) {
  const attributes = new Map<string, string>();
  const storage = new Map<string, string>();
  if (options.stored != null) storage.set('edd-motion', options.stored);

  const osListeners = new Set<() => void>();
  const mediaQuery = {
    matches: options.reduced ?? false,
    addEventListener: (_type: string, listener: () => void) => osListeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) => osListeners.delete(listener),
  };

  const guard = () => {
    if (options.storageBlocked) throw new Error('storage blocked');
  };
  const localStorage = {
    getItem: (key: string) => (guard(), storage.get(key) ?? null),
    setItem: (key: string, value: string) => (guard(), void storage.set(key, value)),
    removeItem: (key: string) => (guard(), void storage.delete(key)),
  };
  const matchMedia = () => mediaQuery;

  vi.stubGlobal('window', { localStorage, matchMedia });
  vi.stubGlobal('localStorage', localStorage);
  vi.stubGlobal('matchMedia', matchMedia);
  vi.stubGlobal('document', {
    documentElement: {
      getAttribute: (name: string) => attributes.get(name) ?? null,
      setAttribute: (name: string, value: string) => void attributes.set(name, value),
    },
  });

  return {
    attributes,
    storage,
    setOsReduced(reduced: boolean) {
      mediaQuery.matches = reduced;
      for (const listener of osListeners) listener();
    },
  };
}

async function loadStore(): Promise<Store> {
  vi.resetModules();
  return import('./quality-store');
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('quality store', () => {
  it('starts with the values the server renders', async () => {
    installDom();
    const store = await loadStore();
    expect(store.getQuality()).toEqual({ glass: 'lite', motion: 'full' });
    expect(store.getServerQuality()).toBe(store.getServerQuality());
    expect(store.getQuality()).toBe(store.getServerQuality());
  });

  it('setters replace the snapshot, notify once and write the root attributes', async () => {
    const dom = installDom();
    const store = await loadStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    const before = store.getQuality();
    store.setGlass('real');
    expect(store.getQuality()).not.toBe(before);
    expect(store.getQuality()).toEqual({ glass: 'real', motion: 'full' });
    expect(dom.attributes.get('data-glass')).toBe('real');
    expect(listener).toHaveBeenCalledTimes(1);

    store.setMotion('still');
    expect(dom.attributes.get('data-motion')).toBe('still');
    expect(store.getQuality()).toEqual({ glass: 'real', motion: 'still' });
    expect(listener).toHaveBeenCalledTimes(2);

    // No change: same snapshot object, no notification (required by useSyncExternalStore).
    const same = store.getQuality();
    store.setMotion('still');
    store.setGlass('real');
    expect(store.getQuality()).toBe(same);
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    store.setGlass('lite');
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('does nothing harmful without a DOM (server render)', async () => {
    const store = await loadStore();
    expect(() => {
      store.initMotionPreference();
      store.initGlass();
      store.setGlass('real');
    }).not.toThrow();
    expect(store.getQuality()).toEqual({ glass: 'real', motion: 'full' });
  });
});

describe('motion preference', () => {
  const cases: {
    name: string;
    reduced: boolean;
    stored: string | null;
    storageBlocked?: boolean;
    expected: 'full' | 'still';
  }[] = [
    { name: 'no saved choice, OS allows motion', reduced: false, stored: null, expected: 'full' },
    { name: 'no saved choice, OS asks for reduced motion', reduced: true, stored: null, expected: 'still' },
    { name: 'saved "still" wins over an OS that allows motion', reduced: false, stored: 'still', expected: 'still' },
    { name: 'saved "full" wins over reduced motion', reduced: true, stored: 'full', expected: 'full' },
    { name: 'an unknown saved value is ignored', reduced: true, stored: 'yes', expected: 'still' },
    { name: 'blocked storage falls back to the OS', reduced: true, stored: 'full', storageBlocked: true, expected: 'still' },
  ];

  for (const { name, expected, ...options } of cases) {
    it(`${name}: store and pre-paint script both give "${expected}"`, async () => {
      const dom = installDom(options);
      const store = await loadStore();

      // The inline script runs first in a real page.
      new Function(store.MOTION_BOOT_SCRIPT)();
      expect(dom.attributes.get('data-motion')).toBe(expected);

      store.initMotionPreference();
      expect(store.getQuality().motion).toBe(expected);
      expect(dom.attributes.get('data-motion')).toBe(expected);
    });
  }

  it('re-applies both root attributes when called again (React dev remount resets them)', async () => {
    const dom = installDom({ stored: 'still' });
    const store = await loadStore();
    store.initMotionPreference();
    store.setGlass('real');

    dom.attributes.set('data-glass', 'lite');
    dom.attributes.set('data-motion', 'full');
    store.initMotionPreference();

    expect(dom.attributes.get('data-glass')).toBe('real');
    expect(dom.attributes.get('data-motion')).toBe('still');
  });

  it('toggle saves only a choice that differs from the OS setting', async () => {
    const dom = installDom({ reduced: false });
    const store = await loadStore();
    store.initMotionPreference();

    store.toggleMotion();
    expect(store.getQuality().motion).toBe('still');
    expect(dom.storage.get('edd-motion')).toBe('still');

    store.toggleMotion();
    expect(store.getQuality().motion).toBe('full');
    expect(dom.storage.has('edd-motion')).toBe(false);
  });

  it('toggle lets a reduced-motion visitor opt in, and back out', async () => {
    const dom = installDom({ reduced: true });
    const store = await loadStore();
    store.initMotionPreference();
    expect(store.getQuality().motion).toBe('still');

    store.toggleMotion();
    expect(store.getQuality().motion).toBe('full');
    expect(dom.storage.get('edd-motion')).toBe('full');

    store.toggleMotion();
    expect(store.getQuality().motion).toBe('still');
    expect(dom.storage.has('edd-motion')).toBe(false);
  });

  it('toggle still works when storage is blocked', async () => {
    installDom({ storageBlocked: true });
    const store = await loadStore();
    store.initMotionPreference();
    expect(() => store.toggleMotion()).not.toThrow();
    expect(store.getQuality().motion).toBe('still');
  });

  it('follows a change of the OS setting during the visit and drops the saved choice', async () => {
    const dom = installDom({ reduced: false, stored: 'still' });
    const store = await loadStore();
    store.initMotionPreference();
    store.initMotionPreference(); // a second call must not add a second listener
    const listener = vi.fn();
    store.subscribe(listener);

    dom.setOsReduced(true);
    expect(store.getQuality().motion).toBe('still');
    expect(dom.storage.has('edd-motion')).toBe(false);
    expect(listener).not.toHaveBeenCalled(); // still -> still: nothing changed

    dom.setOsReduced(false);
    expect(store.getQuality().motion).toBe('full');
    expect(dom.attributes.get('data-motion')).toBe('full');
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
