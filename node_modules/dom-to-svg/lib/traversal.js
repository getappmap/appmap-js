import { isElement, isTextNode } from './dom.js';
import { handleElement } from './element.js';
import { handleTextNode } from './text.js';
export function walkNode(node, context) {
    if (isElement(node)) {
        handleElement(node, context);
    }
    else if (isTextNode(node)) {
        handleTextNode(node, context);
    }
}
//# sourceMappingURL=traversal.js.map