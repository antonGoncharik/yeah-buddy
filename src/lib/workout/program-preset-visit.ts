/** Сколько разных тренировок в программе — без привязки к пн/ср/пт. */

function programDayCountLabel(count: number): string {
  if (count === 1) {
    return "1 тренировка в программе";
  }
  if (count === 2) {
    return "2 разные тренировки";
  }
  if (count === 3) {
    return "3 разные тренировки";
  }
  if (count === 4) {
    return "4 разные тренировки";
  }
  if (count === 6) {
    return "6 разных тренировок";
  }
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return `${count} тренировка в программе`;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} разные тренировки`;
  }
  return `${count} тренировок в программе`;
}

/** Короткая строка для сводки карточки. */
export function programVisitFrequencyShort(count: number): string {
  switch (count) {
    case 1:
      return "каждый поход в зал";
    case 2:
      return "обычно 2–3 раза в неделю";
    case 3:
      return "обычно 3 раза в неделю";
    case 4:
      return "обычно 4 раза в неделю";
    case 6:
      return "до 6 раз в неделю";
    default:
      return "ходишь когда можешь";
  }
}

/** Первая фраза в подсказке программы. */
export function programVisitFrequencyLead(count: number): string {
  const size = programDayCountLabel(count);
  const freq = programVisitFrequencyShort(count);

  if (count === 1) {
    return `${size} — ${freq}, состав один и тот же.`;
  }
  if (count === 2) {
    return `${size} — ${freq}. Сначала первую, потом вторую, потом снова с первой. Это не календарь: пропустил — ничего страшного.`;
  }
  if (count === 3) {
    return `${size} — ${freq} или через день. Три тренировки по порядку, потом снова с первой.`;
  }
  if (count === 4) {
    return `${size} — ${freq}. Четыре тренировки по порядку, потом снова с первой.`;
  }
  if (count === 6) {
    return `${size} — ${freq}, если выдерживаешь. Шесть тренировок по порядку, потом снова с первой.`;
  }
  return `${size} — ${freq}. Тренировки по порядку, без привязки к дням недели.`;
}

export function programQueueDayLabel(count: number): string {
  return programDayCountLabel(count);
}
