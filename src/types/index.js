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
export var SupportedService;
(function (SupportedService) {
    SupportedService["POLISH_BONDS"] = "POLISH_BONDS";
    SupportedService["MBANK"] = "MBANK";
    SupportedService["BOSSA"] = "BOSSA";
})(SupportedService || (SupportedService = {}));
export function stringToSupportedService(value) {
    switch (value) {
        case 'POLISH_BONDS':
            return SupportedService.POLISH_BONDS;
        case 'MBANK':
            return SupportedService.MBANK;
        case "BOSSA":
            return SupportedService.BOSSA;
        default:
            throw new Error(`Unsupported service: ${value}`);
    }
}
export function supportedServiceToDescription(value) {
    switch (value) {
        case SupportedService.POLISH_BONDS:
            return "Polish Bonds";
        case SupportedService.MBANK:
            return "mBank";
        case SupportedService.BOSSA:
            return "BOSSA/DM BOŚ";
    }
}
export function getServiceImplementation(value) {
    switch (value) {
        case SupportedService.POLISH_BONDS:
            return polishBondsReader;
        case SupportedService.MBANK:
            return mBankReader;
        case SupportedService.BOSSA:
            return bossaReader;
    }
}
