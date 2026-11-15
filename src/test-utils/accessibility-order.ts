import { screen } from '@testing-library/react-native';

type Node = NonNullable<typeof screen.root>;

/** The text inside a node, joined. */
function textOf(node: Node): string {
  return node.children.map((child) => (typeof child === 'string' ? child : textOf(child))).join('');
}

/**
 * What a screen reader would move through, in tree order: each accessible element or text
 * field as "<role> <label>", without descending into it. Text with a role (a heading) is
 * named by its content; plain text is skipped. Approximates TalkBack's order for a
 * single-column layout.
 */
export function readingOrder(root: Node | null = screen.root): string[] {
  const names: string[] = [];
  const visit = (node: Node) => {
    const { props } = node;
    if (props.accessibilityElementsHidden || props.importantForAccessibility === 'no-hide-descendants') return;
    const isField = node.type === 'TextInput';
    if (node.type === 'Text' && props.accessibilityRole) {
      names.push(`${props.accessibilityRole} ${props.accessibilityLabel ?? textOf(node)}`);
      return;
    }
    if (isField || props.accessible === true) {
      const role = isField ? 'text field' : (props.accessibilityRole ?? 'element');
      names.push(`${role} ${props.accessibilityLabel ?? ''}`.trim());
      return;
    }
    for (const child of node.children) {
      if (typeof child !== 'string') visit(child);
    }
  };
  if (root) visit(root);
  return names;
}
