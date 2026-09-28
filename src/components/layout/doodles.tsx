import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const STROKE = {
  fill: "none",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  strokeWidth: 1.7,
} as const;

export function CookieMark({ ink = "currentColor" }: { ink?: string }) {
  return (
    <g {...STROKE} stroke={ink}>
      <path d="M0 -11 A 11 11 0 1 0 11 0 A 4.4 4.4 0 0 1 5.5 -5.5 A 4.4 4.4 0 0 1 0 -11 Z" />
      <circle cx="-3.6" cy="-2.6" r="1.15" fill={ink} stroke="none" />
      <circle cx="1.6" cy="1.4" r="1.05" fill={ink} stroke="none" />
      <circle cx="-4.4" cy="3.8" r="1.2" fill={ink} stroke="none" />
      <circle cx="4.4" cy="5.2" r="1.05" fill={ink} stroke="none" />
      <circle cx="-0.4" cy="7" r="0.9" fill={ink} stroke="none" />
    </g>
  );
}

export function MugMark({ ink = "currentColor" }: { ink?: string }) {
  return (
    <g {...STROKE} stroke={ink}>
      <path d="M-4.4 -8.2 C-5 -10.6 -3.4 -11.4 -4 -14" />
      <path d="M-0.2 -8.4 C-1 -11 0.8 -11.6 0.2 -14.4" />
      <path d="M3.8 -8 C3 -10.4 4.6 -11.2 4 -13.6" />
      <path d="M-8.6 -6.4 H6.6 V4 C6.6 10.2 -8.6 10.2 -8.6 4 Z" />
      <path d="M6.6 -3.2 C14.8 -3.6 15.2 7 6.6 6.4" />
      <path d="M-11.2 12.2 C-3.6 15.2 5.2 15.2 12.8 12.2" />
    </g>
  );
}

function hexPath(cx: number, cy: number, rx: number, ry: number): string {
  const top = 0.62;
  return [
    `M${(cx - rx).toFixed(2)} ${cy.toFixed(2)}`,
    `L${(cx - rx * top).toFixed(2)} ${(cy - ry).toFixed(2)}`,
    `L${(cx + rx * top).toFixed(2)} ${(cy - ry).toFixed(2)}`,
    `L${(cx + rx).toFixed(2)} ${cy.toFixed(2)}`,
    `L${(cx + rx * top).toFixed(2)} ${(cy + ry).toFixed(2)}`,
    `L${(cx - rx * top).toFixed(2)} ${(cy + ry).toFixed(2)}`,
    "Z",
  ].join("");
}

export function DumbbellMark({ ink = "currentColor" }: { ink?: string }) {
  const rx = 8.15;
  const ry = 6.9;
  const left = -10.35;
  const right = 10.35;

  return (
    <g fill={ink} stroke="none">
      <path d={hexPath(left, 0, rx, ry)} />
      <path d={hexPath(right, 0, rx, ry)} />
      <rect x="-2.55" y="-1.15" width="5.1" height="2.3" rx="1.15" />
      <rect x="-3.85" y="-2.05" width="1.45" height="4.1" rx="0.4" />
      <rect x="2.4" y="-2.05" width="1.45" height="4.1" rx="0.4" />
    </g>
  );
}

function plates(side: 1 | -1, ink: string, count: 1 | 2 | 3, extra: boolean) {
  const inner = { x: 10.4, w: 3.9, h: 17.2 };
  const mid = { x: 15.65, w: 3.15, h: 12.8 };
  const outer = { x: 20.1, w: 2.45, h: 8.4 };
  const bonus = { x: 23.2, w: 1.9, h: 12.4 };
  const cap = extra ? 26.4 : 24.05;

  return (
    <g fill={ink} stroke="none">
      <rect
        x={side < 0 ? -inner.x - inner.w : inner.x}
        y={-inner.h / 2}
        width={inner.w}
        height={inner.h}
        rx={0.85}
      />
      {count >= 2 ? (
        <rect
          x={side < 0 ? -mid.x - mid.w : mid.x}
          y={-mid.h / 2}
          width={mid.w}
          height={mid.h}
          rx={0.75}
        />
      ) : null}
      {count >= 3 ? (
        <rect
          x={side < 0 ? -outer.x - outer.w : outer.x}
          y={-outer.h / 2}
          width={outer.w}
          height={outer.h}
          rx={0.65}
        />
      ) : null}
      {extra ? (
        <rect
          className="doodle-plate-extra"
          x={side < 0 ? -bonus.x - bonus.w : bonus.x}
          y={-bonus.h / 2}
          width={bonus.w}
          height={bonus.h}
          rx={0.6}
        />
      ) : null}
      <circle
        className={extra ? "doodle-plate-extra" : undefined}
        cx={side * cap}
        cy={0}
        r={1.25}
      />
    </g>
  );
}

