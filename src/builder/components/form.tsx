import { ClipboardList } from "lucide-react";
import type { CSSProperties } from "react";
import { ActionDetails } from "../controls/action.tsx";
import { ColorField } from "../controls/color.tsx";
import { Field, Group } from "../controls/field.tsx";
import {
	BackgroundFields,
	BorderFields,
	BoxFields,
	NumberField,
	ShadowFields,
	TypographyFields,
} from "../controls/groups.tsx";
import { IconField } from "../controls/icon.tsx";
import {
	NumberUnitField,
	SegmentedField,
	SelectField,
	SelectInput,
	SwitchField,
	TextAreaField,
	TextField,
} from "../controls/inputs.tsx";
import { ListField, newItemId } from "../controls/list.tsx";
import { SettingsTabs } from "../controls/settings-layout.tsx";
import { useField } from "../controls/use-field.ts";
import { actionLink } from "../core/actions.ts";
import {
	corners,
	defaultBackground,
	defaultBorder,
	defaultBox,
	defaultShadow,
	defaultTypography,
} from "../core/defaults.ts";
import { IconView } from "../core/icons.tsx";
import { nodeClassName } from "../core/node-helpers.ts";
import { useIsEditor, useRender } from "../core/render-context.tsx";
import { type Responsive, responsive } from "../core/responsive.ts";
import {
	applyBackground,
	applyBorder,
	applyBox,
	applyTypography,
	createSheet,
	shadowToCss,
} from "../core/style-engine.ts";
import type {
	Action,
	Background,
	Border,
	Box,
	Length,
	Shadow,
	Typography,
} from "../core/style-types.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";
import {
	type ButtonStyle,
	ButtonStyleGroups,
	buttonStyleCss,
	defaultButtonStyle,
} from "./shared/button-style.tsx";

export type FormFieldType =
	| "text"
	| "email"
	| "tel"
	| "textarea"
	| "select"
	| "checkbox"
	| "hidden";

export type FormField = {
	id: string;
	type: FormFieldType;
	/** Chave do campo no envio. Vazio: gerada a partir do rótulo. */
	name: string;
	label: string;
	placeholder: string;
	required: boolean;
	/** Opções do select, uma por linha. */
	options: string;
	/** Valor do campo oculto. */
	value: string;
	/** Telefone: mostra o seletor de DDI. */
	showCountry: boolean;
	/** Telefone: DDI padrão, só dígitos ("55"). */
	country: string;
};

type Align = "flex-start" | "center" | "flex-end" | "stretch";

export type FormProps = {
	formName: string;
	fields: FormField[];
	/** Tags separadas por vírgula, enviadas no campo oculto "tags". */
	tags: string;
	/** Envia utm_*, fbclid e gclid da URL junto com os dados. */
	captureUtm: boolean;
	showLabels: boolean;
	requiredMark: boolean;
	requiredColor: string;
	columns: Responsive<number>;
	gap: Responsive<Length>;
	labelTypography: Typography;
	inputTypography: Typography;
	placeholderColor: string;
	inputBackground: string;
	inputBorder: Border;
	inputHeight: Responsive<Length>;
	inputPaddingX: Responsive<Length>;
	focusColor: string;
	submitText: string;
	submitIcon: string;
	loadingText: string;
	submitAlign: Responsive<Align>;
	submit: ButtonStyle;
	afterSubmit: "message" | "redirect";
	successMessage: string;
	successColor: string;
	hideOnSuccess: boolean;
	errorMessage: string;
	redirect: Action;
	appendQuery: boolean;
	background: Background;
	border: Border;
	shadow: Shadow;
	box: Box;
};

const TYPE_LABEL: Record<FormFieldType, string> = {
	text: "Texto",
	email: "E-mail",
	tel: "Telefone",
	textarea: "Texto longo",
	select: "Seleção",
	checkbox: "Caixa de seleção",
	hidden: "Oculto",
};

