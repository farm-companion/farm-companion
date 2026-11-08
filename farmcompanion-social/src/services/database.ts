/**
 * Fetch farm data from your DB
 */

import type { Farm } from "../types.js";

export async function getFarm(farmId?: string): Promise<Farm | null> {
  // TODO: connect to your DB and return farm by id (or default farm)
  return null;
}
