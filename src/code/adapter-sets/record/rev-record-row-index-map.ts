import { RevRecordRowError } from './rev-record-error';

/** Provides fast mappings between array locations, including imbalanced mappings where records are absent from one side */
export class RevRecordRowIndexMap {

    /** Gets the number of indexes on the left */
    get leftCount(): number {
        return this.ltoref.length;
    }

    /** Gets the number of indexes on the right */
    get rightCount(): number {
        return this.rtoref.length;
    }
    // Maps left index values to right
    private ltoref: number[] = [];
    private reftor: number[] = [];

    // Maps right index values to left
    private rtoref: number[] = [];
    private reftol: number[] = [];

    /**
	 * Performs a binary search for a specific reference number
	 * @param nodes - The array to search
	 * @param ref - The reference number to search for
	 * @returns The index of the reference number
	 * @throws Error when the reference number is not found
	 */
    public static search(nodes: number[], ref: number): number {
        let Left = 0, Right = nodes.length - 1;

        while (Left <= Right) {
            const nodeIndex = Left + ((Right - Left) >> 1);
            let nodeRef = nodes[nodeIndex];

            if (nodeRef === -1) {
                let innerIndex = nodeIndex;

                while (nodeRef === -1 && innerIndex > Left) {
                    nodeRef = nodes[--innerIndex];
                }

                if (nodeRef === -1) {
                    innerIndex = nodeIndex;

                    while (nodeRef === -1 && innerIndex < Right) {
                        nodeRef = nodes[++innerIndex];
                    }

                    if (nodeRef === -1) {
                        throw new RevRecordRowError('RRIMSR54441', 'Index is invalid');
                    }
                }

                if (nodeRef < ref) {
                    Left = nodeIndex + 1;
                } else if (nodeRef > ref) {
                    Right = nodeIndex - 1;
                } else {
                    return innerIndex;
                }
            } else {
                if (nodeRef > ref) {
                    Right = nodeIndex - 1;
                } else if (nodeRef < ref) {
                    Left = nodeIndex + 1;
                } else {
                    return nodeIndex;
                }
            }
        }

        throw new RevRecordRowError('RRIMSN54441', 'Index is invalid');
    }

    /**
	 * Attempts to insert a reference at a specific index in an array
	 * @param nodes - The array to insert into
	 * @param nodeIndex - The index to insert at
	 * @returns The new reference number, or -1 if there was no space
	 */
    public static insert(nodes: number[], nodeIndex: number): number {
        let ref: number;

        if (nodeIndex === nodes.length) {
            // Inserting at the very end
            const lowerRef = RevRecordRowIndexMap.refBelow(nodes, nodeIndex - 1);

            if (lowerRef >= 0x7FFFFFFE) {
                return -1;
            } // Need to reallocate the index first

            if (lowerRef === -1) {
                ref = 0x40000000;
            } else {
                ref = Math.floor(((0x7FFFFFFF - lowerRef) >> 1) + lowerRef);
            }
        } else if (nodeIndex === 0) {
            // Inserting at the very start
            const upperRef = RevRecordRowIndexMap.refAbove(nodes, 0);

            if (upperRef === 0) {
                return -1;
            } // Need to reallocate the index first

            if (upperRef === -1) {
                ref = 0x40000000;
            } else {
                ref = Math.floor(upperRef >> 1);
            }
        } else {
            // Insert below the current NodeIndex
            let lowerRef = RevRecordRowIndexMap.refBelow(nodes, nodeIndex - 1);
            let upperRef = RevRecordRowIndexMap.refAbove(nodes, nodeIndex);

            if (lowerRef === -1 && upperRef === -1) {
                ref = 0x40000000; // No existing records
            } else {
                if (lowerRef === -1) {
                    lowerRef = 0;
                }

                if (upperRef === -1) {
                    upperRef = 0x7FFFFFFF;
                }

                if (lowerRef + 1 >= upperRef) {
                    return -1;
                } // Need to reallocate the index first

                ref = Math.floor(((upperRef - lowerRef) >> 1) + lowerRef);
            }
        }

        nodes.splice(nodeIndex, 0, ref);

        return ref;
    }

