import { describe, expect, it } from "vitest";
import { formatDateISO } from "./date";

// Tests ensure we always get a plain YYYY-MM-DD string without time or timezone

describe("formatDateISO", () => {
    it("returns YYYY-MM-DD for a UTC date-time", () => {
        const date = new Date("2024-01-02T15:45:30Z");
        expect(formatDateISO(date)).toBe("2024-01-02");
    });

    it("returns YYYY-MM-DD when constructed from local parts", () => {
        // Using local constructor to catch timezone offsets (process.env.TZ is set to UTC in tests)
        const date = new Date(2025, 6, 14, 23, 59, 59);
        expect(formatDateISO(date)).toBe("2025-07-14");
    });

    it("handles DST boundary dates consistently", () => {
        const dstStart = new Date("2024-03-31T23:30:00Z");
        const dstEnd = new Date("2024-10-27T23:30:00Z");
        expect(formatDateISO(dstStart)).toBe("2024-03-31");
        expect(formatDateISO(dstEnd)).toBe("2024-10-27");
    });

    it("never includes time or timezone components", () => {
        const date = new Date("2024-12-05T08:00:00-05:00");
        const formatted = formatDateISO(date);
        expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(formatted.includes("T")).toBe(false);
    });
});

