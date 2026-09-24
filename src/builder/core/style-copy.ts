/**
 * Copiar e colar estilo entre elementos. Conteúdo (textos, imagens, links,
 * itens, campos, preços...) nunca é copiado: só a aparência.
 *
 * - Mesmo tipo: todo o estilo, incluindo layout e dimensões.
 * - Tipos diferentes: só o que é visual e existe nos dois (tipografia,
 *   fundo, borda, sombra e hover).
 */

/** Props que são conteúdo ou identidade do elemento, em qualquer componente. */
const CONTENT_KEYS = new Set([
	// textos
	"text",
	"html",
	"title",
	"description",
	"label",
	"quote",
	"name",
	"role",
	"linkText",
	"badge",
	"badgeText",
	"ctaText",
	"footerNote",
	"submitText",
	"loadingText",
	"successMessage",
	"errorMessage",
	"nextText",
	"prevText",
	"copiedText",
	"triggerText",
	"expireMessage",
	"ariaLabel",
	"prefix",
	"suffix",
	// mídia e links
	"src",
	"alt",
	"image",
	"imageAlt",
	"images",
	"avatar",
	"thumbnail",
	"url",
	"file",
	"embedCode",
	"source",
	"code",
	"address",
	"action",
	"ctaAction",
	"cardAction",
	"link",
	"redirect",
	"expireUrl",
	"urlMode",
	// listas e dados
	"items",
	"fields",
	"features",
	"formName",
	"tags",
	"value",
	"from",
	"amount",
	"cents",
	"currency",
	"period",
	"oldPrice",
	"installments",
	"rating",
	"endDate",
	"timezone",
	"durationMinutes",
	"dailyTime",
	"mode",
	"labels",
	"contact",
	"backToTop",
	"openByDefault",
	"tag",
	"titleTag",
	"nameTag",
	"htmlTag",
]);

/** Visual e comum a vários componentes: vale entre tipos diferentes. */
const SHARED_VISUAL = new Set([
	"typography",
	"background",
	"border",
	"shadow",
	"hover",
]);

export type CopiedStyle = { type: string; props: Record<string, unknown> };

const clone = <T>(v: T): T => structuredClone(v);

export function extractStyle(
	type: string,
	props: Record<string, unknown>,
): CopiedStyle {
	const out: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(props)) {
		if (CONTENT_KEYS.has(key)) continue;
		// ícone só com o nome (botão, ícone solto) é escolha de conteúdo
		if (key === "icon" && typeof value === "string") continue;
		out[key] = clone(value);
	}
	return { type, props: out };
}

const isObject = (v: unknown): v is Record<string, unknown> =>
	typeof v === "object" && v !== null && !Array.isArray(v);

/** Chaves que a colagem vai alterar no destino. */
export function pastableKeys(
	style: CopiedStyle,
	targetType: string,
	target: Record<string, unknown>,
) {
	const same = style.type === targetType;
	return Object.keys(style.props).filter(
		(key) => key in target && (same || SHARED_VISUAL.has(key)),
	);
}

/** Aplica o estilo copiado nas props (rascunho do setProp). */
export function applyStyle(
	style: CopiedStyle,
	targetType: string,
	draft: Record<string, unknown>,
) {
	for (const key of pastableKeys(style, targetType, draft)) {
		const value = clone(style.props[key]);
		if (key === "box" && isObject(value) && isObject(draft.box)) {
			// a âncora (#id) é do elemento, não do estilo
			draft.box = { ...value, anchorId: draft.box.anchorId };
		} else if (key === "icon" && isObject(value) && isObject(draft.icon)) {
			// ícone com estilo (Card com ícone): mantém o desenho de cada um
			draft.icon = { ...value, name: draft.icon.name };
		} else {
			draft[key] = value;
		}
	}
}
