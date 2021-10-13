import { RevRecordAssertError } from './rev-record-error';

export namespace RevRecordArrayUtil {
    export type Comparer<T> = (left: T, right: T) => number;

    export function sort<T>(values: T[], comparer: Comparer<T>, index?: number, count?: number): void {
		if (index === undefined) {
			index = 0;
		}

		if (count === undefined) {
			count = values.length - index;
		}

		if (index < 0 || count < 0 || index + count > values.length) {
			throw new RangeError(`Out of Range: ${index}, ${count}, ${values.length}`);
		}

		quickSort(values, comparer, index, index + count - 1);
	}

	export function binarySearch<T>(values: T[], item: T, comparer: Comparer<T>): number {
		let min = 0;
        let max = values.length - 1;
		while (min <= max) {
			const mid = min + ((max - min) >> 1);
			const result = comparer(values[mid], item);

			if (result < 0) {
				min = mid + 1;
			} else if (result > 0) {
				max = mid - 1;
            } else {
				return mid;
            }
		}

		return ~min; // Bitwise negation, will always return a negative value. Caller can use ~ to get the index where the item will fit
	}

    /** Search list where multiple items return same comparer result */
    export function binarySearchWithDuplicates<T>(values: T[], item: T, comparer: Comparer<T>) {
        const initialIndex = binarySearch(values, item, comparer);
        if (initialIndex < 0) {
            return initialIndex;
        } else {
            const initialItem = values[initialIndex];
            if (initialItem === item) {
                return initialIndex;
            } else {
                // check for item in duplicates below initial index
                let lowerIndex = initialIndex - 1;
                while (lowerIndex >= 0) {
                    const lowerItem = values[lowerIndex];
                    if (lowerItem === item) {
                        return lowerIndex;
                    } else {
                        lowerIndex--;
                    }
                }

                // check for item in duplicates above initial index
                const count = values.length;
                let upperIndex = initialIndex + 1;
                while (upperIndex < count) {
                    const upperItem = values[upperIndex];
                    if (upperItem === item) {
                        return upperIndex;
                    } else {
                        upperIndex++;
                    }
                }

                // Item was not in duplicates - most likely an error elsewhere
                throw new RevRecordAssertError('UBSWD98884');
            }
        }
    }

	export function binarySearchWithSkip<T>(
		values: T[], item: T, skipIndex: number, comparer: Comparer<T>, index?: number, count?: number): number {
		if (index === undefined) {
			index = 0;
		}

		if (count === undefined) {
			count = values.length - index;
		}

		if (index < 0 || count < 0 || index + count > values.length) {
			throw new RangeError(`Out of Range: ${index}, ${count}, ${values.length}`);
		}

		if (count === 0) {
			return -1;
		}

		let min = index;
        let max = index + count - 1;
		while (min <= max) {
			let mid = min + ((max - min) >> 1);
			if (mid === skipIndex) {
				if (mid > min) {
					mid--;
				} else if (mid < max) {
					mid++;
                } else {
					return ~mid;
 				} // Item should be inserted where the skip point is
			}

			const result = comparer(values[mid], item);

			if (result < 0) {
				min = mid + 1;
			} else if (result > 0) {
				max = mid - 1;
			} else {
				return mid;
            }
		}

		return ~min; // Bitwise negation, will always return a negative value. Caller can use ~ to get the index where the item will fit
	}

	export function partialSort<T>(
		data: T[], offset: number, count: number, sortOffset: number, sortCount: number, comparer: Comparer<T>): void {
		if (offset != sortOffset || count != sortCount) {
			// Ensure everything below the offset is less
			partition(data, offset, sortOffset, sortCount, comparer);

			// Now ensure everything above the end offset is greater
			// We can skip processing everything before offset, since everything below that is already guaranteed less
			partition(data, offset + count - 1, offset, sortCount - (offset - sortOffset), comparer);
		}

		// The items between offset and count now need to be properly sorted
		// TODO: IntroSort?
		quickSort(data, comparer, sortOffset, sortOffset + sortCount - 1);
	}

	function partition<T>(array: T[], offset: number, sortOffset: number, sortCount: number, comparer: Comparer<T>): void {
		let Min = sortOffset, Max = sortOffset + sortCount - 1;

		while (Min < Max) {
			// Select the middle item as our initial pivot
			const PivotIndex = Min + ((Max - Min) >> 1);

			// Sort our first and last items, plus the pivot
			swapIfGreater(array, Min, PivotIndex, comparer);
			swapIfGreater(array, Min, Max, comparer);
			swapIfGreater(array, PivotIndex, Max, comparer);

			// Picks the middle of the three as the pivot
			const Pivot = array[PivotIndex];
			let Left = Min, Right = Max;

			// Sort everything so all items less than the pivot are to its left, and all items greater are on its right
			while (Left < Right) {
				while (comparer(array[Left], Pivot) <= 0) { Left++; }
				while (comparer(Pivot, array[Right]) < 0) { Right--; }

				if (Left < Right) {
					// Swap these two items, since they're on the wrong sides of the pivot
					const Temp1 = array[Left];
					const Temp2 = array[Right];

					// If our two items are the same, then we have one or more items in the list that are identical to our pivot
					if (comparer(Temp1, Temp2) == 0) {
						Left++; // Skip one
						continue;
					}

					array[Left] = Temp2;
					array[Right] = Temp1;
				}
			}

			// Now we repeat either on the left or the right of the pivot
			if (Right > offset) {
				Max = Left - 1; // Pivot is higher, so select on the left
			} else if (Left < offset) {
				Min = Right + 1;
            } else {
				break; // Partition complete
			}
		}
	}

	function swapIfGreater<T>(array: T[], left: number, right: number, comparer: Comparer<T>): void {
		if (left != right && comparer(array[left], array[right]) > 0) {
			const Temp = array[left];
			array[left] = array[right];
			array[right] = Temp;
		}
	}

	function quickSort<T>(values: T[], comparer: Comparer<T>, left: number, right: number): void {
		if (left >= right) {
			return;
		}

		let Min = left, Max = right;
		const pivot = values[left + ((right - left) >> 1)];

		do {
			while (comparer(values[Min], pivot) <= 0) {
				Min++;
			}

			while (comparer(values[Max], pivot) > 0) {
				Max--;
			}

			if (Min < Max) {
				const temp = values[Min];
				values[Min] = values[Max];
				values[Max] = temp;

				Min++;
				Max--;
			}
		} while (Min <= Max);

		quickSort(values, comparer, Min, left - 1);
		quickSort(values, comparer, left, Max);
	}

    export function move<T>(array: T[], oldIndex: number, newIndex: number) {
        const item = array[oldIndex];
        if (newIndex > oldIndex) {
            for (let i = oldIndex; i < newIndex; i++) {
                array[i] = array[i + 1];
            }
            array[newIndex] = item;
        } else {
            if (newIndex < oldIndex) {
                for (let i = oldIndex; i > newIndex; i--) {
                    array[i] = array[i - 1];
                }
                array[newIndex] = item;
            }
        }
    }
}
