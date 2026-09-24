import { craftify } from "./core/craftify.tsx";
import { COMPONENTS } from "./registry.ts";

/** Resolver do Craft: um componente "craftificado" por definição. */
export const resolver = Object.fromEntries(Object.entries(COMPONENTS).map(([type, def]) => [type, craftify(def)]));