    private static refBelow(indexes: number[], nodeIndex: number): number {
        for (let Index = nodeIndex; Index >= 0; Index--) {
            const ref = indexes[Index];

            if (ref !== -1) {
                return ref;
            }
        }

        return -1;
    }

    private static refAbove(indexes: number[], nodeIndex: number): number {
        for (let Index = nodeIndex; Index < indexes.length; Index++) {
            const ref = indexes[Index];

            if (ref !== -1) {
                return ref;
            }
        }

        return -1;
    }

    /**
	 * Redistributes reference numbers to make space at a specific index
	 * @param nodes - The array to redistribute
	 * @param index - The index we need to make space at
	 * @returns A map of old to new reference numbers
	 */
    public static redistribute(nodes: number[], index: number): Map<number, number> {
        const changes = new Map<number, number>();
        // Our goal is to make space for a new reference number at the index position
        // We don't want to waste time shuffling every reference around, though, so we guarantee a gap that's less than the
        // 'ideal' distribution
        // We could apply a max on the result to prevent it from returning zero, but we'd need ~268 million records to trigger it.
        const minGap = Math.floor(0x7FFFFFFF / nodes.length) >> 3;

        // Pick the ideal reference for this node
        const startRef = Math.floor((index + 1) / (nodes.length + 3) * 0x7FFFFFFF);

        // Move left, shifting the references as needed
        for (let Left = index - 1; Left >= 0; Left--) {
            const ref = nodes[Left];

            if (ref === -1) {
                continue;
            }

            const ideal = startRef - minGap * (index - Left);

            if (ref < ideal) {
                break;
            } // We can abort early, this reference is already lower

            changes.set(ref, nodes[Left] = ideal);
        }

        // Now repeat on the right
        for (let Right = index; Right < nodes.length; Right++) {
            const ref = nodes[Right];

            if (ref === -1) {
                continue;
            }

            const ideal = startRef + minGap * (Right - index + 1);

            if (ref > ideal) {
                break;
            } // We can abort early, this reference is already higher

            changes.set(ref, nodes[Right] = ideal);
        }

        // All done. Return the set of changes so the references in the table can be updated
        return changes;
    }

    public static apply(nodes: number[], changes: Map<number, number>): void {
        // Our references have changed, so reallocate them
        for (let Index = 0; Index < nodes.length; Index++) {
            const newRef = changes.get(nodes[Index]);

            if (newRef !== undefined) {
                nodes[Index] = newRef;
            }
        }
    }

    /**
	 * Inserts a new record at both the left and right indexes
	 * @param leftIndex - The left index of the new record
	 * @param rightIndex - The right index of the new record
	 * @remarks O(Log(N)+Log(M)) where N and M are left and right lengths, plus array update
	 */
    add(leftIndex: number | undefined, rightIndex: number | undefined): void {
        if (leftIndex === undefined && rightIndex === undefined) {
            return; // Nothing to add
        }

        if (leftIndex === undefined) {
            rightIndex = <number>rightIndex;

            if (rightIndex > this.rtoref.length) {
                throw new RangeError('Invalid right index');
            }

            // Row on the right, none on the left
            this.rtoref.splice(rightIndex, 0, -1);
            this.reftor.splice(rightIndex, 0, -1);

            return;
        }

        if (rightIndex === undefined) {
            leftIndex = <number>leftIndex;

            if (leftIndex > this.ltoref.length) {
                throw new RangeError('Invalid left index');
            }

            // Row on the left, none on the right
            this.ltoref.splice(leftIndex, 0, -1);
            this.reftol.splice(leftIndex, 0, -1);

            return;
        }

        if (leftIndex > this.ltoref.length || leftIndex < 0) {
            throw new RangeError('Invalid left index');
        }

        if (rightIndex > this.rtoref.length || rightIndex < 0) {
            throw new RangeError('Invalid right index');
        }

        // Calculate and create a reference number for the right index
        let lref = RevRecordRowIndexMap.insert(this.reftor, rightIndex);

        if (lref === -1) {
            // Reallocate space in the index references
            const Changes = RevRecordRowIndexMap.redistribute(this.reftor, rightIndex);
            RevRecordRowIndexMap.apply(this.ltoref, Changes);

            // Try again
            lref = RevRecordRowIndexMap.insert(this.reftor, rightIndex);
        }

        this.ltoref.splice(leftIndex, 0, lref);

        // Now create a reference back
        let rref = RevRecordRowIndexMap.insert(this.reftol, leftIndex);

        if (rref === -1) {
            // Reallocate space in the index references
            const Changes = RevRecordRowIndexMap.redistribute(this.reftol, leftIndex);
            RevRecordRowIndexMap.apply(this.rtoref, Changes);

            rref = RevRecordRowIndexMap.insert(this.reftol, leftIndex);
        }

        this.rtoref.splice(rightIndex, 0, rref);
    }

