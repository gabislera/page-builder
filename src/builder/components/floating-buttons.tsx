import { PanelBottomOpen } from "lucide-react";
import type { CSSProperties } from "react";
import { ActionField } from "../controls/action.tsx";
import { ColorField } from "../controls/color.tsx";
import { Group } from "../controls/field.tsx";
import { BoxFields, NumberField } from "../controls/groups.tsx";
import { IconField } from "../controls/icon.tsx";
import {
	NumberUnitField,
	SegmentedField,
	SwitchField,
	TextAreaField,
	TextField,
} from "../controls/inputs.tsx";
import { SettingsTabs } from "../controls/settings-layout.tsx";
import { useField } from "../controls/use-field.ts";
import { actionLink } from "../core/actions.ts";
import { defaultBox } from "../core/defaults.ts";
import { IconView } from "../core/icons.tsx";
import { nodeClassName } from "../core/node-helpers.ts";
import { useIsEditor, useRender } from "../core/render-context.tsx";
import {
	DEVICES,
	hasOwn,
	type Responsive,
	resolve,
	responsive,
} from "../core/responsive.ts";
import { applyBox, createSheet } from "../core/style-engine.ts";
import type { Action, Box, Length } from "../core/style-types.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";

type FloatButton = {
	enabled: boolean;
	icon: string;
	iconColor: string;
	background: string;
	/** Texto para leitores de tela e dica ao passar o mouse. */
	label: string;
};

export type FloatingButtonsProps = {
	backToTop: FloatButton & {
		/** Aparece depois de rolar esta distância (px). */
		showAfter: number;
	};
	contact: FloatButton & {
		mode: "whatsapp" | "action";
		phone: string;
		message: string;
		action: Action;
		pulse: boolean;
	};
	side: Responsive<"right" | "left">;
	size: Responsive<Length>;
	iconSize: Responsive<Length>;
	bottom: Responsive<Length>;
	offset: Responsive<Length>;
	gap: Length;
	shadow: boolean;
	zIndex: number;
	box: Box;
};

/** No editor os botões ficam no fluxo, numa faixa identificada, para poder selecionar. */
const EDITOR_STYLE: CSSProperties = {
	position: "relative",
	inset: "auto",
	flexDirection: "row",
	alignItems: "center",
	justifyContent: "flex-end",
	flexWrap: "wrap",
	width: "100%",
	padding: 8,
	outline: "1.5px dashed #93c5fd",
	outlineOffset: -2,
	borderRadius: 6,
	pointerEvents: "auto",
};
const EDITOR_LABEL: CSSProperties = {
	marginRight: "auto",
	padding: "3px 8px",
	borderRadius: 4,
	background: "#eff6ff",
	color: "color-mix(in srgb, var(--pb-c-primary) 85%, black)",
	font: "600 11px/1.4 Inter, system-ui, sans-serif",
};

function FloatingButtonsView({
	id,
	props,
	rootRef,
}: NodeViewProps<FloatingButtonsProps>) {
	const isEditor = useIsEditor();
	const ctx = useRender();
	const { backToTop: top, contact } = props;
	const link =
		contact.mode === "whatsapp"
			? actionLink(
					{ type: "whatsapp", phone: contact.phone, message: contact.message },
					ctx,
				)
			: actionLink(contact.action, ctx);
	const contactClass = contact.pulse
		? "pb-float-btn pb-float-contact pb-float-pulse"
		: "pb-float-btn pb-float-contact";
	const lock: CSSProperties | undefined = isEditor
		? { pointerEvents: "none" }
		: undefined;

	return (
		<div
			ref={rootRef as React.Ref<HTMLDivElement>}
			className={nodeClassName(id, "pb-floating", props.box)}
			data-pb-node={id}
			style={isEditor ? EDITOR_STYLE : undefined}
		>
			{isEditor ? (
				<span style={EDITOR_LABEL}>
					Botões flutuantes (fixos na página publicada)
				</span>
			) : null}
			{top.enabled ? (
				<button
					type="button"
					className={
						isEditor
							? "pb-float-btn pb-float-top pb-visible"
							: "pb-float-btn pb-float-top"
					}
					data-pb-top={isEditor ? undefined : ""}
					data-pb-offset={isEditor ? undefined : String(top.showAfter)}
					aria-label={top.label || "Voltar ao topo"}
					title={top.label || undefined}
					style={lock}
				>
					<IconView name={top.icon || "arrow-up"} />
				</button>
			) : null}
			{contact.enabled ? (
				link ? (
					<a
						href={link.href}
						className={contactClass}
						aria-label={contact.label || "Fale conosco"}
						title={contact.label || undefined}
						style={lock}
						{...link}
					>
						<IconView name={contact.icon || "whatsapp"} />
					</a>
				) : (
					// sem destino configurado: botão inerte, para não quebrar o layout
					<button
						type="button"
						className={contactClass}
						aria-label={contact.label || "Fale conosco"}
						style={lock}
					>
						<IconView name={contact.icon || "whatsapp"} />
					</button>
				)
			) : null}
			{isEditor && !top.enabled && !contact.enabled ? (
				<span
					style={{
						...EDITOR_LABEL,
						background: "transparent",
						color: "#71717a",
					}}
				>
					Nenhum botão ativo
				</span>
			) : null}
		</div>
	);
}

