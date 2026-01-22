"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAuthorized: boolean;
    role: string | null;
    roleLevel: number | null;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [role, setRole] = useState<string | null>(null);
    const [roleLevel, setRoleLevel] = useState<number | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setLoading(true);
            if (firebaseUser?.email) {
                try {
                    const userRef = doc(db, "users", firebaseUser.email);
                    const userDoc = await getDoc(userRef);

                    if (userDoc.exists()) {
                        const data = userDoc.data();

                        if (!data.uid) {
                            // First time login: Attach Firebase UID if access is granted
                            if (data.hasAccess !== false) {
                                await updateDoc(userRef, { uid: firebaseUser.uid });
                                setUser(firebaseUser);
                                setIsAuthorized(true);
                                setRole(data.role || "User");
                                setRoleLevel(data.roleLevel ?? 0);
                            } else {
                                setUser(firebaseUser);
                                setIsAuthorized(false);
                            }
                        } else if (data.uid === firebaseUser.uid && data.hasAccess !== false) {
                            // Match existing UID and Access is enabled
                            setUser(firebaseUser);
                            setIsAuthorized(true);
                            setRole(data.role || "User");
                            setRoleLevel(data.roleLevel ?? 0);
                        } else {
                            // UID mismatch OR Access is disabled
                            setUser(firebaseUser);
                            setIsAuthorized(false);
                            setRole(null);
                            setRoleLevel(null);
                        }
                    } else {
                        // User not in 'users' collection
                        setUser(firebaseUser);
                        setIsAuthorized(false);
                        setRole(null);
                        setRoleLevel(null);
                    }
                } catch (error) {
                    console.error("Authorization check failed:", error);
                    setIsAuthorized(false);
                }
            } else {
                setUser(null);
                setIsAuthorized(false);
                setRole(null);
                setRoleLevel(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Login failed:", error);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, isAuthorized, role, roleLevel, signInWithGoogle, logout }}>
            {user && !isAuthorized && !loading ? (
                <AccessDenied onLogout={logout} userEmail={user.email} />
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
}

function AccessDenied({ onLogout, userEmail }: { onLogout: () => void; userEmail: string | null }) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
            <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-red-900/20 bg-zinc-900 px-8 py-12 shadow-2xl">
                <div className="absolute -left-20 -top-20 h-64 w-64 bg-red-500/5 blur-[100px]" />

                <div className="relative z-10 text-center">
                    <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-950 shadow-inner ring-1 ring-red-900/30">
                        <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>

                    <h1 className="text-2xl font-bold tracking-tight text-white">Access Not Granted</h1>
                    <p className="mt-2 text-sm text-zinc-400">
                        The account <span className="text-zinc-200 font-semibold">{userEmail}</span> has not been authorized to access this dashboard.
                    </p>
                    <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                        Please contact your administrator for provisioning.
                    </p>

                    <button
                        onClick={onLogout}
                        className="mt-10 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-800 px-5 py-3 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-zinc-700"
                    >
                        Switch Account
                    </button>
                </div>
            </div>
        </div>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