    /** Clears the index */
    clear(): void {
        this.ltoref = [];
        this.reftor = [];

        this.rtoref = [];
        this.reftol = [];
    }

    /**
	 * Retrieves the left index of a record
	 * @param rightIndex - The right index of the record
	 * @remarks O(Log(N)) where N is the right length, worst O(N + Log(M)) where N and M are the left and right lengths
	 */
    getLeftIndex(rightIndex: number): number | undefined {
        const ref = this.rtoref[rightIndex];

        if (ref === undefined) {
            throw new RangeError(`Index is invalid: rightIndex: ${rightIndex}`);
        }

        if (ref === -1) {
            return undefined;
        }

        return RevRecordRowIndexMap.search(this.reftol, ref);
    }

    /**
	 * Find the nearest valid left index to the left index
	 * @param leftIndex -
	 * @remarks Approximately O(Log(N)) where N is the left length, worst O(Log(N) + M) where N and M are the left and right lengths
	 */
    getNearestLeftIndex(rightIndex: number): number {
        if (rightIndex >= this.rtoref.length) {
            return this.reftol.length;
        }

        if (this.reftol.length === 0) {
            return 0;
        }

        let ref = this.rtoref[rightIndex];

        if (ref !== -1) {
            return RevRecordRowIndexMap.search(this.reftol, ref);
        } // Insert below

        let innerIndex = rightIndex;

        while (ref === -1 && innerIndex > 0) {
            ref = this.rtoref[--innerIndex];
        }

        if (ref !== -1) {
            return RevRecordRowIndexMap.search(this.reftol, ref) + 1;
        } // Insert above

        innerIndex = rightIndex;

        while (ref === -1 && innerIndex < this.rtoref.length - 1) {
            ref = this.rtoref[++innerIndex];
        }

        if (ref === -1) {
            return 0; // There are no left record indexes
        }

        return RevRecordRowIndexMap.search(this.reftol, ref); // Insert below
    }

    /**
	 * Find the nearest valid right index to the left index
	 * @param leftIndex -
	 * @remarks Approximately O(Log(N)) where N is the left length
	 */
    getNearestRightIndex(leftIndex: number): number {
        if (leftIndex >= this.ltoref.length) {
            return this.reftor.length;
        }

        if (this.reftor.length === 0) {
            return 0;
        }

        let ref = this.ltoref[leftIndex];

        if (ref !== -1) {
            return RevRecordRowIndexMap.search(this.reftor, ref);
        } // Insert below

        let innerIndex = leftIndex;

        while (ref === -1 && innerIndex > 0) {
            ref = this.ltoref[--innerIndex];
        }

        if (ref !== -1) {
            return RevRecordRowIndexMap.search(this.reftor, ref) + 1;
        } // Insert above

        innerIndex = leftIndex;

        while (ref === -1 && innerIndex < this.ltoref.length - 1) {
            ref = this.ltoref[++innerIndex];
        }

        if (ref === -1) {
            return 0; // There are no right record indexes
        }

        return RevRecordRowIndexMap.search(this.reftor, ref); // Insert below
    }

