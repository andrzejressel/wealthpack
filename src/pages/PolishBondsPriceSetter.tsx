import {useState, useEffect} from "react";
import {motion} from "motion/react";
import {Card, CardContent, Icons} from "@wealthfolio/ui";
import type {AddonContext, Quote} from "@wealthfolio/addon-sdk";
import {readBonds, type AllBonds, Bond} from "../service/bond-rate/bonds-reader";
import {formatDateISO} from "../lib";

interface PolishBondsPriceSetterProps {
    ctx: AddonContext;
}

enum StepStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    ERROR = "error",
}

interface Step {
    id: string;
    label: string;
    status: StepStatus;
    error?: string;
}

interface QuoteStats {
    totalQuotes: number;
    addedQuotes: number;
}

async function mockDownloadBondsFile(): Promise<ArrayBuffer> {
    const url = "https://www.gov.pl/attachment/b3ec5054-0cc1-45ce-900a-6242e284e65c";
    // Timeout dla pobierania
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
        const res = await fetch(url, {signal: controller.signal});
        if (!res.ok) {
            throw new Error(`Download failed: ${res.status} ${res.statusText}`);
        }
        return await res.arrayBuffer();
    } catch (err) {
        throw new Error(
            `Failed to download bonds file: ${err instanceof Error ? err.message : String(err)}`
        );
    } finally {
        clearTimeout(timeout);
    }
}

async function fetchBondsFromWealthfolio(ctx: AddonContext): Promise<string[]> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Get all accounts and their activities to find Polish bonds
    const accounts = await ctx.api.accounts.getAll();
    const bondSymbols = new Set<string>();

    for (const account of accounts) {
        const activities = await ctx.api.activities.getAll(account.id);
        activities.forEach((activity) => {
            const symbol = activity.assetId;
            if (symbol?.startsWith("EDO") || symbol?.startsWith("ROD")) {
                bondSymbols.add(symbol);
            }
        });
    }

    return Array.from(bondSymbols);
}

export async function updateBondPrices(
    ctx: AddonContext,
    matchedBonds: Map<string, Bond>,
    onProgress?: (added: number, total: number) => void
): Promise<void> {
    // Step 1: Precalculate all quotes to add
    const quotesToAdd: Quote[] = [];

    for (const [symbol, bond] of matchedBonds) {
        // Fetch existing quotes for this symbol to avoid duplicates
        let existingQuotes: Set<string>;
        try {
            const quotes = await ctx.api.quotes.getHistory(symbol);
            // Create a set of existing quote dates for quick lookup (ISO 8601 date format: YYYY-MM-DD)
            existingQuotes = new Set(quotes.map((q) => q.id));
        } catch (error) {
            // If fetching fails, assume no existing quotes
            console.warn(`Could not fetch existing quotes for ${symbol}:`, error);
            existingQuotes = new Set();
        }

        // Get all bond values (daily prices from start to end)
        const values = bond.getValues();

        // Create a quote for each day from initial date to buyout date
        for (let dayIndex = 0; dayIndex < values.length; dayIndex++) {
            const price = values[dayIndex];

            // Calculate the date for this value
            const quoteDate = new Date(bond.initialDate);
            quoteDate.setDate(quoteDate.getDate() + dayIndex);

            // Format date as ISO 8601 (YYYY-MM-DD)
            const quoteDateISO = formatDateISO(quoteDate);

            const id = `${symbol}-${quoteDateISO}`;

            // Skip if quote already exists for this date
            if (existingQuotes.has(id)) {
                continue;
            }

            // Create quote object for the API
            const quote: Quote = {
                id: id,
                createdAt: quoteDate.toISOString(),
                dataSource: "MANUAL",
                timestamp: quoteDate.toISOString(),
                symbol: symbol,
                open: price,
                high: price,
                low: price,
                volume: 0,
                close: price,
                adjclose: price,
                currency: "PLN"
            };

            quotesToAdd.push(quote);
        }
    }

    // Step 2: Add all quotes with progress tracking
    const totalQuotes = quotesToAdd.length;
    for (let i = 0; i < quotesToAdd.length; i++) {
        const quote = quotesToAdd[i];
        await ctx.api.quotes.update(quote.symbol, quote);

        // Report progress
        if (onProgress) {
            onProgress(i + 1, totalQuotes);
        }
    }
}

