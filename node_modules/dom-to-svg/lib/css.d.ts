export declare const isCSSFontFaceRule: (rule: CSSRule) => rule is CSSFontFaceRule;
export declare const isInline: (styles: CSSStyleDeclaration) => boolean;
export declare const isPositioned: (styles: CSSStyleDeclaration) => boolean;
export declare const isInFlow: (styles: CSSStyleDeclaration) => boolean;
export declare const isTransparent: (color: string) => boolean;
export declare const hasUniformBorder: (styles: CSSStyleDeclaration) => boolean;
/** A side of a box. */
export declare type Side = 'top' | 'bottom' | 'right' | 'left';
/** Whether the given side is a horizontal side. */
export declare const isHorizontal: (side: Side) => boolean;
/**
 * Returns the (elliptic) border radii for a given side.
 * For example, for the top side it will return the horizontal top-left and the horizontal top-right border radii.
 */
export declare function getBorderRadiiForSide(side: Side, styles: CSSStyleDeclaration, bounds: DOMRectReadOnly): [number, number];
/**
 * Returns the factor by which all border radii have to be scaled to fit correctly.
 *
 * @see https://drafts.csswg.org/css-backgrounds-3/#corner-overlap
 */
export declare const calculateOverlappingCurvesFactor: (styles: CSSStyleDeclaration, bounds: DOMRectReadOnly) => number;
export declare const isVisible: (styles: CSSStyleDeclaration) => boolean;
export declare function parseCSSLength(length: string, containerLength: number): number | undefined;
export declare const unescapeStringValue: (value: string) => string;
export declare function copyCssStyles(from: CSSStyleDeclaration, to: CSSStyleDeclaration): void;
//# sourceMappingURL=css.d.ts.map