const COUNTRIES = [
	{ code: "55", label: "BR +55" },
	{ code: "351", label: "PT +351" },
	{ code: "1", label: "US +1" },
	{ code: "54", label: "AR +54" },
	{ code: "56", label: "CL +56" },
	{ code: "57", label: "CO +57" },
	{ code: "52", label: "MX +52" },
	{ code: "595", label: "PY +595" },
	{ code: "598", label: "UY +598" },
	{ code: "51", label: "PE +51" },
	{ code: "34", label: "ES +34" },
	{ code: "44", label: "UK +44" },
	{ code: "49", label: "DE +49" },
	{ code: "39", label: "IT +39" },
	{ code: "33", label: "FR +33" },
];

/** "E-mail principal" → "e_mail_principal" */
export function slugify(text: string) {
	return text
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "")
		.slice(0, 60);
}

const fieldName = (f: FormField, index: number) =>
	slugify(f.name) || slugify(f.label) || `campo_${index + 1}`;

const splitOptions = (text: string) =>
	text
		.split("\n")
		.map((o) => o.trim())
		.filter(Boolean);

/** Campo de armadilha para bots: invisível, fora da ordem de tabulação. */
const HONEYPOT_STYLE: CSSProperties = {
	position: "absolute",
	width: 1,
	height: 1,
	overflow: "hidden",
	clipPath: "inset(50%)",
	opacity: 0,
	pointerEvents: "none",
};

function FormView({ id, props, rootRef }: NodeViewProps<FormProps>) {
	const isEditor = useIsEditor();
	const ctx = useRender();
	const redirect =
		props.afterSubmit === "redirect" ? actionLink(props.redirect, ctx) : null;
	// no editor os campos não recebem foco nem clique: o clique seleciona o nó
	const lock = isEditor ? { tabIndex: -1 } : {};
	const lockStyle: CSSProperties | undefined = isEditor
		? { pointerEvents: "none" }
		: undefined;
	const required = (f: FormField) =>
		f.required && props.requiredMark ? (
			<span className="pb-form-req" aria-hidden="true">
				*
			</span>
		) : null;

	const renderField = (f: FormField, index: number) => {
		const name = fieldName(f, index);
		if (f.type === "hidden")
			return <input key={f.id} type="hidden" name={name} value={f.value} />;
		const aria = props.showLabels ? undefined : f.label;
		const label = props.showLabels ? (
			<span className="pb-form-label">
				{f.label}
				{required(f)}
			</span>
		) : null;

		if (f.type === "checkbox") {
			return (
				<label key={f.id} className="pb-form-check pb-form-full">
					<input
						type="checkbox"
						name={name}
						value="Sim"
						required={f.required}
						{...lock}
					/>
					<span>
						{f.label}
						{required(f)}
					</span>
				</label>
			);
		}

		let control: React.ReactNode;
		if (f.type === "textarea") {
			control = (
				<textarea
					className="pb-form-input"
					name={name}
					placeholder={f.placeholder}
					required={f.required}
					aria-label={aria}
					rows={4}
					readOnly={isEditor}
					{...lock}
				/>
			);
		} else if (f.type === "select") {
			control = (
				<select
					className="pb-form-input"
					name={name}
					required={f.required}
					aria-label={aria}
					defaultValue=""
					{...lock}
				>
					<option value="" disabled>
						{f.placeholder || "Selecione..."}
					</option>
					{splitOptions(f.options).map((o) => (
						<option key={o} value={o}>
							{o}
						</option>
					))}
				</select>
			);
		} else if (f.type === "tel") {
			const country = f.country.replace(/\D/g, "") || "55";
			control = (
				<div
					className="pb-form-tel"
					data-pb-tel=""
					data-pb-ddi-default={country}
				>
					{f.showCountry ? (
						<select
							className="pb-form-input pb-form-ddi"
							data-pb-ddi=""
							aria-label="DDI"
							defaultValue={country}
							{...lock}
						>
							{COUNTRIES.some((c) => c.code === country) ? null : (
								<option value={country}>+{country}</option>
							)}
							{COUNTRIES.map((c) => (
								<option key={c.code} value={c.code}>
									{c.label}
								</option>
							))}
						</select>
					) : null}
					<input
						className="pb-form-input"
						type="tel"
						inputMode="tel"
						autoComplete="tel-national"
						data-pb-tel-input=""
						placeholder={f.placeholder}
						required={f.required}
						aria-label={f.label}
						readOnly={isEditor}
						{...lock}
					/>
					<input type="hidden" name={name} data-pb-tel-value="" />
				</div>
			);
		} else {
			control = (
				<input
					className="pb-form-input"
					type={f.type}
					name={name}
					placeholder={f.placeholder}
					required={f.required}
					aria-label={aria}
					autoComplete={f.type === "email" ? "email" : undefined}
					readOnly={isEditor}
					{...lock}
				/>
			);
		}

		return (
			// telefone: o <label> focaria o seletor de DDI, então usa div + aria-label
			f.type === "tel" ? (
				<div key={f.id} className="pb-form-field">
					{label}
					{control}
				</div>
			) : (
				<label
					key={f.id}
					className={
						f.type === "textarea"
							? "pb-form-field pb-form-full"
							: "pb-form-field"
					}
				>
					{label}
					{control}
				</label>
			)
		);
	};

	return (
		<form
			ref={rootRef as React.Ref<HTMLFormElement>}
			className={nodeClassName(id, "pb-form", props.box)}
			data-pb-node={id}
			data-pb-form=""
			method="post"
			data-pb-after={props.afterSubmit}
			data-pb-redirect={redirect?.href}
			data-pb-target={redirect?.target}
			data-pb-append-query={props.appendQuery ? "1" : undefined}
			data-pb-utm={props.captureUtm ? "1" : undefined}
			data-pb-loading={props.loadingText || undefined}
			onSubmit={isEditor ? (e) => e.preventDefault() : undefined}
		>
			<input
				type="hidden"
				name="_pb_form"
				value={props.formName || "Formulário"}
			/>
			<input
				type="text"
				name="_pb_hp"
				tabIndex={-1}
				autoComplete="off"
				aria-hidden="true"
				style={HONEYPOT_STYLE}
			/>
			{props.tags.trim() ? (
				<input type="hidden" name="tags" value={props.tags.trim()} />
			) : null}
			<div className="pb-form-fields" style={lockStyle}>
				{props.fields.map(renderField)}
			</div>
			<button
				type="submit"
				className="pb-btn pb-form-submit"
				style={lockStyle}
				{...lock}
			>
				<span className="pb-form-submit-text">{props.submitText}</span>
				{props.submitIcon ? <IconView name={props.submitIcon} /> : null}
			</button>
			<output className="pb-form-msg pb-form-ok" data-pb-ok="" hidden>
				{props.successMessage}
			</output>
			<div
				className="pb-form-msg pb-form-error"
				data-pb-error=""
				role="alert"
				hidden
			>
				{props.errorMessage}
			</div>
		</form>
	);
}

