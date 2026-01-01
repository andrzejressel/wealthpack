import { describe, it, expect } from "vitest";
import { readBonds } from "./bonds-reader";
import * as fs from "fs";
import * as path from "path";

describe("bonds-reader", () => {
    // Helper function to load the Excel file
    const loadBondsFile = (): Uint8Array => {
        const filePath = path.join(__dirname, "__test-assets__/Dane_dotyczace_obligacji_detalicznych.xls");
        const buffer = fs.readFileSync(filePath);
        return new Uint8Array(buffer);
    };

    describe("readBonds", () => {
        it("should read ROD1235 bond correctly", () => {
            const fileData = loadBondsFile();
            const result = readBonds(fileData);

            const rod1235bond = result.rod.get("ROD1235");
            expect(rod1235bond).toBeDefined();
            rod1235bond!!.getValues()
            expect(rod1235bond).toMatchSnapshot();
        });

        it("should read EDO1224 bond correctly", () => {
            const fileData = loadBondsFile();
            const result = readBonds(fileData);

            const edo1224bond = result.edo.get("EDO1224");
            expect(edo1224bond).toBeDefined();
            edo1224bond!!.getValues()
            expect(edo1224bond).toMatchSnapshot();
        });

        it("should read EDO0125 bond correctly", () => {
            const fileData = loadBondsFile();
            const result = readBonds(fileData);

            const edo0125bond = result.edo.get("EDO0125");
            expect(edo0125bond).toBeDefined();
            edo0125bond!!.getValues()
            expect(edo0125bond).toMatchSnapshot();
        });

        // Dates are dynamically calculated in XLS file, so we need to verify this one separately
        it("should read EDO0535 bond correctly", () => {
            const fileData = loadBondsFile();
            const result = readBonds(fileData);

            const edo0535bond = result.edo.get("EDO0535");
            expect(edo0535bond).toBeDefined();
            edo0535bond!!.getValues()
            expect(edo0535bond).toMatchSnapshot();
        });
    });

    describe("ValueGenerator", () => {
        it("should calculate daily bond values like ROD1235", () => {
            const fileData = loadBondsFile();
            const result = readBonds(fileData);
            const rod1235bond = result.rod.get("ROD1235");

            expect(rod1235bond).toBeDefined();
            rod1235bond!!.getValues()
            expect(rod1235bond).toMatchSnapshot();
        });

        it("should calculate daily bond values with proper rounding", () => {
            const fileData = loadBondsFile();
            const result = readBonds(fileData);
            const bond = result.edo.get("EDO1224");

            expect(bond).toBeDefined();
            if (!bond) {
                throw Error("unreachable");
            }
            // All values should have at most 2 decimal places
            bond.getValues().forEach((value) => {
                const decimalPlaces = (value.toString().split(".")[1] || "").length;
                expect(decimalPlaces).toBeLessThanOrEqual(2);
            });
        });
    });
});
