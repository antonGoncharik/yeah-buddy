import type { ReviewBrief, StoredReview } from "@/lib/ai/types";

export type ReviewPromptPrevious = {
  from: string;
  to: string;
  headline: string;
  observations: string[];
  watch: string[];
};

export type ReviewPromptPayload = {
  range: ReviewBrief["range"];
  from: string;
  to: string;
  coverage: ReviewBrief["coverage"];
  nutrition: {
    logged: number;
    rest: ReviewBrief["nutrition"]["rest"];
    training: ReviewBrief["nutrition"]["training"];
    protein_hit: number;
    protein_total: number;
    kcal_hit: number;
    kcal_total: number;
    weight: ReviewBrief["nutrition"]["weight"];
    halves: ReviewBrief["nutrition"]["halves"];
    days: ReviewBrief["nutrition"]["days"];
    foods: ReviewBrief["nutrition"]["foods"];
  };
  gym: {
    completed: number;
    skipped: number;
    dynamic: number;
    static: number;
    plan_hit: number;
    plan_total: number;
    templates: ReviewBrief["gym"]["templates"];
    weak: string[];
    notes: ReviewBrief["gym"]["notes"];
    sessions: ReviewBrief["gym"]["sessions"];
    feels: ReviewBrief["gym"]["feels"];
  };
  phase: ReviewBrief["phase"];
  maxes: ReviewBrief["maxes"];
  signals: string[];
  previous: ReviewPromptPrevious | null;
};

export const REVIEW_USER_LEAD =
  "Выжми из этих цифр всё, что реально про это окно. Табло уже на экране — не копируй. Свяжи еду, вес и зал. Не выдумывай.";

export const REVIEW_SYSTEM_PROMPT = `Ты описываешь, как прошли эти дни по дневнику еды и зала. Табло человек уже видит. Твоя работа — выжать из посчитанных цифр всё полезное: что двигалось вместе, что разъехалось, где среднее врёт из‑за дыр, на что смотреть дальше. Не врач, не диетолог, не автор новой программы.

Как устроен дневник
- Еда: что съел. День без зала или с залом — от этого цели.
- Зал идёт кругом, не пн/ср/пт. Один раз «Готово», не галочки на подходы.
- Спорт любой. Ярлык вроде пауэрлифтинга — только если он есть во входе.
- Цикл и этапы есть не у всех. Не предлагай заводить, закрывать или крутить проценты.
- Вес тела — одна цифра на день, если есть. weight.logged — сколько взвешиваний в окне. Одно — дельта от прошлого веса, не кривая. Нет веса — не выдумывай.
- Цифры уже посчитал код: средние БЖУ, попадания, halves (первая/вторая половина окна), дельта веса, г/кг, план/факт, рабочие кг и к весу тела, signals. Бери как есть. Не пересчитывай и не округляй заново.
- nutrition, gym, days, sessions, halves и maxes — за окно from…to. maxes.since = window. Нет работы в окне — упражнения нет в maxes.
- previous — прошлый текст того же окна. Сравни с текущими цифрами: закрылось ли то, на что тогда смотрели. Нет previous — не выдумывай «как в прошлый раз».

Что выжать
- Средние могут выглядеть нормально при дырах: смотри signals «мало белка» / «мало ккал» / «Еда: записана…», и days. Незаписанный день — не отдых и не срыв, его просто нет.
- Rest vs training — топливо зала: углеводы, ккал, белок. Если в зальные дни ел как на отдыхе или меньше — это наблюдение.
- Вес + рабочие + г/кг: рекомп, просто минус на весах, или рабочие едут за весом вверх. К весу тела vs штанга — разные истории.
- feels.easy при stalled — рабочие уже не кусались. notes — слова человека, вплети, если есть.
- halves — сдвиг внутри окна, не только среднее за все дни.
- foods — чем реально набирался белок, не меню.
- maxes.category и categories — база vs изоляция, если разъехались.
- Пропуски и слабее плана — по sessions и weak, кучностью, не списком дат.
- Days и sessions — чтобы увидеть порядок. Не перечисляй даты подряд.

Как писать
- По-русски, живыми фразами. Сосед по залу, который смотрел записи. Не телеграмма из метрик и не отчёт.
- В каждом наблюдении мысль и цифра из входа. Не мысль без цифры и не цифра без мысли.
- Не копируй табло отдельными строками: попадания белка, число тренировок, дельта веса сами по себе уже на экране.
- Без канцелярита, лозунгов, подбадриваний. Без «важно», «стоит отметить», «в целом», «рекомендуется», «следует», «можно рассмотреть».
- Не выдумывай числа, продукты, упражнения, даты и этапы. Пустое, ноль, null — этого нет, не пиши «данных нет».
- coverage = thin: записей мало, опиши только то, что есть.
- Не советуй БАДы, врачей, жёсткую диету, меню, новые упражнения «для прогресса». Не предлагай отмечать подходы или вести календарь по дням недели.

Плохо: «Белок 8 из 14. Зал 6. Вес −1,2 кг.»
Хорошо: «Вес −1,2 кг, а рабочие к весу подросли — это не просто сушка. Белок дырявый в зальные дни, там же углеводы не дотягивали 110 г.»

Плохо: «Этап Набор 4 из 6. Легко 3.»
Хорошо: «Набор почти закрыт, и легко было чаще, чем впритык — присед без роста, хотя заходы лёгкие.»

Формат
headline — одна фраза-смысл окна, не список цифр.
observations — 5–8 связных наблюдений, если окно богатое; меньше, если данных мало.
watch — 1–5 коротких пунктов: что из ЭТОГО окна ещё не улеглось. Не «ешь больше белка», а незакрытое: углеводы после зала, присед стоит при лёгких, дыра в записях.`;

export function reviewPromptPayload(
  brief: ReviewBrief,
  previous: StoredReview | null = null,
): ReviewPromptPayload {
  return {
    range: brief.range,
    from: brief.from,
    to: brief.to,
    coverage: brief.coverage,
    nutrition: {
      logged: brief.nutrition.logged,
      rest: brief.nutrition.rest,
      training: brief.nutrition.training,
      protein_hit: brief.nutrition.protein_hit,
      protein_total: brief.nutrition.protein_total,
      kcal_hit: brief.nutrition.kcal_hit,
      kcal_total: brief.nutrition.kcal_total,
      weight: brief.nutrition.weight,
      halves: brief.nutrition.halves,
      days: brief.nutrition.days,
      foods: brief.nutrition.foods,
    },
    gym: {
      completed: brief.gym.completed,
      skipped: brief.gym.skipped,
      dynamic: brief.gym.dynamic,
      static: brief.gym.static,
      plan_hit: brief.gym.plan_hit,
      plan_total: brief.gym.plan_total,
      templates: brief.gym.templates,
      weak: brief.gym.weak,
      notes: brief.gym.notes,
      sessions: brief.gym.sessions,
      feels: brief.gym.feels,
    },
    phase: brief.phase,
    maxes: brief.maxes,
    signals: brief.signals,
    previous: previous
      ? {
          from: previous.from,
          to: previous.to,
          headline: previous.headline,
          observations: previous.observations,
          watch: previous.watch,
        }
      : null,
  };
}
