import { ClipboardList, ListOrdered } from "lucide-react";
import type { CSSProperties } from "react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
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
import { ListEditor, ListField, newItemId } from "../controls/list.tsx";
import { SettingsTabs } from "../controls/settings-layout.tsx";
import { useField, useNodeProps } from "../controls/use-field.ts";
import { actionLink } from "../core/actions.ts";
import {
	corners,
	defaultBackground,
	defaultBorder,
	defaultBox,
	defaultShadow,
	defaultTypography,
} from "../core/defaults.ts";
import { useEditorPreview } from "../core/editor-preview.ts";
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
	nodeSelector,
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
	| "hidden"
	/** Não é um campo: começa uma nova etapa (o rótulo é o título dela). */
	| "step";

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
	/** Etapas: como mostrar o progresso. */
	stepProgress: "bar" | "steps" | "none";
	nextText: string;
	prevText: string;
	progressColor: string;
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
	step: "Nova etapa",
};

type Step = { title: string; fields: { f: FormField; index: number }[] };

/** Divide os campos em etapas a cada "Nova etapa". Etapas vazias somem. */
export function splitSteps(fields: FormField[]): Step[] {
	const steps: Step[] = [{ title: "", fields: [] }];
	fields.forEach((f, index) => {
		if (f.type === "hidden") return;
		if (f.type === "step") {
			const last = steps[steps.length - 1];
			if (last.fields.length) steps.push({ title: f.label, fields: [] });
			else last.title = f.label;
			return;
		}
		steps[steps.length - 1].fields.push({ f, index });
	});
	return steps.filter((s) => s.fields.length);
}

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
	const steps = splitSteps(props.fields);
	const multi = steps.length > 1;
	// no editor, a etapa visível vem do painel/canvas; publicado começa na 1ª
	const previewStep = useEditorPreview((s) => s.formStep[id] ?? 0);
	const setPreviewStep = useEditorPreview((s) => s.setFormStep);
	const active = isEditor ? Math.min(previewStep, steps.length - 1) : 0;
	const last = steps.length - 1;
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
		if (f.type === "step") return null;
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
			// com etapas, a validação é feita por etapa no runtime; a nativa
			// barraria o Enter por causa dos campos das etapas escondidas
			noValidate={multi || undefined}
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
			{multi ? (
				<>
					{props.fields.map((f, i) =>
						f.type === "hidden" ? renderField(f, i) : null,
					)}
					<StepProgress props={props} steps={steps} active={active} />
					{steps.map((step, i) => (
						<fieldset
							// biome-ignore lint/suspicious/noArrayIndexKey: etapas não têm id próprio
							key={i}
							className="pb-form-step"
							data-pb-step={i}
							data-pb-title={step.title || undefined}
							aria-label={step.title || `Etapa ${i + 1}`}
							hidden={i !== active}
						>
							<div className="pb-form-fields" style={lockStyle}>
								{step.fields.map(({ f, index }) => renderField(f, index))}
							</div>
						</fieldset>
					))}
					<div className="pb-form-nav">
						<button
							type="button"
							className="pb-form-prev"
							data-pb-prev=""
							hidden={active === 0}
							onClick={
								isEditor ? () => setPreviewStep(id, active - 1) : undefined
							}
						>
							{props.prevText}
						</button>
						<button
							type="button"
							className="pb-btn pb-form-next"
							data-pb-next=""
							hidden={active === last}
							onClick={
								isEditor ? () => setPreviewStep(id, active + 1) : undefined
							}
						>
							<span>{props.nextText}</span>
							<IconView name="arrow-right" />
						</button>
						<SubmitButton props={props} hidden={active !== last} lock={lock} />
					</div>
				</>
			) : (
				<>
					<div className="pb-form-fields" style={lockStyle}>
						{props.fields.map(renderField)}
					</div>
					<SubmitButton props={props} lock={lock} style={lockStyle} />
				</>
			)}
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

