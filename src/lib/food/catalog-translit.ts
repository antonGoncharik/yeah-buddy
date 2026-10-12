/** Latin ↔ Cyrillic helpers for food search (FEAT-06). */

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

const LATIN_DIGRAPHS: Array<{ latin: string; cyr: string }> = [
  { latin: "sch", cyr: "щ" },
  { latin: "sh", cyr: "ш" },
  { latin: "ch", cyr: "ч" },
  { latin: "zh", cyr: "ж" },
  { latin: "ts", cyr: "ц" },
  { latin: "yu", cyr: "ю" },
  { latin: "ya", cyr: "я" },
  { latin: "yo", cyr: "ё" },
  { latin: "ye", cyr: "е" },
  { latin: "kh", cyr: "х" },
  { latin: "ck", cyr: "к" },
];

const LATIN_SINGLE: Record<string, string> = {
  a: "а",
  b: "б",
  v: "в",
  w: "в",
  g: "г",
  d: "д",
  e: "е",
  z: "з",
  i: "и",
  y: "й",
  k: "к",
  c: "к",
  l: "л",
  m: "м",
  n: "н",
  o: "о",
  p: "п",
  r: "р",
  s: "с",
  t: "т",
  u: "у",
  f: "ф",
  h: "х",
  x: "кс",
  q: "к",
  j: "дж",
};

export function textHasCyrillic(text: string): boolean {
  return /[а-яё]/i.test(text);
}

export function textHasLatin(text: string): boolean {
  return /[a-z]/i.test(text);
}

/** Rough phonetic latin → cyrillic for catalog tokens (e.g. grechka → гречка). */
export function latinTokenToCyrillic(token: string): string | null {
  const lower = token.toLowerCase();
  if (!textHasLatin(lower) || textHasCyrillic(lower)) {
    return null;
  }

  let out = "";
  let i = 0;
  while (i < lower.length) {
    let matched = false;
    for (const { latin, cyr } of LATIN_DIGRAPHS) {
      if (lower.startsWith(latin, i)) {
        out += cyr;
        i += latin.length;
        matched = true;
        break;
      }
    }
    if (matched) {
      continue;
    }
    const ch = lower[i];
    const mapped = ch ? LATIN_SINGLE[ch] : undefined;
    if (!mapped) {
      return null;
    }
    out += mapped;
    i += 1;
  }
  return out.length > 0 ? out : null;
}

export function cyrillicTextToLatinRough(text: string): string {
  let out = "";
  const lower = text.toLowerCase();
  for (const ch of lower) {
    const mapped = CYRILLIC_TO_LATIN[ch];
    if (mapped != null) {
      out += mapped;
    } else if (/[a-z0-9\s]/.test(ch)) {
      out += ch;
    }
  }
  return out.replace(/\s+/g, " ").trim();
}

/** Extra searchable forms for a token (original + translit when applicable). */
export function catalogTokenSearchForms(token: string): string[] {
  const forms = new Set<string>([token]);
  const cyr = latinTokenToCyrillic(token);
  if (cyr) {
    forms.add(cyr);
  }
  if (textHasCyrillic(token)) {
    const latin = cyrillicTextToLatinRough(token);
    if (latin.length >= 2) {
      forms.add(latin);
    }
  }
  return [...forms];
}
