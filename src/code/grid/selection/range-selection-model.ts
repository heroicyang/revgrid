'use strict';

/* eslint-env node, browser */

//(function (module) {  // eslint-disable-line no-unused-expressions

    // This closure supports NodeJS-less client side includes with <script> tags. See https://github.com/joneit/mnm.

/**
 * @desc This object models selection of "cells" within an abstract single-dimensional matrix.
 *
 * Disjoint selections can be built with calls to the following methods:
 * * {@link RangeSelectionModel#select|select(start, stop)} - Add a range to the matrix.
 * * {@link RangeSelectionModel#deselect|deselect(start, stop)} - Remove a range from the matrix.
 *
 * Two more methods are available:
 * * Test a cell to see if it {@link RangeSelectionModel#isSelected|isSelected(cell)}
 * * {@link RangeSelectionModel#clear|clear()} the matrix
 *
 * Internally, the selection is run-length-encoded. It is therefore a "sparse" matrix
 * with undefined bounds. A single data property called `selection` is an array that
 * contains all the "runs" (ranges) of selected cells albeit in no particular order.
 * This property should not normally need to be accessed directly.
 */
export class RangeSelectionModel {
    /**
     * @summary Unordered list of runs.
     */
    selection: RangeSelectionModel.Selection;

    states: Array<RangeSelectionModel.Selection>;

    constructor() {
        this.selection = [];

        //we need to be able to go back in time
        //the states field
        this.states = [];
    }

    /**
     * @summary Add a contiguous run of points to the selection.
     * @desc Insert a new run into `this.selection`.
     * The new run will be merged with overlapping and adjacent runs.
     *
     * The two parameters may be given in either order.
     * The start and stop elements in the resulting run will however always be ordered.
     * (However, note that the order of the runs within `this.selection` is itself always unordered.)
     *
     * Note that `this.selection` is updated in place, preserving validity of any external references.
     * @param start - Start of run. May be greater than `stop`.
     * @param stop - End of run (inclusive). May be less than `start`.
     * @returns Self (i.e., `this`), for chaining.
     */
    select(start: number | RangeSelectionModel.Run, stop?: number): RangeSelectionModel {
        this.storeState();
        let run = makeRun(start, stop);
        const newSelection: RangeSelectionModel.Run[] = [];
        this.selection.forEach(function (each) {
            if (overlaps(each, run) || abuts(each, run)) {
                run = merge(each, run);
            } else {
                newSelection.push(each);
            }
        });
        newSelection.push(run);
        this.selection.splice(0, this.selection.length, ...newSelection); // update in place to preserve external references
        return this;
    }

    /**
     * @summary Remove a contiguous run of points from the selection.
     * @desc Truncate and/or remove run(s) from `this.selection`.
     * Removing part of existing runs will (correctly) shorten them or break them into two fragments.
     *
     * The two parameters may be given in either order.
     *
     * Note that `this.selection` is updated in place, preserving validity of any external references.
     * @param start - Start of run. May be greater than `stop`.
     * @param stop - End of run (inclusive). May be less than `start`.
     * @returns Self (i.e., `this`), for chaining.
     */
    deselect(start: number | RangeSelectionModel.Run, stop?: number): RangeSelectionModel {
        const run = makeRun(start, stop);
        let newSelection: RangeSelectionModel.Run[] = [];
        this.selection.forEach(function (each) {
            if (overlaps(each, run)) {
                const pieces = subtract(each, run);
                newSelection = newSelection.concat(pieces);
            } else {
                newSelection.push(each);
            }
        });
        this.selection.splice(0, this.selection.length, ...newSelection); // update in place to preserve external references
        return this;
    }

    /**
     * @summary Empties `this.selection`, effectively removing all runs.
     * @returns Self (i.e., `this`), for chaining.
     */
    clear(): RangeSelectionModel {
        this.states.length = 0;
        this.selection.length = 0;
        return this;
    }

    clearMostRecentSelection() {
        if (this.states.length === 0) {
            return;
        }
        this.selection = this.states.pop();
    }

