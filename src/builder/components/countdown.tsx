import { Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { ColorField } from "../controls/color.tsx";
import {
	DateTimeField,
	TIMEZONE_OPTIONS,
	TimeField,
} from "../controls/datetime.tsx";
import { Group } from "../controls/field.tsx";
import {
	BorderFields,
	BoxFields,
	NumberField,
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
import { SettingsTabs } from "../controls/settings-layout.tsx";
import { useField } from "../controls/use-field.ts";
import {
	corners,
	defaultBorder,
	defaultBox,
	defaultTypography,
	sides,
} from "../core/defaults.ts";
import { Lines } from "../core/inline-edit.tsx";
import { nodeClassName } from "../core/node-helpers.ts";
import { useIsEditor } from "../core/render-context.tsx";
import { type Responsive, responsive } from "../core/responsive.ts";
import {
	applyBorder,
	applyBox,
	applyTypography,
	createSheet,
	sidesToCss,
} from "../core/style-engine.ts";
import type {
	Border,
	Box,
	Length,
	Sides,
	Typography,
} from "../core/style-types.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";

type Unit = "days" | "hours" | "minutes" | "seconds";
const UNITS: Unit[] = ["days", "hours", "minutes", "seconds"];
const UNIT_KEY: Record<Unit, string> = {
	days: "d",
	hours: "h",
	minutes: "m",
	seconds: "s",
};
const UNIT_SECONDS: Record<Unit, number> = {
	days: 86400,
	hours: 3600,
	minutes: 60,
	seconds: 1,
};

export type CountdownProps = {
	mode: "date" | "evergreen" | "daily";
	/** Data final no fuso escolhido, sem fuso: "2026-12-31T23:59". */
	endDate: string;
	/** Deslocamento UTC do fuso: "-03:00". */
	timezone: string;
	/** Evergreen: duração por visitante, em minutos. */
	durationMinutes: number;
	/** Diário: horário em que zera, "23:59". */
	dailyTime: string;
	show: Record<Unit, boolean>;
	labels: Record<Unit, string>;
	showLabels: boolean;
	separator: boolean;
	expireAction: "hide" | "show-message" | "redirect";
	expireMessage: string;
	expireUrl: string;
	align: Responsive<"flex-start" | "center" | "flex-end">;
	gap: Responsive<Length>;
	unitBackground: string;
	unitBorder: Border;
	unitPadding: Responsive<Sides>;
	unitMinWidth: Responsive<Length>;
	numberTypography: Typography;
	labelTypography: Typography;
	messageTypography: Typography;
	box: Box;
};

/* ------------------------------------------------------------------ */
/* Cálculo de tempo (o runtime da página publicada repete esta lógica) */
/* ------------------------------------------------------------------ */

/** Minutos de deslocamento de "-03:00" (→ -180). */
export function offsetMinutes(tz: string): number {
	const m = /^([+-])(\d{2}):?(\d{2})$/.exec(tz.trim());
	if (!m) return 0;
	const v = Number(m[2]) * 60 + Number(m[3]);
	return m[1] === "-" ? -v : v;
}

/** Instante UTC (ms) de uma data local no fuso informado. */
export function zonedToUtc(local: string, tz: string): number | null {
	const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(
		local.trim(),
	);
	if (!m) return null;
	const utc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] ?? 0));
	return utc - offsetMinutes(tz) * 60000;
}

/** Próxima ocorrência (ms) de "HH:MM" no fuso informado. */
export function nextDaily(time: string, tz: string, now: number): number {
	const [hh, mm] = time.split(":").map((n) => Number(n) || 0);
	const off = offsetMinutes(tz) * 60000;
	const local = new Date(now + off);
	let target =
		Date.UTC(
			local.getUTCFullYear(),
			local.getUTCMonth(),
			local.getUTCDate(),
			hh,
			mm,
		) - off;
	if (target <= now) target += 86400000;
	return target;
}

