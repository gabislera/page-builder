import { Video as VideoIcon } from "lucide-react";
import { ColorField } from "../controls/color.tsx";
import { Group } from "../controls/field.tsx";
import {
	BorderFields,
	BoxFields,
	MediaPathField,
	NumberField,
	ShadowFields,
} from "../controls/groups.tsx";
import {
	NumberUnitField,
	SelectField,
	SwitchField,
	TextAreaField,
	TextField,
} from "../controls/inputs.tsx";
import { SettingsTabs } from "../controls/settings-layout.tsx";
import { useField } from "../controls/use-field.ts";
import { defaultBorder, defaultBox, defaultShadow } from "../core/defaults.ts";
import { nodeClassName } from "../core/node-helpers.ts";
import { useIsEditor } from "../core/render-context.tsx";
import { responsive } from "../core/responsive.ts";
import {
	applyBorder,
	applyBox,
	createSheet,
	shadowToCss,
} from "../core/style-engine.ts";
import type { Border, Box, Length, Shadow } from "../core/style-types.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";

type VideoSource = "youtube" | "vimeo" | "upload" | "embed";
type AspectRatio = "16/9" | "9/16" | "4/3" | "1/1" | "custom" | "auto";

export type VideoProps = {
	source: VideoSource;
	/** Link do YouTube ou do Vimeo (qualquer formato). */
	url: string;
	/** Arquivo enviado (mp4/webm). */
	file: string;
	/** Código de incorporação (iframe/embed) colado pelo usuário. */
	embedCode: string;
	autoplay: boolean;
	muted: boolean;
	loop: boolean;
	controls: boolean;
	playsinline: boolean;
	/** Começar em (segundos). */
	start: number;
	aspect: AspectRatio;
	/** Proporção livre, ex.: "21/9". */
	customAspect: string;
	/** YouTube: mostra a miniatura e só carrega o player ao clicar. */
	lite: boolean;
	/** Miniatura própria. Se definida, o player só carrega ao clicar. */
	thumbnail: string;
	playIconSize: Length;
	playIconColor: string;
	playIconBackground: string;
	title: string;
	border: Border;
	shadow: Shadow;
	box: Box;
};

/* ------------------------------------------------------------------ */
/* URLs                                                                */
/* ------------------------------------------------------------------ */

/** Extrai o id de qualquer link do YouTube (watch, youtu.be, shorts, embed, live). */
export function youtubeId(url: string): string | null {
	const u = url.trim();
	if (/^[\w-]{11}$/.test(u)) return u;
	const m =
		/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([\w-]{11})/i.exec(
			u,
		);
	return m ? m[1] : null;
}

/** Id (e hash de vídeos privados) de um link do Vimeo. */
export function vimeoId(url: string): { id: string; hash?: string } | null {
	const u = url.trim();
	if (/^\d+$/.test(u)) return { id: u };
	const m = /vimeo\.com\/(?:.*?\/)?(\d+)(?:\/([\da-f]+))?/i.exec(u);
	if (!m) return null;
	const hash =
		m[2] ?? new URLSearchParams(u.split("?")[1] ?? "").get("h") ?? undefined;
	return { id: m[1], hash };
}

const flag = (params: URLSearchParams, key: string, on: boolean) => {
	if (on) params.set(key, "1");
};

/**
 * URL do player. `autoplay` já vem resolvido (no editor é sempre falso).
 * Autoplay força o áudio mudo, senão o navegador bloqueia.
 */
export function playerUrl(p: VideoProps, autoplay: boolean): string | null {
	const muted = p.muted || autoplay;
	const start = Math.max(0, Math.floor(p.start || 0));
	if (p.source === "youtube") {
		const id = youtubeId(p.url);
		if (!id) return null;
		const params = new URLSearchParams({ rel: "0" });
		flag(params, "autoplay", autoplay);
		flag(params, "mute", muted);
		flag(params, "playsinline", p.playsinline);
		if (!p.controls) params.set("controls", "0");
		if (p.loop) {
			// o YouTube só repete com a playlist apontando para o próprio vídeo
			params.set("loop", "1");
			params.set("playlist", id);
		}
		if (start) params.set("start", String(start));
		return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
	}
	if (p.source === "vimeo") {
		const v = vimeoId(p.url);
		if (!v) return null;
		const params = new URLSearchParams();
		if (v.hash) params.set("h", v.hash);
		flag(params, "autoplay", autoplay);
		flag(params, "muted", muted);
		flag(params, "loop", p.loop);
		flag(params, "playsinline", p.playsinline);
		if (!p.controls) params.set("controls", "0");
		const qs = params.toString();
		return `https://player.vimeo.com/video/${v.id}${qs ? `?${qs}` : ""}${start ? `#t=${start}s` : ""}`;
	}
	return null;
}

