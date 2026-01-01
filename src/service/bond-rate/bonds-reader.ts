import * as XLSX from "xlsx";

export interface BondId {
    value: string;
}

export class Bond {
    id: BondId;
    initialDate: Date;
    saleEnd: Date;
    buyoutDate: Date;
    private values: number[] | null = null;
    private valueGenerator: ValueGenerator;

    constructor(id: BondId, initialDate: Date, saleEnd: Date, buyoutDate: Date, generator: ValueGenerator) {
        this.id = id;
        this.initialDate = initialDate;
        this.saleEnd = saleEnd;
        this.buyoutDate = buyoutDate;
        this.valueGenerator = generator;
    }
    
    getValues(): number[] {
        if (this.values === null) {
            this.values = this.valueGenerator.calculateDailyBondValues(this.initialDate);
        }
        return this.values;
    }
}

export interface AllBonds {
    edo: Map<string, Bond>;
    rod: Map<string, Bond>;
}

class ValueGenerator {
    private yearlyReturns: number[] = [];
    private initialValue: number;

    constructor(initialValue: number) {
        this.initialValue = initialValue;
    }

    addYearlyReturn(returnRate: number): void {
        this.yearlyReturns.push(returnRate);
    }

    /**
     * Calculates bond values for every single day starting from the given date
     * Returns a list of bond values with daily compounding interest
     */
    calculateDailyBondValues(startDate: Date): number[] {
        const values: number[] = [this.initialValue];
        let currentValue = this.initialValue;

        for (let i = 0; i < this.yearlyReturns.length; i++) {
            const annualReturnRate = this.yearlyReturns[i];
            const yearStartDate = new Date(startDate);
            yearStartDate.setFullYear(startDate.getFullYear() + i);

            const yearEndDate = new Date(yearStartDate);
            yearEndDate.setFullYear(yearStartDate.getFullYear() + 1);

            const daysInYear = Math.floor((yearEndDate.getTime() - yearStartDate.getTime()) / (1000 * 60 * 60 * 24));

            for (let day = 1; day <= daysInYear; day++) {
                const additionalValue = currentValue * (day / daysInYear) * annualReturnRate;
                const todayValue = currentValue + additionalValue;
                values.push(this.twoDecimalPlaces(todayValue));
            }

            currentValue = values[values.length - 1];
        }

        return values;
    }

    private twoDecimalPlaces(value: number): number {
        return Math.round(value * 100) / 100;
    }
}

function extractBondType(workbook: XLSX.WorkBook, bondType: string, bondLengthInYears: number): Map<string, Bond> {
    const bonds = new Map<string, Bond>();

    const worksheet = workbook.Sheets[bondType];
    if (!worksheet) {
        throw new Error(`Failed to get worksheet [${bondType}]`);
    }

    // Convert worksheet to array of arrays
    const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // First two rows are headers, start from row index 2
    for (let rowId = 2; rowId < data.length; rowId++) {
        const row = data[rowId];
        const firstCell = row[0];

        const [, , , saleStart, saleEnd, , , , , ...rates] = row;

        const bondId: BondId = { value: firstCell };

        const buyoutDate = new Date(saleStart);
        buyoutDate.setFullYear(saleStart.getFullYear() + bondLengthInYears);

        const generator = new ValueGenerator(100.0);

        // Extract yearly returns from columns 9 onwards
        for (let i = 0; i < bondLengthInYears; i++) {
            const rate = rates[i];
            if (!rate) {
                continue;
            }
            if (typeof rate !== "number") {
                throw new Error(`Cannot extract yearly return from cell [${rate}], row id: [${rowId}], column: [${i}]`);
            }
            const roundedValue = Math.round(rate * 100000) / 100000;
            generator.addYearlyReturn(roundedValue);
        }

        const bond = new Bond(bondId, saleStart, saleEnd, buyoutDate, generator);

        bonds.set(bondId.value, bond);
    }

    return bonds;
}

export function readBonds(fileData: ArrayBuffer | Uint8Array): AllBonds {
    const workbook = XLSX.read(fileData, { cellDates: true });

    const edo = extractBondType(workbook, "EDO", 10);
    const rod = extractBondType(workbook, "ROD", 12);

    return { edo, rod };
}
