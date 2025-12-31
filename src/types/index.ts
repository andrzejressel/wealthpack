// Export your type definitions here
// Example:
// export interface AddonConfig {
//   enabled: boolean;
//   settings: Record<string, any>;
// }
//
// export type AddonPageProps = {
//   onSettingsChange: (settings: Record<string, any>) => void;
// };

import { polishBondsReader } from "../service/transaction-log/transaction-reader";
import { mBankReader } from "../service/banks/mbank/mbank-reader";
import { bossaReader } from "../service/brokers/bossa/bossa-reader";

export type ActivityType = "BUY" | "SELL" | "DEPOSIT" | "WITHDRAWAL" | "ADD_HOLDING" | "REMOVE_HOLDING";

export interface Transaction {
    id?: string;
    activityType: ActivityType;
    activityDate: string | Date;
    assetId: string;
    quantity?: number;
    unitPrice?: number;
    amount?: number;
    currency?: string;
    fee?: number;
    isDraft: boolean;
    comment?: string;
}

export enum SupportedService {
    POLISH_BONDS = "POLISH_BONDS",
    MBANK = "MBANK",
    BOSSA = "BOSSA",
}

export function stringToSupportedService(value: string): SupportedService {
    switch (value) {
        case "POLISH_BONDS":
            return SupportedService.POLISH_BONDS;
        case "MBANK":
            return SupportedService.MBANK;
        case "BOSSA":
            return SupportedService.BOSSA;
        default:
            throw new Error(`Unsupported service: ${value}`);
    }
}

export function supportedServiceToDescription(value: SupportedService): string {
    switch (value) {
        case SupportedService.POLISH_BONDS:
            return "Polish Bonds";
        case SupportedService.MBANK:
            return "mBank";
        case SupportedService.BOSSA:
            return "BOSSA/DM BOŚ";
    }
}

export function getServiceImplementation(value: SupportedService): Reader {
    switch (value) {
        case SupportedService.POLISH_BONDS:
            return polishBondsReader;
        case SupportedService.MBANK:
            return mBankReader;
        case SupportedService.BOSSA:
            return bossaReader;
    }
}

export interface Reader {
    readFile(fileData: ArrayBuffer | Uint8Array): Transaction[];
}

export type Services = { [key in keyof typeof SupportedService]: Reader };
