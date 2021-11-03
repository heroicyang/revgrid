import { DataModel } from './data-model';

/** @public */
export interface MainDataModel extends DataModel {
    readonly mainDataModel: true,
    addDataCallbackListener(listener: MainDataModel.CallbackListener): void;
}

/** @public */
export namespace MainDataModel {
    export interface CallbackListener extends DataModel.CallbackListener {
        /**
         * @desc The data models should trigger this event immediately before data model remaps the rows.
         * Hypergrid responds by saving the underlying row indices of currently selected rows — before triggering a grid event using the same event string, which applications can listen for using {@link Hypergrid#addEventListener addEventListener}:
         * ```js
         * grid.addEventListener('rev-data-prereindex', myHandlerFunction);
         * ```
         * This event is not cancelable.
         */
        preReindex: (this: void) => void;
        /**
         * @desc The data models should trigger this event immediately after data model remaps the rows.
         * Hypergrid responds by reselecting the remaining rows matching the indices previously saved in the `data-prereindex` event, and then calling {@link Hypergrid#behaviorShapeChanged grid.behaviorShapeChanged()} — before triggering a grid event using the same event string, which applications can listen for using {@link Hypergrid#addEventListener addEventListener}:
         * ```js
         * grid.addEventListener('rev-data-postreindex', myHandlerFunction);
         * ```
         * This event is not cancelable.
         */
        postReindex: (this: void) => void;
    }

    export function isMain(dataModel: DataModel): dataModel is MainDataModel {
        return (dataModel as MainDataModel).mainDataModel === true;
    }
}
