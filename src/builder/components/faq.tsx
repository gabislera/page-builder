import { MessageCircleQuestion } from "lucide-react";
import { ColorField } from "../controls/color.tsx";
import { Group } from "../controls/field.tsx";
import {
	BorderFields,
	BoxFields,
	ShadowFields,
	SidesField,
	TypographyFields,
} from "../controls/groups.tsx";
import {
	NumberUnitField,
	SegmentedField,
	SelectField,
	SwitchField,
	TextAreaField,
	TextField,
} from "../controls/inputs.tsx";
import { ListField, newItemId } from "../controls/list.tsx";
import { SettingsTabs } from "../controls/settings-layout.tsx";
import { useField } from "../controls/use-field.ts";
import {
	corners,
	defaultBorder,
	defaultBox,
	defaultShadow,
	defaultTypography,
	sides,
} from "../core/defaults.ts";
import { Lines, useInlineEdit } from "../core/inline-edit.tsx";
import { nodeClassName } from "../core/node-helpers.ts";
import { useIsEditor } from "../core/render-context.tsx";
import { type Responsive, responsive } from "../core/responsive.ts";
import {
	applyBorder,
	applyBox,
	applyTypography,
	createSheet,
	nodeSelector,
	shadowToCss,
	sidesToCss,
} from "../core/style-engine.ts";
import type {
	Border,
	BorderStyle,
	Box,
	Length,
	Shadow,
	Sides,
	Typography,
} from "../core/style-types.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";

export type FaqItem = {
	id: string;
	question: string;
	/** Texto simples; quebras de linha são preservadas. */
	answer: string;
};

export type FaqProps = {
	items: FaqItem[];
	/** Se falso, abrir um item fecha os outros (atributo `name` do <details>). */
	allowMultiple: boolean;
	firstOpen: boolean;
	/** Só no editor: mostra todas as respostas abertas. */
	editorOpenAll: boolean;
	iconStyle: "chevron" | "plus" | "none";
	iconPosition: "left" | "right";
	iconSize: Length;
	iconColor: string;
	questionTypography: Typography;
	answerTypography: Typography;
	itemBackground: string;
	openBackground: string;
	border: Border;
	shadow: Shadow;
	gap: Responsive<Length>;
	questionPadding: Responsive<Sides>;
	answerPadding: Responsive<Sides>;
	/** Linha entre um item e outro (estilo lista). */
	dividerStyle: BorderStyle;
	dividerColor: string;
	dividerWidth: Length;
	box: Box;
};

function FaqIcon({ style }: { style: FaqProps["iconStyle"] }) {
	if (style === "none") return null;
	if (style === "plus") {
		return (
			<svg
				className="pb-faq-icon pb-faq-plus"
				viewBox="0 0 24 24"
				aria-hidden="true"
			>
				<path className="pb-faq-h" d="M5 12h14" />
				<path className="pb-faq-v" d="M12 5v14" />
			</svg>
		);
	}
	return (
		<svg
			className="pb-faq-icon pb-faq-chevron"
			viewBox="0 0 24 24"
			aria-hidden="true"
		>
			<path d="m6 9 6 6 6-6" />
		</svg>
	);
}

function FaqEntry({
	item,
	index,
	props,
	name,
	open,
	onPropChange,
}: {
	item: FaqItem;
	index: number;
	props: FaqProps;
	name?: string;
	open: boolean;
	onPropChange?: (path: string, value: unknown) => void;
}) {
	const isEditor = useIsEditor();
	const question = useInlineEdit(
		item.question,
		onPropChange && ((v) => onPropChange(`items.${index}.question`, v)),
	);
	const answer = useInlineEdit(
		item.answer,
		onPropChange && ((v) => onPropChange(`items.${index}.answer`, v)),
		{ multiline: true },
	);
	const icon = <FaqIcon style={props.iconStyle} />;
	return (
		<details className="pb-faq-item" name={name} open={open || undefined}>
			<summary
				className="pb-faq-q"
				// no editor o clique seleciona o nó em vez de abrir/fechar
				onClick={isEditor ? (e) => e.preventDefault() : undefined}
			>
				{props.iconPosition === "left" ? icon : null}
				<span
					className="pb-faq-q-text"
					ref={question.ref as React.Ref<HTMLSpanElement>}
					{...question.attrs}
				>
					{question.editing ? null : item.question}
				</span>
				{props.iconPosition === "right" ? icon : null}
			</summary>
			{item.answer || isEditor ? (
				<div
					className="pb-faq-a"
					ref={answer.ref as React.Ref<HTMLDivElement>}
					{...answer.attrs}
				>
					{answer.editing ? null : <Lines text={item.answer} />}
				</div>
			) : null}
		</details>
	);
}

