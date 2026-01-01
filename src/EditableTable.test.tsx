// @vitest-environment jsdom
import "@testing-library/jest-dom"; // Essential for 'toBeInTheDocument'
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { EditableTable } from "./EditableTable"; // Adjust path as needed

// --- Mock Animations ---
// We mock motion/react to avoid animation delays causing test flakiness
vi.mock("motion/react", () => ({
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
        tr: ({ children, className, ...props }: any) => (
            <tr className={className} {...props}>
                {children}
            </tr>
        ),
        div: ({ children, className, ...props }: any) => (
            <div className={className} {...props}>
                {children}
            </div>
        ),
        p: ({ children, className, ...props }: any) => (
            <p className={className} {...props}>
                {children}
            </p>
        ),
    },
}));

describe("EditableTable Component", () => {
    it("renders the table headers and initial data", () => {
        render(<EditableTable />);

        // Check headers
        expect(screen.getByText("Name")).toBeInTheDocument();
        expect(screen.getByText("Role")).toBeInTheDocument();
        expect(screen.getByText("Actions")).toBeInTheDocument();

        // Check initial mock data
        expect(screen.getByText("Liam Hunter")).toBeInTheDocument();
        expect(screen.getByText("Olivia Reiss")).toBeInTheDocument();
    });

    it("adds a new row successfully", async () => {
        const user = userEvent.setup();
        render(<EditableTable />);

        // 1. Fill out the "Add New" inputs (found via placeholder)
        const nameInput = screen.getByPlaceholderText("New Name");
        const roleInput = screen.getByPlaceholderText("New Role");
        const emailInput = screen.getByPlaceholderText("New Email");

        await user.type(nameInput, "New User");
        await user.type(roleInput, "Developer");
        await user.type(emailInput, "test@test.com");

        // 2. Click Add
        const addButton = screen.getByRole("button", { name: /add row/i });
        await user.click(addButton);

        // 3. Verify new user appears in the main list
        expect(screen.getByText("New User")).toBeInTheDocument();
        expect(screen.getByText("Developer")).toBeInTheDocument();

        // 4. Verify inputs are cleared
        expect(nameInput).toHaveValue("");
        expect(roleInput).toHaveValue("");
    });

    it("shows an error when trying to add an empty row", async () => {
        const user = userEvent.setup();
        render(<EditableTable />);

        const addButton = screen.getByRole("button", { name: /add row/i });
        await user.click(addButton);

        // Check for error message
        expect(screen.getByText(/all fields are required/i)).toBeInTheDocument();
    });

    it("clears error when user starts typing", async () => {
        const user = userEvent.setup();
        render(<EditableTable />);

        // Trigger error
        const addButton = screen.getByRole("button", { name: /add row/i });
        await user.click(addButton);
        expect(screen.getByText(/all fields are required/i)).toBeInTheDocument();

        // Type in a field
        const nameInput = screen.getByPlaceholderText("New Name");
        await user.type(nameInput, "A");

        // Error should be gone
        expect(screen.queryByText(/all fields are required/i)).not.toBeInTheDocument();
    });

    it("deletes a row", async () => {
        const user = userEvent.setup();
        render(<EditableTable />);

        const liamRow = screen.getByText("Liam Hunter").closest("tr");
        // Use 'within' to scope the search to just that row
        const deleteButton = within(liamRow as HTMLElement).getByRole("button", { name: /delete/i });

        await user.click(deleteButton);

        expect(screen.queryByText("Liam Hunter")).not.toBeInTheDocument();
    });

    it("edits a row and saves changes", async () => {
        const user = userEvent.setup();
        render(<EditableTable />);

        // 1. Click Edit on "Olivia Reiss"
        const row = screen.getByText("Olivia Reiss").closest("tr");
        const editButton = within(row as HTMLElement).getByRole("button", { name: /edit/i });
        await user.click(editButton);

        // 2. Find inputs (which replace the text) and modify them
        // Note: In edit mode, the component renders inputs with `name="name"`, `name="role"`, etc.
        const nameInput = within(row as HTMLElement).getByDisplayValue("Olivia Reiss");
        await user.clear(nameInput);
        await user.type(nameInput, "Olivia Updated");

        // 3. Click Save
        const saveButton = within(row as HTMLElement).getByRole("button", { name: /save/i });
        await user.click(saveButton);

        // 4. Verify text is updated and inputs are gone
        expect(screen.getByText("Olivia Updated")).toBeInTheDocument();
        expect(screen.queryByDisplayValue("Olivia Updated")).not.toBeInTheDocument(); // Should be text node, not input
    });

    it("cancels editing without saving", async () => {
        const user = userEvent.setup();
        render(<EditableTable />);

        // 1. Click Edit
        const row = screen.getByText("Liam Hunter").closest("tr");
        const editButton = within(row as HTMLElement).getByRole("button", { name: /edit/i });
        await user.click(editButton);

        // 2. Change value
        const nameInput = within(row as HTMLElement).getByDisplayValue("Liam Hunter");
        await user.type(nameInput, " - Changed");

        // 3. Click Cancel
        const cancelButton = within(row as HTMLElement).getByRole("button", { name: /cancel/i });
        await user.click(cancelButton);

        // 4. Verify original value remains
        expect(screen.getByText("Liam Hunter")).toBeInTheDocument();
        expect(screen.queryByText("Liam Hunter - Changed")).not.toBeInTheDocument();
    });
});
