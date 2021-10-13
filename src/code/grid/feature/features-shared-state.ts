export interface FeaturesSharedState {
    mouseDownUpClickUsedForMoveOrResize: boolean;
}

export namespace FeaturesSharedState {
    export function initialise(state: FeaturesSharedState) {
        state.mouseDownUpClickUsedForMoveOrResize = false;
    }
}
