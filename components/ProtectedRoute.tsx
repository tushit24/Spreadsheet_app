"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    // Still figuring out auth state
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="text-gray-500 font-medium animate-pulse">Loading Collab Sheets...</div>
            </div>
        );
    }

    // Not authenticated — router.push("/login") is in-flight; render nothing
    if (!user) return null;

    return <>{children}</>;
}
