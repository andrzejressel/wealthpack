import {describe, it, expect} from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {parseAmount, mBankReader} from './mbank-reader';

describe("mbank-reader", () => {

    // Partial as is initial amount is non-zero
    const loadPartialCsvFile = (): Uint8Array => {
        const filePath = path.join(__dirname, '__test-assets__/lista_operacji_partial.csv');
        const buffer = fs.readFileSync(filePath);
        return new Uint8Array(buffer);
    };

    const loadWholeCsvFile = (): Uint8Array => {
        const filePath = path.join(__dirname, '__test-assets__/lista_operacji_whole.csv');
        const buffer = fs.readFileSync(filePath);
        return new Uint8Array(buffer);
    };
    
    
    it('should parse partial CSV file and return operations', () => {
        const operations = mBankReader.readFile(loadPartialCsvFile());
        expect(operations).toMatchSnapshot();
    });
    
    
    it('should parse whole CSV file and return operations', () => {
        const operations = mBankReader.readFile(loadWholeCsvFile());
        expect(operations).toMatchSnapshot();
    });

    describe('parseAmount', () => {
        
        const data = {
            "1 234,56 PLN": {value: 1234.56, currency: 'PLN'},
            "-1 234,56 PLN": {value: -1234.56, currency: 'PLN'},
            "3,57 PLN": {value: 3.57, currency: 'PLN'},
            "987 654,32 EUR": {value: 987654.32, currency: 'EUR'},
            "-1 234,56 GBP": {value: -1234.56, currency: 'GBP'},
        }
        
        for (const [input, expected] of Object.entries(data)) {
            it(`should parse amount string "${input}"`, () => {
                const result = parseAmount(input);
                expect(result).toEqual(expected);
            });
        }
        
    })
    
});

