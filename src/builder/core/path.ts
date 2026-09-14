/** Leitura e escrita por caminho com pontos ("typography.fontSize"). */

export function getPath<T = unknown>(obj: unknown, path: string): T {
	let cur: unknown = obj;
	for (const key of path.split(".")) {
		if (cur === null || cur === undefined) return undefined as T;
		cur = (cur as Record<string, unknown>)[key];
	}
	return cur as T;
}

/** Escreve mutando `obj`. Pensado para o draft (immer) do `setProp` do Craft. */
export function setPath(
	obj: Record<string, unknown>,
	path: string,
	value: unknown,
) {
	const keys = path.split(".");
	let cur: Record<string, unknown> = obj;
	for (const key of keys.slice(0, -1)) {
		const next = cur[key];
		if (typeof next !== "object" || next === null) cur[key] = {};
		cur = cur[key] as Record<string, unknown>;
	}
	cur[keys[keys.length - 1]] = value;
}
