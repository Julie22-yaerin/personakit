import { createJsonFileStore, type PersonaKitStore } from "@personakit/store";
import path from "node:path";

const DATA_DIR = process.env.PERSONAKIT_DATA_DIR ?? path.join(process.cwd(), "data");

let cached: PersonaKitStore | undefined;

/**
 * Single-process JSON-file store (see @personakit/store). Fine for local
 * dev / a single self-hosted instance; swap for a real database before
 * running this behind multiple serverless instances.
 */
export function getStore(): PersonaKitStore {
  if (!cached) {
    cached = createJsonFileStore(path.join(DATA_DIR, "personakit-store.json"));
  }
  return cached;
}
