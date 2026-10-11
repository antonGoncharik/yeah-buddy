# Muscle map — data layer (ready for UI TZ)

## Catalog source

Repo `yeah-buddy-exercises`: `data/yeah-buddy-exercises.json` (1324 rows).

Each row has `target`, `secondary_muscles[]`, `body_part`, `equipment`, `name`.  
`muscle_group` duplicates one secondary entry — not imported.

## Database

Migration `0054_catalog_exercise_muscles.sql`:

- `catalog_exercises.target text`
- `catalog_exercises.secondary_muscles text[]`

After deploy:

```bash
npm run exercise-catalog:import -- /path/to/yeah-buddy-exercises/data/yeah-buddy-exercises.json
```

## Resolution order (`resolveExerciseMuscleWeights`)

1. `STARTER_MUSCLE_BY_SOURCE_ID` in `muscle-starter-overrides.ts` (curated, absolute weights).
2. Catalog `target` + `secondary_muscles` via `muscle-catalog-map.ts` + `muscle-resolve.ts`.
3. Legacy heuristics `resolveExerciseMuscles` in `muscle-taxonomy.ts` (normalized) for exercises without catalog link.

Weights are **not** normalized to sum 1 on the catalog path. Primary = 1.0, secondary = 0.5 (forearms / isolation secondaries = 0.25).

Compound glute target + squat/leg press/lunge name → force `quads` and `glutes` ≥ 1.0.

## Muscle ids

`traps`, `obliques`, `adductors` added to `MuscleId`. Current SVG screen does not draw them yet — they appear in API aggregates and the zone list once UI is rebuilt.

## Not done yet (UI TZ)

- Anatomical 2D SVG (e.g. body-highlighter paths)
- Weekly set bands instead of relative tonnage load
- Split metrics (volume vs freshness vs missed)
- `balance` / `insights` blocks in API

## Exercises repo hygiene

Fix mojibake `45в°` → `45°` in sled leg/calf press names (ids 0738, 0739, 0740, 1464) before next catalog publish.