export function BarbellMark({
  ink = "currentColor",
  plates: count = 3,
  extra = false,
}: {
  ink?: string;
  plates?: 1 | 2 | 3;
  extra?: boolean;
}) {
  return (
    <g fill={ink} stroke="none">
      <rect x="-24.6" y="-0.75" width="49.2" height="1.5" rx="0.75" />
      {plates(-1, ink, count, extra)}
      {plates(1, ink, count, extra)}
    </g>
  );
}

export function MacroMark({ ink = "currentColor" }: { ink?: string }) {
  return (
    <g {...STROKE} stroke={ink}>
      <path d="M1.6 -10.6 A 10.8 10.8 0 0 1 10.4 4.2" />
      <path d="M8.2 7.2 A 10.8 10.8 0 0 1 -8.8 6.4" />
      <path d="M-10.4 3.4 A 10.8 10.8 0 0 1 -1.2 -10.6" />
      <circle cx="0.1" cy="0.2" r="2.05" fill={ink} stroke="none" />
    </g>
  );
}

export function PlateMark({ ink = "currentColor" }: { ink?: string }) {
  return (
    <g {...STROKE} stroke={ink}>
      <ellipse cx="0" cy="-2.4" rx="11.5" ry="3.35" />
      <path d="M-11.5 -2.4 C-11.2 6.8 11.2 6.8 11.5 -2.4" />
      <path d="M-4.4 -3.6 C-5.2 -6.4 -0.4 -7.4 1.6 -5.2 C3.6 -3.2 2.2 0.2 -1 0 C-3.6 -0.2 -4.6 -1.6 -4.4 -3.6 Z" />
    </g>
  );
}

export function MealDayMark({ ink = "currentColor" }: { ink?: string }) {
  return (
    <g>
      <g {...STROKE} stroke={ink}>
        <path
          d="M-11.2 -5.8 H11.2 Q12.6 -5.8 12.6 -4.4 V6.8 Q12.6 8.2 11.2 8.2 H-11.2 Q-12.6 8.2 -12.6 6.8 V-4.4 Q-12.6 -5.8 -11.2 -5.8 Z"
        />
      </g>
      <g fill={ink} stroke="none">
        <circle cx="-5.6" cy="1.2" r="2.35" />
        <rect x="-0.9" y="-1.4" width="4.4" height="4.4" rx="1.15" />
        <circle cx="5.8" cy="1.4" r="2.05" />
      </g>
    </g>
  );
}

export function ProductMark({ ink = "currentColor" }: { ink?: string }) {
  return (
    <g {...STROKE} stroke={ink}>
      <path d="M-4.1 -11.4 H4.1 L5.6 -8.2 H-5.6 Z" />
      <path
        d="M-6.2 -8.2 H6.2 Q7.8 -8.2 7.8 -6.6 V8.4 Q7.8 10 6.2 10 H-6.2 Q-7.8 10 -7.8 8.4 V-6.6 Q-7.8 -8.2 -6.2 -8.2 Z"
      />
      <path d="M-4.8 -2.6 H4.8" />
      <path d="M-4.8 0.6 H4.8" />
      <path d="M-4.8 4 H1.4" />
    </g>
  );
}

export function SandwichMark({ ink = "currentColor" }: { ink?: string }) {
  return (
    <g {...STROKE} stroke={ink}>
      <path
        d="M-9.8 -6.4 H9.8 Q11.2 -6.4 11.2 -5 V-3.8 H-11.2 V-5 Q-11.2 -6.4 -9.8 -6.4 Z"
      />
      <path d="M-11.2 -0.8 H11.2" />
      <path
        d="M-9.8 1.6 H9.8 Q11.2 1.6 11.2 3 V4.2 H-11.2 V3 Q-11.2 1.6 -9.8 1.6 Z"
      />
      <path
        d="M-9.8 6 H9.8 Q11.2 6 11.2 7.4 V8.6 H-11.2 V7.4 Q-11.2 6 -9.8 6 Z"
      />
    </g>
  );
}

