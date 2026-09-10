import type { SVGProps } from "react";
const paths = {
  grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  box: "m12 3 9 5v8l-9 5-9-5V8z M3 8l9 5 9-5 M12 13v8 M7 5.8l9 5",
  layers: "m12 3 10 5-10 5L2 8z M2 12l10 5 10-5 M2 16l10 5 10-5",
  truck:
    "M3 5h11v12H3z M14 9h4l3 4v4h-7 M5 17a2 2 0 1 0 4 0 M15 17a2 2 0 1 0 4 0",
  in: "M12 3v12 m-5-5 5 5 5-5 M4 16v5h16v-5",
  out: "M12 15V3 m-5 5 5-5 5 5 M4 16v5h16v-5",
  activity: "M3 12h4l3-8 4 16 3-8h4",
  search: "M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15 M16 16l5 5",
  plus: "M12 5v14 M5 12h14",
  arrow: "M5 12h14 m-5-5 5 5-5 5",
  chevron: "m9 5 7 7-7 7",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4",
  menu: "M4 6h16 M4 12h16 M4 18h16",
  close: "m6 6 12 12 M18 6 6 18",
  logout: "M9 4H4v16h5 M9 12h12 m-5-5 5 5-5 5",
  sparkle: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z",
  refresh: "M20 7v5h-5 M4 17v-5h5 M6 6a8 8 0 0 1 14 6 M18 18A8 8 0 0 1 4 12",
  trend: "m3 17 6-6 4 4 8-10 M15 5h6v6",
  wallet: "M3 6h17v14H3z M3 6V3h14v3 M16 11h5v5h-5z",
  check: "m5 12 4 4L19 6",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 7v5l3 2",
  alert: "m12 3 10 18H2z M12 9v5 M12 17v.1",
  history: "M3 4v5h5 M3 9a9 9 0 1 1 0 6 M12 7v5l4 2",
} as const;
export type IconName = keyof typeof paths;
export default function Icon({
  name,
  size = 20,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
