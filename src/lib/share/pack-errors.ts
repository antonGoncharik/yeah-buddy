import { PACK_LIMIT, PACK_NOT_FOUND } from "@/lib/messages";
import { PackEmptyError } from "@/lib/share/payload";

export class PackNotFoundError extends Error {
  constructor() {
    super(PACK_NOT_FOUND);
  }
}

export class PackLimitError extends Error {
  constructor() {
    super(PACK_LIMIT);
  }
}

export { PackEmptyError };