/** Quebra os segundos restantes nas unidades visíveis (a maior absorve o resto). */
export function splitTime(totalSeconds: number, show: Record<Unit, boolean>) {
	let rest = Math.max(0, Math.floor(totalSeconds));
	const out: Partial<Record<Unit, number>> = {};
	for (const u of UNITS) {
		if (!show[u]) continue;
		out[u] = Math.floor(rest / UNIT_SECONDS[u]);
		rest %= UNIT_SECONDS[u];
	}
	return out;
}

const pad = (n: number | undefined) =>
	n === undefined ? "00" : String(n).padStart(2, "0");

/** Fim da contagem no editor (evergreen conta a partir de quando o editor abriu). */
function editorEnd(
	p: CountdownProps,
	now: number,
	mountedAt: number,
): number | null {
	if (p.mode === "date") return zonedToUtc(p.endDate, p.timezone);
	if (p.mode === "daily") return nextDaily(p.dailyTime, p.timezone, now);
	return mountedAt + p.durationMinutes * 60000;
}

/* ------------------------------------------------------------------ */
/* View                                                                */
/* ------------------------------------------------------------------ */

function useNow(enabled: boolean) {
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		if (!enabled) return;
		const t = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(t);
	}, [enabled]);
	return now;
}

function CountdownView({
	id,
	props: p,
	rootRef,
}: NodeViewProps<CountdownProps>) {
	const isEditor = useIsEditor();
	const now = useNow(isEditor);
	const [mountedAt] = useState(() => Date.now());
	const visible = UNITS.filter((u) => p.show[u]);

	let parts: Partial<Record<Unit, number>> = {};
	if (isEditor) {
		const end = editorEnd(p, now, mountedAt);
		parts = splitTime(end === null ? 0 : (end - now) / 1000, p.show);
	} else if (p.mode === "evergreen") {
		// primeiro acesso: a contagem começa cheia; o runtime ajusta para quem volta
		parts = splitTime(p.durationMinutes * 60, p.show);
	}

	const data: Record<string, string> = {
		"data-pb-countdown": "",
		"data-pb-mode": p.mode,
		"data-pb-expire": p.mode === "daily" ? "none" : p.expireAction,
	};
	if (p.mode === "date") {
		const end = zonedToUtc(p.endDate, p.timezone);
		data["data-pb-end"] = end === null ? "0" : String(end);
	} else if (p.mode === "evergreen") {
		data["data-pb-duration"] = String(
			Math.max(0, Math.round(p.durationMinutes * 60)),
		);
	} else {
		data["data-pb-daily"] = p.dailyTime;
		data["data-pb-tz"] = p.timezone;
	}
	if (p.expireAction === "redirect" && p.expireUrl)
		data["data-pb-redirect"] = p.expireUrl;

	return (
		<div
			ref={rootRef as React.Ref<HTMLDivElement>}
			className={nodeClassName(id, "pb-countdown", p.box)}
			data-pb-node={id}
			{...(isEditor ? {} : data)}
		>
			<div className="pb-cd-units">
				{visible.map((u, i) => (
					<span key={u} className="pb-cd-group">
						{p.separator && i > 0 ? (
							<span className="pb-cd-sep" aria-hidden="true">
								:
							</span>
						) : null}
						<span className="pb-cd-unit">
							<span className="pb-cd-num" data-pb-unit={UNIT_KEY[u]}>
								{pad(parts[u])}
							</span>
							{p.showLabels ? (
								<span className="pb-cd-label">{p.labels[u]}</span>
							) : null}
						</span>
					</span>
				))}
			</div>
			{p.expireAction === "show-message" && p.mode !== "daily" ? (
				<div className="pb-cd-message" hidden>
					<Lines text={p.expireMessage} />
				</div>
			) : null}
		</div>
	);
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

function UnitsFields() {
	const showLabels = useField<boolean>("showLabels").value;
	return (
		<>
			{UNITS.map((u) => (
				<SwitchField key={u} path={`show.${u}`} label={UNIT_LABEL[u]} />
			))}
			<SwitchField path="showLabels" label="Mostrar rótulos" />
			{showLabels
				? UNITS.map((u) => (
						<TextField
							key={u}
							path={`labels.${u}`}
							label={`Rótulo: ${UNIT_LABEL[u].toLowerCase()}`}
						/>
					))
				: null}
		</>
	);
}

const UNIT_LABEL: Record<Unit, string> = {
	days: "Dias",
	hours: "Horas",
	minutes: "Minutos",
	seconds: "Segundos",
};

function CountdownSettings() {
	const mode = useField<CountdownProps["mode"]>("mode").value;
	const expire = useField<CountdownProps["expireAction"]>("expireAction").value;
	return (
		<SettingsTabs
			content={
				<>
					<Group title="Contagem">
						<SelectField
							path="mode"
							label="Tipo"
							options={[
								{ value: "date", label: "Até uma data" },
								{ value: "evergreen", label: "Por visitante (evergreen)" },
								{ value: "daily", label: "Diário (reinicia todo dia)" },
							]}
						/>
						{mode === "date" ? (
							<DateTimeField path="endDate" label="Termina em" />
						) : null}
						{mode === "evergreen" ? (
							<NumberField
								path="durationMinutes"
								label="Duração (minutos)"
								min={1}
								max={43200}
							/>
						) : null}
						{mode === "daily" ? (
							<TimeField path="dailyTime" label="Zera às" />
						) : null}
						{mode !== "evergreen" ? (
							<SelectField
								path="timezone"
								label="Fuso horário"
								options={TIMEZONE_OPTIONS}
							/>
						) : (
							<p className="text-[11px] text-muted-foreground">
								Cada visitante tem sua própria contagem, que continua de onde
								parou ao recarregar a página.
							</p>
						)}
					</Group>
					<Group title="Unidades">
						<UnitsFields />
						<SwitchField path="separator" label='Separador ":"' />
					</Group>
					{mode !== "daily" ? (
						<Group title="Ao terminar">
							<SelectField
								path="expireAction"
								label="Ação"
								options={[
									{ value: "hide", label: "Esconder o contador" },
									{ value: "show-message", label: "Mostrar uma mensagem" },
									{ value: "redirect", label: "Redirecionar para um link" },
								]}
							/>
							{expire === "show-message" ? (
								<TextAreaField path="expireMessage" label="Mensagem" />
							) : null}
							{expire === "redirect" ? (
								<TextField
									path="expireUrl"
									label="Link"
									placeholder="https://..."
								/>
							) : null}
						</Group>
					) : null}
				</>
			}
			style={
				<>
					<Group title="Layout">
						<SegmentedField
							path="align"
							label="Alinhamento"
							options={[
								{ value: "flex-start", label: "Início" },
								{ value: "center", label: "Centro" },
								{ value: "flex-end", label: "Fim" },
							]}
						/>
						<NumberUnitField
							path="gap"
							label="Espaço entre unidades"
							units={["px", "rem"]}
							max={80}
						/>
					</Group>
					<Group title="Caixa de cada unidade">
						<ColorField path="unitBackground" label="Fundo" allowEmpty />
						<SidesField
							path="unitPadding"
							label="Espaço interno"
							units={["px", "rem"]}
						/>
						<NumberUnitField
							path="unitMinWidth"
							label="Largura mínima"
							units={["px", "rem"]}
							max={300}
						/>
						<BorderFields base="unitBorder" />
					</Group>
					<Group title="Números" defaultOpen={false}>
						<TypographyFields base="numberTypography" withAlign={false} />
					</Group>
					<Group title="Rótulos" defaultOpen={false}>
						<TypographyFields base="labelTypography" withAlign={false} />
					</Group>
					<Group title="Mensagem final" defaultOpen={false}>
						<TypographyFields base="messageTypography" />
					</Group>
				</>
			}
			advanced={<BoxFields />}
		/>
	);
}

/** Uma semana a partir de hoje, meia-noite, como valor inicial. */
function defaultEndDate() {
	const d = new Date(Date.now() + 7 * 86400000);
	const p2 = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T23:59`;
}

export const Countdown: ComponentDefinition<CountdownProps> = {
	type: "Countdown",
	displayName: "Contador regressivo",
	category: "conversion",
	icon: Timer,
	inToolbox: true,
	defaults: {
		mode: "date",
		endDate: defaultEndDate(),
		timezone: "-03:00",
		durationMinutes: 15,
		dailyTime: "23:59",
		show: { days: true, hours: true, minutes: true, seconds: true },
		labels: {
			days: "Dias",
			hours: "Horas",
			minutes: "Minutos",
			seconds: "Segundos",
		},
		showLabels: true,
		separator: false,
		expireAction: "hide",
		expireMessage: "Esta oferta foi encerrada.",
		expireUrl: "",
		align: responsive("center"),
		gap: responsive("12px", undefined, "8px"),
		unitBackground: "#18181b",
		unitBorder: defaultBorder({ radius: responsive(corners("10px")) }),
		unitPadding: responsive(
			sides("14px", "12px"),
			undefined,
			sides("10px", "8px"),
		),
		unitMinWidth: responsive("84px", undefined, "64px"),
		numberTypography: defaultTypography({
			fontSize: responsive("40px", undefined, "28px"),
			fontWeight: "700",
			lineHeight: responsive("1"),
			color: "#ffffff",
		}),
		labelTypography: defaultTypography({
			fontSize: responsive("12px", undefined, "10px"),
			fontWeight: "500",
			letterSpacing: responsive("0.05em"),
			textTransform: "uppercase",
			color: "#a1a1aa",
		}),
		messageTypography: defaultTypography({
			fontSize: responsive("20px"),
			fontWeight: "600",
			textAlign: responsive("center"),
		}),
		box: defaultBox({ width: responsive("100%") }),
	},
	View: CountdownView,
	css: (id, p) => {
		const sheet = createSheet(id);
		sheet.root().set("display", "block");
		sheet
			.rule(" .pb-cd-units")
			.set("display", "flex")
			.set("flex-wrap", "wrap")
			.set("align-items", "flex-start")
			.set("justify-content", p.align)
			.set("gap", p.gap);
		sheet
			.rule(" .pb-cd-group")
			.set("display", "flex")
			.set("align-items", "flex-start")
			.set("gap", p.gap);
		const unit = sheet.rule(" .pb-cd-unit");
		unit
			.set("display", "flex")
			.set("flex-direction", "column")
			.set("align-items", "center")
			.set("gap", "6px")
			.set("background-color", p.unitBackground)
			.set("padding", p.unitPadding, sidesToCss)
			.set("min-width", p.unitMinWidth);
		applyBorder(unit, p.unitBorder);
		const num = sheet.rule(" .pb-cd-num");
		applyTypography(num, p.numberTypography);
		num.set("font-variant-numeric", "tabular-nums");
		applyTypography(sheet.rule(" .pb-cd-label"), p.labelTypography);
		const sep = sheet.rule(" .pb-cd-sep");
		applyTypography(sep, p.numberTypography);
		// alinha o ":" com os números (mesmo espaço interno do topo da caixa)
		sep.set("padding", p.unitPadding, (s) => `${s.top} 0 0`);
		applyTypography(sheet.rule(" .pb-cd-message"), p.messageTypography);
		applyBox(sheet, p.box);
		return sheet.toString();
	},
	Settings: CountdownSettings,
	runtime: ["countdown"],
	fonts: (p) => [
		p.numberTypography.fontFamily,
		p.labelTypography.fontFamily,
		p.messageTypography.fontFamily,
	],
};