    /**
     * @summary Determines if the given `cell` is selected.
     * @returns `true` iff given `cell` is within any of the runs in `this.selection`.
     * @param cell - The cell to test for inclusion in the selection.
     */
    isSelected(cell: number): boolean {
        return this.selection.some(
            (each) => {
                return each[0] <= cell && cell <= each[1];
            }
        );
    }

    isEmpty() {
        return this.selection.length === 0;
    }

    /**
     * @summary Return the indexes that are selected.
     * @desc Return the indexes that are selected.
     */
    getSelections() {
        const result: number[] = [];
        this.selection.forEach(
            (each) => {
                for (let i = each[0]; i <= each[1]; i++) {
                    result.push(i);
                }
            }
        );

        result.sort((a, b) => {
            return a - b;
        });

        return result;
    }

    //clone and store my current state
    //so we can unwind changes if need be
    storeState() {
        const sels = this.selection;
        const state: RangeSelectionModel.Selection = [];
        for (let i = 0; i < sels.length; i++) {
            const copy = sels[i].slice() as RangeSelectionModel.Run;
            // const copy = [].concat(sels[i]);
            state.push(copy);
        }
        this.states.push(state);
    }
}

export namespace RangeSelectionModel {
    /**
     * A "run" is defined as an Array(2) where:
     * element [0] is the beginning of the run
     * element [1] is the end of the run (inclusive) and is always >= element [0]
     */
    export type RunStartStop = [start: number, stop: number];
    export interface Run extends RunStartStop {
        offsetY?: number;
    }

    export type Selection = Run[];
}
/**
 * @summary Preps `start` and `stop` params into order array
 * @desc Utility function called by both `select()` and `deselect()`.
 * @param start - Start of run. if array, `start` and `stop` are taken from first two elements.
 * @param stop - End of run (inclusive).
 */
function makeRun(start: number | RangeSelectionModel.Run, stop?: number): RangeSelectionModel.Run {
    return (
        start instanceof Array
            ? makeRun(start[0], start[1]) // extract params from given array
            : stop === undefined
                ? [ start, start ] // single param is a run that stops where it starts
                : start <= stop
                    ? [ start, stop ]
                    : [ stop, start ] // reverse descending params into ascending order
    );
}

/**
 * @private
 * @function overlaps
 * @returns {boolean} `true` iff `run1` overlaps `run2`
 * @summary Comparison operator that determines if given runs overlap with one another.
 * @desc Both parameters are assumed to be _ordered_ arrays.
 *
 * Overlap is defined to include the case where one run completely contains the other.
 *
 * Note: This operator is commutative.
 * @param run1 - first run
 * @param run2 - second run
 */
function overlaps(run1: RangeSelectionModel.Run, run2: RangeSelectionModel.Run): boolean {
    return (
        run1[0] <= run2[0] && run2[0] <= run1[1] || // run2's start is within run1 OR...
        run1[0] <= run2[1] && run2[1] <= run1[1] || // run2's stop is within run1 OR...
        run2[0] <  run1[0] && run1[1] <  run2[1]    // run2 completely contains run1
    );
}

/**
 * @summary Comparison operator that determines if given runs are consecutive with one another.
 * @returns `true` iff `run1` is consecutive with `run2`
 * @desc Both parameters are assumed to be _ordered_ arrays.
 *
 * Note: This operator is commutative.
 * @param run1 - first run
 * @param run2 - second run
 */
function abuts(run1: RangeSelectionModel.Run, run2: RangeSelectionModel.Run): boolean {
    return (
        run1[1] === run2[0] - 1 || // run1's top immediately precedes run2's start OR...
        run2[1] === run1[0] - 1    // run2's top immediately precedes run1's start
    );
}

