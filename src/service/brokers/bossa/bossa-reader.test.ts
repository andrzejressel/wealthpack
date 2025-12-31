import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { bossaReader } from "./bossa-reader";

describe("bossa-reader", () => {
    const loadBondsFile = (): Uint8Array => {
        const filePath = path.join(__dirname, "__test-assets__/2025-12-20 21-17-35_historia_finansowa_wszystkie.csv");
        const buffer = fs.readFileSync(filePath);
        return new Uint8Array(buffer);
    };

    it("should generate transaction log", () => {
        const transaction = bossaReader.readFile(loadBondsFile());
        expect(transaction).toMatchSnapshot();
    });
});