    /**
	 * Retrieves the right index of a record
	 * @param leftIndex - The left index of the record
	 * @remarks O(Log(N)) where N is the right length
	 */
    getRightIndex(leftIndex: number): number | undefined {
        const ref = this.ltoref[leftIndex];

        if (ref === undefined) {
            throw new RangeError('Index is invalid');
        }

        if (ref === -1) {
            return undefined;
        }

        return RevRecordRowIndexMap.search(this.reftor, ref);
    }

    /**
	 * Efficiently repopulates the mappings as if left and right indexes are one-to-one (no relocations)
	 * @param length - The number of records to map
	 * @remarks O(N) where N is the length
	 */
    oneToOne(length: number): void {
        if (this.ltoref.length !== 0 || this.rtoref.length !== 0) {
            throw new RevRecordRowError('RRIMOTO34443', 'Invalid operation, index must be empty');
        }

        const minGap = Math.floor(0x7FFFFFFF / (length + 2));

        for (let Index = 0; Index < length; Index++) {
            const ref = (Index + 1) * minGap;

            this.ltoref.push(ref);
        }

        // Copy the array we just populated
        this.reftor = this.ltoref.slice();
        this.rtoref = this.ltoref.slice();
        this.reftol = this.ltoref.slice();
    }

    /**
	 * Replace the index with mappings for the given records
	 * @param left - The records in their left positions
	 * @param right - The records in the right positions
	 * @remarks O(N Log(M)) where N is the left length, and M is the right
	 */
    populate<T>(left: readonly T[], right: readonly T[]): void {
        if (left.length === 0 && right.length === 0) {
            return;
        }

        if (left.length === 0) {
            this.ltoref = [];
            this.reftor = new Array(right.length).fill(-1);
            this.rtoref = new Array(right.length).fill(-1);
            this.reftol = [];

            return;
        }

        if (right.length === 0) {
            this.ltoref = new Array(left.length).fill(-1);
            this.reftor = [];
            this.rtoref = [];
            this.reftol = new Array(left.length).fill(-1);

            return;
        }

        const LeftToRight = new Map<T, number>();

        // Map the left objects to their right values, so we can rapidly look up the location for a record
        for (let Index = 0; Index < right.length; Index++) {
            LeftToRight.set(right[Index], Index);
        }

        // Generate an even spread on both sides
        const leftGap = Math.floor(0x7FFFFFFF / (left.length + 2));
        const rightGap = Math.floor(0x7FFFFFFF / (right.length + 2));

        // Pre-fill the right with -1
        // Easier than scanning for records on the right that aren't on the left
        this.ltoref = new Array(left.length);
        this.reftor = new Array(right.length).fill(-1);
        this.reftol = new Array(left.length);
        this.rtoref = new Array(right.length).fill(-1);

        // Match all the values on the left into the right
        for (let leftIndex = 0; leftIndex < left.length; leftIndex++) {
            const rightIndex = LeftToRight.get(left[leftIndex]);

            if (rightIndex === undefined) {
                // No match, write an empty ref
                this.ltoref[leftIndex] = -1;
                this.reftol[leftIndex] = -1;

                continue;
            }

            const lref = leftGap * (leftIndex + 1);
            const rref = rightGap * (rightIndex + 1);

            this.ltoref[leftIndex] = rref;
            this.reftor[rightIndex] = rref;

            this.rtoref[rightIndex] = lref;
            this.reftol[leftIndex] = lref;
        }
    }

