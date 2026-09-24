import { useInlineEdit } from "../../core/inline-edit.tsx";

/** Texto simples editável com duplo clique no canvas (Logo, Menu). */
export function InlineText({
  value,
  onCommit,
  className,
}: {
  value: string;
  onCommit?: (value: string) => void;
  className?: string;
}) {
  const edit = useInlineEdit(value, onCommit);
  return (
    <span ref={edit.ref as React.Ref<HTMLSpanElement>} className={className} {...edit.attrs}>
      {edit.editing ? null : value}
    </span>
  );
}
