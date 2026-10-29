"use client";

import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  catalogExerciseSearchActive,
  useCatalogExerciseSearch,
} from "@/components/workout/use-catalog-exercise-search";
import {
  type CatalogExerciseSummary,
  catalogExerciseDisplayName,
} from "@/lib/workout/exercise-catalog-map";

export function ExerciseTechniqueCatalogPicker({
  searchInputId,
  linked,
  query,
  onQueryChange,
  linkError,
  pendingId,
  onPick,
  onCancelReplace,
}: {
  searchInputId: string;
  linked: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  linkError: string | null;
  pendingId: string | null;
  onPick: (item: CatalogExerciseSummary) => void;
  onCancelReplace?: () => void;
}) {
  const catalog = useCatalogExerciseSearch(query);
  const showResults = catalogExerciseSearchActive(query);

  return (
    <div className="flex flex-col gap-3">
      {!linked ? (
        <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2.5 text-sm text-muted-foreground">
          <Search className="size-4 shrink-0" aria-hidden />
          <span>Например: выпады, squat, жим лёжа</span>
        </div>
      ) : null}
      <Input
        id={searchInputId}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Поиск в каталоге"
        className="h-12 text-base"
        inputMode="search"
        enterKeyHint="search"
      />
      {linkError ? (
        <p className="text-sm text-destructive">{linkError}</p>
      ) : null}
      {showResults && catalog.loading ? (
        <p className="text-sm text-muted-foreground">Ищем…</p>
      ) : null}
      {showResults && !catalog.loading && catalog.exercises.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ничего не нашлось.</p>
      ) : null}
      {showResults && catalog.exercises.length > 0 ? (
        <ul className="flex flex-col gap-0.5 rounded-xl border border-border/60 bg-background">
          {catalog.exercises.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                disabled={pendingId != null}
                className="flex w-full flex-col gap-0.5 px-3 py-3 text-left first:rounded-t-xl last:rounded-b-xl hover:bg-muted/50 disabled:opacity-60"
                onClick={() => onPick(item)}
              >
                <span className="text-base font-medium">
                  {catalogExerciseDisplayName(item, "ru")}
                </span>
                <span className="text-sm text-muted-foreground">
                  {item.name_en}
                  {item.equipment ? ` · ${item.equipment}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {linked && onCancelReplace ? (
        <Button
          type="button"
          variant="ghost"
          className="h-11 self-start text-base"
          onClick={onCancelReplace}
        >
          Отмена
        </Button>
      ) : null}
    </div>
  );
}
