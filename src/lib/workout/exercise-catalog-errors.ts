export class CatalogExerciseNotFoundError extends Error {
  constructor() {
    super("Упражнение не найдено в каталоге.");
    this.name = "CatalogExerciseNotFoundError";
  }
}
