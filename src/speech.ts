const STORAGE_KEY = 'flag-map:sound';

// Used when localStorage can't be read or written (private mode, blocked storage).
let soundOnFallback = true;

// False during SSR and in browsers with no voices. Chrome loads its voices late, so
// callers that show UI should check again on `voiceschanged`.
export function canSpeak(): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  return window.speechSynthesis.getVoices().length > 0;
}

export function isSoundOn(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'on' || saved === 'off') return saved === 'on';
  } catch {}
  return soundOnFallback;
}

export function setSoundOn(on: boolean) {
  soundOnFallback = on;
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
  } catch {}
  if (!on && canSpeak()) window.speechSynthesis.cancel();
}

// English until the app speaks other languages (#3): the device's default voice if it is
// English, then a US voice, then any English one.
function englishVoice(): SpeechSynthesisVoice | undefined {
  const english = window.speechSynthesis.getVoices().filter(voice => voice.lang.toLowerCase().startsWith('en'));
  return english.find(voice => voice.default) ?? english.find(voice => voice.lang.toLowerCase() === 'en-us') ?? english[0];
}

export function speak(text: string) {
  if (!canSpeak() || !isSoundOn()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  const voice = englishVoice();
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  }
  synth.speak(utterance);
}
