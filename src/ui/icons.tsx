import type { ReactNode, SVGProps } from 'react';

export type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & { size?: number };

// Every icon: 24 grid, stroke 2.5, round caps and joins, currentColor, hidden from screen readers.
// Pass `size` and `strokeWidth` to change them.
export function Icon({ size = 24, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {children}
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return <Icon {...props}><path d="M5 12h14M13 6l6 6-6 6" /></Icon>;
}

export function CheckIcon(props: IconProps) {
  return <Icon {...props}><path d="M5 12l5 5L20 7" /></Icon>;
}

export function XIcon(props: IconProps) {
  return <Icon {...props}><path d="M6 6l12 12M18 6L6 18" /></Icon>;
}

export function PlusIcon(props: IconProps) {
  return <Icon {...props}><path d="M12 5v14M5 12h14" /></Icon>;
}

export function MinusIcon(props: IconProps) {
  return <Icon {...props}><path d="M5 12h14" /></Icon>;
}

export function MenuIcon(props: IconProps) {
  return <Icon {...props}><path d="M4 7h16M4 12h16M4 17h16" /></Icon>;
}

// Points up; turns over when its panel opens.
export function ChevronIcon(props: IconProps) {
  return (
    <Icon className="transition-transform duration-(--dur-pop) ease-bouncy motion-reduce:transition-none" {...props}>
      <path d="M6 15l6-6 6 6" />
    </Icon>
  );
}

export function BulbIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z" />
    </Icon>
  );
}

export function FlagIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 21V4" />
      <path d="M5 4h11l-2 4 2 4H5" />
    </Icon>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </Icon>
  );
}

export function CompassIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" />
    </Icon>
  );
}

export function TargetIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </Icon>
  );
}

export function BookIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 6.5C10 5 7.5 4.5 4 4.5v14c3.5 0 6 .5 8 2 2-1.5 4.5-2 8-2v-14c-3.5 0-6 .5-8 2z" />
      <path d="M12 6.5v14" />
    </Icon>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Icon>
  );
}

export function MoonIcon(props: IconProps) {
  return <Icon {...props}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /></Icon>;
}

export function SpeakerIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M11 5 6 9H3v6h3l5 4z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9.5 9.5 0 0 1 0 13" />
    </Icon>
  );
}

export function SpeakerOffIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M11 5 6 9H3v6h3l5 4z" />
      <path d="M16 9.5l5 5M21 9.5l-5 5" />
    </Icon>
  );
}

// Filled icons: brand fill with an ink edge in both themes.

export function StarIcon(props: IconProps) {
  return (
    <Icon className="fill-sun-400 stroke-on-sun" {...props}>
      <path d="M12 3l2.7 5.6 6.1.8-4.4 4.2 1.1 6.1L12 16.8l-5.5 2.9 1.1-6.1-4.4-4.2 6.1-.8z" />
    </Icon>
  );
}

// A lost heart is empty and grey, so it doesn't rely on colour alone.
export function HeartIcon({ lost = false, ...props }: IconProps & { lost?: boolean }) {
  return (
    <Icon className={lost ? 'fill-surface-sunk stroke-fg-muted' : 'fill-coral-500 stroke-on-coral'} {...props}>
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
    </Icon>
  );
}

export function FlameIcon(props: IconProps) {
  return (
    <Icon className="fill-sun-400 stroke-on-sun" {...props}>
      <path d="M12 21c-4 0-7-2.7-7-6.5 0-3.5 3-5.5 4-9.5 2 1.5 3 3.5 3 5.5 1-1 1.5-2 1.5-3.5 2.5 2 5.5 4.5 5.5 7.5 0 3.8-3 6.5-7 6.5z" />
    </Icon>
  );
}
