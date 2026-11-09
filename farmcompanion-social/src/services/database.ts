/**
 * Fetch farm data from the directory database.
 *
 * NOT BUILT YET. It returns null, which `run()` reports as `skipped` with a
 * reason rather than as a successful post, so a monitor can tell "the cron
 * fired and did nothing" from "the cron fired and published". The `farmId`
 * parameter the first version took was never read, so it is gone until there
 * is something behind it to select.
 */

import type { Farm } from "../types.js";

export async function getFarm(): Promise<Farm | null> {
  return null;
}
