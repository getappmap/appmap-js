// Namespaces
export const svgNamespace = 'http://www.w3.org/2000/svg';
export const xlinkNamespace = 'http://www.w3.org/1999/xlink';
export const xhtmlNamespace = 'http://www.w3.org/1999/xhtml';
// DOM
export const isElement = (node) => node.nodeType === Node.ELEMENT_NODE;
export const isTextNode = (node) => node.nodeType === Node.TEXT_NODE;
export const isCommentNode = (node) => node.nodeType === Node.COMMENT_NODE;
// SVG
export const isSVGElement = (element) => element.namespaceURI === svgNamespace;
export const isSVGSVGElement = (element) => isSVGElement(element) && element.tagName === 'svg';
export const isSVGGraphicsElement = (element) => isSVGElement(element) && 'getCTM' in element && 'getScreenCTM' in element;
export const isSVGGroupElement = (element) => isSVGElement(element) && element.tagName === 'g';
export const isSVGAnchorElement = (element) => isSVGElement(element) && element.tagName === 'a';
export const isSVGTextContentElement = (element) => isSVGElement(element) && 'textLength' in element;
export const isSVGImageElement = (element) => element.tagName === 'image' && isSVGElement(element);
export const isSVGStyleElement = (element) => element.tagName === 'style' && isSVGElement(element);
// HTML
export const isHTMLElement = (element) => element.namespaceURI === xhtmlNamespace;
export const isHTMLAnchorElement = (element) => element.tagName === 'A' && isHTMLElement(element);
export const isHTMLLabelElement = (element) => element.tagName === 'LABEL' && isHTMLElement(element);
export const isHTMLImageElement = (element) => element.tagName === 'IMG' && isHTMLElement(element);
export const isHTMLInputElement = (element) => element.tagName === 'INPUT' && isHTMLElement(element);
export const hasLabels = (element) => 'labels' in element;
export function* traverseDOM(node, shouldEnter = () => true) {
    yield node;
    if (shouldEnter(node)) {
        for (const childNode of node.childNodes) {
            yield* traverseDOM(childNode);
        }
    }
}
//# sourceMappingURL=dom.js.map