/* ------------------------------------------------------------------ */
/* Configurações                                                       */
/* ------------------------------------------------------------------ */

function FieldItem({
	itemPath,
	field,
}: {
	itemPath: string;
	field: FormField;
}) {
	return (
		<>
			<SelectField
				path={`${itemPath}.type`}
				label="Tipo"
				options={(Object.keys(TYPE_LABEL) as FormFieldType[]).map((t) => ({
					value: t,
					label: TYPE_LABEL[t],
				}))}
			/>
			<TextField
				path={`${itemPath}.label`}
				label={field.type === "hidden" ? "Descrição" : "Rótulo"}
			/>
			<TextField
				path={`${itemPath}.name`}
				label="Nome do campo (chave)"
				placeholder={slugify(field.label) || "campo"}
				hint="Identifica o dado no envio. Vazio: gerado a partir do rótulo."
			/>
			{field.type === "hidden" ? (
				<TextField path={`${itemPath}.value`} label="Valor" />
			) : (
				<>
					{field.type !== "checkbox" ? (
						<TextField
							path={`${itemPath}.placeholder`}
							label="Texto de exemplo"
						/>
					) : null}
					<SwitchField path={`${itemPath}.required`} label="Obrigatório" />
				</>
			)}
			{field.type === "select" ? (
				<TextAreaField
					path={`${itemPath}.options`}
					label="Opções (uma por linha)"
					rows={4}
				/>
			) : null}
			{field.type === "tel" ? (
				<>
					<SwitchField
						path={`${itemPath}.showCountry`}
						label="Mostrar seletor de DDI"
					/>
					<SelectField
						path={`${itemPath}.country`}
						label="DDI padrão"
						options={COUNTRIES.map((c) => ({ value: c.code, label: c.label }))}
					/>
				</>
			) : null}
		</>
	);
}

