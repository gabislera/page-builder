import {
	AlignCenter,
	AlignJustify,
	AlignLeft,
	AlignRight,
	Eye,
	Link2,
	Link2Off,
	Monitor,
	Smartphone,
	Tablet,
} from "lucide-react";
import { useState } from "react";
import { Switch } from "#/components/ui/switch";
import { cn } from "#/lib/utils";
import { corners, sides } from "../core/defaults.ts";
import { getPath } from "../core/path.ts";
import type { Responsive } from "../core/responsive.ts";
import type { Background, Corners, Sides } from "../core/style-types.ts";
import { fontChoices } from "../core/theme.ts";
import { CodeField } from "./code.tsx";
import { ColorField } from "./color.tsx";
import { Field, Group } from "./field.tsx";
import {
	NumberUnitField,
	NumberUnitInput,
	type Option,
	SegmentedField,
	SelectField,
	SwitchField,
	TextField,
	type Unit,
} from "./inputs.tsx";
import { MediaInput } from "./media.tsx";
import { useField, useNodeProps } from "./use-field.ts";

const join = (base: string, key: string) => (base ? `${base}.${key}` : key);

/* ------------------------------------------------------------------ */
/* Lados e cantos                                                      */
/* ------------------------------------------------------------------ */

const SIDE_LABELS: Record<keyof Sides, string> = {
	top: "Cima",
	right: "Dir.",
	bottom: "Baixo",
	left: "Esq.",
};
const CORNER_LABELS: Record<keyof Corners, string> = {
	topLeft: "↖",
	topRight: "↗",
	bottomRight: "↘",
	bottomLeft: "↙",
};

function FourValues<K extends string>({
	value,
	labels,
	onChange,
	units,
	keywords = [],
}: {
	value: Record<K, string>;
	labels: Record<K, string>;
	onChange: (value: Record<K, string>, throttle?: boolean) => void;
	units: Unit[];
	keywords?: string[];
}) {
	const keys = Object.keys(labels) as K[];
	const allEqual = keys.every((k) => value[k] === value[keys[0]]);
	const [linked, setLinked] = useState(allEqual);

	if (linked) {
		return (
			<div className="flex items-center gap-2">
				<div className="flex-1">
					<NumberUnitInput
						value={value[keys[0]]}
						units={units}
						keywords={keywords}
						onChange={(v, t) =>
							onChange(
								Object.fromEntries(keys.map((k) => [k, v])) as Record<
									K,
									string
								>,
								t,
							)
						}
					/>
				</div>
				<LinkToggle linked onClick={() => setLinked(false)} />
			</div>
		);
	}
	return (
		<div className="flex items-start gap-2">
			<div className="grid flex-1 grid-cols-2 gap-2">
				{keys.map((k) => (
					<div key={k} className="flex flex-col gap-1">
						<span className="text-[10px] text-muted-foreground">
							{labels[k]}
						</span>
						<NumberUnitInput
							slider={false}
							value={value[k]}
							units={units}
							keywords={keywords}
							onChange={(v, t) => onChange({ ...value, [k]: v }, t)}
						/>
					</div>
				))}
			</div>
			<LinkToggle linked={false} onClick={() => setLinked(true)} />
		</div>
	);
}

function LinkToggle({
	linked,
	onClick,
}: {
	linked: boolean;
	onClick: () => void;
}) {
	const Icon = linked ? Link2 : Link2Off;
	return (
		<button
			type="button"
			title={linked ? "Editar lados separadamente" : "Vincular lados"}
			onClick={onClick}
			className={cn(
				"flex size-8 shrink-0 items-center justify-center rounded-md border border-input hover:bg-accent",
				linked && "text-primary",
			)}
		>
			<Icon className="size-3.5" />
		</button>
	);
}

export function SidesField({
	path,
	label,
	units = ["px", "%", "rem"],
	keywords,
	hint,
}: {
	path: string;
	label: string;
	units?: Unit[];
	keywords?: string[];
	hint?: string;
}) {
	const f = useField<Sides>(path);
	return (
		<Field
			label={label}
			hint={hint}
			responsive={f.responsive}
			overridden={f.overridden}
			onReset={f.reset}
		>
			<FourValues
				value={f.value ?? sides("0px")}
				labels={SIDE_LABELS}
				units={units}
				keywords={keywords}
				onChange={(v, t) => f.set(v, { throttle: t })}
			/>
		</Field>
	);
}

