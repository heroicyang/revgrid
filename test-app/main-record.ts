export interface MainRecord {
    id: number;
    name: string;
    type: string;
    color: string;
    age: number;
    receiveDate: Date;
    favoriteFood: string;
    restrictMovement: boolean;
}

export namespace MainRecord {
    export function compareField<K extends keyof MainRecord>(key: K, left: MainRecord, right: MainRecord) {
        switch (key) {
            case 'id': return compareNumber(left.id, right.id);
            case 'name': return compareString(left.name, right.name);
            case 'type': return compareString(left.type, right.type);
            case 'color': return compareString(left.color, right.color);
            case 'age': return compareNumber(left.age, right.age);
            case 'receiveDate': return compareDate(left.receiveDate, right.receiveDate);
            case 'favoriteFood': return compareString(left.favoriteFood, right.favoriteFood);
            case 'restrictMovement': return compareBoolean(left.restrictMovement, right.restrictMovement);
            default:
                const unsupportField: never = key;
                throw new Error(`MainRecord: unsupport compare field: ${unsupportField}`);
        }
    }

    function compareString(left: string, right: string) {
        if (left < right) {
            return -1;
        } else {
            if (left > right) {
                return 1;
            } else {
                return 0;
            }
        }
    }

    function compareNumber(left: number, right: number) {
        if (left < right) {
            return -1;
        } else {
            if (left > right) {
                return 1;
            } else {
                return 0;
            }
        }
    }

    function compareDate(left: Date, right: Date) {
        const leftTime = left.getTime();
        const rightTime = right.getTime();
        if (leftTime < rightTime) {
            return -1;
        } else {
            if (leftTime > rightTime) {
                return 1;
            } else {
                return 0;
            }
        }
    }

    function compareBoolean(left: boolean, right: boolean) {
        if (left === right) {
            return 0;
        } else {
            return left ? 1 : -1;
        }
    }
}
