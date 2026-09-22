/**
 * Mapa: incorporação pública do Google Maps (sem chave de API) a partir de um
 * endereço ou nome de lugar. Carrega só quando chega perto da tela.
 */
import { MapPinned } from "lucide-react";
import { Group } from "../controls/field.tsx";
import {
	BorderFields,
	BoxFields,
	NumberField,
	ShadowFields,
} from "../controls/groups.tsx";
import {
	NumberUnitField,
	SwitchField,
	TextField,
} from "../controls/inputs.tsx";
import { SettingsTabs } from "../controls/settings-layout.tsx";
import {
	corners,
	defaultBorder,
	defaultBox,
	defaultShadow,
} from "../core/defaults.ts";
import { nodeClassName } from "../core/node-helpers.ts";
import { useIsEditor } from "../core/render-context.tsx";
import { type Responsive, responsive } from "../core/responsive.ts";
import {
	applyBorder,
	applyBox,
	createSheet,
	shadowToCss,
} from "../core/style-engine.ts";
import type { Border, Box, Length, Shadow } from "../core/style-types.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";

export type MapProps = {
	/** Endereço ou nome do lugar, como se busca no Google Maps. */
	address: string;
	zoom: number;
	height: Responsive<Length>;
	grayscale: boolean;
	border: Border;
	shadow: Shadow;
	box: Box;
};

export const mapEmbedUrl = (address: string, zoom: number) =>
	`https://maps.google.com/maps?q=${encodeURIComponent(address.trim())}&z=${Math.round(zoom)}&hl=pt-BR&output=embed`;

function MapView({ id, props, rootRef }: NodeViewProps<MapProps>) {
	const isEditor = useIsEditor();
	const address = props.address.trim();
	return (
		<div
			ref={rootRef as React.Ref<HTMLDivElement>}
			className={nodeClassName(id, "pb-map", props.box)}
			data-pb-node={id}
		>
			{address ? (
				<iframe
					src={mapEmbedUrl(address, props.zoom)}
					title={`Mapa: ${address}`}
					loading={isEditor ? undefined : "lazy"}
					referrerPolicy="no-referrer-when-downgrade"
					allowFullScreen
				/>
			) : (
				<div className="pb-placeholder">Informe um endereço no painel</div>
			)}
			{/* no editor, o clique seleciona o elemento em vez de mexer no mapa */}
			{isEditor ? <div className="pb-map-shield" /> : null}
		</div>
	);
}

function MapSettings() {
	return (
		<SettingsTabs
			content={
				<Group title="Local">
					<TextField
						path="address"
						label="Endereço ou lugar"
						placeholder="ex.: Av. Paulista, 1000 - São Paulo"
						hint="Do jeito que você buscaria no Google Maps."
					/>
					<NumberField path="zoom" label="Zoom" min={3} max={20} />
				</Group>
			}
			style={
				<>
					<Group title="Dimensões">
						<NumberUnitField
							path="height"
							label="Altura"
							units={["px", "vh"]}
							min={120}
							max={900}
						/>
						<SwitchField path="grayscale" label="Mapa em tons de cinza" />
					</Group>
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

export const MapEmbed: ComponentDefinition<MapProps> = {
	type: "Map",
	displayName: "Mapa",
	category: "media",
	icon: MapPinned,
	inToolbox: true,
	defaults: {
		address: "Av. Paulista, 1578 - Bela Vista, São Paulo - SP",
		zoom: 15,
		height: responsive("400px", undefined, "300px"),
		grayscale: false,
		border: defaultBorder({ radius: responsive(corners("12px")) }),
		shadow: defaultShadow(),
		box: defaultBox({ width: responsive("100%") }),
	},
	View: MapView,
	css: (id, p) => {
		const sheet = createSheet(id);
		const root = sheet.root();
		root
			.set("position", "relative")
			.set("display", "block")
			.set("overflow", "hidden")
			.set("height", p.height)
			.set("box-shadow", shadowToCss(p.shadow));
		applyBorder(root, p.border);
		sheet
			.rule(" > iframe")
			.set("display", "block")
			.set("width", "100%")
			.set("height", "100%")
			.set("border", "0")
			.set("filter", p.grayscale ? "grayscale(1)" : undefined);
		sheet.rule(" > .pb-placeholder").set("height", "100%");
		sheet
			.rule(" > .pb-map-shield")
			.set("position", "absolute")
			.set("inset", "0")
			.set("z-index", "1");
		applyBox(sheet, p.box);
		return sheet.toString();
	},
	Settings: MapSettings,
};
