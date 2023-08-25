import { TraversalContext } from './traversal.js';
/**
 * Recursively clone an `<svg>` element, inlining it into the output SVG document with the necessary transforms.
 */
export declare function handleSvgNode(node: Node, context: SvgTraversalContext): void;
interface SvgTraversalContext extends Pick<TraversalContext, 'svgDocument' | 'currentSvgParent' | 'options'> {
    /**
     * A prefix to use for all ID to make them unique inside the output SVG document.
     */
    readonly idPrefix: string;
}
export declare function handleSvgElement(element: SVGElement, context: SvgTraversalContext): void;
export {};
//# sourceMappingURL=svg.d.ts.map