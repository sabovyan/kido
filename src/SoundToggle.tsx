import { Toggle } from '@base-ui/react/toggle';
import { useEffect, useState } from 'react';
import { canSpeak, isSoundOn, setSoundOn } from './speech';
import { IconButton } from './ui/IconButton';
import { SpeakerIcon, SpeakerOffIcon } from './ui/icons';

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
      render={<IconButton aria-label={soundOn ? 'Turn sound off' : 'Turn sound on'} />}
    >
      {/* Shows what you hear now: a speaker with waves, or a crossed-out one. */}
      {soundOn ? <SpeakerIcon /> : <SpeakerOffIcon />}
    </Toggle>
  );
}
