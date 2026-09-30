import type { SidePlate } from "@/lib/workout/rest-load";

export const PLATE_DRAW: Record<SidePlate, { w: number; h: number }> = {
  25: { w: 3.4, h: 20 },
  20: { w: 3.1, h: 17.2 },
  15: { w: 2.8, h: 14.6 },
  10: { w: 2.5, h: 12 },
  5: { w: 2.2, h: 9.2 },
  2.5: { w: 1.9, h: 7.2 },
  1.25: { w: 1.6, h: 5.6 },
};