function SubmitButton({
	props,
	hidden,
	lock,
	style,
}: {
	props: FormProps;
	hidden?: boolean;
	lock: { tabIndex?: number };
	style?: CSSProperties;
}) {
	return (
		<button
			type="submit"
			className="pb-btn pb-form-submit"
			hidden={hidden}
			style={style}
			{...lock}
		>
			<span className="pb-form-submit-text">{props.submitText}</span>
			{props.submitIcon ? <IconView name={props.submitIcon} /> : null}
		</button>
	);
}

/** Progresso das etapas. O runtime atualiza texto, barra e passos. */
function StepProgress({
	props,
	steps,
	active,
}: {
	props: FormProps;
	steps: Step[];
	active: number;
}) {
	if (props.stepProgress === "none") return null;
	const total = steps.length;
	if (props.stepProgress === "steps") {
		return (
			<ol className="pb-form-progress pb-form-dots" aria-hidden="true">
				{steps.map((s, i) => (
					<li
						// biome-ignore lint/suspicious/noArrayIndexKey: etapas não têm id próprio
						key={i}
						data-pb-dot={i}
						className={
							i === active ? "pb-active" : i < active ? "pb-done" : undefined
						}
					>
						<span className="pb-form-dot">{i + 1}</span>
						{s.title ? (
							<span className="pb-form-dot-label">{s.title}</span>
						) : null}
					</li>
				))}
			</ol>
		);
	}
	return (
		<div
			className="pb-form-progress pb-form-bar"
			style={
				{ "--pb-progress": `${((active + 1) / total) * 100}%` } as CSSProperties
			}
		>
			<div className="pb-form-bar-head">
				<span data-pb-step-count="">
					Etapa {active + 1} de {total}
				</span>
				<span className="pb-form-bar-title" data-pb-step-title="">
					{steps[active]?.title}
				</span>
			</div>
			<div className="pb-form-bar-track">
				<div className="pb-form-bar-fill" />
			</div>
		</div>
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
				options={(Object.keys(TYPE_LABEL) as FormFieldType[])
					.filter((t) => t !== "step")
					.map((t) => ({ value: t, label: TYPE_LABEL[t] }))}
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

function StepsGroup() {
	const fields = useField<FormField[]>("fields").value ?? [];
	if (!fields.some((f) => f.type === "step")) return null;
	return (
		<Group title="Opções das etapas">
			{
				<>
					<SegmentedField
						path="stepProgress"
						label="Progresso"
						options={[
							{ value: "steps", label: "Passos" },
							{ value: "bar", label: "Barra" },
							{ value: "none", label: "Nenhum" },
						]}
					/>
					<TextField path="nextText" label="Botão de avançar" />
					<TextField path="prevText" label="Botão de voltar" />
				</>
			}
		</Group>
	);
}

/* ------------------------------------------------------------------ */
/* Campos e etapas                                                     */
/* ------------------------------------------------------------------ */

const newField = (): FormField =>
	field({ type: "text", label: "Novo campo", options: "Opção 1\nOpção 2" });

const stepMarker = (label: string) => field({ type: "step", label });

/** Uma etapa na tela de edição: o marcador (título) e os campos dela. */
type StepGroup = {
	id: string;
	marker: FormField | null;
	markerIndex: number;
	items: { f: FormField; index: number }[];
};

/** Agrupa a lista plana (campos + marcadores "step") por etapa. */
function groupSteps(fields: FormField[]): StepGroup[] {
	const groups: StepGroup[] = [];
	fields.forEach((f, index) => {
		if (f.type === "step") {
			groups.push({ id: f.id, marker: f, markerIndex: index, items: [] });
			return;
		}
		// campos antes do primeiro marcador formam a 1ª etapa
		if (!groups.length)
			groups.push({ id: "__first", marker: null, markerIndex: -1, items: [] });
		groups[groups.length - 1].items.push({ f, index });
	});
	return groups;
}

/** Volta para a lista plana salva nas props. */
const flatten = (groups: StepGroup[]) =>
	groups.flatMap((g, i) => [
		g.marker ?? stepMarker(`Etapa ${i + 1}`),
		...g.items.map((it) => it.f),
	]);

const fieldLabel = (item: FormField) =>
	`${item.label || item.name} · ${TYPE_LABEL[item.type]}`;

/**
 * Lista de campos. Sem etapas: uma lista simples. Com etapas: uma lista de
 * etapas, cada uma abre com o título e os campos dela.
 */
function FieldsEditor() {
	const { id, props, update } = useNodeProps<FormProps>();
	const fields = props.fields ?? [];
	const setFields = (next: FormField[]) =>
		update((draft) => {
			draft.fields = next;
		});
	const multi = fields.some((f) => f.type === "step");

	if (!multi)
		return (
			<>
				<ListField<FormField>
					path="fields"
					label="Campos"
					addLabel="Adicionar campo"
					min={1}
					create={newField}
					itemLabel={fieldLabel}
					renderItem={(itemPath, item) => (
						<FieldItem itemPath={itemPath} field={item} />
					)}
				/>
				<Button
					type="button"
					size="sm"
					variant="ghost"
					className="h-8 justify-start text-xs text-muted-foreground"
					onClick={() =>
						setFields([stepMarker("Etapa 1"), ...fields, stepMarker("Etapa 2")])
					}
				>
					<ListOrdered className="size-3.5" /> Dividir em etapas
				</Button>
			</>
		);

	return <StepsEditor nodeId={id} fields={fields} setFields={setFields} />;
}

function StepsEditor({
	nodeId,
	fields,
	setFields,
}: {
	nodeId: string;
	fields: FormField[];
	setFields: (next: FormField[]) => void;
}) {
	const setPreviewStep = useEditorPreview((s) => s.setFormStep);
	const groups = groupSteps(fields);
	/** Etapa i no canvas (etapas sem campos não aparecem). */
	const renderIndex = (i: number) =>
		groups
			.slice(0, i)
			.filter((g) => g.items.some((it) => it.f.type !== "hidden")).length;

	return (
		<Field label="Etapas">
			<ListEditor<StepGroup>
				items={groups}
				variant="section"
				min={1}
				max={10}
				addLabel="Adicionar etapa"
				onChange={(fn) => setFields(flatten(fn([...groups])))}
				create={() => {
					const marker = stepMarker(`Etapa ${groups.length + 1}`);
					return { id: marker.id, marker, markerIndex: -1, items: [] };
				}}
				duplicate={(g) => {
					const marker = stepMarker(`${g.marker?.label || "Etapa"} (cópia)`);
					return {
						id: marker.id,
						marker,
						markerIndex: -1,
						items: g.items.map((it) => ({
							f: { ...structuredClone(it.f), id: newItemId() },
							index: -1,
						})),
					};
				}}
				onOpen={(_, i) => setPreviewStep(nodeId, renderIndex(i))}
				itemLabel={(g, i) => `${i + 1}. ${g.marker?.label || `Etapa ${i + 1}`}`}
				itemMeta={(g) => {
					const n = g.items.filter((it) => it.f.type !== "hidden").length;
					return n === 1 ? "1 campo" : `${n} campos`;
				}}
				renderItem={(g, i) => (
					<>
						{g.marker ? (
							<TextField
								path={`fields.${g.markerIndex}.label`}
								label="Título da etapa"
							/>
						) : (
							<Field label="Título da etapa">
								<Input
									className="h-8 text-xs"
									placeholder={`Etapa ${i + 1}`}
									onChange={(e) =>
										setFields(
											flatten([
												{ ...g, marker: stepMarker(e.target.value) },
												...groups.slice(1),
											]),
										)
									}
								/>
							</Field>
						)}
						<Field label="Campos da etapa">
							<ListEditor<FormField>
								items={g.items.map((it) => it.f)}
								addLabel="Adicionar campo"
								create={newField}
								onChange={(fn) => {
									const next = fn(g.items.map((it) => it.f));
									setFields(
										flatten(
											groups.map((x) =>
												x.id === g.id
													? { ...x, items: next.map((f) => ({ f, index: -1 })) }
													: x,
											),
										),
									);
								}}
								itemLabel={fieldLabel}
								renderItem={(f, k) => (
									<FieldItem
										itemPath={`fields.${g.items[k]?.index ?? fields.indexOf(f)}`}
										field={f}
									/>
								)}
							/>
							{g.items.length === 0 ? (
								<p className="text-[11px] text-muted-foreground">
									Etapa sem campos não aparece no formulário.
								</p>
							) : null}
						</Field>
					</>
				)}
			/>
			<Button
				type="button"
				size="sm"
				variant="ghost"
				className="h-8 justify-start text-xs text-muted-foreground"
				onClick={() => setFields(fields.filter((f) => f.type !== "step"))}
			>
				Juntar tudo em uma etapa só
			</Button>
		</Field>
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
						<FieldsEditor />
					</Group>
					<StepsGroup />
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
					<Group title="Etapas" defaultOpen={false}>
						<ColorField path="progressColor" label="Cor do progresso" />
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

/** Etapas: navegação, barra de progresso e passos numerados. */
function stepsCss(
	sheet: ReturnType<typeof createSheet>,
	id: string,
	p: FormProps,
) {
	const accent = p.progressColor || "var(--pb-c-primary)";
	sheet
		.rule(" .pb-form-step")
		.set("min-width", "0")
		.set("margin", "0")
		.set("padding", "0")
		.set("border", "0")
		.set("animation", "pb-form-step-in .25s ease both");
	sheet.appendRaw(
		"@keyframes pb-form-step-in{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:none}}@media (prefers-reduced-motion:reduce){.pb-form-step{animation:none!important}}",
	);
	sheet
		.rule(" .pb-form-nav")
		.set("display", "flex")
		.set("align-items", "center")
		.set("gap", "12px");
	for (const btn of [
		" .pb-form-nav > .pb-form-next",
		" .pb-form-nav > .pb-form-submit",
	])
		sheet
			.rule(btn)
			.set("width", "auto")
			.set("margin-left", "auto")
			.set("flex", p.submitAlign, (a) =>
				a === "stretch" ? "1 1 auto" : "0 1 auto",
			);
	sheet
		.rule(" .pb-form-prev")
		.set("display", "inline-flex")
		.set("align-items", "center")
		.set("height", "100%")
		.set("min-height", "44px")
		.set("padding", "0 18px")
		.set("border", "1px solid currentColor")
		.set("border-radius", "999px")
		.set("background", "transparent")
		.set("color", p.labelTypography.color || "#3f3f46")
		.set("font", "inherit")
		.set("font-size", p.labelTypography.fontSize)
		.set("font-weight", "600")
		.set("opacity", ".75")
		.set("cursor", "pointer")
		.set("transition", "opacity .15s ease");
	sheet.rule(" .pb-form-prev:hover").set("opacity", "1");

	// barra
	sheet
		.rule(" .pb-form-bar")
		.set("display", "flex")
		.set("flex-direction", "column")
		.set("gap", "8px");
	sheet
		.rule(" .pb-form-bar-head")
		.set("display", "flex")
		.set("justify-content", "space-between")
		.set("gap", "12px")
		.set("font-size", p.labelTypography.fontSize)
		.set("color", p.labelTypography.color || "#3f3f46");
	sheet.rule(" .pb-form-bar-title").set("font-weight", "600");
	sheet
		.rule(" .pb-form-bar-track")
		.set("height", "6px")
		.set("border-radius", "999px")
		.set("background", `color-mix(in srgb, ${accent} 15%, transparent)`)
		.set("overflow", "hidden");
	sheet
		.rule(" .pb-form-bar-fill")
		.set("width", "var(--pb-progress, 0%)")
		.set("height", "100%")
		.set("border-radius", "inherit")
		.set("background", accent)
		.set("transition", "width .35s ease");

	// passos numerados, ligados por uma linha
	sheet
		.rule(" .pb-form-dots")
		.set("display", "flex")
		.set("margin", "0")
		.set("padding", "0")
		.set("list-style", "none");
	sheet
		.rule(" .pb-form-dots > li")
		.set("position", "relative")
		.set("flex", "1 1 0")
		.set("display", "flex")
		.set("flex-direction", "column")
		.set("align-items", "center")
		.set("gap", "6px")
		.set("min-width", "0")
		.set("text-align", "center");
	sheet
		.rule(" .pb-form-dots > li + li::before")
		.set("content", '""')
		.set("position", "absolute")
		.set("top", "15px")
		.set("right", "calc(50% + 22px)")
		.set("left", "calc(-50% + 22px)")
		.set("height", "2px")
		.set("border-radius", "2px")
		.set("background", `color-mix(in srgb, ${accent} 18%, transparent)`)
		.set("transition", "background .3s ease");
	sheet
		.rule(" .pb-form-dots > li.pb-done + li::before")
		.set("background", accent);
	sheet
		.rule(" .pb-form-dot")
		.set("display", "grid")
		.set("place-items", "center")
		.set("width", "32px")
		.set("height", "32px")
		.set("border-radius", "999px")
		.set("border", `2px solid color-mix(in srgb, ${accent} 25%, transparent)`)
		.set("background", "#ffffff")
		.set("color", `color-mix(in srgb, ${accent} 55%, #52525b)`)
		.set("font-size", "14px")
		.set("font-weight", "700")
		.set("transition", "all .25s ease");
	sheet
		.rule(" .pb-form-dots > li.pb-active .pb-form-dot")
		.set("border-color", accent)
		.set("color", accent)
		.set(
			"box-shadow",
			`0 0 0 4px color-mix(in srgb, ${accent} 15%, transparent)`,
		);
	sheet
		.rule(" .pb-form-dots > li.pb-done .pb-form-dot")
		.set("border-color", accent)
		.set("background", accent)
		.set("color", "#ffffff");
	sheet
		.rule(" .pb-form-dot-label")
		.set("font-size", "12px")
		.set("font-weight", "500")
		.set("color", p.labelTypography.color || "#3f3f46")
		.set("opacity", ".7")
		.set("overflow", "hidden")
		.set("text-overflow", "ellipsis")
		.set("white-space", "nowrap")
		.set("max-width", "100%");
	sheet
		.rule(" .pb-form-dots > li.pb-active .pb-form-dot-label")
		.set("opacity", "1");
	// no celular os títulos dos passos ocupariam espaço demais
	sheet.appendRaw(
		`@media (max-width: 600px){${nodeSelector(id)} .pb-form-dot-label{display:none}}`,
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
		focusColor: "var(--pb-c-primary)",
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
		stepProgress: "steps",
		nextText: "Continuar",
		prevText: "Voltar",
		progressColor: "var(--pb-c-primary)",
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
			sheet.rule(".pb-sent .pb-form-nav").set("display", "none");
			sheet.rule(".pb-sent .pb-form-progress").set("display", "none");
		}
		stepsCss(sheet, id, p);
		applyBox(sheet, p.box, "flex");
		return (
			sheet.toString() +
			buttonStyleCss(id, ".pb-form-submit", p.submit) +
			buttonStyleCss(id, ".pb-form-next", p.submit)
		);
	},
	Settings: FormSettings,
	fonts: (p) => [
		p.labelTypography.fontFamily,
		p.inputTypography.fontFamily,
		p.submit.typography.fontFamily,
	],
};

/** Modelo "Formulário em etapas": 3 etapas curtas, com passos numerados. */
export const multiStepFormProps = (): Partial<FormProps> => ({
	formName: "Formulário em etapas",
	stepProgress: "steps",
	fields: [
		field({ type: "step", label: "Sobre você" }),
		field({
			type: "text",
			label: "Nome",
			name: "nome",
			placeholder: "Seu nome",
			required: true,
		}),
		field({
			type: "email",
			label: "E-mail",
			name: "email",
			placeholder: "seu@email.com",
			required: true,
		}),
		field({ type: "step", label: "Contato" }),
		field({
			type: "tel",
			label: "WhatsApp",
			name: "whatsapp",
			placeholder: "(11) 99999-9999",
			required: true,
		}),
		field({
			type: "select",
			label: "Como podemos ajudar?",
			name: "interesse",
			placeholder: "Selecione...",
			options: "Quero um orçamento\nTenho uma dúvida\nOutro assunto",
			required: true,
		}),
		field({ type: "step", label: "Finalizar" }),
		field({
			type: "textarea",
			label: "Mensagem",
			name: "mensagem",
			placeholder: "Conte um pouco mais (opcional)",
		}),
		field({
			type: "checkbox",
			label: "Aceito receber contato por WhatsApp e e-mail.",
			name: "aceite",
			required: true,
		}),
	],
	submitText: "Enviar",
});
