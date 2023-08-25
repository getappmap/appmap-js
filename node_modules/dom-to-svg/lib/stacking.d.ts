declare global {
    interface CSSStyleDeclaration {
        src: string;
        mixBlendMode: string;
        maskBorder: string;
        isolation: string;
        webkitOverflowScrolling: string;
        contain: string;
        displayOutside: string;
        displayInside: string;
    }
}
export declare function establishesStackingContext(styles: CSSStyleDeclaration, parentStyles: CSSStyleDeclaration | null): boolean;
export interface StackingLayers {
    /** 1. The background and borders of the element forming the stacking context. */
    readonly rootBackgroundAndBorders: SVGGElement;
    /** 2. The child stacking contexts with negative stack levels (most negative first). */
    readonly childStackingContextsWithNegativeStackLevels: SVGGElement;
    /** 3. The in-flow, non-inline-level, non-positioned descendants. */
    readonly inFlowNonInlineNonPositionedDescendants: SVGGElement;
    /** 4. The non-positioned floats. */
    readonly nonPositionedFloats: SVGGElement;
    /** 5. The in-flow, inline-level, non-positioned descendants, including inline tables and inline blocks. */
    readonly inFlowInlineLevelNonPositionedDescendants: SVGGElement;
    /** 6. The child stacking contexts with stack level 0 and the positioned descendants with stack level 0. */
    readonly childStackingContextsWithStackLevelZeroAndPositionedDescendantsWithStackLevelZero: SVGGElement;
    /** 7. The child stacking contexts with positive stack levels (least positive first). */
    readonly childStackingContextsWithPositiveStackLevels: SVGGElement;
}
export declare function createStackingLayers(container: SVGElement): StackingLayers;
export declare function determineStackingLayer(styles: CSSStyleDeclaration, parentStyles: CSSStyleDeclaration | null): keyof StackingLayers | undefined;
export declare function sortChildrenByZIndex(parent: SVGElement): void;
export declare function sortStackingLayerChildren(stackingLayers: StackingLayers): void;
/**
 * Removes all stacking layers that are empty.
 */
export declare function cleanupStackingLayerChildren(stackingLayers: StackingLayers): void;
//# sourceMappingURL=stacking.d.ts.map