    /**
	 * Validates and removes a record given both left and right indexes
	 * @param leftIndex - The left index of the record to remove
	 * @param rightIndex - The right index of the record to remove
	 * @remarks O(1), plus array update. Both left and right indexes must correspond
	 * @throws Error when the left and right indexes do not match the same record
	 */
    remove(leftIndex: number | undefined, rightIndex: number | undefined): void {
        if (leftIndex === undefined && rightIndex === undefined) {
            return;
        }

        if (leftIndex === undefined) {
            rightIndex = <number>rightIndex;

            if (this.rtoref[rightIndex] !== -1) {
                throw new RangeError('Left index is invalid');
            }

            this.reftor.splice(rightIndex, 1);
            this.rtoref.splice(rightIndex, 1);

            return;
        }

        if (rightIndex === undefined) {
            leftIndex = <number>leftIndex;

            if (this.ltoref[leftIndex] !== -1) {
                throw new RangeError('Right index is invalid');
            }

            this.ltoref.splice(leftIndex, 1);
            this.reftol.splice(leftIndex, 1);

            return;
        }

        const lref = this.ltoref[leftIndex];
        const rref = this.rtoref[rightIndex];

        if (lref === undefined || rref === undefined) {
            throw new RangeError('Index is invalid');
        }

        if (this.reftol[leftIndex] !== rref) {
            throw new RevRecordRowError('RRIMRR69994', 'Right-to-Left is invalid');
        }

        if (this.reftor[rightIndex] !== lref) {
            throw new RevRecordRowError('RRIMRL69994', 'Left-to-Right is invalid');
        }

        this.ltoref.splice(leftIndex, 1);
        this.reftor.splice(rightIndex, 1);
        this.rtoref.splice(rightIndex, 1);
        this.reftol.splice(leftIndex, 1);
    }

    /**
	 * Removes a record based on the left index
	 * @param leftIndex - The left index of the record to remove
	 * @remarks O(Log(N)) where N is the right length, plus array update
	 */
    removeLeft(leftIndex: number): number | undefined {
        const ref = this.ltoref[leftIndex];

        if (ref === undefined) {
            throw new RangeError('Index is invalid');
        }

        this.reftol.splice(leftIndex, 1);
        this.ltoref.splice(leftIndex, 1);

        if (ref === -1) {
            return undefined;
        }

        const rightIndex = RevRecordRowIndexMap.search(this.reftor, ref);

        this.reftor.splice(rightIndex, 1);
        this.rtoref.splice(rightIndex, 1);

        return rightIndex;
    }

    /**
	 * Removes a record based on the right index
	 * @param rightIndex - The right index of the record to remove
	 * @remarks O(Log(N)) where N is the left length, plus array update
	 */
    removeRight(rightIndex: number): number | undefined {
        const ref = this.rtoref[rightIndex];

        if (ref === undefined) {
            throw new RangeError('Index is invalid');
        }

        this.reftor.splice(rightIndex, 1);
        this.rtoref.splice(rightIndex, 1);

        if (ref === -1) {
            return undefined;
        }

        const leftIndex = RevRecordRowIndexMap.search(this.reftol, ref);

        this.ltoref.splice(leftIndex, 1);
        this.reftol.splice(leftIndex, 1);

        return leftIndex;
    }

    /**
     * Removes all records based on the left and right indexes given
     * @param left -
     * @param right -
     */
    removeAll(left: (number | undefined)[], right: (number | undefined)[]): void {
        if (left.length != right.length) {
            throw new RangeError('Left indexes do not match right indexes');
        }

        // Validate removals
        for (let Index = 0; Index < left.length; Index++) {
            const leftIndex = left[Index];
            const rightIndex = right[Index];

            if (leftIndex === undefined) {
                if (rightIndex === undefined || this.rtoref[rightIndex] !== -1) {
                    throw new RangeError('Left index is invalid');
                }
            } else if (rightIndex === undefined) {
                if (this.ltoref[leftIndex] !== -1) {
                    throw new RangeError('Right index is invalid');
                }
            } else {
                if (this.ltoref[leftIndex] !== this.reftor[rightIndex]) {
                    throw new RangeError('Left-to-Right is invalid');
                }

                if (this.rtoref[rightIndex] !== this.reftol[leftIndex]) {
                    throw new RangeError('Right-to-Left is invalid');
                }
            }
        }

        // Remove in bulk
        for (const leftIndex of (<number[]>Array.from(left).filter(value => value !== undefined)).sort((l, r) => r - l)) {
            this.ltoref.splice(leftIndex, 1);
            this.reftol.splice(leftIndex, 1);
        }

        for (const rightIndex of (<number[]>Array.from(right).filter(value => value !== undefined)).sort((l, r) => r - l)) {
            this.rtoref.splice(rightIndex, 1);
            this.reftor.splice(rightIndex, 1);
        }
    }