export function CornersField({ path, label }: { path: string; label: string }) {
	const f = useField<Corners>(path);
	return (
		<Field
			label={label}
			responsive={f.responsive}
			overridden={f.overridden}
			onReset={f.reset}
		>
			<FourValues
				value={f.value ?? corners("0px")}
				labels={CORNER_LABELS}
				units={["px", "%"]}
				onChange={(v, t) => f.set(v, { throttle: t })}
			/>
		</Field>
	);
}

/* ------------------------------------------------------------------ */
/* Tipografia                                                          */
/* ------------------------------------------------------------------ */

const WEIGHTS: Option[] = [
	{ value: "300", label: "Leve (300)" },
	{ value: "400", label: "Normal (400)" },
	{ value: "500", label: "Médio (500)" },
	{ value: "600", label: "Semi-negrito (600)" },
	{ value: "700", label: "Negrito (700)" },
	{ value: "800", label: "Extra-negrito (800)" },
	{ value: "900", label: "Black (900)" },
];

export const TEXT_ALIGN: Option[] = [
	{ value: "left", label: "Esquerda", icon: AlignLeft },
	{ value: "center", label: "Centro", icon: AlignCenter },
	{ value: "right", label: "Direita", icon: AlignRight },
	{ value: "justify", label: "Justificado", icon: AlignJustify },
];

export function TypographyFields({
	base,
	withColor = true,
	withAlign = true,
}: {
	base: string;
	withColor?: boolean;
	withAlign?: boolean;
}) {
	return (
		<>
			<SelectField
				path={join(base, "fontFamily")}
				label="Fonte"
				options={fontChoices({ inherit: true })}
			/>
			<div className="grid grid-cols-1 gap-3">
				<NumberUnitField
					path={join(base, "fontSize")}
					label="Tamanho"
					units={["px", "rem", "em", "vw"]}
					max={120}
				/>
				<SelectField
					path={join(base, "fontWeight")}
					label="Peso"
					options={WEIGHTS}
				/>
			</div>
			{withColor ? <ColorField path={join(base, "color")} label="Cor" /> : null}
			{withAlign ? (
				<SegmentedField
					path={join(base, "textAlign")}
					label="Alinhamento"
					options={TEXT_ALIGN}
				/>
			) : null}
			<NumberUnitField
				path={join(base, "lineHeight")}
				label="Altura da linha"
				unitless
				max={3}
				step={0.05}
			/>
			<NumberUnitField
				path={join(base, "letterSpacing")}
				label="Espaço entre letras"
				units={["px", "em"]}
				min={-5}
				max={20}
			/>
			<div className="grid grid-cols-2 gap-3">
				<SelectField
					path={join(base, "textTransform")}
					label="Caixa"
					options={[
						{ value: "none", label: "Normal" },
						{ value: "uppercase", label: "MAIÚSCULA" },
						{ value: "lowercase", label: "minúscula" },
						{ value: "capitalize", label: "Capitalizar" },
					]}
				/>
				<SelectField
					path={join(base, "fontStyle")}
					label="Estilo"
					options={[
						{ value: "normal", label: "Normal" },
						{ value: "italic", label: "Itálico" },
					]}
				/>
			</div>
		</>
	);
}

/* ------------------------------------------------------------------ */
/* Fundo                                                               */
/* ------------------------------------------------------------------ */

