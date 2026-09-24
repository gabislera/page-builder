import { craftify } from "./core/craftify.tsx";
import { COMPONENTS } from "./registry.ts";

/** Craft resolver: one craftified component per definition. */
export const resolver = Object.fromEntries(Object.entries(COMPONENTS).map(([type, def]) => [type, craftify(def)]));
