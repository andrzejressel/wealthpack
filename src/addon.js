import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { lazy, useState } from 'react';
import { Button, Card, CardContent, Icons, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@wealthfolio/ui';
import { useQuery } from "@tanstack/react-query";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FileDropzone } from "./components/file-dropzone";
import { getServiceImplementation, stringToSupportedService, SupportedService, supportedServiceToDescription } from "./types";
async function getAllTransactionIds(ctx, accountId) {
    const activities = await ctx.api.activities.getAll(accountId);
    const transactionIds = new Set();
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
function AddonExample({ ctx }) {
    // let [daneFile, setDaneFile] = React.useState<File | null>(null);
    // let [historiaFile, setHistoriaFile] = React.useState<File | null>(null);
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['accounts'],
        queryFn: async () => {
            return await ctx.api.accounts.getAll();
        }
    });
    const [accountId, setAccountId] = useState(null);
    const [file, setFile] = useState(null);
    const [service, setService] = useState(null);
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
        const creates = [];
        for (let transaction of transactions) {
            creates.push({
                ...transaction,
                accountId,
            });
        }
        await ctx.api.activities.saveMany({
            creates: creates,
            deleteIds: Array.from(existingTransactionIds)
        });
        alert(`Imported ${transactions.length} transactions`);
    }
    return (_jsx("div", { className: "p-6", children: _jsx(Card, { children: _jsx(CardContent, { className: "p-6", children: _jsx("div", { className: "w-48", children: _jsxs("div", { children: [isLoading && _jsx("div", { children: "Loading accounts..." }), isError && _jsxs("div", { children: ["Error loading accounts: ", error.message] }), data && data.length === 0 && _jsx("div", { children: "No accounts found." }), data && data.length > 0 &&
                                _jsxs(Select, { onValueChange: setAccountId, children: [_jsx(SelectTrigger, { "aria-label": "Account", children: _jsx(SelectValue, { placeholder: "Select an account" }) }), _jsx(SelectContent, { className: "max-h-[500px] overflow-y-auto", children: data.map((account) => (_jsxs(SelectItem, { value: account.id, children: [account.name, " ", _jsxs("span", { className: "text-muted-foreground font-light", children: ["(", account.currency, ")"] })] }, account.id))) })] }), _jsxs(Select, { onValueChange: (s) => setService(stringToSupportedService(s)), children: [_jsx(SelectTrigger, { "aria-label": "Service", children: _jsx(SelectValue, { placeholder: "Select service" }) }), _jsx(SelectContent, { className: "max-h-[500px] overflow-y-auto", children: Object.keys(SupportedService).map((serviceKey) => (_jsx(SelectItem, { value: serviceKey, children: supportedServiceToDescription(stringToSupportedService(serviceKey)) }, serviceKey))) })] }), _jsx(FileDropzone, { file: file, onFileChange: setFile }), _jsx(Button, { onClick: handleSend, disabled: (accountId === null) || (service === null) || (file === null), children: "Import" })] }) }) }) }) }));
}
const queryClient = new QueryClient();
export default function enable(ctx) {
    // Add a sidebar item
    const sidebarItem = ctx.sidebar.addItem({
        id: 'polish-bonds',
        label: 'polish-bonds',
        icon: _jsx(Icons.Blocks, { className: "h-5 w-5" }),
        route: '/addon/polish-bonds',
        order: 100,
    });
    // Add a route
    const Wrapper = () => _jsx(QueryClientProvider, { client: queryClient, children: _jsx(AddonExample, { ctx: ctx }) });
    ctx.router.add({
        path: '/addon/polish-bonds',
        component: lazy(() => Promise.resolve({ default: Wrapper })),
    });
    // Cleanup on disable
    ctx.onDisable(() => {
        try {
            sidebarItem.remove();
        }
        catch (err) {
            ctx.api.logger.error(`Failed to remove sidebar item: ${err}`);
        }
    });
}
