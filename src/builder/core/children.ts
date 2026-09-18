import { Children, Fragment, isValidElement, type ReactNode } from "react";

/**
 * Lista os filhos desembrulhando Fragments. No editor o Craft entrega os
 * filhos de um canvas dentro de um Fragment; sem isso, componentes que
 * numeram os filhos (abas, acordeão, carrossel) veriam um filho só.
 */
export function flattenChildren(children: ReactNode): ReactNode[] {
	const out: ReactNode[] = [];
	for (const child of Children.toArray(children)) {
		if (
			isValidElement<{ children?: ReactNode }>(child) &&
			child.type === Fragment
		) {
			out.push(...flattenChildren(child.props.children));
		} else {
			out.push(child);
		}
	}
	return out;
}
