declare global {
    interface SVGStyleElement extends LinkStyle {
    }
}
/**
 * Inlines all external resources of the given element, such as fonts and images.
 *
 * Fonts and binary images are inlined as Base64 data: URIs.
 *
 * Images that reference another SVG are inlined by inlining the embedded SVG into the output SVG.
 * Note: The passed element needs to be attached to a document with a window (`defaultView`) for this so that `getComputedStyle()` can be used.
 */
export declare function inlineResources(element: Element): Promise<void>;
//# sourceMappingURL=inline.d.ts.map