export function BackgroundFields({ base }: { base: string }) {
	const type = useField<Background["type"]>(join(base, "type"));
	return (
		<>
			<SegmentedField
				path={join(base, "type")}
				label="Tipo"
				options={[
					{ value: "none", label: "Nenhum" },
					{ value: "color", label: "Cor" },
					{ value: "gradient", label: "Gradiente" },
					{ value: "image", label: "Imagem" },
				]}
			/>
			{type.value === "color" ? (
				<ColorField path={join(base, "color")} label="Cor" />
			) : null}
			{type.value === "gradient" ? (
				<>
					<SegmentedField
						path={join(base, "gradient.type")}
						label="Formato"
						options={[
							{ value: "linear", label: "Linear" },
							{ value: "radial", label: "Radial" },
						]}
					/>
					<ColorField path={join(base, "gradient.from")} label="Cor inicial" />
					<NumberField
						path={join(base, "gradient.fromPosition")}
						label="Posição inicial (%)"
						max={100}
					/>
					<ColorField path={join(base, "gradient.to")} label="Cor final" />
					<NumberField
						path={join(base, "gradient.toPosition")}
						label="Posição final (%)"
						max={100}
					/>
					<NumberField
						path={join(base, "gradient.angle")}
						label="Ângulo (°)"
						max={360}
					/>
				</>
			) : null}
			{type.value === "image" ? (
				<>
					<MediaPathField
						path={join(base, "image.url")}
						label="Imagem"
						accept="image"
					/>
					<SelectField
						path={join(base, "image.size")}
						label="Tamanho"
						options={[
							{ value: "cover", label: "Cobrir" },
							{ value: "contain", label: "Conter" },
							{ value: "auto", label: "Original" },
						]}
					/>
					<SelectField
						path={join(base, "image.position")}
						label="Posição"
						options={[
							"center center",
							"top center",
							"bottom center",
							"center left",
							"center right",
						].map((v) => ({ value: v, label: POSITION_LABEL[v] }))}
					/>
					<SwitchField path={join(base, "image.repeat")} label="Repetir" />
					<SwitchField
						path={join(base, "image.fixed")}
						label="Fixo ao rolar (parallax)"
					/>
					<ColorField
						path={join(base, "overlay")}
						label="Sobreposição"
						allowEmpty
					/>
				</>
			) : null}
		</>
	);
}

const POSITION_LABEL: Record<string, string> = {
	"center center": "Centro",
	"top center": "Topo",
	"bottom center": "Base",
	"center left": "Esquerda",
	"center right": "Direita",
};

/** Número simples (sem unidade no valor salvo). */
export function NumberField({
	path,
	label,
	min = 0,
	max = 100,
	step = 1,
}: {
	path: string;
	label: string;
	min?: number;
	max?: number;
	step?: number;
}) {
	const f = useField<number>(path);
	return (
		<Field
			label={label}
			responsive={f.responsive}
			overridden={f.overridden}
			onReset={f.reset}
		>
			<NumberUnitInput
				unitless
				min={min}
				max={max}
				step={step}
				value={String(f.value ?? 0)}
				onChange={(v, t) => f.set(Number(v), { throttle: t })}
			/>
		</Field>
	);
}

export function MediaPathField({
	path,
	label,
	accept,
	hint,
}: {
	path: string;
	label: string;
	accept: "image" | "video" | "svg";
	hint?: string;
}) {
	const f = useField<string>(path);
	return (
		<Field
			label={label}
			hint={hint}
			responsive={f.responsive}
			overridden={f.overridden}
			onReset={f.reset}
		>
			<MediaInput value={f.value} onChange={(v) => f.set(v)} accept={accept} />
		</Field>
	);
}

/* ------------------------------------------------------------------ */
/* Borda, sombra e hover                                               */
/* ------------------------------------------------------------------ */

export function BorderFields({ base }: { base: string }) {
	const style = useField<string>(join(base, "style"));
	return (
		<>
			<SelectField
				path={join(base, "style")}
				label="Estilo"
				options={[
					{ value: "none", label: "Nenhuma" },
					{ value: "solid", label: "Sólida" },
					{ value: "dashed", label: "Tracejada" },
					{ value: "dotted", label: "Pontilhada" },
				]}
			/>
			{style.value !== "none" ? (
				<>
					<SidesField
						path={join(base, "width")}
						label="Espessura"
						units={["px"]}
					/>
					<ColorField path={join(base, "color")} label="Cor" />
				</>
			) : null}
			<CornersField path={join(base, "radius")} label="Arredondamento" />
		</>
	);
}

export function ShadowFields({ base, text }: { base: string; text?: boolean }) {
	const enabled = useField<boolean>(join(base, "enabled"));
	return (
		<>
			<SwitchField
				path={join(base, "enabled")}
				label={text ? "Sombra no texto" : "Sombra"}
			/>
			{enabled.value ? (
				<>
					<ColorField path={join(base, "color")} label="Cor" />
					<NumberField
						path={join(base, "x")}
						label="Horizontal"
						min={-50}
						max={50}
					/>
					<NumberField
						path={join(base, "y")}
						label="Vertical"
						min={-50}
						max={50}
					/>
					<NumberField path={join(base, "blur")} label="Desfoque" max={100} />
					{text ? null : (
						<>
							<NumberField
								path={join(base, "spread")}
								label="Expansão"
								min={-50}
								max={50}
							/>
							<SwitchField path={join(base, "inset")} label="Interna" />
						</>
					)}
				</>
			) : null}
		</>
	);
}

