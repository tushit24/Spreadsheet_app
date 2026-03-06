"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
    const { user, loading, login, loginAsGuest } = useAuth();
    const router = useRouter();
    const [guestName, setGuestName] = useState("");
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // If already logged in, redirect to dashboard
    useEffect(() => {
        if (!loading && user) {
            router.push("/");
        }
    }, [user, loading, router]);

    const handleGoogleLogin = async () => {
        setIsLoggingIn(true);
        await login();
        setIsLoggingIn(false);
    };

    const handleGuestLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const name = guestName.trim() || "Anonymous User";
        setIsLoggingIn(true);
        await loginAsGuest(name);
        setIsLoggingIn(false);
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="text-gray-500 font-medium">Loading...</div>
            </div>
        );
    }

    return (
        <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg border border-gray-100 text-center">
                <div className="mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                        <span className="text-3xl font-bold text-blue-600">fx</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Collab Sheets</h1>
                    <p className="text-gray-500">Sign in to start collaborating in real-time.</p>
                </div>

                <div className="space-y-6">
                    <button
                        onClick={handleGoogleLogin}
                        disabled={isLoggingIn}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Sign in with Google
                    </button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-white px-2 text-gray-500">Or continue as guest</span>
                        </div>
                    </div>

                    <form onSubmit={handleGuestLogin} className="space-y-3">
                        <input
                            type="text"
                            placeholder="Enter your display name"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                        <button
                            type="submit"
                            disabled={isLoggingIn || !guestName.trim()}
                            className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-white font-medium bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 transition-colors"
                        >
                            Continue as Guest
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
