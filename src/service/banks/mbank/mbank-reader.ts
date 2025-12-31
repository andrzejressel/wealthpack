import Papa from 'papaparse';
import {Reader, Transaction} from "../../../types";

interface MBankOperation {
    date: string;
    description: string;
    account: string;
    category: string;
    amount: number;
    balanceAfter: number;
    currency: string;
}

export function parseAmount(amountStr: string): { value: number; currency: string } {
    if (amountStr == '-') {
        return { value: 0, currency: '' };
    }
    // Format: "-2,72 PLN" or "14,27 PLN"
    const match = amountStr.trim().match(/^(-?[\d\s]+,\d+)\s+(\w+)$/);
    if (!match) {
        throw new Error(`Invalid amount format: ${amountStr}`);
    }
    const value = parseFloat(match[1].replace(/\s/g, '').replace(',', '.'));
    const currency = match[2];
    return { value, currency };
}

function readMBankCsv(fileData: ArrayBuffer | Uint8Array | string): MBankOperation[] {
    let content: string;
    
    if (typeof fileData === 'string') {
        content = fileData;
    } else {
        const decoder = new TextDecoder('utf-8');
        content = decoder.decode(fileData);
    }

    const lines = content.split(/\r?\n/);
    
    // Find the header line starting with #Data operacji
    const headerIndex = lines.findIndex(line => line.startsWith('#Data operacji'));
    if (headerIndex === -1) {
        throw new Error("Header row not found in CSV file");
    }

    // Get content from header line onwards
    const csvContent = lines.slice(headerIndex).join('\n');

    const parseResult = Papa.parse<string[]>(csvContent, {
        delimiter: ';',
        skipEmptyLines: true,
        header: false
    });

    const operations: MBankOperation[] = [];

    // Skip header row (index 0)
    for (let i = 1; i < parseResult.data.length; i++) {
        const parts = parseResult.data[i];
        if (parts.length < 6) {
            continue;
        }

        const [dateStr, description, account, category, amountStr, balanceStr] = parts;
        
        if (!dateStr || !amountStr) {
            continue;
        }

        const amount = parseAmount(amountStr);
        const balance = parseAmount(balanceStr);

        operations.push({
            date: dateStr,
            description: description.trim(),
            account: account,
            category: category,
            amount: amount.value,
            balanceAfter: balance.value,
            currency: amount.currency
        });
    }

    return operations;
}


function convertToTransactions(operations: MBankOperation[]): Transaction[] {
    return operations.map(op => {
        const activityType = op.amount >= 0 ? 'DEPOSIT' : 'WITHDRAWAL';
        
        return {
            activityDate: op.date,
            activityType: activityType,
            assetId: "$CASH-PLN",
            amount: Math.abs(op.amount),
            currency: op.currency,
            isDraft: false,
            comment: op.description
        } as Transaction;
    });
}

function readFile(fileData: ArrayBuffer | Uint8Array | string): Transaction[] {
    const operations = readMBankCsv(fileData);
    if (operations .length === 0) {
        return [];
    }
    const lastOperation = operations[operations.length - 1];
    let balanceBefore = lastOperation.balanceAfter - lastOperation.amount;
    if (balanceBefore !== 0) {
        const openingBalanceOperation: MBankOperation = {
            date: lastOperation.date,
            description: 'Opening Balance',
            account: lastOperation.account,
            category: 'Balance Adjustment',
            amount: balanceBefore,
            balanceAfter: 0,
            currency: lastOperation.currency
        };
        operations.push(openingBalanceOperation);
    }
    
    return convertToTransactions(operations);
}

export const mBankReader: Reader = {
    readFile
};