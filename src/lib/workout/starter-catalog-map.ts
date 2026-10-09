import { exerciseNameKey } from "@/lib/workout/dedupe-exercises";
import { STARTER_EXERCISES } from "@/lib/workout/starter-exercises";

/** Curated map: starter full name → 4-digit id in yeah-buddy-exercises.json */
const STARTER_SOURCE_EXERCISE_ID: Record<string, string> = {
  [exerciseNameKey("Приседания со штангой")]: "0043",
  [exerciseNameKey("Румынская тяга")]: "0085",
  [exerciseNameKey("Жим лёжа")]: "0025",
  [exerciseNameKey("Жим стоя")]: "1457",
  [exerciseNameKey("Тяга штанги в наклоне")]: "0027",
  [exerciseNameKey("Тяга верхнего блока")]: "0198",
  [exerciseNameKey("Становая тяга")]: "0032",
  [exerciseNameKey("Выпады")]: "0054",
  [exerciseNameKey("Жим гантелей лёжа")]: "0289",
  [exerciseNameKey("Отжимания на брусьях")]: "0814",
  [exerciseNameKey("Подтягивания")]: "0652",
  [exerciseNameKey("Тяга горизонтального блока")]: "0861",
  [exerciseNameKey("Жим ногами")]: "0739",
  [exerciseNameKey("Отжимания от пола")]: "0662",
  [exerciseNameKey("Жим гантелей стоя")]: "0426",
  [exerciseNameKey("Тяга гантели в наклоне")]: "0293",
  [exerciseNameKey("Жим лёжа под наклоном")]: "0047",
  [exerciseNameKey("Жим гантелей под наклоном")]: "0314",
  [exerciseNameKey("Жим гантелей сидя")]: "0405",
  [exerciseNameKey("Разведение гантелей в стороны")]: "0334",
  [exerciseNameKey("Жим узким хватом")]: "0030",
  [exerciseNameKey("Французский жим")]: "0060",
  [exerciseNameKey("Разгибание на блоке")]: "0201",
  [exerciseNameKey("Подъём штанги на бицепс")]: "0031",
  [exerciseNameKey("Подъём гантелей на бицепс")]: "0294",
  [exerciseNameKey("Молотковый подъём")]: "0313",
  [exerciseNameKey("Сгибание ног")]: "0586",
  [exerciseNameKey("Махи в наклоне")]: "0378",
  [exerciseNameKey("Гак-приседания")]: "0743",
  [exerciseNameKey("Разгибание ног")]: "0585",
  [exerciseNameKey("Гиперэкстензия")]: "0489",
  [exerciseNameKey("Подъём на носки стоя")]: "1372",
  [exerciseNameKey("Подъём на носки сидя")]: "0594",
  [exerciseNameKey("Наклоны со штангой")]: "0044",
  [exerciseNameKey("Тяга Т-штанги")]: "0606",
  [exerciseNameKey("Шраги со штангой")]: "0095",
  [exerciseNameKey("Тяга штанги к подбородку")]: "0120",
  [exerciseNameKey("Подъём гантелей перед собой")]: "0310",
  [exerciseNameKey("Обратные разведения в тренажёре")]: "0602",
  [exerciseNameKey("Жим от груди в тренажёре")]: "0576",
  [exerciseNameKey("Разведение гантелей лёжа")]: "0308",
  [exerciseNameKey("Сведение в кроссовере")]: "0227",
  [exerciseNameKey("Пуловер")]: "0375",
  [exerciseNameKey("Скручивания на блоке")]: "0175",
  [exerciseNameKey("Подъём на скамье Скотта")]: "0070",
  [exerciseNameKey("Концентрированный подъём")]: "0297",
  [exerciseNameKey("Пресс")]: "0274",
  [exerciseNameKey("Приседания без веса")]: "3119",
  [exerciseNameKey("Ягодичный мост")]: "3013",
  [exerciseNameKey("Обратные отжимания")]: "0129",
  [exerciseNameKey("Отжимания узкие")]: "0259",
  [exerciseNameKey("Отжимания уголком")]: "0279",
  [exerciseNameKey("Австралийские подтягивания")]: "0499",
  [exerciseNameKey("Лодочка")]: "0488",
  [exerciseNameKey("Планка")]: "0464",
  [exerciseNameKey("Боковая планка")]: "0705",
  [exerciseNameKey("Болгарские выпады")]: "0410",
  [exerciseNameKey("Ягодичный мост на одной")]: "3645",
  [exerciseNameKey("Отведение бедра лёжа")]: "3667",
  [exerciseNameKey("Приседания с гантелью")]: "1760",
  [exerciseNameKey("Румынская тяга с гантелями")]: "1459",
  [exerciseNameKey("Жим гантелей на полу")]: "0065",
};

export function starterSourceExerciseId(starterName: string): string | null {
  return STARTER_SOURCE_EXERCISE_ID[exerciseNameKey(starterName)] ?? null;
}

export const STARTER_CATALOG_SOURCE_IDS = new Set(
  Object.values(STARTER_SOURCE_EXERCISE_ID),
);

/** Russian display name for catalog rows that match a starter id. */
export function starterNameRuForSourceId(
  sourceExerciseId: string,
): string | null {
  for (const starter of STARTER_EXERCISES) {
    const id = starterSourceExerciseId(starter.name);
    if (id === sourceExerciseId) {
      return starter.name;
    }
  }
  return null;
}

export function assertStarterCatalogMapComplete(): void {
  const missing = STARTER_EXERCISES.filter(
    (starter) => !starterSourceExerciseId(starter.name),
  );
  if (missing.length > 0) {
    throw new Error(
      `starter catalog map missing: ${missing.map((item) => item.name).join(", ")}`,
    );
  }
}
