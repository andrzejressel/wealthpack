import {describe, it, expect} from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {polishBondsReader} from './transaction-reader'

describe("transaction-reader", () => {

    const loadBondsFile = (): Uint8Array => {
        const filePath = path.join(__dirname, '__test-assets__/HistoriaDyspozycji.xls');
        const buffer = fs.readFileSync(filePath);
        return new Uint8Array(buffer);
    };

    it('should generate transaction log', () => {
        const transaction = polishBondsReader.readFile(loadBondsFile());
        expect(transaction).toMatchSnapshot();
    });

})
