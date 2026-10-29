import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { canSpeak, isSoundOn, setSoundOn, speak } from './speech';

type Voice = Pick<SpeechSynthesisVoice, 'lang' | 'default' | 'name'>;

class FakeUtterance {
  lang = '';
  voice: Voice | null = null;
  constructor(public text: string) {}
}

function fakeSynth(voices: Voice[]) {
  return { getVoices: vi.fn(() => voices), speak: vi.fn(), cancel: vi.fn() };
}

function fakeStorage() {
  const items = new Map<string, string>();
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  };
}

const VOICES: Voice[] = [
  { name: 'Anna', lang: 'de-DE', default: true },
  { name: 'Daniel', lang: 'en-GB', default: false },
  { name: 'Samantha', lang: 'en-US', default: false },
];

let synth: ReturnType<typeof fakeSynth>;

beforeEach(() => {
  synth = fakeSynth(VOICES);
  vi.stubGlobal('window', { speechSynthesis: synth });
  vi.stubGlobal('localStorage', fakeStorage());
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
});

afterEach(() => {
  setSoundOn(true);
  vi.unstubAllGlobals();
});

describe('canSpeak', () => {
  it('is false with no window (SSR)', () => {
    vi.stubGlobal('window', undefined);
    expect(canSpeak()).toBe(false);
  });

  it('is false when the browser has no speechSynthesis', () => {
    vi.stubGlobal('window', {});
    expect(canSpeak()).toBe(false);
  });

  it('is false while there are no voices', () => {
    vi.stubGlobal('window', { speechSynthesis: fakeSynth([]) });
    expect(canSpeak()).toBe(false);
  });

  it('is true when voices are there', () => {
    expect(canSpeak()).toBe(true);
  });
});

describe('sound setting', () => {
  it('is on by default', () => {
    expect(isSoundOn()).toBe(true);
  });

  it('is saved in localStorage', () => {
    setSoundOn(false);
    expect(localStorage.getItem('flag-map:sound')).toBe('off');
    expect(isSoundOn()).toBe(false);
    setSoundOn(true);
    expect(localStorage.getItem('flag-map:sound')).toBe('on');
    expect(isSoundOn()).toBe(true);
  });

  it('reads a choice saved before a reload', () => {
    localStorage.setItem('flag-map:sound', 'off');
    expect(isSoundOn()).toBe(false);
  });

  it('still works for this visit when storage throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    });
    expect(isSoundOn()).toBe(true);
    setSoundOn(false);
    expect(isSoundOn()).toBe(false);
  });

  it('stops anything still speaking when turned off', () => {
    setSoundOn(false);
    expect(synth.cancel).toHaveBeenCalled();
  });
});

describe('speak', () => {
  it('cancels what is still speaking, then says the text', () => {
    speak('Armenia');
    expect(synth.cancel).toHaveBeenCalledBefore(synth.speak);
    expect(synth.speak).toHaveBeenCalledOnce();
    expect(synth.speak.mock.calls[0][0].text).toBe('Armenia');
  });

  it('uses an English voice, preferring en-US', () => {
    speak('Armenia');
    const utterance = synth.speak.mock.calls[0][0];
    expect(utterance.voice.name).toBe('Samantha');
    expect(utterance.lang).toBe('en-US');
  });

  it('prefers the default voice when it is English', () => {
    synth = fakeSynth([{ name: 'Daniel', lang: 'en-GB', default: true }, ...VOICES.slice(2)]);
    vi.stubGlobal('window', { speechSynthesis: synth });
    speak('Armenia');
    expect(synth.speak.mock.calls[0][0].voice.name).toBe('Daniel');
  });

  it('says nothing when sound is off', () => {
    setSoundOn(false);
    speak('Armenia');
    expect(synth.speak).not.toHaveBeenCalled();
  });

  it('says nothing when the browser cannot speak', () => {
    vi.stubGlobal('window', {});
    expect(() => speak('Armenia')).not.toThrow();
  });
});