export function HoverFields({
	base,
	withBackground = true,
	withColor = true,
}: {
	base: string;
	withBackground?: boolean;
	withColor?: boolean;
}) {
	const enabled = useField<boolean>(join(base, "enabled"));
	return (
		<>
			<SwitchField
				path={join(base, "enabled")}
				label="Efeito ao passar o mouse"
			/>
			{enabled.value ? (
				<>
					{withBackground ? (
						<ColorField
							path={join(base, "background")}
							label="Fundo"
							allowEmpty
						/>
					) : null}
					{withColor ? (
						<ColorField path={join(base, "color")} label="Texto" allowEmpty />
					) : null}
					<ColorField
						path={join(base, "borderColor")}
						label="Borda"
						allowEmpty
					/>
					<NumberField
						path={join(base, "opacity")}
						label="Opacidade"
						max={1}
						step={0.05}
					/>
					<NumberField
						path={join(base, "scale")}
						label="Zoom"
						min={0.8}
						max={1.3}
						step={0.01}
					/>
					<NumberField
						path={join(base, "durationMs")}
						label="Duração (ms)"
						max={1000}
						step={50}
					/>
				</>
			) : null}
		</>
	);
}

/* ------------------------------------------------------------------ */
/* Aba Avançado (Box)                                                  */
/* ------------------------------------------------------------------ */

const VISIBILITY_DEVICES = [
	{ key: "desktop", label: "Desktop", icon: Monitor },
	{ key: "tablet", label: "Tablet", icon: Tablet },
	{ key: "mobile", label: "Celular", icon: Smartphone },
] as const;

export function BoxFields({
	base = "box",
	withSize = true,
}: {
	base?: string;
	withSize?: boolean;
}) {
	return (
		<>
			<Group title="Espaçamento">
				<SidesField
					path={join(base, "margin")}
					label="Margem externa"
					units={["px", "%", "rem"]}
				/>
				<SidesField
					path={join(base, "padding")}
					label="Espaço interno"
					units={["px", "%", "rem"]}
				/>
			</Group>
			{withSize ? (
				<Group title="Tamanho">
					<NumberUnitField
						path={join(base, "width")}
						label="Largura"
						units={["%", "px", "vw"]}
						keywords={["auto"]}
						max={1400}
					/>
					<NumberUnitField
						path={join(base, "maxWidth")}
						label="Largura máxima"
						units={["px", "%", "vw"]}
						keywords={["none"]}
						max={1600}
					/>
					<NumberUnitField
						path={join(base, "minHeight")}
						label="Altura mínima"
						units={["px", "vh"]}
						max={1000}
					/>
					<SegmentedField
						path={join(base, "alignSelf")}
						label="Alinhamento no container"
						options={[
							{ value: "auto", label: "Auto" },
							{ value: "flex-start", label: "Início" },
							{ value: "center", label: "Centro" },
							{ value: "flex-end", label: "Fim" },
							{ value: "stretch", label: "Esticar" },
						]}
					/>
				</Group>
			) : null}
			<PositionGroup base={base} />
			<Group title="Transformar" defaultOpen={false}>
				<NumberField
					path={join(base, "transform.rotate")}
					label="Girar (°)"
					min={-180}
					max={180}
				/>
				<NumberField
					path={join(base, "transform.scale")}
					label="Escala"
					min={0.1}
					max={3}
					step={0.05}
				/>
				<NumberUnitField
					path={join(base, "transform.translateX")}
					label="Mover na horizontal"
					units={["px", "%"]}
					min={-300}
					max={300}
				/>
				<NumberUnitField
					path={join(base, "transform.translateY")}
					label="Mover na vertical"
					units={["px", "%"]}
					min={-300}
					max={300}
				/>
			</Group>
			<Group title="Efeitos" defaultOpen={false}>
				<NumberField
					path={join(base, "opacity")}
					label="Opacidade"
					max={1}
					step={0.05}
				/>
				<SegmentedField
					path={join(base, "overflow")}
					label="Conteúdo que transborda"
					options={[
						{ value: "visible", label: "Mostrar" },
						{ value: "hidden", label: "Cortar" },
						{ value: "auto", label: "Rolar" },
					]}
				/>
				<ScrollEffectFields base={base} />
			</Group>
			<Group title="Visibilidade e animação">
				<VisibilityField path={join(base, "visible")} />
				<SelectField
					path={join(base, "animation")}
					label="Animação de entrada"
					options={[
						{ value: "none", label: "Nenhuma" },
						{ value: "fade-in", label: "Aparecer" },
						{ value: "fade-up", label: "Subir aparecendo" },
						{ value: "pulse", label: "Pulsar (contínuo)" },
					]}
				/>
			</Group>
			<Group title="Identificação" defaultOpen={false}>
				<TextField
					path={join(base, "anchorId")}
					label="ID âncora"
					placeholder="ex.: oferta"
				/>
				<TextField path={join(base, "cssClass")} label="Classe CSS" />
			</Group>
			<Group title="CSS personalizado" defaultOpen={false}>
				<CodeField
					path={join(base, "customCss")}
					label="CSS"
					language="css"
					hint='Use "selector" para se referir a este elemento. Ex.: selector:hover { opacity: .8 }'
				/>
			</Group>
		</>
	);
}

