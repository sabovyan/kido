import { useEffect, useState } from 'react';
import { IconButton } from './ui/IconButton';
import { MoonIcon, SunIcon } from './ui/icons';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

// Runs in <head> before paint so a saved choice never flashes the other theme.
export const themeInitScript = `try{var t=localStorage.getItem('${STORAGE_KEY}');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

function currentTheme(): Theme {
  const set = document.documentElement.dataset.theme;
  if (set === 'light' || set === 'dark') return set;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeToggle() {
  // null until mounted: the server can't know the theme, so both renders start the same.
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(currentTheme());
    // With no saved choice, keep following the device.
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setTheme(currentTheme());
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const flip = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    setTheme(next);
  };

  return (
    <IconButton aria-label={theme === 'dark' ? 'Switch to day' : 'Switch to night'} onClick={flip}>
      {/* Shows the theme a press switches to, as in the design. */}
      {theme === 'dark' ? <span className="grid text-sun-400"><SunIcon /></span> : <MoonIcon />}
    </IconButton>
  );
}
