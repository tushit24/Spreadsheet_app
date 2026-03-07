"use client";

import React, { useEffect, useRef, useState } from "react";
import { FileSpreadsheet, X } from "lucide-react";

interface CreateSheetModalProps {
    onConfirm: (title: string) => void;
    onCancel: () => void;
}

export default function CreateSheetModal({ onConfirm, onCancel }: CreateSheetModalProps) {
    const [title, setTitle] = useState("Untitled Spreadsheet");
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-select text on mount so user can immediately type
    useEffect(() => {
        inputRef.current?.select();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(title.trim() || "Untitled Spreadsheet");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") onCancel();
    };

    return (
        // Backdrop
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.45)" }}
            onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                            <FileSpreadsheet className="w-5 h-5 text-green-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Create New Spreadsheet</h2>
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600 transition-colors rounded-lg p-1 hover:bg-gray-100"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="px-6 py-5">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Spreadsheet Name
                    </label>
                    <input
                        ref={inputRef}
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Untitled Spreadsheet"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                        maxLength={128}
                        autoFocus
                    />
                    <p className="text-xs text-gray-400 mt-1.5">Press Escape to cancel</p>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors shadow-sm"
                        >
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