function ButtonFields({ base }: { base: string }) {
	return (
		<>
			<IconField path={`${base}.icon`} label="Ícone" />
			<ColorField path={`${base}.iconColor`} label="Cor do ícone" />
			<ColorField path={`${base}.background`} label="Cor de fundo" />
			<TextField
				path={`${base}.label`}
				label="Texto de acessibilidade"
				hint="Lido por leitores de tela e mostrado ao passar o mouse."
			/>
		</>
	);
}

function FloatingButtonsSettings() {
	const topEnabled = useField<boolean>("backToTop.enabled");
	const contactEnabled = useField<boolean>("contact.enabled");
	const mode = useField<"whatsapp" | "action">("contact.mode");
	return (
		<SettingsTabs
			content={
				<>
					<Group title="Botão de contato">
						<SwitchField path="contact.enabled" label="Mostrar" />
						{contactEnabled.value ? (
							<>
								<SegmentedField
									path="contact.mode"
									label="Tipo"
									options={[
										{ value: "whatsapp", label: "WhatsApp" },
										{ value: "action", label: "Outra ação" },
									]}
								/>
								{mode.value === "whatsapp" ? (
									<>
										<TextField
											path="contact.phone"
											label="Número com DDI e DDD"
											hint="Ex.: 5511999998888"
										/>
										<TextAreaField
											path="contact.message"
											label="Mensagem inicial"
											rows={2}
										/>
									</>
								) : (
									<ActionField path="contact.action" />
								)}
								<SwitchField path="contact.pulse" label="Animação pulsante" />
							</>
						) : null}
					</Group>
					<Group title="Voltar ao topo">
						<SwitchField path="backToTop.enabled" label="Mostrar" />
						{topEnabled.value ? (
							<NumberField
								path="backToTop.showAfter"
								label="Aparece após rolar (px)"
								max={2000}
								step={50}
							/>
						) : null}
					</Group>
				</>
			}
			style={
				<>
					<Group title="Posição">
						<SegmentedField
							path="side"
							label="Lado"
							options={[
								{ value: "left", label: "Esquerda" },
								{ value: "right", label: "Direita" },
							]}
						/>
						<NumberUnitField
							path="bottom"
							label="Distância da base"
							units={["px"]}
							max={200}
						/>
						<NumberUnitField
							path="offset"
							label="Distância da lateral"
							units={["px"]}
							max={200}
						/>
						<NumberField path="zIndex" label="Camada (z-index)" max={9999} />
					</Group>
					<Group title="Tamanho">
						<NumberUnitField
							path="size"
							label="Tamanho do botão"
							units={["px"]}
							min={32}
							max={96}
						/>
						<NumberUnitField
							path="iconSize"
							label="Tamanho do ícone"
							units={["px"]}
							min={12}
							max={64}
						/>
						<NumberUnitField
							path="gap"
							label="Espaço entre botões"
							units={["px"]}
							max={40}
						/>
						<SwitchField path="shadow" label="Sombra" />
					</Group>
					{contactEnabled.value ? (
						<Group title="Botão de contato">
							<ButtonFields base="contact" />
						</Group>
					) : null}
					{topEnabled.value ? (
						<Group title="Voltar ao topo">
							<ButtonFields base="backToTop" />
						</Group>
					) : null}
				</>
			}
			advanced={<BoxFields withSize={false} />}
		/>
	);
}

