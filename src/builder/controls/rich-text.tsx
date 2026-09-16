import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyleKit } from "@tiptap/extension-text-style";
import {
	type Editor,
	EditorContent,
	useEditor,
	useEditorState,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
	AlignCenter,
	AlignLeft,
	AlignRight,
	Bold,
	Highlighter,
	Italic,
	Link as LinkIcon,
	List,
	ListOrdered,
	RemoveFormatting,
	Strikethrough,
	Underline,
} from "lucide-react";
import { useEffect } from "react";
import { create } from "zustand";
import { cn } from "#/lib/utils";
import { fontStack } from "../core/style-engine.ts";
import { fontChoices } from "../core/theme.ts";
import { ColorInput } from "./color.tsx";
import { Field } from "./field.tsx";
import { useNodeProps } from "./use-field.ts";

export const richExtensions = [
	StarterKit.configure({
		heading: false,
		codeBlock: false,
		code: false,
		blockquote: false,
		link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
	}),
	TextStyleKit,
	Highlight.configure({ multicolor: true }),
	TextAlign.configure({ types: ["paragraph"] }),
];

/** Editor inline ativo no canvas (para a barra do painel agir sobre ele). */
export const useInlineRich = create<{
	nodeId: string | null;
	editor: Editor | null;
	set: (nodeId: string | null, editor: Editor | null) => void;
}>((set) => ({
	nodeId: null,
	editor: null,
	set: (nodeId, editor) => set({ nodeId, editor }),
}));

/** Campo de texto rico no painel. Se o nó estiver em edição inline, mostra só a barra. */
export function RichTextField({
	path,
	label,
}: {
	path: string;
	label: string;
}) {
	const { id, props, set } = useNodeProps<Record<string, string>>();
	const inline = useInlineRich();
	const value = props[path] ?? "";

	if (inline.nodeId === id && inline.editor) {
		return (
			<Field
				label={label}
				hint="Editando direto no canvas. Clique fora do texto para concluir."
			>
				<RichToolbar editor={inline.editor} />
			</Field>
		);
	}
	return (
		<Field
			label={label}
			hint="Dica: dê dois cliques no texto para editar direto no canvas."
		>
			<PanelEditor
				key={id}
				value={value}
				onChange={(html) => set(path, html, 600)}
			/>
		</Field>
	);
}

function PanelEditor({
	value,
	onChange,
}: {
	value: string;
	onChange: (html: string) => void;
}) {
	const editor = useEditor({
		extensions: richExtensions,
		content: value,
		immediatelyRender: false,
		editorProps: {
			attributes: {
				class:
					"prose prose-sm prose-invert max-w-none min-h-28 max-h-80 overflow-y-auto px-3 py-2 text-xs outline-none",
			},
		},
		onUpdate: ({ editor }) => onChange(editor.getHTML()),
	});

	// valor mudou por fora (undo/redo): sincroniza sem perder o cursor quando igual
	useEffect(() => {
		if (editor && !editor.isFocused && editor.getHTML() !== value) {
			editor.commands.setContent(value, { emitUpdate: false });
		}
	}, [editor, value]);

	if (!editor) return null;
	return (
		<div className="overflow-hidden rounded-md border border-input">
			<RichToolbar editor={editor} />
			<EditorContent editor={editor} />
		</div>
	);
}

const SIZES = [
	"12px",
	"14px",
	"16px",
	"18px",
	"20px",
	"24px",
	"28px",
	"32px",
	"40px",
	"48px",
];

