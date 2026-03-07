"use client";

import { Plus, FileSpreadsheet, LogOut } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { subscribeToUserSheets, createNewSpreadsheet } from "@/lib/firebase";
import CreateSheetModal from "@/components/CreateSheetModal";
import SheetCard from "@/components/SheetCard";

interface SheetDoc {
    id: string;
    title?: string;
    name?: string;
    updatedAt?: unknown;
    ownerId?: string;
    lastEditedBy?: { uid: string; name: string; color: string } | null;
    lastEditedAt?: unknown;
}

export default function DashboardPage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [documents, setDocuments] = useState<SheetDoc[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const unsubscribe = subscribeToUserSheets((sheets) => {
            setDocuments(sheets as SheetDoc[]);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleNewSheetClick = () => {
        if (!user || isCreating) return;
        setShowModal(true);
    };

    const handleModalConfirm = async (title: string) => {
        if (!user) return;
        setShowModal(false);
        setIsCreating(true);
        try {
            const newId = await createNewSpreadsheet(user.uid, title);
            router.push(`/sheet/${newId}`);
        } catch (error) {
            console.error("Failed to create spreadsheet:", error);
            alert("Failed to create spreadsheet");
            setIsCreating(false);
        }
    };

    const handleModalCancel = () => setShowModal(false);

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
                                onClick={handleNewSheetClick}
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

                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map((n) => (
                                <div key={n} className="bg-white border border-gray-100 rounded-xl h-40 animate-pulse p-5 flex flex-col">
                                    <div className="w-8 h-8 rounded bg-gray-200 mb-4" />
                                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-auto" />
                                    <div className="border-t border-gray-50 pt-3 mt-4">
                                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-dashed border-gray-300 shadow-sm mx-auto max-w-3xl">
                            <div className="bg-green-50 p-4 rounded-full mb-4">
                                <FileSpreadsheet className="w-10 h-10 text-green-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">No spreadsheets yet</h2>
                            <p className="text-gray-500 mt-2 max-w-md">
                                Create your first spreadsheet to start organizing your data and collaborating with your team.
                            </p>
                            <button
                                onClick={handleNewSheetClick}
                                className="mt-6 flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-lg transition-all font-medium shadow-sm"
                            >
                                <Plus className="w-5 h-5" />
                                Create Spreadsheet
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {documents.map((doc) => (
                                <SheetCard
                                    key={doc.id}
                                    doc={doc}
                                    currentUserId={user?.uid || ""}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Sheet Modal */}
            {showModal && (
                <CreateSheetModal
                    onConfirm={handleModalConfirm}
                    onCancel={handleModalCancel}
                />
            )}
        </ProtectedRoute>
    );
}
