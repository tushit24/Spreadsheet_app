"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserProfile } from "@/types/user";
import { signInWithGoogle, signOutUser, signInAsGuest } from "@/lib/auth";

interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
    login: () => Promise<void>;
    loginAsGuest: (name: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                if (firebaseUser) {
                    // Fetch custom user profile from Firestore
                    const userRef = doc(db, "users", firebaseUser.uid);
                    let userSnap = await getDoc(userRef);

                    // Short retry if profile is still being written immediately after login
                    if (!userSnap.exists()) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                        userSnap = await getDoc(userRef);
                    }

                    if (userSnap.exists()) {
                        setUser(userSnap.data() as UserProfile);
                    } else {
                        console.error("User profile not found in database for uid:", firebaseUser.uid);
                        setUser(null);
                    }
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error("Error fetching user profile in AuthContext:", error);
                setUser(null); // Reset user state on error for safety
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const login = async () => {
        try {
            const profile = await signInWithGoogle();
            setUser(profile);
        } catch (error) {
            console.error("Login failed:", error);
            alert("Login failed: " + (error instanceof Error ? error.message : "Unknown error"));
        }
    };

    const loginAsGuest = async (name: string) => {
        try {
            const profile = await signInAsGuest(name);
            setUser(profile);
        } catch (error) {
            console.error("Guest login failed:", error);
            alert("Guest login failed: " + (error instanceof Error ? error.message : "Unknown error"));
        }
    };

    const logout = async () => {
        await signOutUser();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, loginAsGuest, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
