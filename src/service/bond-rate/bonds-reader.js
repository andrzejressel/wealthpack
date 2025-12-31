import * as XLSX from 'xlsx';
class ValueGenerator {
    constructor(initialValue) {
        this.yearlyReturns = [];
        this.initialValue = initialValue;
    }
    addYearlyReturn(returnRate) {
        this.yearlyReturns.push(returnRate);
    }
    /**
     * Calculates bond values for every single day starting from the given date
     * Returns a list of bond values with daily compounding interest
     */
    calculateDailyBondValues(startDate) {
        const values = [this.initialValue];
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
    twoDecimalPlaces(value) {
        return Math.round(value * 100) / 100;
    }
}
function extractBondType(workbook, bondType, bondLengthInYears) {
    const bonds = new Map();
    const worksheet = workbook.Sheets[bondType];
    if (!worksheet) {
        throw new Error(`Failed to get worksheet [${bondType}]`);
    }
    // Convert worksheet to array of arrays
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    // First two rows are headers, start from row index 2
    for (let rowId = 2; rowId < data.length; rowId++) {
        const row = data[rowId];
        const firstCell = row[0];
        const [, , , saleStart, saleEnd, , , , , ...rates] = row;
        const bondId = { value: firstCell };
        const buyoutDate = new Date(saleStart);
        buyoutDate.setFullYear(saleStart.getFullYear() + bondLengthInYears);
        const generator = new ValueGenerator(100.0);
        // Extract yearly returns from columns 9 onwards
        for (let i = 0; i < bondLengthInYears; i++) {
            const rate = rates[i];
            if (!rate) {
                continue;
            }
            if (typeof rate !== 'number') {
                throw new Error(`Cannot extract yearly return from cell [${rate}], row id: [${rowId}], column: [${i}]`);
            }
            const roundedValue = Math.round(rate * 100000) / 100000;
            generator.addYearlyReturn(roundedValue);
        }
        const bond = {
            id: bondId,
            initialDate: saleStart,
            buyoutDate: buyoutDate,
            saleEnd: saleEnd,
            values: generator.calculateDailyBondValues(saleStart),
        };
        bonds.set(bondId.value, bond);
    }
    return bonds;
}
export function readBonds(fileData) {
    const workbook = XLSX.read(fileData, { cellDates: true });
    const edo = extractBondType(workbook, 'EDO', 10);
    const rod = extractBondType(workbook, 'ROD', 12);
    return { edo, rod };
}
