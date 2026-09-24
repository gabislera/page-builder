import { Children, Fragment, isValidElement, type ReactNode } from "react";

/**
 * Lists children, unwrapping Fragments. In the editor, Craft delivers
 * canvas children inside a Fragment; without this, components that
 * number children (tabs, accordion, carousel) would see only one child.
 */
export function flattenChildren(children: ReactNode): ReactNode[] {
  const out: ReactNode[] = [];
  for (const child of Children.toArray(children)) {
    if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
      out.push(...flattenChildren(child.props.children));
    } else {
      out.push(child);
    }
  }
  return out;
}
