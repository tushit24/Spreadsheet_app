"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FileSpreadsheet, Trash2 } from "lucide-react";
import { formatRelativeTime, formatDate } from "@/lib/time";
import DeleteSheetModal from "./DeleteSheetModal";
import { deleteSpreadsheet } from "@/lib/firebase";

export interface SheetDoc {
    id: string;
    title?: string;
    name?: string;
    ownerId?: string;
    updatedAt?: unknown;
    lastEditedBy?: { uid: string; name: string; color: string } | null;
    lastEditedAt?: unknown;
}

interface SheetCardProps {
    doc: SheetDoc;
    currentUserId: string;
}

export default function SheetCard({ doc, currentUserId }: SheetCardProps) {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const isOwner = doc.ownerId === currentUserId;
    const title = doc.title || doc.name || "Untitled Spreadsheet";

    const handleDeleteConfirm = async () => {
        setIsDeleting(true);
        try {
            await deleteSpreadsheet(doc.id);
            // Card disappears when Firestore snapshot updates
        } catch (err) {
            console.error("Failed to delete:", err);
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    return (
        <>
            <div
                className="group relative bg-white border border-gray-200 rounded-xl hover:border-green-500 hover:shadow-md transition-all flex flex-col"
                style={{ minHeight: 160 }}
            >
                {/* Delete button — owner only */}
                {isOwner && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowDeleteModal(true);
                        }}
                        className="absolute top-3 right-3 z-10 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete spreadsheet"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}

                {/* Card content — clickable to open */}
                <Link href={`/sheet/${doc.id}`} className="flex-1 flex flex-col p-5">
                    <div className="flex-1">
                        <FileSpreadsheet className="w-8 h-8 text-green-600 mb-3 opacity-80 group-hover:opacity-100 transition-opacity" />
                        <h3 className="font-semibold text-gray-900 line-clamp-2 leading-snug pr-6">
                            {title}
                        </h3>
                    </div>

                    {/* Last edited info */}
                    <div className="mt-3 pt-3 border-t border-gray-50 space-y-0.5">
                        {doc.lastEditedBy ? (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <span
                                    className="w-4 h-4 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
                                    style={{ backgroundColor: doc.lastEditedBy.color ?? "#6b7280", fontSize: 9 }}
                                >
                                    {doc.lastEditedBy.name.charAt(0).toUpperCase()}
                                </span>
                                <span className="truncate">
                                    Last edited by <span className="font-medium text-gray-700">{doc.lastEditedBy.name}</span>
                                </span>
                            </div>
                        ) : null}
                        <p className="text-xs text-gray-400 pl-0.5">
                            {doc.lastEditedAt
                                ? formatRelativeTime(doc.lastEditedAt)
                                : `Opened ${formatDate(doc.updatedAt)}`}
                        </p>
                    </div>
                </Link>
            </div>

            {showDeleteModal && (
                <DeleteSheetModal
                    sheetTitle={title}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => !isDeleting && setShowDeleteModal(false)}
                    isDeleting={isDeleting}
                />
            )}
        </>
    );
}
