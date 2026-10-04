import type { RawDay } from "@/lib/workout/program-guide-bench-compile";

const p = (
  k: string,
  blocks: Array<{ p: number; r: number; s: number }>,
): {
  k: string;
  t: "p";
  blocks: Array<{ p: number; r: number; s: number }>;
} => ({
  k,
  t: "p",
  blocks,
});
const f = (k: string, r: number, s: number) => ({ k, t: "f" as const, r, s });
const v = (k: string, r: number, s: number) => ({ k, t: "v" as const, r, s });

export const BENCH_GUIDE_RAW_WEEKS: Record<string, RawDay[]> = {
  w1: [
    {
      d: "Пн",
      slots: [
        p("sq", [{ p: 50, r: 10, s: 3 }]),
        p("bp", [{ p: 75, r: 3, s: 5 }]),
        f("fly", 10, 3),
        f("curl", 10, 4),
        f("abs", 30, 3),
        v("hyper", 20, 2),
      ],
    },
    {
      d: "Ср",
      slots: [
        f("hyperw", 10, 4),
        p("ohp", [{ p: 35, r: 6, s: 2 }]),
        p("pull", [{ p: 15, r: 4, s: 4 }]),
        f("rowh", 30, 4),
        f("wrist", 15, 4),
        f("abs", 30, 3),
      ],
    },
    {
      d: "Пт",
      slots: [
        p("bp", [{ p: 60, r: 5, s: 2 }]),
        p("bpinc", [{ p: 50, r: 6, s: 4 }]),
        f("fly", 8, 4),
        f("latdb", 8, 4),
        f("curlrev", 8, 5),
      ],
    },
  ],
  w2: [
    {
      d: "Пн",
      slots: [
        p("bp", [
          { p: 70, r: 4, s: 2 },
          { p: 77, r: 3, s: 5 },
        ]),
        p("sq", [{ p: 60, r: 8, s: 4 }]),
        p("close", [{ p: 50, r: 5, s: 5 }]),
        f("curl", 12, 4),
        f("abs", 30, 3),
      ],
    },
    {
      d: "Ср",
      slots: [
        p("dl", [{ p: 50, r: 8, s: 4 }]),
        p("ohpseated", [{ p: 35, r: 6, s: 4 }]),
        f("rowv", 10, 5),
        f("rowh", 10, 5),
        f("wrist", 15, 4),
        v("hyper", 20, 3),
      ],
    },
    {
      d: "Пт",
      slots: [
        p("bp", [
          { p: 70, r: 3, s: 2 },
          { p: 80, r: 3, s: 5 },
        ]),
        f("bpincdb", 8, 4),
        f("tri", 8, 4),
        f("hammer", 10, 5),
        f("abs", 30, 3),
      ],
    },
  ],
  w3: [
    {
      d: "Пн",
      slots: [
        p("sq", [{ p: 60, r: 12, s: 3 }]),
        p("bp", [{ p: 80, r: 3, s: 6 }]),
        f("fly", 10, 4),
        f("curl", 6, 6),
        f("abs", 30, 3),
      ],
    },
    {
      d: "Ср",
      slots: [
        p("dl", [{ p: 55, r: 8, s: 4 }]),
        p("ohpseated", [{ p: 40, r: 5, s: 5 }]),
        v("pull", 8, 4),
        f("rowv", 10, 3),
        v("pullneg", 4, 3),
        f("abs", 30, 3),
      ],
    },
    {
      d: "Пт",
      slots: [
        p("bp", [{ p: 70, r: 5, s: 5 }]),
        f("fly", 10, 3),
        p("medium", [{ p: 55, r: 5, s: 4 }]),
        f("curlrev", 8, 5),
        f("abs", 30, 3),
      ],
    },
  ],
  w4: [
    {
      d: "Пн",
      slots: [
        p("sq", [{ p: 50, r: 15, s: 3 }]),
        p("bp", [
          { p: 70, r: 4, s: 2 },
          { p: 75, r: 4, s: 2 },
          { p: 77, r: 3, s: 2 },
          { p: 85, r: 2, s: 2 },
          { p: 82, r: 2, s: 3 },
        ]),
        f("fly", 8, 3),
        f("french", 5, 5),
        f("curl", 8, 5),
      ],
    },
    {
      d: "Ср",
      slots: [
        p("dl", [{ p: 60, r: 5, s: 5 }]),
        p("bpinc", [{ p: 60, r: 4, s: 5 }]),
        f("rowv", 10, 4),
        f("rowh", 10, 4),
        p("bp", [{ p: 70, r: 4, s: 4 }]),
        f("abs", 30, 3),
      ],
    },
    {
      d: "Пт",
      slots: [
        p("bp", [
          { p: 70, r: 3, s: 2 },
          { p: 75, r: 3, s: 5 },
        ]),
        f("fly", 6, 4),
        p("bp", [
          { p: 70, r: 4, s: 2 },
          { p: 85, r: 3, s: 4 },
        ]),
        f("latdb", 10, 4),
        f("curlrev", 10, 5),
        f("abs", 30, 3),
      ],
    },
  ],
  w5: [
    {
      d: "Пн",
      slots: [
        p("sq", [{ p: 60, r: 8, s: 4 }]),
        p("bp", [
          { p: 70, r: 3, s: 2 },
          { p: 80, r: 3, s: 6 },
        ]),
        f("fly", 8, 4),
        p("bp", [
          { p: 60, r: 5, s: 1 },
          { p: 65, r: 5, s: 1 },
          { p: 70, r: 5, s: 1 },
          { p: 75, r: 5, s: 1 },
          { p: 80, r: 5, s: 1 },
        ]),
        f("curl", 8, 5),
      ],
    },
    {
      d: "Ср",
      slots: [
        p("dl", [{ p: 65, r: 6, s: 5 }]),
        p("bpinc", [{ p: 65, r: 4, s: 5 }]),
        v("pull", 8, 4),
        f("rowh", 10, 4),
        f("dbrow", 10, 4),
        f("abs", 30, 3),
      ],
    },
    {
      d: "Пт",
      slots: [
        p("bp", [
          { p: 60, r: 6, s: 1 },
          { p: 65, r: 5, s: 1 },
          { p: 70, r: 4, s: 1 },
          { p: 80, r: 3, s: 1 },
          { p: 85, r: 2, s: 1 },
          { p: 87, r: 1, s: 1 },
          { p: 82.5, r: 3, s: 1 },
          { p: 75, r: 4, s: 1 },
          { p: 60, r: 6, s: 1 },
          { p: 55, r: 8, s: 1 },
        ]),
        f("fly", 10, 3),
        f("dbohp", 6, 4),
        f("latdb", 10, 4),
        f("hammer", 8, 5),
        f("abs", 30, 3),
      ],
    },
  ],
  w6: [
    {
      d: "Пн",
      slots: [
        p("sq", [{ p: 70, r: 6, s: 5 }]),
        p("bp", [
          { p: 70, r: 4, s: 2 },
          { p: 80, r: 3, s: 2 },
          { p: 85, r: 2, s: 3 },
        ]),
        f("fly", 10, 5),
        p("medium", [
          { p: 55, r: 5, s: 1 },
          { p: 60, r: 5, s: 1 },
          { p: 65, r: 5, s: 1 },
          { p: 70, r: 5, s: 1 },
          { p: 75, r: 5, s: 1 },
        ]),
        f("curl", 6, 6),
        f("abs", 30, 3),
      ],
    },
    {
      d: "Ср",
      slots: [
        p("dlstiff", [{ p: 50, r: 12, s: 3 }]),
        p("ohp", [{ p: 40, r: 6, s: 5 }]),
        f("rowv", 8, 5),
        f("rowh", 8, 5),
        f("tbar", 8, 4),
        v("hyper", 20, 3),
      ],
    },
    {
      d: "Пт",
      slots: [
        p("bp", [{ p: 80, r: 4, s: 4 }]),
        p("bpinc", [{ p: 50, r: 8, s: 3 }]),
        f("latdb", 10, 4),
        f("tri", 8, 5),
        f("curlrev", 8, 5),
      ],
    },
  ],
  w7: [
    {
      d: "Пн",
      slots: [
        p("bp", [
          { p: 70, r: 3, s: 2 },
          { p: 80, r: 3, s: 2 },
          { p: 85, r: 2, s: 2 },
          { p: 80, r: 3, s: 2 },
        ]),
        p("sq", [{ p: 60, r: 10, s: 3 }]),
        p("medium", [{ p: 75, r: 4, s: 4 }]),
        f("curl", 8, 3),
        f("curlrev", 8, 3),
        f("abs", 30, 3),
      ],
    },
    {
      d: "Ср",
      slots: [
        p("dl", [{ p: 55, r: 8, s: 4 }]),
        p("bpinc", [{ p: 65, r: 5, s: 4 }]),
        f("tri", 10, 4),
        f("rowh", 20, 4),
        f("tbar", 8, 4),
        v("hyper", 20, 3),
      ],
    },
    {
      d: "Пт",
      slots: [
        p("bp", [
          { p: 70, r: 3, s: 2 },
          { p: 80, r: 3, s: 1 },
          { p: 85, r: 2, s: 3 },
          { p: 87, r: 1, s: 2 },
        ]),
        f("fly", 8, 4),
        p("bp", [{ p: 70, r: 5, s: 5 }]),
        f("latdb", 10, 4),
        f("hammer", 8, 5),
        f("abs", 30, 3),
      ],
    },
  ],
  w8: [
    {
      d: "Пн",
      slots: [
        p("sq", [{ p: 70, r: 5, s: 5 }]),
        p("bp", [
          { p: 70, r: 3, s: 2 },
          { p: 80, r: 3, s: 2 },
          { p: 85, r: 2, s: 5 },
        ]),
        f("fly", 10, 4),
        f("french", 8, 3),
        f("curl", 10, 5),
        f("abs", 30, 3),
      ],
    },
    {
      d: "Ср",
      slots: [
        f("hyperw", 10, 3),
        p("bpinc", [{ p: 70, r: 5, s: 3 }]),
        f("dbohp", 8, 3),
        v("pull", 8, 4),
        f("rowv", 10, 4),
        f("abs", 30, 3),
      ],
    },
    {
      d: "Пт",
      slots: [
        p("bp", [
          { p: 70, r: 3, s: 2 },
          { p: 80, r: 4, s: 4 },
        ]),
        f("fly", 6, 5),
        f("tri", 8, 5),
        f("curlrev", 8, 4),
        f("abs", 30, 3),
      ],
    },
  ],
  w9: [
    {
      d: "Пн",
      slots: [
        p("sq", [{ p: 60, r: 8, s: 4 }]),
        p("bp", [
          { p: 50, r: 8, s: 1 },
          { p: 60, r: 6, s: 1 },
          { p: 70, r: 5, s: 2 },
          { p: 80, r: 4, s: 2 },
          { p: 85, r: 3, s: 2 },
          { p: 87, r: 2, s: 2 },
        ]),
        f("fly", 10, 3),
        f("tri", 8, 5),
        f("curl", 10, 4),
      ],
    },
    {
      d: "Ср",
      slots: [
        p("dl", [{ p: 60, r: 8, s: 3 }]),
        f("tbar", 8, 3),
        f("rowv", 10, 3),
        f("rowh", 10, 3),
        f("wrist", 15, 4),
        v("hyper", 20, 3),
      ],
    },
    {
      d: "Пт",
      slots: [
        p("bp", [
          { p: 70, r: 3, s: 2 },
          { p: 80, r: 3, s: 2 },
          { p: 85, r: 2, s: 3 },
        ]),
        f("fly", 8, 3),
        p("bp", [
          { p: 70, r: 3, s: 1 },
          { p: 80, r: 3, s: 1 },
          { p: 90, r: 3, s: 1 },
          { p: 100, r: 1, s: 2 },
        ]),
        f("latdb", 10, 4),
        f("hammer", 12, 4),
      ],
    },
  ],
  w10: [
    {
      d: "Пн",
      slots: [
        p("sq", [{ p: 70, r: 5, s: 4 }]),
        p("bp", [
          { p: 60, r: 6, s: 1 },
          { p: 70, r: 5, s: 1 },
          { p: 80, r: 4, s: 4 },
          { p: 80, r: 4, s: 2 },
          { p: 85, r: 3, s: 2 },
          { p: 87, r: 2, s: 2 },
        ]),
        f("fly", 8, 5),
        p("bp", [{ p: 60, r: 2, s: 5 }]),
        f("curl", 6, 6),
      ],
    },
    {
      d: "Ср",
      slots: [
        p("dl", [{ p: 70, r: 4, s: 4 }]),
        p("pull", [{ p: 10, r: 3, s: 3 }]),
        f("rowh", 10, 5),
        f("dbrow", 10, 3),
        v("hyper", 20, 2),
      ],
    },
    {
      d: "Пт",
      slots: [
        p("bp", [{ p: 80, r: 2, s: 4 }]),
        f("dbpress", 10, 4),
        f("latdb", 8, 4),
        f("curlrev", 10, 4),
        f("abs", 30, 3),
      ],
    },
  ],
  w11: [
    {
      d: "Пн",
      slots: [
        p("sq", [{ p: 60, r: 8, s: 3 }]),
        p("bp", [
          { p: 60, r: 6, s: 1 },
          { p: 70, r: 5, s: 1 },
          { p: 80, r: 4, s: 1 },
          { p: 85, r: 3, s: 1 },
          { p: 90, r: 3, s: 1 },
          { p: 92.5, r: 3, s: 1 },
          { p: 95, r: 3, s: 1 },
        ]),
        f("fly", 8, 4),
        f("tri", 10, 4),
        f("curl", 15, 3),
      ],
    },
    {
      d: "Ср",
      slots: [
        p("dl", [{ p: 60, r: 6, s: 5 }]),
        f("rowv", 10, 4),
        f("rowh", 10, 4),
        f("tbar", 8, 4),
        f("hyperw", 10, 4),
        f("abs", 30, 3),
      ],
    },
    {
      d: "Пт",
      slots: [
        p("bp", [
          { p: 75, r: 5, s: 5 },
          { p: 80, r: 2, s: 4 },
        ]),
        p("ohpseated", [{ p: 35, r: 6, s: 4 }]),
        f("latdb", 8, 4),
        f("curlrev", 12, 4),
        f("wrist", 15, 4),
        f("abs", 30, 3),
      ],
    },
  ],
  w12: [
    {
      d: "Пн",
      slots: [
        p("sq", [{ p: 70, r: 5, s: 4 }]),
        p("bp", [
          { p: 70, r: 4, s: 2 },
          { p: 80, r: 3, s: 1 },
          { p: 82.5, r: 2, s: 3 },
        ]),
        f("tri", 8, 4),
        f("fly", 10, 4),
        f("curl", 15, 4),
      ],
    },
    {
      d: "Ср",
      slots: [
        f("hyperw", 10, 3),
        f("rowv", 15, 3),
        f("rowh", 15, 3),
        f("hammer", 8, 5),
        f("wrist", 15, 4),
        f("abs", 30, 3),
      ],
    },
    {
      d: "Пт",
      slots: [p("bp", [{ p: 70, r: 4, s: 4 }]), f("meditate", 5, 1)],
    },
  ],
  w13: [
    {
      d: "Пн",
      slots: [
        p("bp", [
          { p: 50, r: 6, s: 1 },
          { p: 60, r: 5, s: 1 },
          { p: 70, r: 3, s: 1 },
          { p: 80, r: 2, s: 1 },
          { p: 90, r: 1, s: 1 },
          { p: 100, r: 1, s: 1 },
          { p: 102, r: 1, s: 1 },
        ]),
      ],
    },
    {
      d: "Ср",
      slots: [f("abs", 30, 2), v("hyper", 15, 2)],
    },
    {
      d: "Пт",
      slots: [f("meditate", 5, 1)],
    },
  ],
};
