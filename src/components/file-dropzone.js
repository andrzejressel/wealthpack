import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { Button, Icons } from "@wealthfolio/ui";
export const FileDropzone = ({ file, onFileChange, isLoading = false, accept = "*", isValid = true, error = null, }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };
    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFileChange(e.dataTransfer.files[0]);
        }
    };
    const handleFileInputChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            onFileChange(e.target.files[0]);
        }
    };
    const handleClick = () => {
        if (!file && !isLoading) {
            fileInputRef.current?.click();
        }
    };
    const handleRemoveFile = (e) => {
        e.stopPropagation(); // Prevent triggering the parent div's click handler
        onFileChange(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    // Determine the border and background colors based on state
    const getBorderClasses = () => {
        if (isDragging) {
            return "border-primary bg-primary/5";
        }
        if (file) {
            if (isLoading) {
                return "border-blue-500 bg-blue-50 dark:bg-blue-900/10";
            }
            if (!isValid || error) {
                return "border-red-500 bg-red-50 dark:bg-red-900/10";
            }
            return "border-green-500 bg-green-50 dark:bg-green-900/10";
        }
        return "border-border bg-background/50 hover:bg-background/80 hover:border-muted-foreground/50";
    };
    // Animation variants for icon containers
    const iconContainerVariants = {
        initial: {
            scale: 0.8,
            opacity: 0,
            rotate: -10,
        },
        animate: {
            scale: 1,
            opacity: 1,
            rotate: 0,
            transition: {
                type: "spring",
                stiffness: 260,
                damping: 20,
                duration: 0.5,
            },
        },
        exit: {
            scale: 0.8,
            opacity: 0,
            rotate: 10,
            transition: { duration: 0.3 },
        },
    };
    // Animation variants for icons
    const iconVariants = {
        initial: { scale: 0.6, opacity: 0 },
        animate: {
            scale: 1,
            opacity: 1,
            transition: {
                delay: 0.1,
                type: "spring",
                stiffness: 300,
            },
        },
    };
    return (_jsxs("div", { className: `group relative flex h-full flex-col justify-center rounded-lg border border-dashed p-4 transition-colors ${getBorderClasses()} ${!file && !isLoading ? "cursor-pointer" : ""}`, onDragOver: handleDragOver, onDragLeave: handleDragLeave, onDrop: handleDrop, onClick: handleClick, children: [_jsx("input", { type: "file", ref: fileInputRef, onChange: handleFileInputChange, className: "hidden", accept: accept, disabled: isLoading }), file && !isLoading && (_jsx("div", { className: "bg-background/90 dark:bg-background/95 pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-90", onClick: (e) => e.stopPropagation(), children: _jsx("div", { className: "flex flex-col items-center gap-3", children: _jsxs(Button, { size: "sm", onClick: handleRemoveFile, className: "flex items-center gap-1.5 px-3", children: [_jsx(Icons.Trash, { className: "h-4 w-4" }), _jsx("span", { children: "Remove File" })] }) }) })), _jsxs("div", { className: "flex flex-col items-center justify-center space-y-2", children: [_jsx(AnimatePresence, { mode: "wait", children: isLoading ? (_jsx(motion.div, { variants: iconContainerVariants, initial: "initial", animate: "animate", exit: "exit", className: "flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 shadow-sm dark:bg-blue-900/20", children: _jsx(motion.div, { variants: iconVariants, initial: "initial", animate: "animate", children: _jsx(Icons.Spinner, { className: "h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" }) }) }, "loading")) : file && (!isValid || error) ? (_jsx(motion.div, { variants: iconContainerVariants, initial: "initial", animate: "animate", exit: "exit", className: "flex h-10 w-10 items-center justify-center rounded-full bg-red-100 shadow-sm dark:bg-red-900/20", children: _jsx(motion.div, { variants: iconVariants, initial: "initial", animate: "animate", children: _jsx(Icons.AlertCircle, { className: "h-5 w-5 text-red-600 dark:text-red-400" }) }) }, "error")) : file ? (_jsx(motion.div, { variants: iconContainerVariants, initial: "initial", animate: "animate", exit: "exit", className: "flex h-10 w-10 items-center justify-center rounded-full bg-green-100 shadow-sm dark:bg-green-900/20", children: _jsx(motion.div, { variants: iconVariants, initial: "initial", animate: "animate", children: isValid ? (_jsx(Icons.CheckCircle, { className: "h-5 w-5 text-green-600 dark:text-green-400" })) : (_jsx(Icons.FileText, { className: "h-5 w-5 text-green-600 dark:text-green-400" })) }) }, "file")) : (_jsx(motion.div, { variants: iconContainerVariants, initial: "initial", animate: "animate", exit: "exit", className: "bg-muted flex h-10 w-10 items-center justify-center rounded-full shadow-sm", children: _jsx(motion.div, { variants: iconVariants, initial: "initial", animate: "animate", children: _jsx(Icons.Import, { className: "text-muted-foreground h-5 w-5" }) }) }, "upload")) }), _jsx("div", { className: "space-y-0.5 text-center", children: _jsx(AnimatePresence, { mode: "wait", children: isLoading ? (_jsx(motion.p, { initial: { opacity: 0, y: 5 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -5 }, transition: { duration: 0.2 }, className: "text-xs font-medium", children: "Processing file..." }, "loading-text")) : file && (!isValid || error) ? (_jsxs(motion.div, { initial: { opacity: 0, y: 5 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -5 }, transition: { duration: 0.2 }, className: "space-y-0", children: [_jsx("p", { className: "font-medium text-red-600 dark:text-red-400", children: file.name }), _jsxs("p", { className: "text-xs text-red-500 dark:text-red-400", children: [(file.size / 1024).toFixed(2), " KB"] })] }, "error-info")) : file ? (_jsxs(motion.div, { initial: { opacity: 0, y: 5 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -5 }, transition: { duration: 0.2 }, className: "space-y-0", children: [_jsx("p", { className: "text-xs font-medium", children: file.name }), _jsxs("p", { className: "text-muted-foreground text-xs", children: [(file.size / 1024).toFixed(2), " KB"] })] }, "file-info")) : (_jsx(motion.div, { initial: { opacity: 0, y: 5 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -5 }, transition: { duration: 0.2 }, children: _jsxs("p", { className: "text-xs font-medium", children: [_jsx("span", { className: "text-primary", children: "Click to upload" }), " or drop"] }) }, "upload-text")) }) })] })] }));
};