    /**
	 * The right index of the record may have changed, update it
	 * @param leftIndex - The left index of the record to update
	 * @param rightIndex - The new right index to apply
	 * @returns The old right index of the record
	 * @remarks O(Log(N)+Log(M)) where N and M are left and right lengths. The right index should be the location before the
     * insert is performed
	 */
    updateLeft(leftIndex: number, rightIndex: number | null): number | null {
        const ref = this.ltoref[leftIndex];
        let oldIndex = -1;
        let rref: number;

        if (ref === undefined) {
            throw new RevRecordRowError('RRIMULU16773', 'Index is invalid');
        }

        if (ref === -1) {
            if (rightIndex === null) {
                return null;
            }

            // We don't have a previous right index, so we need to allocate a right reference
            this.reftol.splice(leftIndex, 1);

            rref = RevRecordRowIndexMap.insert(this.reftol, leftIndex);

            if (rref === -1) {
                // Reallocate space in the index references
                const Changes = RevRecordRowIndexMap.redistribute(this.reftol, leftIndex);
                RevRecordRowIndexMap.apply(this.rtoref, Changes);

                rref = RevRecordRowIndexMap.insert(this.reftol, leftIndex);
            }
        } else {
            oldIndex = RevRecordRowIndexMap.search(this.reftor, ref);

            if (rightIndex === null) {
                this.ltoref[leftIndex] = -1;
                this.reftol[leftIndex] = -1;

                this.reftor.splice(oldIndex, 1);
                this.rtoref.splice(oldIndex, 1);

                return oldIndex;
            }

            if (rightIndex > oldIndex) {
                rightIndex--;
            }

            if (rightIndex === oldIndex) {
                return oldIndex;
            } // Record hasn't moved

            // Remove the old left-to-right reference, and allocate a new one
            this.reftor.splice(oldIndex, 1);

            // Now we can simply remove the old right-to-left reference, and insert the new one
            rref = this.rtoref[oldIndex];

            this.rtoref.splice(oldIndex, 1);
        }

        let lref = RevRecordRowIndexMap.insert(this.reftor, rightIndex);

        if (lref === -1) {
            // Reallocate space in the index references
            const Changes = RevRecordRowIndexMap.redistribute(this.reftor, rightIndex);
            RevRecordRowIndexMap.apply(this.ltoref, Changes);

            // Try again
            lref = RevRecordRowIndexMap.insert(this.reftor, rightIndex);
        }

        // Replace our left reference
        this.ltoref[leftIndex] = lref;

        this.rtoref.splice(rightIndex, 0, rref);

        if (this.ltoref.length !== this.reftol.length) {
            throw new RevRecordRowError('RRIMULL16773', 'Inconsistent');
        }

        if (this.rtoref.length !== this.reftor.length) {
            throw new RevRecordRowError('RRIMULR16773', 'Inconsistent');
        }

        return oldIndex;
    }