const ALLOW =
	"accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share";

function aspectCss(p: VideoProps): string | undefined {
	if (p.aspect === "auto") return undefined;
	if (p.aspect !== "custom") return p.aspect.replace("/", " / ");
	const m = /^\s*(\d+(?:\.\d+)?)\s*[/:x]\s*(\d+(?:\.\d+)?)\s*$/.exec(
		p.customAspect,
	);
	return m ? `${m[1]} / ${m[2]}` : "16 / 9";
}

/* ------------------------------------------------------------------ */
/* View                                                                */
/* ------------------------------------------------------------------ */

function PlayIcon() {
	return (
		<span className="pb-video-play" aria-hidden="true">
			<svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">
				<path
					d="M8 5.5v13a1 1 0 0 0 1.52.85l10.4-6.5a1 1 0 0 0 0-1.7L9.52 4.65A1 1 0 0 0 8 5.5z"
					fill="currentColor"
				/>
			</svg>
		</span>
	);
}

function VideoView({ id, props: p, rootRef }: NodeViewProps<VideoProps>) {
	const isEditor = useIsEditor();
	const className = nodeClassName(id, "pb-video", p.box);
	const ytId = p.source === "youtube" ? youtubeId(p.url) : null;
	const thumb =
		p.thumbnail || (ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : "");
	const title = p.title || "Vídeo";

	let content: React.ReactNode = null;
	let empty = false;

	if (p.source === "youtube" || p.source === "vimeo") {
		const embedSrc = playerUrl(p, false);
		// com autoplay na página publicada o player precisa carregar direto
		const useFacade =
			Boolean(thumb) &&
			(isEditor || (!p.autoplay && (Boolean(p.thumbnail) || p.lite)));
		if (!embedSrc) {
			empty = true;
		} else if (useFacade) {
			content = (
				<button
					type="button"
					className="pb-video-facade"
					data-pb-video-facade=""
					data-pb-src={embedSrc}
					aria-label={`Reproduzir: ${title}`}
				>
					<img
						src={thumb}
						alt=""
						loading={isEditor ? undefined : "lazy"}
						decoding="async"
					/>
					<PlayIcon />
				</button>
			);
		} else {
			content = (
				<iframe
					src={isEditor ? embedSrc : (playerUrl(p, p.autoplay) ?? embedSrc)}
					title={title}
					allow={ALLOW}
					allowFullScreen
					loading={isEditor || p.autoplay ? undefined : "lazy"}
					referrerPolicy="strict-origin-when-cross-origin"
				/>
			);
		}
	} else if (p.source === "upload") {
		if (!p.file) {
			empty = true;
		} else {
			const autoplay = !isEditor && p.autoplay;
			content = (
				<video
					src={p.file}
					poster={p.thumbnail || undefined}
					controls={p.controls}
					autoPlay={autoplay}
					muted={p.muted || autoplay}
					loop={p.loop}
					playsInline={p.playsinline}
					preload={autoplay ? "auto" : "metadata"}
				/>
			);
		}
	} else if (!p.embedCode.trim()) {
		empty = true;
	} else {
		content = (
			<div
				className="pb-video-embed"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: código de incorporação colado pelo dono da página
				dangerouslySetInnerHTML={{ __html: p.embedCode }}
			/>
		);
	}

	if (empty) {
		if (!isEditor) return null;
		return (
			<div
				ref={rootRef as React.Ref<HTMLDivElement>}
				className={className}
				data-pb-node={id}
			>
				<div className="pb-placeholder">
					Cole o link do vídeo no painel ao lado
				</div>
			</div>
		);
	}

	return (
		<div
			ref={rootRef as React.Ref<HTMLDivElement>}
			className={className}
			data-pb-node={id}
		>
			<div className="pb-video-frame">
				{content}
				{/* no editor, uma camada por cima garante que o clique seleciona o nó */}
				{isEditor ? <div className="pb-video-shield" /> : null}
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

function VideoSettings() {
	const source = useField<VideoSource>("source").value;
	const aspect = useField<AspectRatio>("aspect").value;
	const autoplay = useField<boolean>("autoplay").value;
	const isPlayer = source === "youtube" || source === "vimeo";
	return (
		<SettingsTabs
			content={
				<>
					<Group title="Vídeo">
						<SelectField
							path="source"
							label="Origem"
							options={[
								{ value: "youtube", label: "YouTube" },
								{ value: "vimeo", label: "Vimeo" },
								{ value: "upload", label: "Arquivo enviado" },
								{ value: "embed", label: "Código de incorporação" },
							]}
						/>
						{isPlayer ? (
							<TextField
								path="url"
								label="Link do vídeo"
								placeholder={
									source === "youtube"
										? "https://www.youtube.com/watch?v=..."
										: "https://vimeo.com/..."
								}
								hint="Cole o link do navegador ou de compartilhamento."
							/>
						) : null}
						{source === "upload" ? (
							<MediaPathField path="file" label="Arquivo" accept="video" />
						) : null}
						{source === "embed" ? (
							<TextAreaField
								path="embedCode"
								label="Código"
								rows={5}
								hint="Cole o <iframe> fornecido pela plataforma do vídeo."
							/>
						) : null}
						<TextField path="title" label="Título (acessibilidade)" />
					</Group>
					{source !== "embed" ? (
						<Group title="Reprodução">
							<SwitchField
								path="autoplay"
								label="Reproduzir automaticamente"
								hint={
									autoplay
										? "Com reprodução automática o vídeo começa sem som."
										: undefined
								}
							/>
							<SwitchField path="muted" label="Sem som" />
							<SwitchField path="loop" label="Repetir" />
							<SwitchField path="controls" label="Mostrar controles" />
							<SwitchField
								path="playsinline"
								label="Tocar na página (iPhone)"
							/>
							{isPlayer ? (
								<NumberField
									path="start"
									label="Começar em (segundos)"
									max={36000}
								/>
							) : null}
						</Group>
					) : null}
					{source !== "embed" ? (
						<Group title="Miniatura" defaultOpen={false}>
							{source === "youtube" ? (
								<SwitchField
									path="lite"
									label="Carregamento leve"
									hint="Mostra a miniatura e só carrega o YouTube ao clicar. Deixa a página bem mais rápida."
								/>
							) : null}
							<MediaPathField
								path="thumbnail"
								label="Miniatura personalizada"
								accept="image"
								hint={
									source === "upload"
										? "Imagem mostrada antes do play."
										: "Com miniatura, o player só carrega ao clicar (sem reprodução automática)."
								}
							/>
						</Group>
					) : null}
				</>
			}
			style={
				<>
					<Group title="Dimensões">
						<SelectField
							path="aspect"
							label="Proporção"
							options={[
								{ value: "16/9", label: "16:9 (paisagem)" },
								{ value: "9/16", label: "9:16 (vertical)" },
								{ value: "4/3", label: "4:3" },
								{ value: "1/1", label: "1:1 (quadrado)" },
								{ value: "custom", label: "Personalizada" },
								{ value: "auto", label: "Automática" },
							]}
						/>
						{aspect === "custom" ? (
							<TextField
								path="customAspect"
								label="Proporção personalizada"
								placeholder="21/9"
							/>
						) : null}
						<NumberUnitField
							path="box.maxWidth"
							label="Largura máxima"
							units={["px", "%", "vw"]}
							keywords={["none"]}
							max={1600}
						/>
					</Group>
					{isPlayer ? (
						<Group title="Botão de play" defaultOpen={false}>
							<NumberUnitField
								path="playIconSize"
								label="Tamanho"
								units={["px"]}
								max={200}
							/>
							<ColorField path="playIconColor" label="Cor do ícone" />
							<ColorField path="playIconBackground" label="Fundo" allowEmpty />
						</Group>
					) : null}
					<Group title="Borda" defaultOpen={false}>
						<BorderFields base="border" />
					</Group>
					<Group title="Sombra" defaultOpen={false}>
						<ShadowFields base="shadow" />
					</Group>
				</>
			}
			advanced={<BoxFields />}
		/>
	);
}

export const Video: ComponentDefinition<VideoProps> = {
	type: "Video",
	displayName: "Vídeo",
	category: "media",
	icon: VideoIcon,
	inToolbox: true,
	defaults: {
		source: "youtube",
		url: "",
		file: "",
		embedCode: "",
		autoplay: false,
		muted: false,
		loop: false,
		controls: true,
		playsinline: true,
		start: 0,
		aspect: "16/9",
		customAspect: "21/9",
		lite: true,
		thumbnail: "",
		playIconSize: "72px",
		playIconColor: "#ffffff",
		playIconBackground: "#000000a6",
		title: "",
		border: defaultBorder(),
		shadow: defaultShadow(),
		box: defaultBox({ width: responsive("100%") }),
	},
	View: VideoView,
	css: (id, p) => {
		const sheet = createSheet(id);
		sheet.root().set("display", "block");
		const frame = sheet.rule(" .pb-video-frame");
		frame
			.set("position", "relative")
			.set("width", "100%")
			.set("overflow", "hidden")
			.set("background-color", "#000000")
			.set("aspect-ratio", aspectCss(p))
			.set("box-shadow", shadowToCss(p.shadow));
		applyBorder(frame, p.border);
		// cada seletor precisa do prefixo do nó (a regra não separa por vírgula)
		const media = [
			" .pb-video-frame > iframe",
			" .pb-video-frame > video",
			" .pb-video-facade",
			" .pb-video-embed",
		];
		for (const suffix of media) {
			const rule = sheet
				.rule(suffix)
				.set("display", "block")
				.set("width", "100%")
				.set("border", "0");
			// na proporção automática o conteúdo define a altura
			if (p.aspect !== "auto")
				rule
					.set("position", "absolute")
					.set("inset", "0")
					.set("height", "100%");
		}
		if (p.aspect === "auto")
			sheet.rule(" .pb-video-frame > iframe").set("aspect-ratio", "16 / 9");
		for (const tag of ["iframe", "video", "embed"]) {
			sheet
				.rule(` .pb-video-embed ${tag}`)
				.set("width", "100%")
				.set("height", "100%")
				.set("border", "0");
		}
		sheet
			.rule(" .pb-video-facade")
			.set("padding", "0")
			.set("margin", "0")
			.set("cursor", "pointer")
			.set("background", "#000000")
			.set("overflow", "hidden");
		sheet
			.rule(" .pb-video-facade img")
			.set("width", "100%")
			.set("height", "100%")
			.set("object-fit", "cover")
			.set("transition", "transform .3s ease");
		sheet.rule(" .pb-video-facade:hover img").set("transform", "scale(1.03)");
		sheet
			.rule(" .pb-video-play")
			.set("position", "absolute")
			.set("top", "50%")
			.set("left", "50%")
			.set("transform", "translate(-50%, -50%)")
			.set("display", "flex")
			.set("width", p.playIconSize)
			.set("height", p.playIconSize)
			.set("padding", `calc(${p.playIconSize} * .24)`)
			.set("padding-left", `calc(${p.playIconSize} * .28)`)
			.set("border-radius", "50%")
			.set("color", p.playIconColor)
			.set("background", p.playIconBackground || "transparent")
			.set("transition", "transform .2s ease");
		sheet
			.rule(" .pb-video-facade:hover .pb-video-play")
			.set("transform", "translate(-50%, -50%) scale(1.08)");
		sheet
			.rule(" .pb-video-shield")
			.set("position", "absolute")
			.set("inset", "0")
			.set("z-index", "2");
		applyBox(sheet, p.box);
		return sheet.toString();
	},
	Settings: VideoSettings,
	runtime: ["video"],
};
