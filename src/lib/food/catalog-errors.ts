export class CatalogFoodNotFoundError extends Error {
  constructor() {
    super("Продукт не найден.");
    this.name = "CatalogFoodNotFoundError";
  }
}
