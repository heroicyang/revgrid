export interface RenderAction {
    type: RenderAction.Type;
}

export interface RepaintGridRenderAction extends RenderAction {
    type: RenderAction.Type.RepaintGrid;
}

export interface RecalculateViewRenderAction extends RenderAction {
    type: RenderAction.Type.RecalculateView;
}

export namespace RenderAction {
    export const enum Type {
        RepaintGrid,
        RecalculateView,
    }
}