    /**
	 * The left index of the record may have changed, update it
	 * @param leftIndex - The new left index to apply
	 * @param rightIndex - The right index of the record to update
	 * @returns The old left index of the record
	 * @remarks O(Log(N)+Log(M)) where N and M are left and right lengths. The left index should be the location before
     * the insert is performed
	 */
    updateRight(leftIndex: number | null, rightIndex: number): number | null {
        const ref = this.rtoref[rightIndex];
        let oldIndex = -1;
        let lref: number;

        if (ref === undefined) {
            throw new RevRecordRowError('RRIMURU16774', 'Index is invalid');
        }

        if (ref === -1) {
            if (leftIndex === null) {
                return null;
            }

            // We don't have a previous left index, so we need to allocate a left reference
            this.reftor.splice(leftIndex, 1);

            lref = RevRecordRowIndexMap.insert(this.reftor, rightIndex);

            if (lref === -1) {
                // Reallocate space in the index references
                const Changes = RevRecordRowIndexMap.redistribute(this.reftor, rightIndex);
                RevRecordRowIndexMap.apply(this.ltoref, Changes);

                // Try again
                lref = RevRecordRowIndexMap.insert(this.reftor, rightIndex);
            }
        } else {
            oldIndex = RevRecordRowIndexMap.search(this.reftol, ref);

            if (leftIndex === null) {
                this.rtoref[rightIndex] = -1;
                this.reftor[rightIndex] = -1;

                this.reftol.splice(oldIndex, 1);
                this.ltoref.splice(oldIndex, 1);

                return oldIndex;
            }

            if (leftIndex > oldIndex) {
                leftIndex--;
            }

            if (leftIndex === oldIndex) {
                return oldIndex;
            } // Record hasn't moved

            // Remove the old right-to-left reference, and allocate a new one
            this.reftol.splice(oldIndex, 1);

            // Now we can simply remove the old left-to-right reference, and insert the new one
            lref = this.ltoref[oldIndex];

            this.ltoref.splice(oldIndex, 1);
        }

        let rref = RevRecordRowIndexMap.insert(this.reftol, leftIndex);

        if (rref === -1) {
            // Reallocate space in the index references
            const Changes = RevRecordRowIndexMap.redistribute(this.reftol, leftIndex);
            RevRecordRowIndexMap.apply(this.rtoref, Changes);

            // Try again
            rref = RevRecordRowIndexMap.insert(this.reftol, leftIndex);
        }

        // Replace our right reference
        this.rtoref[rightIndex] = rref;

        this.ltoref.splice(leftIndex, 0, lref);

        return oldIndex;
    }

    verify(): void {
        const RightRefs = new Map<number, number>();

        for (let Index = 0; Index < this.reftor.length; Index++) {
            const lref = this.reftor[Index];

            if (lref !== -1) {
                RightRefs.set(lref, Index);
            }
        }

        const LeftToRight = new Map<number, number>();

        for (let Index = 0; Index < this.ltoref.length; Index++) {
            const lref = this.ltoref[Index];

            if (lref != -1) {
                const rightIndex = RightRefs.get(lref);

                if (rightIndex === undefined) {
                    throw new RevRecordRowError('RRIMVU87269', 'Mismatch');
                }

                LeftToRight.set(Index, rightIndex);
            }
        }

        for (const [left, right] of LeftToRight) {
            if (this.rtoref[right] != this.reftol[left]) {
                throw new RevRecordRowError('RRIMVL87269', 'Mismatch');
            }
        }

        const LeftRefs = new Map<number, number>();

        for (let Index = 0; Index < this.reftol.length; Index++) {
            const rref = this.reftol[Index];

            if (rref !== -1) {
                LeftRefs.set(rref, Index);
            }
        }

        const RightToLeft = new Map<number, number>();

        for (let Index = 0; Index < this.rtoref.length; Index++) {
            const rref = this.rtoref[Index];

            if (rref != -1) {
                const leftIndex = LeftRefs.get(rref);

                if (leftIndex === undefined) {
                    throw new RevRecordRowError('RRIMVG87269', 'Mismatch');
                }

                RightToLeft.set(Index, leftIndex);
            }
        }

        for (const [right, left] of RightToLeft) {
            if (this.reftor[right] != this.ltoref[left]) {
                throw new RevRecordRowError('RRIMVR87269', 'Mismatch');
            }
        }

    }
}
