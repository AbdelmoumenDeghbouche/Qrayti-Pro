// utils/mindmapUtils.ts

export interface MindMapUINode {
  id: string;
  text: string;
  children: MindMapUINode[];
}

const TAB_WIDTH = 2; // Treat a tab as 2 spaces for indentation calculation

/**
 * Calculates the indentation level of a line and extracts the clean text.
 * @param lineStr The original line string.
 * @returns An object with the indent level and the processed text.
 */
function getLineDetails(lineStr: string): { indent: number, text: string } {
  let indent = 0;
  let textStartIndex = 0;

  // Calculate indentation based on leading spaces and tabs
  for (let i = 0; i < lineStr.length; i++) {
    if (lineStr[i] === ' ') {
      indent++;
    } else if (lineStr[i] === '\t') {
      indent += TAB_WIDTH;
    } else {
      textStartIndex = i;
      break;
    }
    // If loop finishes, means line is all whitespace
    if (i === lineStr.length - 1) textStartIndex = lineStr.length;
  }

  // Strip optional bullet/prefix from the actual content part
  const potentialText = lineStr.substring(textStartIndex);
  // Matches common bullet points like -, *, + followed by optional space
  const text = potentialText.replace(/^([-*+]?\s*)/, '').trim();
  
  return { indent, text };
}

/**
 * Parses a text-based mind map (using indentation) into a tree structure.
 * @param text The raw mind map text.
 * @returns The root node of the mind map tree, or null if input is empty.
 */
export function parseMindMapText(text: string): MindMapUINode | null {
  const lines = text.split('\n')
    // Process each line to get its details, then filter out lines that are empty after processing
    .map(line => ({ original: line, details: getLineDetails(line) }))
    .filter(item => item.details.text !== '');

  if (lines.length === 0) return null;

  const rootNodes: MindMapUINode[] = [];
  // Stack to keep track of parent nodes based on indentation
  const parentStack: { node: MindMapUINode; indent: number }[] = [];

  lines.forEach((lineItem, index) => {
    const { indent, text: nodeText } = lineItem.details;

    const newNode: MindMapUINode = { 
      id: `node-${Date.now()}-${index}`, // More unique ID
      text: nodeText, 
      children: [] 
    };

    // Adjust parent stack: Pop nodes from stack if current node's indent
    // is less than or equal to the indent of the node at the top of the stack.
    // This finds the correct parent for the current node.
    while (parentStack.length > 0 && indent <= parentStack[parentStack.length - 1].indent) {
      parentStack.pop();
    }

    if (parentStack.length === 0) {
      // Current node is a root-level node
      rootNodes.push(newNode);
    } else {
      // Current node is a child of the node at the top of the stack
      parentStack[parentStack.length - 1].node.children.push(newNode);
    }
    
    // Push current node onto the stack to become a potential parent for subsequent nodes
    parentStack.push({ node: newNode, indent: indent });
  });

  if (rootNodes.length === 0) return null;
  
  // If there's only one root node, return it directly.
  if (rootNodes.length === 1) return rootNodes[0];
  
  // If multiple root nodes are detected (e.g., disjointed topics at the lowest indent),
  // create a synthetic root node to contain them all for a unified tree structure.
  return {
    id: 'synthetic-root',
    text: 'المخطط الذهني (مواضيع متعددة)', // Default text for synthetic root
    children: rootNodes,
  };
}
