import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

interface RowData {
    id: number;
    name: string;
    role: string;
    email: string;
}

export const EditableTable = () => {
    const [data, setData] = useState<RowData[]>([
        { id: 1, name: "Liam Hunter", role: "Portfolio Manager", email: "liam@wealthfolio.app" },
        { id: 2, name: "Olivia Reiss", role: "Risk Analyst", email: "olivia@wealthfolio.app" },
    ]);

    // State for the new row input
    const [newRow, setNewRow] = useState({ name: "", role: "", email: "" });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<RowData>>({});
    const [error, setError] = useState<string | null>(null);

    // Common input styles matching the Dropzone reference aesthetic
    const inputClasses =
        "w-full bg-background border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors placeholder:text-muted-foreground/50";

    const handleNewRowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewRow({ ...newRow, [e.target.name]: e.target.value });
        if (error) setError(null);
    };

    const handleAddRow = () => {
        if (!newRow.name || !newRow.role || !newRow.email) {
            setError("All fields are required to add a new row.");
            return;
        }

        const newEntry = {
            id: Date.now(),
            ...newRow,
        } as RowData;

        setData([...data, newEntry]);
        setNewRow({ name: "", role: "", email: "" });
    };

    const handleEditClick = (row: RowData) => {
        setEditingId(row.id);
        setEditFormData(row);
    };

    const handleSaveClick = (id: number) => {
        const updatedData = data.map((row) => (row.id === id ? { ...row, ...editFormData } : row));
        setData(updatedData as RowData[]);
        setEditingId(null);
    };

    const handleDeleteClick = (id: number) => {
        setData(data.filter((row) => row.id !== id));
    };

    return (
        <div className="w-full rounded-lg border border-border bg-background/50 overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
                    <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    <AnimatePresence initial={false}>
                        {data.map((row) => (
                            <motion.tr
                                key={row.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="hover:bg-muted/30 transition-colors"
                            >
                                {editingId === row.id ? (
                                    <>
                                        <td className="px-4 py-3">
                                            <input
                                                name="name"
                                                value={editFormData.name}
                                                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                                className={inputClasses}
                                                autoFocus
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                name="role"
                                                value={editFormData.role}
                                                onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                                                className={inputClasses}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                name="email"
                                                value={editFormData.email}
                                                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                                className={inputClasses}
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-right space-x-3">
                                            <button
                                                onClick={() => handleSaveClick(row.id)}
                                                className="text-green-600 dark:text-green-400 hover:underline font-medium"
                                            >
                                                Save
                                            </button>
                                            <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground hover:underline">
                                                Cancel
                                            </button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-4 py-3 text-foreground font-medium">{row.name}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{row.role}</td>
                                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{row.email}</td>
                                        {/* CHANGE: Removed opacity classes to make actions always visible */}
                                        <td className="px-4 py-3 text-right space-x-3">
                                            <button onClick={() => handleEditClick(row)} className="text-primary hover:underline font-medium">
                                                Edit
                                            </button>
                                            <button onClick={() => handleDeleteClick(row.id)} className="text-red-600 dark:text-red-400 hover:underline">
                                                Delete
                                            </button>
                                        </td>
                                    </>
                                )}
                            </motion.tr>
                        ))}
                    </AnimatePresence>

                    {/* Add New Row */}
                    <tr className={`bg-primary/5 border-t border-border transition-colors ${error ? "bg-red-50 dark:bg-red-900/10" : ""}`}>
                        <td className="px-4 py-3">
                            <input
                                name="name"
                                placeholder="New Name"
                                value={newRow.name}
                                onChange={handleNewRowChange}
                                className={`${inputClasses} bg-transparent border-transparent focus:bg-background focus:border-primary`}
                            />
                        </td>
                        <td className="px-4 py-3">
                            <input
                                name="role"
                                placeholder="New Role"
                                value={newRow.role}
                                onChange={handleNewRowChange}
                                className={`${inputClasses} bg-transparent border-transparent focus:bg-background focus:border-primary`}
                            />
                        </td>
                        <td className="px-4 py-3">
                            <input
                                name="email"
                                placeholder="New Email"
                                value={newRow.email}
                                onChange={handleNewRowChange}
                                className={`${inputClasses} bg-transparent border-transparent focus:bg-background focus:border-primary`}
                            />
                        </td>
                        <td className="px-4 py-3 text-right">
                            <button
                                onClick={handleAddRow}
                                className="text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-md transition-all shadow-sm"
                            >
                                Add Row
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* Error Message Toast/Indicator */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-red-50 dark:bg-red-900/10 border-t border-red-200 dark:border-red-900/20 px-4 py-2"
                    >
                        <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default EditableTable;
