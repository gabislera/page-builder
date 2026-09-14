/**
 * Peças comuns ao Cabeçalho e ao Rodapé: texto com edição inline e o logo
 * (imagem ou texto).
 */
import type { ReactNode } from "react";
import { actionLink } from "../core/actions.ts";
import { useInlineEdit } from "../core/inline-edit.tsx";
import { useRender } from "../core/render-context.tsx";
import type { Action } from "../core/style-types.ts";

/** Texto simples editável com duplo clique no canvas. */
export function InlineText({
	value,
	onCommit,
	className,
	multiline,
}: {
	value: string;
	onCommit?: (value: string) => void;
	className?: string;
	multiline?: boolean;
}) {
	const edit = useInlineEdit(value, onCommit, { multiline });
	return (
		<span
			ref={edit.ref as React.Ref<HTMLSpanElement>}
			className={className}
			style={multiline ? { whiteSpace: "pre-line" } : undefined}
			{...edit.attrs}
		>
			{edit.editing ? null : value}
		</span>
	);
}

/** Logo: imagem quando houver, senão o texto da marca. */
export function LogoView({
	src,
	alt,
	text,
	action,
	onTextChange,
}: {
	src: string;
	alt: string;
	text: string;
	action?: Action;
	onTextChange?: (value: string) => void;
}) {
	const ctx = useRender();
	const link = actionLink(action, ctx);
	let content: ReactNode;
	if (src) {
		content = <img src={src} alt={alt || text} decoding="async" />;
	} else {
		content = (
			<InlineText
				value={text}
				onCommit={onTextChange}
				className="pb-logo-text"
			/>
		);
	}
	if (link) {
		return (
			<a className="pb-logo" {...link}>
				{content}
			</a>
		);
	}
	return <div className="pb-logo">{content}</div>;
}