export function ChartMark({ ink = "currentColor" }: { ink?: string }) {
  return (
    <g fill={ink} stroke="none">
      <rect x="-10.4" y="1.8" width="4.15" height="8.4" rx="1.2" />
      <rect x="-4.55" y="-4.6" width="4.15" height="14.8" rx="1.2" />
      <rect x="1.3" y="-1.1" width="4.15" height="11.3" rx="1.2" />
      <rect x="7.15" y="-8.6" width="4.15" height="18.8" rx="1.2" />
    </g>
  );
}

export function WeekMark({ ink = "currentColor" }: { ink?: string }) {
  const cells: Array<[number, number, boolean]> = [
    [-7.7, -0.15, false],
    [-3.85, -0.15, false],
    [0, -0.15, false],
    [3.85, -0.15, true],
    [-7.7, 5.15, false],
    [-3.85, 5.15, false],
    [0, 5.15, false],
  ];

  return (
    <g>
      <g {...STROKE} stroke={ink}>
        <path d="M-10.2 -9.4 H10.2 Q12 -9.4 12 -7.6 V8.8 Q12 10.8 10.2 10.8 H-10.2 Q-12 10.8 -12 8.8 V-7.6 Q-12 -9.4 -10.2 -9.4 Z" />
        <path d="M-12 -4.15 H12" />
      </g>
      {cells.map(([x, y, today]) => (
        <rect
          key={`${x}-${y}`}
          x={x - 1.2}
          y={y - 1.2}
          width="2.4"
          height="2.4"
          rx="0.55"
          fill={today ? ink : "none"}
          stroke={ink}
          strokeWidth={today ? 0 : 1.35}
        />
      ))}
    </g>
  );
}

export function LinkMark({ ink = "currentColor" }: { ink?: string }) {
  return (
    <g {...STROKE} stroke={ink}>
      <ellipse
        cx="-3.7"
        cy="1.05"
        rx="7.35"
        ry="4.25"
        transform="rotate(-34 -3.7 1.05)"
      />
      <ellipse
        cx="3.7"
        cy="-1.05"
        rx="7.35"
        ry="4.25"
        transform="rotate(-34 3.7 -1.05)"
      />
    </g>
  );
}

export function FriendsMark({ ink = "currentColor" }: { ink?: string }) {
  return (
    <g {...STROKE} stroke={ink}>
      <circle cx="-4.65" cy="-5.55" r="3.15" />
      <path d="M-9.35 10.1 C-7.05 4.15 -2.25 3.55 -4.65 1.15" />
      <circle cx="4.65" cy="-5.55" r="3.15" />
      <path d="M9.35 10.1 C7.05 4.15 2.25 3.55 4.65 1.15" />
    </g>
  );
}

export function BookMark({ ink = "currentColor" }: { ink?: string }) {
  return (
    <g {...STROKE} stroke={ink}>
      <path d="M0 -10.6 V10.6" />
      <path
        d="M0 -10.6 C-8.6 -10 -11.4 -5.4 -11.4 -0.2 C-11.4 5 -8.6 10 0 10.6"
      />
      <path d="M0 -10.6 C8.6 -10 11.4 -5.4 11.4 -0.2 C11.4 5 8.6 10 0 10.6" />
      <path d="M-8.4 -5 H-3.6" />
      <path d="M-8.4 -1.2 H-2.9" />
      <path d="M-8.4 2.6 H-4.1" />
      <path d="M3.6 -5 H8.4" />
      <path d="M2.9 -1.2 H8.4" />
      <path d="M4.1 2.6 H8.4" />
    </g>
  );
}

function qrFinder(x: number, y: number, ink: string) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width="6.5"
        height="6.5"
        rx="1.25"
        fill="none"
        stroke={ink}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x={x + 2.1}
        y={y + 2.1}
        width="2.3"
        height="2.3"
        rx="0.45"
        fill={ink}
        stroke="none"
      />
    </g>
  );
}

