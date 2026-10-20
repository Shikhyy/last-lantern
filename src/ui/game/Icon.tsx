import type { SVGProps } from 'react';

export type IconName =
  | 'flame'
  | 'book'
  | 'board'
  | 'mask'
  | 'gear'
  | 'sound'
  | 'mute'
  | 'users'
  | 'archive'
  | 'arrow'
  | 'close'
  | 'check'
  | 'moon'
  | 'sun'
  | 'seal'
  | 'warning'
  | 'eye'
  | 'door';

const PATHS: Record<IconName, string[]> = {
  flame: ['M12 21c3.4 0 5.8-2.3 5.8-5.4 0-2.2-1.1-4-2.9-5.8-.5 1.4-1.3 2.3-2.4 2.9.2-3.5-1.5-6.2-4.5-8.2.2 3.1-1.1 5-2.6 6.7A7 7 0 0 0 4 15.2C4 18.5 7.4 21 12 21Z'],
  book: ['M5 4.5h5.5A4.5 4.5 0 0 1 15 9v10.5H9.5A4.5 4.5 0 0 0 5 24V4.5Z', 'M19 4.5h-5.5A4.5 4.5 0 0 0 9 9v10.5h5.5A4.5 4.5 0 0 1 19 24V4.5Z'],
  board: ['M4 4h7v6H4zM13 14h7v6h-7zM4 18h7v2H4zM13 6h7v4h-7z', 'M11 7h2v10h-2zM11 16h2'],
  mask: ['M4 5c2.6 1 5.1 1 8 1s5.4 0 8-1v7.5c0 4-3.4 7.5-8 7.5s-8-3.5-8-7.5V5Z', 'M8 10.5c.6.8 1.6.8 2.2 0M13.8 10.5c.6.8 1.6.8 2.2 0M9 15.5c1.8 1.1 4.2 1.1 6 0'],
  gear: ['M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z', 'M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4'],
  sound: ['M4 9h3l4-3v12l-4-3H4V9Z', 'M14.5 9.5a4 4 0 0 1 0 5M17 7a7 7 0 0 1 0 10'],
  mute: ['M4 9h3l4-3v12l-4-3H4V9Z', 'M14.5 9.5l5 5M19.5 9.5l-5 5'],
  users: ['M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM2.5 20c0-3.2 2.9-5.5 6.5-5.5s6.5 2.3 6.5 5.5', 'M16 4.8a3.2 3.2 0 0 1 0 6.4M17.5 14.8c2.4.5 4 2.3 4 5.2'],
  archive: ['M3 4h18v4H3zM5 8h14v12H5zM9 12h6M9 16h6'],
  arrow: ['M4 12h15M13 6l6 6-6 6'],
  close: ['M5 5l14 14M19 5L5 19'],
  check: ['M4 12.5l5 5L20 6.5'],
  moon: ['M20 15.5A8.2 8.2 0 0 1 8.5 4 8.4 8.4 0 1 0 20 15.5Z', 'M16 4.5l.5 1.2 1.2.5-1.2.5-.5 1.2-.5-1.2-1.2-.5 1.2-.5.5-1.2Z'],
  sun: ['M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z', 'M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'],
  seal: ['M12 3l2.2 2.1 3-.3.3 3L20 10l-1.6 2.6.8 2.9-2.9.8L14.5 20l-2.5-1.6L9.5 20l-1.8-3.7-2.9-.8.8-2.9L4 10l2.5-2.2.3-3 3 .3L12 3Z', 'M9 11.5l2 2 4-4'],
  warning: ['M12 3l9 17H3L12 3Z', 'M12 9v5M12 17.3v.2'],
  eye: ['M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z', 'M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z'],
  door: ['M5 3h11v18H5zM16 12h3M8 7h5v4H8z'],
};

export function Icon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {PATHS[name].map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  );
}
