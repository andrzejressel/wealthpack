import * as XLSX from "xlsx";
import {ActivityType, Reader, Transaction} from "../../types";

function readFile(fileData: ArrayBuffer | Uint8Array): Transaction[] {
    const workbook = XLSX.read(fileData);
    if (workbook.SheetNames.length === 0) {
        throw new Error("No sheets found in the workbook");
    }
    if (workbook.SheetNames.length > 1) {
        throw new Error("Multiple sheets found in the workbook");
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!worksheet) {
        throw new Error(`Failed to get worksheet [${workbook.SheetNames[0]}]`);
    }

    const data: any[][] = XLSX.utils.sheet_to_json(worksheet, {header: 1});
    let transactions: Transaction[] = [];

    for (let rowId = 1; rowId < data.length; rowId++) {
        const row = data[rowId];
        let [date, type, bondId, , bondSeries, numberOfBonds, , status] = row;

        if (status !== 'zrealizowana') {
            continue;
        }

        let partialTransaction: { activityType: ActivityType };

        if (type === 'zakup papierów') {
            partialTransaction = {
                activityType: 'ADD_HOLDING',
            };
        } else if (type === 'dyspozycja przedterminowego wykupu') {
            partialTransaction = {
                activityType: 'REMOVE_HOLDING',
            };
        } else {
            continue
        }

        transactions.push({
            ...partialTransaction,
            activityDate: date,
            assetId: bondId,
            quantity: numberOfBonds,
            unitPrice: 100,
            currency: 'PLN',
            isDraft: false
        });
    }

    return transactions;
}

export const polishBondsReader: Reader = {
    readFile
};