export function QrMark({ ink = "currentColor" }: { ink?: string }) {
  return (
    <g>
      {qrFinder(-10.4, -10.4, ink)}
      {qrFinder(3.9, -10.4, ink)}
      {qrFinder(-10.4, 3.9, ink)}
      <rect
        x="4.35"
        y="4.2"
        width="2.35"
        height="2.35"
        rx="0.45"
        fill={ink}
        stroke="none"
      />
      <rect
        x="7.85"
        y="6.55"
        width="1.85"
        height="1.85"
        rx="0.4"
        fill={ink}
        stroke="none"
      />
      <rect
        x="1.15"
        y="7.15"
        width="1.85"
        height="1.85"
        rx="0.4"
        fill={ink}
        stroke="none"
      />
      <rect
        x="6.95"
        y="1.05"
        width="1.7"
        height="1.7"
        rx="0.35"
        fill={ink}
        stroke="none"
      />
    </g>
  );
}

export function SetsMark({ ink = "currentColor" }: { ink?: string }) {
  const rows = [
    { y: -6.35, w: 14.2 },
    { y: -1.15, w: 9.6 },
    { y: 4.05, w: 17.4 },
  ];

  return (
    <g fill={ink} stroke="none">
      {rows.map((row) => (
        <g key={row.y}>
          <circle cx="-9.15" cy={row.y + 1.15} r="2.15" />
          <rect x="-5.35" y={row.y} width={row.w} height="2.3" rx="1.15" />
        </g>
      ))}
    </g>
  );
}

/** Тренер: дневник + глаз (только чтение, смотрит со стороны). */
export function CoachMark({ ink = "currentColor" }: { ink?: string }) {
  return (
    <g>
      <g {...STROKE} stroke={ink}>
        <path
          d="M-11.2 -9.8 H5.8 Q7.8 -9.8 7.8 -7.8 V8.2 Q7.8 10.2 5.8 10.2 H-11.2 Q-13.2 10.2 -13.2 8.2 V-7.8 Q-13.2 -9.8 -11.2 -9.8 Z"
        />
        <path d="M-9.4 -3.2 H4.2" />
        <path d="M-9.4 0.6 H0.8" />
        <path d="M-9.4 4.4 H3.4" />
      </g>
      <g {...STROKE} stroke={ink}>
        <path d="M9.8 -1.1 C13.6 0.35 13.6 3.85 9.8 5.3" />
        <path d="M9.8 5.3 C6 3.85 6 0.35 9.8 -1.1 Z" />
      </g>
      <circle cx="9.8" cy="2.1" r="1.2" fill={ink} stroke="none" />
    </g>
  );
}

export const COOKIE_VIEWBOX = "-12.8 -12.8 25.6 25.6";
export const MUG_VIEWBOX = "-12.9 -16.2 29.8 33.2";
export const DUMBBELL_VIEWBOX = "-19.2 -7.6 38.4 15.2";
export const BARBELL_VIEWBOX = "-28.2 -9.6 56.4 19.2";
export const MACRO_VIEWBOX = "-12.8 -12.8 25.6 25.6";
export const PLATE_VIEWBOX = "-13.2 -12.2 26.4 23.6";
export const MEAL_DAY_VIEWBOX = "-13.4 -8.4 26.8 18.4";
export const PRODUCT_VIEWBOX = "-10.2 -13.2 20.4 26.4";
export const SANDWICH_VIEWBOX = "-12.6 -8.2 25.2 18.4";
export const CHART_VIEWBOX = "-12.2 -10.4 24.8 22.4";
export const WEEK_VIEWBOX = "-13.4 -11.2 26.8 23.8";
export const LINK_VIEWBOX = "-13.2 -10.4 26.4 20.8";
export const FRIENDS_VIEWBOX = "-12.2 -10.4 24.4 22.4";
export const BOOK_VIEWBOX = "-12.8 -12.8 25.6 25.6";
export const QR_VIEWBOX = "-12.2 -12.2 24.4 24.4";
export const SETS_VIEWBOX = "-13.2 -10.2 26.8 20.4";
export const COACH_VIEWBOX = "-14.8 -11.8 30.2 24.8";

