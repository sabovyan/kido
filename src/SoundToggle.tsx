import { Toggle } from '@base-ui/react/toggle';
import { useEffect, useState } from 'react';
import { canSpeak, isSoundOn, setSoundOn } from './speech';

function SpeakerIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 6 9H3v6h3l5 4z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9.5 9.5 0 0 1 0 13" />
    </svg>
  );
}

function SpeakerOffIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 6 9H3v6h3l5 4z" />
      <path d="M16 9.5l5 5M21 9.5l-5 5" />
    </svg>
  );
}

export function SoundToggle() {
  // null until mounted and voices are known: the server can't speak, so both renders start empty.
  const [soundOn, setSoundOnState] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const check = () => setSoundOnState(canSpeak() ? isSoundOn() : null);
    check();
    // Chrome fills in its voices after the page loads.
    window.speechSynthesis.addEventListener('voiceschanged', check);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', check);
  }, []);

  if (soundOn === null) return null;

  const change = (on: boolean) => {
    setSoundOn(on);
    setSoundOnState(on);
  };

  return (
    <Toggle
      pressed={soundOn}
      onPressedChange={change}
      aria-label={soundOn ? 'Turn sound off' : 'Turn sound on'}
      className="grid size-tap-icon cursor-pointer place-items-center rounded-md border-3 border-outline bg-surface p-0 text-fg shadow-drop-sm transition-transform duration-(--dur-tap) active:translate-y-1 active:shadow-none motion-reduce:transition-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ocean-500"
    >
      {/* Shows what you hear now: a speaker with waves, or a crossed-out one. */}
      {soundOn ? <SpeakerIcon /> : <SpeakerOffIcon />}
    </Toggle>
  );
}