export const FloatingButtons: ComponentDefinition<FloatingButtonsProps> = {
	type: "FloatingButtons",
	displayName: "Botões flutuantes",
	category: "advanced",
	icon: PanelBottomOpen,
	inToolbox: true,
	defaults: {
		backToTop: {
			enabled: true,
			icon: "arrow-up",
			iconColor: "#ffffff",
			background: "#18181b",
			label: "Voltar ao topo",
			showAfter: 300,
		},
		contact: {
			enabled: true,
			icon: "whatsapp",
			iconColor: "#ffffff",
			background: "#25d366",
			label: "Fale conosco no WhatsApp",
			mode: "whatsapp",
			phone: "",
			message: "Olá! Vim pela página e gostaria de mais informações.",
			action: { type: "url", url: "", newTab: true },
			pulse: true,
		},
		side: responsive("right"),
		size: responsive("56px", undefined, "52px"),
		iconSize: responsive("26px", undefined, "24px"),
		bottom: responsive("24px", undefined, "16px"),
		offset: responsive("24px", undefined, "16px"),
		gap: "12px",
		shadow: true,
		zIndex: 900,
		box: defaultBox(),
	},
	rules: { canMoveIn: () => false },
	runtime: ["floating"],
	View: FloatingButtonsView,
	css: (id, p) => {
		const sheet = createSheet(id);
		const root = sheet.root();
		root
			.set("position", "fixed")
			.set("bottom", p.bottom)
			.set("z-index", String(p.zIndex))
			.set("display", "flex")
			.set("flex-direction", "column")
			.set("align-items", p.side, (s) =>
				s === "left" ? "flex-start" : "flex-end",
			)
			.set("gap", p.gap)
			.set("pointer-events", "none");
		// a distância lateral vale para o lado escolhido em cada dispositivo
		for (const device of DEVICES) {
			if (!hasOwn(p.side, device) && !hasOwn(p.offset, device)) continue;
			const side = resolve(p.side, device);
			root
				.setOn(device, side, resolve(p.offset, device))
				.setOn(device, side === "right" ? "left" : "right", "auto");
		}
		const btn = sheet.rule(" .pb-float-btn");
		btn
			.set("display", "flex")
			.set("align-items", "center")
			.set("justify-content", "center")
			.set("width", p.size)
			.set("height", p.size)
			.set("font-size", p.iconSize)
			.set("border", "0")
			.set("border-radius", "999px")
			.set("cursor", "pointer")
			.set("pointer-events", "auto")
			.set("box-shadow", p.shadow ? "0 6px 20px rgba(0,0,0,.22)" : undefined)
			.set(
				"transition",
				"transform .2s ease, opacity .25s ease, visibility .25s ease",
			);
		sheet.rule(" .pb-float-btn:hover").set("transform", "scale(1.06)");
		sheet
			.rule(" .pb-float-top")
			.set("color", p.backToTop.iconColor)
			.set("background-color", p.backToTop.background)
			.set("opacity", "0")
			.set("visibility", "hidden")
			.set("transform", "translateY(8px)");
		sheet
			.rule(" .pb-float-top.pb-visible")
			.set("opacity", "1")
			.set("visibility", "visible")
			.set("transform", "none");
		sheet
			.rule(" .pb-float-contact")
			.set("color", p.contact.iconColor)
			.set("background-color", p.contact.background);
		sheet
			.rule(" .pb-float-pulse")
			.set("animation", "pb-float-ring 2s ease-out infinite")
			.set("--pb-ring", p.contact.background);
		applyBox(
			sheet,
			{ ...p.box, width: undefined, maxWidth: undefined, alignSelf: undefined },
			"flex",
		);
		return (
			sheet.toString() +
			"@keyframes pb-float-ring{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--pb-ring) 60%,transparent)}100%{box-shadow:0 0 0 16px transparent}}" +
			"@media (prefers-reduced-motion:reduce){.pb-float-pulse{animation:none}}"
		);
	},
	Settings: FloatingButtonsSettings,
};