export function RichToolbar({ editor }: { editor: Editor }) {
	const state = useEditorState({
		editor,
		selector: ({ editor: e }) => ({
			bold: e.isActive("bold"),
			italic: e.isActive("italic"),
			underline: e.isActive("underline"),
			strike: e.isActive("strike"),
			bullet: e.isActive("bulletList"),
			ordered: e.isActive("orderedList"),
			link: e.isActive("link"),
			align:
				(["left", "center", "right"] as const).find((a) =>
					e.isActive({ textAlign: a }),
				) ?? "left",
			color: (e.getAttributes("textStyle").color as string) ?? "",
			fontSize: (e.getAttributes("textStyle").fontSize as string) ?? "",
			fontFamily: (e.getAttributes("textStyle").fontFamily as string) ?? "",
		}),
	});

	const btn = (
		active: boolean,
		onClick: () => void,
		Icon: typeof Bold,
		title: string,
	) => (
		<button
			type="button"
			title={title}
			onMouseDown={(e) => e.preventDefault()}
			onClick={onClick}
			className={cn(
				"flex size-7 items-center justify-center rounded hover:bg-accent",
				active && "bg-primary/25 text-foreground",
			)}
		>
			<Icon className="size-3.5" />
		</button>
	);

	const chain = () => editor.chain().focus();

	return (
		<div className="flex flex-col gap-1 border-b border-input bg-muted/40 p-1">
			<div className="flex flex-wrap items-center gap-0.5">
				{btn(state.bold, () => chain().toggleBold().run(), Bold, "Negrito")}
				{btn(
					state.italic,
					() => chain().toggleItalic().run(),
					Italic,
					"Itálico",
				)}
				{btn(
					state.underline,
					() => chain().toggleUnderline().run(),
					Underline,
					"Sublinhado",
				)}
				{btn(
					state.strike,
					() => chain().toggleStrike().run(),
					Strikethrough,
					"Riscado",
				)}
				{btn(
					state.bullet,
					() => chain().toggleBulletList().run(),
					List,
					"Lista",
				)}
				{btn(
					state.ordered,
					() => chain().toggleOrderedList().run(),
					ListOrdered,
					"Lista numerada",
				)}
				{btn(
					state.align === "left",
					() => chain().setTextAlign("left").run(),
					AlignLeft,
					"Esquerda",
				)}
				{btn(
					state.align === "center",
					() => chain().setTextAlign("center").run(),
					AlignCenter,
					"Centro",
				)}
				{btn(
					state.align === "right",
					() => chain().setTextAlign("right").run(),
					AlignRight,
					"Direita",
				)}
				{btn(
					state.link,
					() => {
						if (state.link) return chain().unsetLink().run();
						const url = window.prompt("URL do link");
						if (url) chain().setLink({ href: url }).run();
					},
					LinkIcon,
					"Link",
				)}
				{btn(
					false,
					() => chain().toggleHighlight({ color: "#fde68a" }).run(),
					Highlighter,
					"Marca-texto",
				)}
				{btn(
					false,
					() => chain().unsetAllMarks().run(),
					RemoveFormatting,
					"Limpar formatação",
				)}
			</div>
			<div className="flex items-center gap-1">
				<select
					className="h-7 flex-1 rounded border border-input bg-transparent px-1 text-[11px] outline-none"
					value={state.fontSize}
					onMouseDown={(e) => e.stopPropagation()}
					onChange={(e) =>
						e.target.value
							? chain().setFontSize(e.target.value).run()
							: chain().unsetFontSize().run()
					}
				>
					<option value="">Tamanho</option>
					{SIZES.map((s) => (
						<option key={s} value={s}>
							{s}
						</option>
					))}
				</select>
				<select
					className="h-7 flex-1 rounded border border-input bg-transparent px-1 text-[11px] outline-none"
					value={
						fontChoices().find((f) => fontStack(f.value) === state.fontFamily)
							?.value ?? ""
					}
					onChange={(e) =>
						e.target.value
							? chain().setFontFamily(fontStack(e.target.value)).run()
							: chain().unsetFontFamily().run()
					}
				>
					<option value="">Fonte</option>
					{fontChoices().map((f) => (
						<option key={f.value} value={f.value}>
							{f.label}
						</option>
					))}
				</select>
				<ColorInput
					value={state.color}
					allowEmpty
					onChange={(c) =>
						c ? chain().setColor(c).run() : chain().unsetColor().run()
					}
				/>
			</div>
		</div>
	);
}
