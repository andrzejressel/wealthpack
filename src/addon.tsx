import React, { lazy, useState } from "react";
import type { Account, ActivityCreate, AddonContext } from "@wealthfolio/addon-sdk";
import { Button, Card, CardContent, Icons, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@wealthfolio/ui";
import { useQuery } from "@tanstack/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FileDropzone } from "./components/file-dropzone";
import { getServiceImplementation, stringToSupportedService, SupportedService, supportedServiceToDescription } from "./types";
import {PolishBondsPriceSetter} from "./pages/PolishBondsPriceSetter";

async function getAllTransactionIds(ctx: AddonContext, accountId: string): Promise<Set<string>> {
    const activities = await ctx.api.activities.getAll(accountId);
    const transactionIds = new Set<string>();

    for (let activity of activities) {
        if (activity.id) {
            transactionIds.add(activity.id);
        }
    }

    return transactionIds;
}

// const services: Services = {
//     POLISH_BONDS: polishBondsReader,
//     MBANK: mBankReader
// }

function AddonExample({ ctx }: { ctx: AddonContext }) {
    // let [daneFile, setDaneFile] = React.useState<File | null>(null);
    // let [historiaFile, setHistoriaFile] = React.useState<File | null>(null);

    const { data, isLoading, isError, error } = useQuery<Account[], Error>({
        queryKey: ["accounts"],
        queryFn: async () => {
            return await ctx.api.accounts.getAll();
        },
    });

    const [accountId, setAccountId] = useState<string | null>(null);

    const [file, setFile] = useState<File | null>(null);

    const [service, setService] = useState<SupportedService | null>(null);

    async function handleSend() {
        if (!file) {
            alert("Please upload a file");
            return;
        }

        if (!accountId) {
            alert("Please select an account");
            return;
        }

        if (!service) {
            alert("Please select a service");
            return;
        }

        const historiaFileContent = await file.arrayBuffer();

        const existingTransactionIds = await getAllTransactionIds(ctx, accountId);

        const transactions = getServiceImplementation(service).readFile(historiaFileContent);

        const creates: ActivityCreate[] = [];

        for (let transaction of transactions) {
            creates.push({
                ...transaction,
                accountId,
            });
        }

        await ctx.api.activities.saveMany({
            creates: creates,
            deleteIds: Array.from(existingTransactionIds),
        });

        alert(`Imported ${transactions.length} transactions`);
    }

    return (
        <div className="p-6">
            <Card>
                <CardContent className="p-6">
                    <div className="w-48">
                        <div>
                            {isLoading && <div>Loading accounts...</div>}
                            {isError && <div>Error loading accounts: {error.message}</div>}
                            {data && data.length === 0 && <div>No accounts found.</div>}
                            {data && data.length > 0 && (
                                <Select onValueChange={setAccountId}>
                                    <SelectTrigger aria-label="Account">
                                        <SelectValue placeholder="Select an account" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[500px] overflow-y-auto">
                                        {data.map((account) => (
                                            <SelectItem value={account.id} key={account.id}>
                                                {account.name} <span className="text-muted-foreground font-light">({account.currency})</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            <Select onValueChange={(s) => setService(stringToSupportedService(s))}>
                                <SelectTrigger aria-label="Service">
                                    <SelectValue placeholder="Select service" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[500px] overflow-y-auto">
                                    {Object.keys(SupportedService).map((serviceKey) => (
                                        <SelectItem value={serviceKey} key={serviceKey}>
                                            {supportedServiceToDescription(stringToSupportedService(serviceKey))}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <FileDropzone file={file} onFileChange={setFile} />
                            <Button onClick={handleSend} disabled={accountId === null || service === null || file === null}>
                                Import
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
            {/*<EditableTable />*/}
        </div>
    );
}

// noinspection JSUnusedGlobalSymbols
export default function enable(ctx: AddonContext) {
    const queryClient = new QueryClient();

    // Add a sidebar item
    const sidebarItem = ctx.sidebar.addItem({
        id: "wealthpack",
        label: "wealthpack",
        icon: <Icons.Blocks className="h-5 w-5" />,
        route: "/addon/wealthpack",
        order: 100,
    });
    
    const sidebarItemBondPrices = ctx.sidebar.addItem({
        id: "wealthpack-bond-prices",
        label: "Wealthpack Bond Prices",
        icon: <Icons.BarChart className="h-5 w-5" />,
        route: "/addon/wealthpack-bond-prices",
        order: 101,
    });
    
    // Add a route
    const Wrapper = () => (
        <QueryClientProvider client={queryClient}>
            <AddonExample ctx={ctx} />
        </QueryClientProvider>
    );
    ctx.router.add({
        path: "/addon/wealthpack",
        component: lazy(() => Promise.resolve({ default: Wrapper })),
    });
    
    const WrapperBondPrices = () => (
        <QueryClientProvider client={queryClient}>
            <PolishBondsPriceSetter ctx={ctx} />
        </QueryClientProvider>
    );
    ctx.router.add({
        path: "/addon/wealthpack-bond-prices",
        component: lazy(() => Promise.resolve({ default: WrapperBondPrices })),
    });

    // Cleanup on disable
    ctx.onDisable(() => {
        try {
            sidebarItem.remove();
            sidebarItemBondPrices.remove();
        } catch (err) {
            ctx.api.logger.error(`Failed to remove sidebar item: ${err}`);
        }
    });
}