export function Doodle({
  children,
  className,
  viewBox = "-22 -18 44 38",
}: {
  children: ReactNode;
  className?: string;
  viewBox?: string;
}) {
  return (
    <svg aria-hidden viewBox={viewBox} className={className}>
      {children}
    </svg>
  );
}

export function CookieDoodle({ className = "size-4" }: { className?: string }) {
  return (
    <Doodle className={className} viewBox={COOKIE_VIEWBOX}>
      <CookieMark />
    </Doodle>
  );
}

export function MugDoodle({ className = "h-5 w-4" }: { className?: string }) {
  return (
    <Doodle className={cn("doodle-mug", className)} viewBox={MUG_VIEWBOX}>
      <MugMark />
    </Doodle>
  );
}

export function DumbbellDoodle({
  className = "h-3.5 w-7",
}: {
  className?: string;
}) {
  return (
    <Doodle className={className} viewBox={DUMBBELL_VIEWBOX}>
      <DumbbellMark />
    </Doodle>
  );
}

export function BarbellDoodle({
  className = "h-3.5 w-8",
}: {
  className?: string;
}) {
  return (
    <Doodle className={className} viewBox={BARBELL_VIEWBOX}>
      <BarbellMark />
    </Doodle>
  );
}

export function MacroDoodle({ className = "size-4" }: { className?: string }) {
  return (
    <Doodle className={className} viewBox={MACRO_VIEWBOX}>
      <MacroMark />
    </Doodle>
  );
}

export function PlateDoodle({ className = "size-4" }: { className?: string }) {
  return (
    <Doodle className={className} viewBox={PLATE_VIEWBOX}>
      <PlateMark />
    </Doodle>
  );
}

export function MealDayDoodle({
  className = "size-4",
}: {
  className?: string;
}) {
  return (
    <Doodle className={className} viewBox={MEAL_DAY_VIEWBOX}>
      <MealDayMark />
    </Doodle>
  );
}

export function ProductDoodle({
  className = "size-4",
}: {
  className?: string;
}) {
  return (
    <Doodle className={className} viewBox={PRODUCT_VIEWBOX}>
      <ProductMark />
    </Doodle>
  );
}

export function SandwichDoodle({
  className = "size-4",
}: {
  className?: string;
}) {
  return (
    <Doodle className={className} viewBox={SANDWICH_VIEWBOX}>
      <SandwichMark />
    </Doodle>
  );
}

export function ChartDoodle({ className = "h-4 w-5" }: { className?: string }) {
  return (
    <Doodle className={className} viewBox={CHART_VIEWBOX}>
      <ChartMark />
    </Doodle>
  );
}

export function WeekDoodle({ className = "h-4 w-5" }: { className?: string }) {
  return (
    <Doodle className={className} viewBox={WEEK_VIEWBOX}>
      <WeekMark />
    </Doodle>
  );
}

export function LinkDoodle({ className = "h-4 w-5" }: { className?: string }) {
  return (
    <Doodle className={className} viewBox={LINK_VIEWBOX}>
      <LinkMark />
    </Doodle>
  );
}

export function FriendsDoodle({
  className = "h-4 w-5",
}: {
  className?: string;
}) {
  return (
    <Doodle className={className} viewBox={FRIENDS_VIEWBOX}>
      <FriendsMark />
    </Doodle>
  );
}

export function BookDoodle({ className = "h-4 w-5" }: { className?: string }) {
  return (
    <Doodle className={className} viewBox={BOOK_VIEWBOX}>
      <BookMark />
    </Doodle>
  );
}

export function QrDoodle({ className = "size-4" }: { className?: string }) {
  return (
    <Doodle className={className} viewBox={QR_VIEWBOX}>
      <QrMark />
    </Doodle>
  );
}

export function SetsDoodle({ className = "h-4 w-5" }: { className?: string }) {
  return (
    <Doodle className={className} viewBox={SETS_VIEWBOX}>
      <SetsMark />
    </Doodle>
  );
}

export function CoachDoodle({
  className = "h-3.5 w-6",
}: {
  className?: string;
}) {
  return (
    <Doodle className={className} viewBox={COACH_VIEWBOX}>
      <CoachMark />
    </Doodle>
  );
}