function FaqView({
	id,
	props,
	rootRef,
	onPropChange,
}: NodeViewProps<FaqProps>) {
	const isEditor = useIsEditor();
	const name = props.allowMultiple ? undefined : `faq-${id}`;
	return (
		<div
			ref={rootRef as React.Ref<HTMLDivElement>}
			className={nodeClassName(id, "pb-faq", props.box)}
			data-pb-node={id}
		>
			{props.items.map((item, i) => (
				<FaqEntry
					key={item.id}
					item={item}
					index={i}
					props={props}
					// no editor o `name` fecharia os outros itens abertos
					name={isEditor ? undefined : name}
					open={
						(isEditor && props.editorOpenAll) || (props.firstOpen && i === 0)
					}
					onPropChange={onPropChange}
				/>
			))}
			{isEditor && props.items.length === 0 ? (
				<div className="pb-placeholder">Adicione perguntas no painel</div>
			) : null}
		</div>
	);
}

function FaqSettings() {
	const iconStyle = useField<FaqProps["iconStyle"]>("iconStyle").value;
	const divider = useField<BorderStyle>("dividerStyle").value;
	return (
		<SettingsTabs
			content={
				<>
					<Group title="Perguntas">
						<ListField<FaqItem>
							path="items"
							label="Itens"
							addLabel="Adicionar pergunta"
							create={() => ({
								id: newItemId(),
								question: "Nova pergunta",
								answer: "Escreva a resposta aqui.",
							})}
							itemLabel={(item) => item.question}
							renderItem={(itemPath) => (
								<>
									<TextField path={`${itemPath}.question`} label="Pergunta" />
									<TextAreaField
										path={`${itemPath}.answer`}
										label="Resposta"
										rows={4}
									/>
								</>
							)}
						/>
					</Group>
					<Group title="Comportamento">
						<SwitchField
							path="allowMultiple"
							label="Várias abertas ao mesmo tempo"
							hint="Desligado: abrir uma pergunta fecha as outras."
						/>
						<SwitchField path="firstOpen" label="Primeira pergunta aberta" />
						<SwitchField
							path="editorOpenAll"
							label="Mostrar respostas no editor"
							hint="Só no editor. Dê dois cliques num texto para editar."
						/>
					</Group>
				</>
			}
			style={
				<>
					<Group title="Itens">
						<NumberUnitField
							path="gap"
							label="Espaço entre itens"
							units={["px", "rem"]}
							max={80}
						/>
						<ColorField path="itemBackground" label="Fundo" allowEmpty />
						<ColorField
							path="openBackground"
							label="Fundo quando aberto"
							allowEmpty
						/>
						<SidesField
							path="questionPadding"
							label="Espaço interno da pergunta"
							units={["px", "rem"]}
						/>
						<SidesField
							path="answerPadding"
							label="Espaço interno da resposta"
							units={["px", "rem"]}
						/>
					</Group>
					<Group title="Ícone">
						<SegmentedField
							path="iconStyle"
							label="Estilo"
							options={[
								{ value: "chevron", label: "Seta" },
								{ value: "plus", label: "Mais" },
								{ value: "none", label: "Nenhum" },
							]}
						/>
						{iconStyle !== "none" ? (
							<>
								<SegmentedField
									path="iconPosition"
									label="Posição"
									options={[
										{ value: "left", label: "Esquerda" },
										{ value: "right", label: "Direita" },
									]}
								/>
								<NumberUnitField
									path="iconSize"
									label="Tamanho"
									units={["px", "em"]}
									max={64}
								/>
								<ColorField path="iconColor" label="Cor" allowEmpty />
							</>
						) : null}
					</Group>
					<Group title="Pergunta" defaultOpen={false}>
						<TypographyFields base="questionTypography" />
					</Group>
					<Group title="Resposta" defaultOpen={false}>
						<TypographyFields base="answerTypography" />
					</Group>
					<Group title="Borda" defaultOpen={false}>
						<BorderFields base="border" />
					</Group>
					<Group title="Divisória" defaultOpen={false}>
						<SelectField
							path="dividerStyle"
							label="Linha entre itens"
							options={[
								{ value: "none", label: "Nenhuma" },
								{ value: "solid", label: "Sólida" },
								{ value: "dashed", label: "Tracejada" },
								{ value: "dotted", label: "Pontilhada" },
							]}
						/>
						{divider !== "none" ? (
							<>
								<NumberUnitField
									path="dividerWidth"
									label="Espessura"
									units={["px"]}
									max={10}
								/>
								<ColorField path="dividerColor" label="Cor" />
							</>
						) : null}
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

export const Faq: ComponentDefinition<FaqProps> = {
	type: "Faq",
	displayName: "Perguntas frequentes",
	category: "conversion",
	icon: MessageCircleQuestion,
	inToolbox: true,
	defaults: {
		items: [
			{
				id: "faq1",
				question: "Por quanto tempo terei acesso?",
				answer:
					"O acesso é vitalício. Você pode assistir quando e quantas vezes quiser.",
			},
			{
				id: "faq2",
				question: "Tem garantia?",
				answer:
					"Sim! Você tem 7 dias de garantia incondicional. Se não gostar, devolvemos 100% do valor.",
			},
			{
				id: "faq3",
				question: "Quais são as formas de pagamento?",
				answer: "Cartão de crédito em até 12x, Pix ou boleto.",
			},
		],
		allowMultiple: false,
		firstOpen: false,
		editorOpenAll: true,
		iconStyle: "chevron",
		iconPosition: "right",
		iconSize: "20px",
		iconColor: "",
		questionTypography: defaultTypography({
			fontSize: responsive("18px", undefined, "16px"),
			fontWeight: "600",
			lineHeight: responsive("1.4"),
		}),
		answerTypography: defaultTypography({
			fontSize: responsive("16px", undefined, "15px"),
			lineHeight: responsive("1.6"),
			color: "#52525b",
		}),
		itemBackground: "#ffffff",
		openBackground: "",
		border: defaultBorder({
			style: "solid",
			radius: responsive(corners("10px")),
		}),
		shadow: defaultShadow(),
		gap: responsive("12px"),
		questionPadding: responsive(
			sides("18px", "20px"),
			undefined,
			sides("16px"),
		),
		answerPadding: responsive(
			sides("0px", "20px", "18px"),
			undefined,
			sides("0px", "16px", "16px"),
		),
		dividerStyle: "none",
		dividerColor: "#e4e4e7",
		dividerWidth: "1px",
		box: defaultBox({ width: responsive("100%") }),
	},
	View: FaqView,
	css: (id, p) => {
		const sheet = createSheet(id);
		sheet
			.root()
			.set("display", "flex")
			.set("flex-direction", "column")
			.set("gap", p.gap)
			// permite animar a altura até "auto" onde houver suporte
			.set("interpolate-size", "allow-keywords");

		const item = sheet.rule(" .pb-faq-item");
		item
			.set("background-color", p.itemBackground)
			.set("box-shadow", shadowToCss(p.shadow))
			.set("overflow", "hidden")
			.set("transition", "background-color .2s ease");
		applyBorder(item, p.border);
		sheet.rule(" .pb-faq-item[open]").set("background-color", p.openBackground);
		if (p.dividerStyle !== "none") {
			sheet
				.rule(" .pb-faq-item:not(:last-child)")
				.set(
					"border-bottom",
					`${p.dividerWidth} ${p.dividerStyle} ${p.dividerColor}`,
				);
		}

		const q = sheet.rule(" .pb-faq-q");
		q.set("display", "flex")
			.set("align-items", "center")
			.set("gap", "12px")
			.set("cursor", "pointer")
			.set("list-style", "none")
			.set("padding", p.questionPadding, sidesToCss);
		applyTypography(q, p.questionTypography);
		sheet.rule(" .pb-faq-q::marker").set("content", '""');
		sheet.rule(" .pb-faq-q-text").set("flex", "1").set("min-width", "0");

		const a = sheet.rule(" .pb-faq-a");
		a.set("padding", p.answerPadding, sidesToCss);
		applyTypography(a, p.answerTypography);

		sheet
			.rule(" .pb-faq-icon")
			.set("flex-shrink", "0")
			.set("width", p.iconSize)
			.set("height", p.iconSize)
			.set("fill", "none")
			.set("stroke", p.iconColor || "currentColor")
			.set("stroke-width", "2")
			.set("stroke-linecap", "round")
			.set("stroke-linejoin", "round")
			.set("transition", "transform .25s ease");
		sheet
			.rule(" .pb-faq-item[open] .pb-faq-chevron")
			.set("transform", "rotate(180deg)");
		sheet
			.rule(" .pb-faq-v")
			.set("transform-origin", "center")
			.set("transition", "transform .25s ease");
		sheet
			.rule(" .pb-faq-item[open] .pb-faq-v")
			.set("transform", "rotate(90deg)");
		applyBox(sheet, p.box, "flex");

		// abertura suave onde houver ::details-content; nos demais abre direto
		const s = nodeSelector(id);
		const motion =
			`${s} .pb-faq-q::-webkit-details-marker{display:none}` +
			`${s} .pb-faq-item::details-content{block-size:0;overflow:hidden;transition:block-size .3s ease,content-visibility .3s allow-discrete}` +
			`${s} .pb-faq-item[open]::details-content{block-size:auto}` +
			`@media (prefers-reduced-motion:reduce){${s} .pb-faq-item::details-content,${s} .pb-faq-icon,${s} .pb-faq-v{transition:none}}`;
		return sheet.toString() + motion;
	},
	Settings: FaqSettings,
	fonts: (p) => [
		p.questionTypography.fontFamily,
		p.answerTypography.fontFamily,
	],
};