export const PolishBondsPriceSetter = ({ctx}: PolishBondsPriceSetterProps) => {
    const [steps, setSteps] = useState<Step[]>([
        {id: "download", label: "Downloading bond rates file", status: StepStatus.PENDING},
        {id: "parse", label: "Parsing bond data", status: StepStatus.PENDING},
        {id: "fetch", label: "Fetching your bonds from Wealthfolio", status: StepStatus.PENDING},
        {id: "match", label: "Matching bond prices", status: StepStatus.PENDING},
        {id: "update", label: "Updating prices", status: StepStatus.PENDING},
    ]);

    const [bondData, setBondData] = useState<AllBonds | null>(null);
    const [userBonds, setUserBonds] = useState<string[]>([]);
    const [matchedBonds, setMatchedBonds] = useState<Map<string, Bond>>(new Map());
    const [quoteStats, setQuoteStats] = useState<QuoteStats>({totalQuotes: 0, addedQuotes: 0});

    const updateStepStatus = (stepId: string, status: StepStatus, error?: string) => {
        setSteps((prev) =>
            prev.map((step) =>
                step.id === stepId ? {...step, status, error} : step
            )
        );
    };

    const matchBondPrices = (
        bonds: AllBonds,
        userBondSymbols: string[]
    ): Map<string, Bond> => {
        const matches = new Map<string, Bond>();

        userBondSymbols.forEach((symbol) => {
            const edoBond = bonds.edo.get(symbol);
            const rodBond = bonds.rod.get(symbol);
            const foundBond = edoBond || rodBond;

            if (foundBond) {
                matches.set(symbol, foundBond);
            } else {
                // matches.set(symbol, {matched: false});
            }
        });

        console.log("Matched Bonds:", matches);

        return matches;
    };

    const startProcess = async () => {
        try {
            console.log("Starting Polish Bonds Price Setter process...");
            // Step 1: Download
            updateStepStatus("download", StepStatus.IN_PROGRESS);
            // try {
            const fileData = await mockDownloadBondsFile();
            updateStepStatus("download", StepStatus.COMPLETED);

            // Step 2: Parse
            updateStepStatus("parse", StepStatus.IN_PROGRESS);
            const allBonds = readBonds(fileData);
            setBondData(allBonds);
            updateStepStatus("parse", StepStatus.COMPLETED);

            // Step 3: Fetch user bonds
            updateStepStatus("fetch", StepStatus.IN_PROGRESS);
            const userBondsIds = await fetchBondsFromWealthfolio(ctx);
            setUserBonds(userBondsIds);
            updateStepStatus("fetch", StepStatus.COMPLETED);

            // Step 4: Match
            updateStepStatus("match", StepStatus.IN_PROGRESS);
            const matches = matchBondPrices(allBonds, userBondsIds);
            setMatchedBonds(matches);
            updateStepStatus("match", StepStatus.COMPLETED);

            // Step 5: Update
            updateStepStatus("update", StepStatus.IN_PROGRESS);
            await updateBondPrices(ctx, matches, (added, total) => {
                setQuoteStats({addedQuotes: added, totalQuotes: total});
            });
            updateStepStatus("update", StepStatus.COMPLETED);
        } catch (error) {
            console.error("Error during process:", error);
            const currentInProgress = steps.find((s) => s.status === StepStatus.IN_PROGRESS);
            if (currentInProgress) {
                updateStepStatus(
                    currentInProgress.id,
                    StepStatus.ERROR,
                    error instanceof Error ? error.message : "Unknown error"
                );
            }
        }
    };

    useEffect(() => {
        // noinspection JSIgnoredPromiseFromCall
        startProcess()
    }, []);

    return (
        <div className="p-6">
            <Card>
                <CardContent className="p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-6">
                        Updating Polish Bond Prices
                    </h2>

                    <div className="space-y-3">
                        {steps.map((step, index) => (
                            <motion.div
                                key={step.id}
                                initial={{opacity: 0, x: -20}}
                                animate={{opacity: 1, x: 0}}
                                transition={{delay: index * 0.1}}
                                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                                    step.status === StepStatus.COMPLETED
                                        ? "bg-muted/30 border-border/50"
                                        : step.status === StepStatus.IN_PROGRESS
                                            ? "bg-background border-primary/50"
                                            : step.status === StepStatus.ERROR
                                                ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/20"
                                                : "bg-background/50 border-border/30"
                                }`}
                            >
                                <div className="flex-shrink-0">
                                    {step.status === StepStatus.IN_PROGRESS && (
                                        <Icons.Loader className="h-5 w-5 text-primary animate-spin"/>
                                    )}
                                    {step.status === StepStatus.COMPLETED && (
                                        <Icons.Check className="h-5 w-5 text-green-600 dark:text-green-400"/>
                                    )}
                                    {step.status === StepStatus.ERROR && (
                                        <Icons.AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400"/>
                                    )}
                                    {step.status === StepStatus.PENDING && (
                                        <div className="h-5 w-5 rounded-full border-2 border-border/50"/>
                                    )}
                                </div>

                                <div className="flex-grow">
                                    <p
                                        className={`text-sm font-medium ${
                                            step.status === StepStatus.COMPLETED
                                                ? "text-muted-foreground"
                                                : step.status === StepStatus.IN_PROGRESS
                                                    ? "text-foreground"
                                                    : step.status === StepStatus.ERROR
                                                        ? "text-red-600 dark:text-red-400"
                                                        : "text-muted-foreground/70"
                                        }`}
                                    >
                                        {step.label}
                                    </p>
                                    {step.error && (
                                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                            {step.error}
                                        </p>
                                    )}
                                </div>

                                {step.status === StepStatus.COMPLETED && (
                                    <motion.div
                                        initial={{scale: 0}}
                                        animate={{scale: 1}}
                                        className="flex-shrink-0"
                                    >
                                        <div className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-400"/>
                                    </motion.div>
                                )}
                            </motion.div>
                        ))}
                    </div>

                    {bondData && (
                        <motion.div
                            initial={{opacity: 0, y: 10}}
                            animate={{opacity: 1, y: 0}}
                            className="mt-6 p-4 rounded-lg bg-muted/30 border border-border"
                        >
                            <p className="text-sm text-muted-foreground">
                                Loaded {bondData.edo.size} EDO bonds and {bondData.rod.size} ROD bonds
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Found {userBonds.length} bonds in your portfolio.
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Matched prices for {matchedBonds.size} bonds.
                            </p>
                            {quoteStats.totalQuotes > 0 && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    Adding quotes: {quoteStats.addedQuotes} / {quoteStats.totalQuotes}
                                </p>
                            )}
                        </motion.div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};