const POSITIONS = [
	{ value: "static", label: "Padrão (no fluxo)" },
	{ value: "relative", label: "Relativa" },
	{ value: "absolute", label: "Absoluta (livre dentro do pai)" },
	{ value: "fixed", label: "Fixa na tela" },
	{ value: "sticky", label: "Grudar ao rolar" },
];

const POSITION_HINT: Record<string, string> = {
	relative: "Desloca o elemento sem afetar os vizinhos.",
	absolute: "Sai do fluxo e se posiciona em relação ao container pai.",
	fixed: "Fica parado na tela mesmo ao rolar a página.",
	sticky: "Rola junto até encostar na borda definida e então gruda.",
};

function PositionGroup({ base }: { base: string }) {
	const position = useField<string>(join(base, "position"));
	const active = position.value && position.value !== "static";
	return (
		<Group title="Posição" defaultOpen={false}>
			<SelectField
				path={join(base, "position")}
				label="Posição"
				options={POSITIONS}
			/>
			{active ? (
				<>
					<p className="text-[11px] text-muted-foreground">
						{POSITION_HINT[position.value]}
					</p>
					<SidesField
						path={join(base, "offsets")}
						label="Distância das bordas"
						units={["px", "%", "vh", "vw"]}
						keywords={["auto"]}
						hint='Use "auto" nos lados que não devem ser fixados.'
					/>
				</>
			) : null}
			<NumberUnitField
				path={join(base, "zIndex")}
				label="Camada (z-index)"
				unitless
				min={-10}
				max={100}
				step={1}
				keywords={[""]}
				hint="Maior fica por cima. Vazio = automático."
			/>
		</Group>
	);
}

function ScrollEffectFields({ base }: { base: string }) {
	const type = useField<string>(join(base, "scrollEffect.type"));
	return (
		<>
			<SelectField
				path={join(base, "scrollEffect.type")}
				label="Efeito ao rolar"
				options={[
					{ value: "none", label: "Nenhum" },
					{
						value: "parallax",
						label: "Parallax (move mais devagar/rápido que a página)",
					},
				]}
			/>
			{type.value === "parallax" ? (
				<NumberField
					path={join(base, "scrollEffect.speed")}
					label="Intensidade"
					min={-1}
					max={1}
					step={0.05}
				/>
			) : null}
		</>
	);
}

function VisibilityField({ path }: { path: string }) {
	const { props, set: setProp } = useNodeProps<Record<string, unknown>>();
	const value = getPath<Responsive<boolean>>(props, path) ?? { desktop: true };
	const set = (next: Responsive<boolean>) => setProp(path, next);
	return (
		<Field label="Mostrar em">
			<div className="flex gap-2">
				{VISIBILITY_DEVICES.map(({ key, label, icon: Icon }) => {
					const effective =
						key === "mobile"
							? (value.mobile ?? value.tablet ?? value.desktop)
							: key === "tablet"
								? (value.tablet ?? value.desktop)
								: value.desktop;
					return (
						<label
							key={key}
							className="flex flex-1 cursor-pointer flex-col items-center gap-1.5 rounded-md border border-input p-2"
						>
							<Icon className="size-4 text-muted-foreground" />
							<span className="text-[10px]">{label}</span>
							<Switch
								checked={effective}
								onCheckedChange={(v) => set({ ...value, [key]: v })}
							/>
						</label>
					);
				})}
			</div>
			<p className="flex items-center gap-1 text-[10px] text-muted-foreground">
				<Eye className="size-3" /> Elementos ocultos continuam no editor em modo
				translúcido.
			</p>
		</Field>
	);
}
