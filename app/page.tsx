"use client";

import Link from "next/link";
import { Plus, FileSpreadsheet, LogOut } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { subscribeToUserSheets, createNewSpreadsheet } from "@/lib/firebase";

export default function DashboardPage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [documents, setDocuments] = useState<Array<{ id: string; name?: string; updatedAt?: unknown }>>([]);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        const unsubscribe = subscribeToUserSheets((sheets: Array<{ id: string; name?: string; updatedAt?: unknown }>) => {
            setDocuments(sheets);
        });
        return () => unsubscribe();
    }, []);

    const handleCreateNewSheet = async () => {
        if (!user || isCreating) return;
        setIsCreating(true);
        try {
            const newId = await createNewSpreadsheet(user.uid);
            router.push(`/sheet/${newId}`);
        } catch (error) {
            console.error("Failed to create spreadsheet:", error);
            alert("Failed to create spreadsheet");
            setIsCreating(false);
        }
    };

    const formatDate = (timestamp: unknown) => {
        if (!timestamp) return "Just now";
        if (typeof timestamp === "object" && timestamp !== null && "toDate" in timestamp) {
            const ts = timestamp as { toDate: () => Date };
            return ts.toDate().toLocaleDateString(undefined, {
                year: "numeric", month: "short", day: "numeric",
            });
        }
        return "Recently";
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center">
                <div className="w-full max-w-6xl">
                    <header className="flex justify-between items-center mb-12">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-600 p-2 rounded-lg">
                                <FileSpreadsheet className="text-white w-6 h-6" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900">Spreadsheets</h1>
                        </div>

                        <div className="flex items-center gap-4">
                            {user && (
                                <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium shadow-sm"
                                        style={{ backgroundColor: user.color }}
                                    >
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 hidden sm:block">{user.name}</span>
                                    <button
                                        onClick={logout}
                                        className="text-gray-400 hover:text-red-500 transition-colors ml-2"
                                        title="Sign out"
                                    >
                                        <LogOut className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={handleCreateNewSheet}
                                disabled={isCreating}
                                className={`flex items-center gap-2 text-white px-4 py-2 rounded-lg transition-all font-medium shadow-sm ${isCreating ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                                    }`}
                            >
                                <Plus className={`w-5 h-5 ${isCreating ? "animate-spin" : ""}`} />
                                <span className="hidden sm:inline">
                                    {isCreating ? "Creating..." : "New Blank Spreadsheet"}
                                </span>
                            </button>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {documents.map((doc) => (
                            <Link
                                key={doc.id}
                                href={`/sheet/${doc.id}`}
                                className="group bg-white border border-gray-200 rounded-xl p-5 hover:border-green-500 hover:shadow-md transition-all cursor-pointer flex flex-col h-40"
                            >
                                <div className="flex-1">
                                    <FileSpreadsheet className="w-8 h-8 text-green-600 mb-3 opacity-80 group-hover:opacity-100 transition-opacity" />
                                    <h3 className="font-semibold text-gray-900 line-clamp-1">{doc.name || "Untitled Spreadsheet"}</h3>
                                </div>
                                <div className="text-sm text-gray-500 mt-auto">
                                    Opened {formatDate(doc.updatedAt)}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
