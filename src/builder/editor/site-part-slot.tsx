/**
 * Espaço no canvas quando a página não tem cabeçalho/rodapé: convida a
 * adicionar, oferecendo o do site (se existir) ou um modelo. Só no editor.
 */
import { Plus } from "lucide-react";
import type { SitePart } from "../core/tree.ts";
import { useSectionPicker } from "./section-picker-store.ts";
import { PART_CATEGORY, PART_LABEL, useSitePart } from "./site-parts.tsx";

const box: React.CSSProperties = {
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	gap: 8,
	minHeight: 56,
	margin: 8,
	border: "1.5px dashed #c4c4cc",
	borderRadius: 8,
	background: "#fafafa",
	color: "#52525b",
	font: "500 12px/1.4 Inter, system-ui, sans-serif",
};

const action: React.CSSProperties = {
	display: "inline-flex",
	alignItems: "center",
	gap: 6,
	height: 30,
	padding: "0 12px",
	border: "1px solid #d4d4d8",
	borderRadius: 6,
	background: "#ffffff",
	color: "#18181b",
	font: "inherit",
	cursor: "pointer",
};

export function SitePartSlot({ part }: { part: SitePart }) {
	const { current, stored, applySiteVersion } = useSitePart(part);
	const openPicker = useSectionPicker((s) => s.open);
	if (current) return null;
	const label = PART_LABEL[part].toLowerCase();
	return (
		<div style={box} data-pb-slot={part}>
			<span style={{ color: "#71717a" }}>Esta página está sem {label}.</span>
			{stored ? (
				<button
					type="button"
					style={{ ...action, borderColor: "#2563eb", color: "#2563eb" }}
					onClick={applySiteVersion}
				>
					Usar o {label} do site
				</button>
			) : null}
			<button
				type="button"
				style={action}
				onClick={() => openPicker(undefined, PART_CATEGORY[part])}
			>
				<Plus size={14} />{" "}
				{stored ? "Escolher outro modelo" : `Adicionar ${label}`}
			</button>
		</div>
	);
}