function RedirectField() {
	const f = useField<Action>("redirect");
	const action: Action =
		f.value?.type === "url" || f.value?.type === "page"
			? f.value
			: { type: "url", url: "", newTab: false };
	return (
		<>
			<Field label="Destino">
				<SelectInput
					value={action.type}
					options={[
						{ value: "url", label: "Link (URL)" },
						{ value: "page", label: "Outra página" },
					]}
					onChange={(t) =>
						f.set(
							t === "page"
								? { type: "page", pageId: "", newTab: false }
								: { type: "url", url: "", newTab: false },
						)
					}
				/>
			</Field>
			<ActionDetails action={action} onChange={(a) => f.set(a)} />
		</>
	);
}

function FormSettings() {
	const after = useField<FormProps["afterSubmit"]>("afterSubmit");
	const showLabels = useField<boolean>("showLabels");
	return (
		<SettingsTabs
			content={
				<>
					<Group title="Formulário">
						<TextField
							path="formName"
							label="Nome do formulário"
							hint="Aparece nos leads recebidos."
						/>
						<ListField<FormField>
							path="fields"
							label="Campos"
							addLabel="Adicionar campo"
							min={1}
							create={() => ({
								id: newItemId(),
								type: "text",
								name: "",
								label: "Novo campo",
								placeholder: "",
								required: false,
								options: "Opção 1\nOpção 2",
								value: "",
								showCountry: true,
								country: "55",
							})}
							itemLabel={(item) =>
								`${item.label || item.name} · ${TYPE_LABEL[item.type]}`
							}
							renderItem={(itemPath, item) => (
								<FieldItem itemPath={itemPath} field={item} />
							)}
						/>
					</Group>
					<Group title="Botão de envio">
						<TextField path="submitText" label="Texto" />
						<IconField path="submitIcon" label="Ícone" />
						<TextField path="loadingText" label="Texto ao enviar" />
					</Group>
					<Group title="Após o envio">
						<SegmentedField
							path="afterSubmit"
							label="Ação"
							options={[
								{ value: "message", label: "Mostrar mensagem" },
								{ value: "redirect", label: "Redirecionar" },
							]}
						/>
						{after.value === "redirect" ? (
							<>
								<RedirectField />
								<SwitchField
									path="appendQuery"
									label="Repassar parâmetros da URL (UTMs)"
									hint="Leva utm_source, utm_campaign etc. para a página de destino."
								/>
							</>
						) : (
							<>
								<TextAreaField
									path="successMessage"
									label="Mensagem de sucesso"
								/>
								<ColorField path="successColor" label="Cor da mensagem" />
								<SwitchField
									path="hideOnSuccess"
									label="Esconder campos após enviar"
								/>
							</>
						)}
						<TextField path="errorMessage" label="Mensagem de erro" />
					</Group>
					<Group title="Rastreamento" defaultOpen={false}>
						<TextField
							path="tags"
							label="Tags"
							placeholder="ex.: lead, webinar"
							hint="Separadas por vírgula."
						/>
						<SwitchField path="captureUtm" label="Enviar UTMs da URL junto" />
					</Group>
				</>
			}
			style={
				<>
					<Group title="Layout">
						<NumberField path="columns" label="Colunas" min={1} max={2} />
						<NumberUnitField
							path="gap"
							label="Espaço entre campos"
							units={["px", "rem"]}
							max={60}
						/>
						<SegmentedField
							path="submitAlign"
							label="Alinhamento do botão"
							options={[
								{ value: "flex-start", label: "Início" },
								{ value: "center", label: "Centro" },
								{ value: "flex-end", label: "Fim" },
								{ value: "stretch", label: "Esticar" },
							]}
						/>
					</Group>
					<Group title="Rótulos">
						<SwitchField path="showLabels" label="Mostrar rótulos" />
						<SwitchField path="requiredMark" label="Marcar obrigatórios (*)" />
						<ColorField path="requiredColor" label="Cor do *" />
						{showLabels.value ? (
							<TypographyFields base="labelTypography" withAlign={false} />
						) : null}
					</Group>
					<Group title="Campos">
						<NumberUnitField
							path="inputHeight"
							label="Altura"
							units={["px"]}
							min={28}
							max={80}
						/>
						<NumberUnitField
							path="inputPaddingX"
							label="Espaço interno lateral"
							units={["px"]}
							max={40}
						/>
						<ColorField path="inputBackground" label="Fundo" />
						<ColorField path="placeholderColor" label="Texto de exemplo" />
						<ColorField path="focusColor" label="Cor ao focar" />
					</Group>
					<Group title="Campos: tipografia" defaultOpen={false}>
						<TypographyFields base="inputTypography" withAlign={false} />
					</Group>
					<Group title="Campos: borda" defaultOpen={false}>
						<BorderFields base="inputBorder" />
					</Group>
					<ButtonStyleGroups base="submit" />
					<Group title="Fundo do formulário" defaultOpen={false}>
						<BackgroundFields base="background" />
						<BorderFields base="border" />
						<ShadowFields base="shadow" />
					</Group>
				</>
			}
			advanced={<BoxFields />}
		/>
	);
}

