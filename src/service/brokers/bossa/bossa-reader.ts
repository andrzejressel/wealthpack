
import Papa from 'papaparse';
import {Reader, Transaction} from "../../../types";
import isin_to_ticker from "./isin_to_ticker"

type BossaRowNames = 'data' | 'tytuł operacji' | 'szczegóły' | 'kwota';

type BossaCsvRow = Record<BossaRowNames, string>

interface BossaOperation {
    date: string;
    title: string;
    details: string;
    amount: number;
}

export function parsePolishAmount(amountStr: string): number {
    // Format: "-1956,00" or "1956,00" or "-4355,13"
    const normalized = amountStr.trim().replace(',', '.');
    return parseFloat(normalized);
}

function readBossaCsv(fileData: ArrayBuffer | Uint8Array): BossaOperation[] {
    const decoder = new TextDecoder('windows-1250');
    const content = decoder.decode(fileData);

    const parseResult = Papa.parse<BossaCsvRow>(content, {
        delimiter: ';',
        skipEmptyLines: true,
        header: true,
    });

    const operations: BossaOperation[] = [];

    for (const row of parseResult.data) {
        // noinspection JSNonASCIINames
        operations.push({
            date: row.data,
            title: row["tytuł operacji"].trim(),
            details: row["szczegóły"].trim(),
            amount: parsePolishAmount(row.kwota)
        });
    }

    return operations;
}

interface ParsedBuyTransaction {
    assetName: string;
    isin: string;
    quantity: number;
    unitPrice: number;
    transactionId: string;
}

function parseBuyDetails(details: string): ParsedBuyTransaction | null {
    // Format: "Vanguard S&P 500 UCITS ETF acc (IE00BFMXXD54) 10 x 400.1128 PLN nr ZXXXXXXXXXXX"
    const match = details.match(/^(.+?)\s+\(([A-Z0-9]{12})\)\s+(\d+)\s+x\s+([\d.]+)\s+PLN\s+nr\s+(\S+)$/);
    if (!match) {
        return null;
    }

    return {
        assetName: match[1],
        isin: match[2],
        quantity: parseInt(match[3], 10),
        unitPrice: parseFloat(match[4]),
        transactionId: match[5]
    };
}

function convertToTransactions(operations: BossaOperation[]): Transaction[] {
    const transactions: Transaction[] = [];

    for (const op of operations) {
        if (op.title === 'Przelew do DM BOŚ') {
            // Deposit to brokerage account
            transactions.push({
                activityDate: op.date,
                activityType: 'DEPOSIT',
                assetId: '$CASH-PLN',
                amount: op.amount,
                currency: 'PLN',
                isDraft: false,
                comment: op.title
            });
        } else if (op.title.startsWith('Zwrot nadpłaty - przekroczony limit wpłat na IKE/IKZE')) {
            // Return of overpayment - withdrawal
            transactions.push({
                activityDate: op.date,
                activityType: 'WITHDRAWAL',
                assetId: '$CASH-PLN',
                amount: Math.abs(op.amount),
                currency: 'PLN',
                isDraft: false,
                comment: op.title
            });
        } else if (op.title.startsWith('Rozliczenie transakcji kupna')) {
            // Buy transaction settlement
            const buyDetails = parseBuyDetails(op.details);
            if (!buyDetails) {
                throw new Error(`Failed to parse buy transaction details: [${op.details}]`);
            }
            const ticker = isin_to_ticker.get(buyDetails.isin)
            if (!ticker) {
                throw new Error(`Ticker not found for ISIN: [${buyDetails.isin}]`);
            }
            transactions.push({
                activityDate: op.date,
                activityType: 'BUY',
                assetId: ticker,
                quantity: buyDetails.quantity,
                unitPrice: buyDetails.unitPrice,
                amount: Math.abs(op.amount),
                currency: 'PLN',
                isDraft: false,
                comment: `${buyDetails.assetName} nr ${buyDetails.transactionId}`
            });
        } else {
            throw new Error(`Unsupported operation title: [${op.title}]`);
        }
    }

    return transactions;
}

function readFile(fileData: ArrayBuffer | Uint8Array): Transaction[] {
    const operations = readBossaCsv(fileData);
    return convertToTransactions(operations);
}

export const bossaReader: Reader = {
    readFile
};