/**
 * @summary Operator that subtracts one run from another.
 * @returns The remaining pieces of `minuend` after removing `subtrahend`.
 * @desc Both parameters are assumed to be _ordered_ arrays.
 *
 * This function _does not assumes_ that `overlap()` has already been called with the same runs and has returned `true`.
 *
 * Returned array contains 0, 1, or 2 runs which are the portion(s) of `minuend` that do _not_ include `subtrahend`.
 *
 * Caveat: This operator is *not* commutative.
 * @param minuend - a run from which to "subtract" `subtrahend`
 * @param subtrahend - a run to "subtracted" from `minuend`
 */
function subtract(minuend: RangeSelectionModel.Run, subtrahend: RangeSelectionModel.Run) {
    const m0 = minuend[0];
    const m1 = minuend[1];
    const s0 = subtrahend[0];
    const s1 = subtrahend[1];
    const result: RangeSelectionModel.Run[] = [];

    if (s0 <= m0 && s1 < m1) {
        //subtrahend extends before minuend: return remaining piece of `minuend`
        result.push([s1 + 1, m1]);
    } else if (s0 > m0 && s1 >= m1) {
        //subtrahend extends after minuend: return remaining piece of `minuend`
        result.push([m0, s0 - 1]);
    } else if (m0 < s0 && s1 < m1) {
        //completely inside: return 2 smaller pieces resulting from the hole
        result.push([m0, s0 - 1]);
        result.push([s1 + 1, m1]);
    } else if (s1 < m0 || s0 > m1) {
        // completely outside: return `minuend` untouched
        result.push(minuend);
    }

    //else subtrahend must completely overlap minuend so return no pieces

    return result;
}


// Local utility functions

/**
 * @summary Operator that merges given runs.
 * @returns A single merged run.
 * @desc Both parameters are assumed to be _ordered_ arrays.
 *
 * The runs are assumed to be overlapping or adjacent to one another.
 *
 * Note: This operator is commutative.
 * @param run1 - a run to merge with `run2`
 * @param run2 - a run to merge with `run1`
 */
function merge(run1: RangeSelectionModel.Run, run2: RangeSelectionModel.Run): RangeSelectionModel.Run {
    const min = Math.min(Math.min(...run1), Math.min(...run2));
    const max = Math.max(Math.max(...run1), Math.max(...run2));
    return [min, max];
}

//     // Interface
//     module.exports = RangeSelectionModel;
// })(
//     typeof module === 'object' && module || (window.RangeSelectionModel = {}),
//     typeof module === 'object' && module.exports || (window.RangeSelectionModel.exports = {})
// ) || (
//     typeof module === 'object' || (window.RangeSelectionModel = window.RangeSelectionModel.exports)
// );

/* About the above IIFE:
 * This file is a "modified node module." It functions as usual in Node.js *and* is also usable directly in the browser.
 * 1. Node.js: The IIFE is superfluous but innocuous.
 * 2. In the browser: The IIFE closure serves to keep internal declarations private.
 * 2.a. In the browser as a global: The logic in the actual parameter expressions + the post-invocation expression
 * will put your API in `window.RangeSelectionModel`.
 * 2.b. In the browser as a module: If you predefine a `window.module` object, the results will be in `module.exports`.
 * The bower component `mnm` makes this easy and also provides a global `require()` function for referencing your module
 * from other closures. In either case, this works with both NodeJs-style export mechanisms -- a single API assignment,
 * `module.exports = yourAPI` *or* a series of individual property assignments, `module.exports.property = property`.
 *
 * Before the IIFE runs, the actual parameter expressions are executed:
 * 1. If `window` object undefined, we're in NodeJs so assume there is a `module` object with an `exports` property
 * 2. If `window` object defined, we're in browser
 * 2.a. If `module` object predefined, use it
 * 2.b. If `module` object undefined, create a `RangeSelectionModel` object
 *
 * After the IIFE returns:
 * Because it always returns undefined, the expression after the || will execute:
 * 1. If `window` object undefined, then we're in NodeJs so we're done
 * 2. If `window` object defined, then we're in browser
 * 2.a. If `module` object predefined, we're done; results are in `moudule.exports`
 * 2.b. If `module` object undefined, redefine`RangeSelectionModel` to be the `RangeSelectionModel.exports` object
 */