/* ------------------------------------------------------------------ */
/* Definição                                                           */
/* ------------------------------------------------------------------ */

const field = (
	f: Partial<FormField> & Pick<FormField, "type" | "label">,
): FormField => ({
	id: newItemId(),
	name: "",
	placeholder: "",
	required: false,
	options: "",
	value: "",
	showCountry: true,
	country: "55",
	...f,
});

export const Form: ComponentDefinition<FormProps> = {
	type: "Form",
	displayName: "Formulário",
	category: "conversion",
	icon: ClipboardList,
	inToolbox: true,
	defaults: {
		formName: "Formulário",
		fields: [
			{
				...field({
					type: "text",
					label: "Nome",
					name: "nome",
					placeholder: "Seu nome",
					required: true,
				}),
				id: "nome",
			},
			{
				...field({
					type: "email",
					label: "E-mail",
					name: "email",
					placeholder: "seu@email.com",
					required: true,
				}),
				id: "email",
			},
			{
				...field({
					type: "tel",
					label: "WhatsApp",
					name: "whatsapp",
					placeholder: "(11) 99999-9999",
					required: true,
				}),
				id: "whatsapp",
			},
		],
		tags: "",
		captureUtm: true,
		showLabels: true,
		requiredMark: true,
		requiredColor: "#ef4444",
		columns: responsive(1),
		gap: responsive("16px"),
		labelTypography: defaultTypography({
			fontSize: responsive("14px"),
			fontWeight: "500",
			color: "#3f3f46",
		}),
		inputTypography: defaultTypography({
			fontSize: responsive("15px"),
			color: "#18181b",
		}),
		placeholderColor: "#a1a1aa",
		inputBackground: "#ffffff",
		inputBorder: defaultBorder({
			style: "solid",
			color: "#d4d4d8",
			radius: responsive(corners("8px")),
		}),
		inputHeight: responsive("48px"),
		inputPaddingX: responsive("14px"),
		focusColor: "#2563eb",
		submitText: "Quero me inscrever",
		submitIcon: "arrow-right",
		loadingText: "Enviando...",
		submitAlign: responsive("stretch"),
		submit: defaultButtonStyle({ fullWidth: responsive(true) }),
		afterSubmit: "message",
		successMessage: "Recebemos seus dados! Em breve entraremos em contato.",
		successColor: "#16a34a",
		hideOnSuccess: true,
		errorMessage:
			"Não foi possível enviar. Verifique sua conexão e tente novamente.",
		redirect: { type: "url", url: "", newTab: false },
		appendQuery: true,
		background: defaultBackground(),
		border: defaultBorder(),
		shadow: defaultShadow(),
		box: defaultBox({ width: responsive("100%") }),
	},
	rules: { canMoveIn: () => false },
	runtime: ["form"],
	View: FormView,
	css: (id, p) => {
		const sheet = createSheet(id);
		const root = sheet.root();
		root
			.set("display", "flex")
			.set("flex-direction", "column")
			.set("gap", p.gap)
			.set("position", "relative")
			.set("box-shadow", shadowToCss(p.shadow));
		applyBackground(root, p.background);
		applyBorder(root, p.border);

		sheet.rule(" [hidden]").set("display", "none !important");
		sheet
			.rule(" .pb-form-fields")
			.set("display", "grid")
			.set(
				"grid-template-columns",
				p.columns,
				(n) => `repeat(${n}, minmax(0, 1fr))`,
			)
			.set("gap", p.gap);
		sheet.rule(" .pb-form-full").set("grid-column", "1 / -1");
		sheet
			.rule(" .pb-form-field")
			.set("display", "flex")
			.set("flex-direction", "column")
			.set("gap", "6px")
			.set("min-width", "0");
		applyTypography(sheet.rule(" .pb-form-label"), p.labelTypography);
		sheet
			.rule(" .pb-form-req")
			.set("color", p.requiredColor)
			.set("margin-left", "2px");

		const input = sheet.rule(" .pb-form-input");
		input
			.set("display", "block")
			.set("width", "100%")
			.set("min-width", "0")
			.set("height", p.inputHeight)
			.set("padding", p.inputPaddingX, (v) => `0 ${v}`)
			.set("background-color", p.inputBackground)
			.set("outline", "none")
			.set("margin", "0")
			.set("transition", "border-color .15s ease, box-shadow .15s ease");
		applyTypography(input, p.inputTypography);
		applyBorder(input, p.inputBorder);
		sheet
			.rule(" textarea.pb-form-input")
			.set("height", "auto")
			.set("min-height", "110px")
			.set("padding", p.inputPaddingX, (v) => `10px ${v}`)
			.set("resize", "vertical");
		sheet
			.rule(" .pb-form-input::placeholder")
			.set("color", p.placeholderColor)
			.set("opacity", "1");
		sheet
			.rule(" .pb-form-input:focus")
			.set("border-color", p.focusColor)
			.set(
				"box-shadow",
				p.focusColor
					? `0 0 0 3px color-mix(in srgb, ${p.focusColor} 22%, transparent)`
					: undefined,
			);
		sheet.rule(" .pb-form-tel").set("display", "flex").set("gap", "8px");
		sheet
			.rule(" .pb-form-tel .pb-form-ddi")
			.set("width", "auto")
			.set("flex", "0 0 auto")
			.set("padding", "0 6px");

		const check = sheet.rule(" .pb-form-check");
		applyTypography(check, {
			...p.inputTypography,
			fontSize: p.labelTypography.fontSize,
		});
		check
			.set("display", "flex")
			.set("align-items", "flex-start")
			.set("gap", "8px")
			.set("cursor", "pointer");
		sheet
			.rule(" .pb-form-check input")
			.set("width", "18px")
			.set("height", "18px")
			.set("margin", "2px 0 0")
			.set("flex-shrink", "0")
			.set("accent-color", p.focusColor);

		sheet
			.rule(" .pb-form-submit")
			.set("align-self", p.submitAlign)
			.set("max-width", "100%");
		sheet
			.rule(" .pb-form-submit[disabled]")
			.set("opacity", ".7")
			.set("cursor", "progress");
		sheet
			.rule(" .pb-form-msg")
			.set("display", "block")
			.set("font-size", p.labelTypography.fontSize)
			.set("line-height", "1.5")
			.set("text-align", "center")
			.set("white-space", "pre-line");
		sheet.rule(" .pb-form-ok").set("color", p.successColor);
		sheet.rule(" .pb-form-error").set("color", "#dc2626");
		if (p.hideOnSuccess) {
			sheet.rule(".pb-sent .pb-form-fields").set("display", "none");
			sheet.rule(".pb-sent .pb-form-submit").set("display", "none");
		}
		applyBox(sheet, p.box, "flex");
		return sheet.toString() + buttonStyleCss(id, ".pb-form-submit", p.submit);
	},
	Settings: FormSettings,
	fonts: (p) => [
		p.labelTypography.fontFamily,
		p.inputTypography.fontFamily,
		p.submit.typography.fontFamily,
	],
};
