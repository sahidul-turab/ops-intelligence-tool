"use client";

import React, { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Autocomplete from "./Autocomplete";

const ROLE_LEVELS: Record<string, number> = {
    "Manager": 5,
    "Lead": 4,
    "Senior Executive": 3,
    "Executive": 2,
    "Junior Executive": 1,
};

interface UserRecord {
    email: string;
    name: string;
    role: string;
    roleLevel: number;
    department: string;
    reportingManager?: string | null;
    uid?: string | null;
    hasAccess: boolean;
}

export default function UserManagement() {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [role, setRole] = useState("Executive");
    const [department, setDepartment] = useState("");
    const [reportingManager, setReportingManager] = useState("");
    const [hasAccess, setHasAccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [fetchingUsers, setFetchingUsers] = useState(true);
    const [editingEmail, setEditingEmail] = useState<string | null>(null);

    // Fetch all users on mount
    const fetchAllUsers = async () => {
        setFetchingUsers(true);
        try {
            const querySnapshot = await getDocs(collection(db, "users"));
            const userList: UserRecord[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                userList.push({
                    email: doc.id,
                    name: data.name || "",
                    role: data.role,
                    roleLevel: data.roleLevel,
                    department: data.department || "",
                    reportingManager: data.reportingManager,
                    uid: data.uid,
                    hasAccess: data.hasAccess ?? true,
                });
            });
            // Sort by role level descending
            setUsers(userList.sort((a, b) => b.roleLevel - a.roleLevel));
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setFetchingUsers(false);
        }
    };

    useEffect(() => {
        fetchAllUsers();
    }, []);

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !name) return;

        setLoading(true);
        setMessage(null);

        try {
            const userRef = doc(db, "users", email.toLowerCase());
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                setMessage({ type: "error", text: "User already exists in the system." });
                setLoading(false);
                return;
            }

            const newUser = {
                name,
                role,
                roleLevel: ROLE_LEVELS[role],
                department,
                reportingManager: reportingManager.trim() || null,
                uid: null,
                hasAccess,
                createdAt: new Date().toISOString(),
            };

            await setDoc(userRef, newUser);

            setMessage({ type: "success", text: `Successfully registered ${name} in the Staff Directory.` });
            resetForm();
            await fetchAllUsers(); // Refresh list
        } catch (error) {
            console.error("Error adding user:", error);
            setMessage({ type: "error", text: "Failed to register staff member." });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setEmail("");
        setName("");
        setDepartment("");
        setReportingManager("");
        setRole("Executive");
        setHasAccess(false);
        setEditingEmail(null);
    };

    const handleToggleAccess = async (userEmail: string, currentAccess: boolean) => {
        try {
            const userRef = doc(db, "users", userEmail);
            await updateDoc(userRef, {
                hasAccess: !currentAccess,
            });

            setUsers(prev => prev.map(u =>
                u.email === userEmail ? { ...u, hasAccess: !currentAccess } : u
            ));
        } catch (error) {
            console.error("Error toggling access:", error);
            alert("Failed to update access status.");
        }
    };

    const handleUpdateRole = async (userEmail: string, newRole: string) => {
        try {
            const userRef = doc(db, "users", userEmail);
            await updateDoc(userRef, {
                role: newRole,
                roleLevel: ROLE_LEVELS[newRole],
            });

            setUsers(prev => prev.map(u =>
                u.email === userEmail ? { ...u, role: newRole, roleLevel: ROLE_LEVELS[newRole] } : u
            ));
        } catch (error) {
            console.error("Error updating role:", error);
            alert("Failed to update role.");
        }
    };

    const handleUpdateDept = async (userEmail: string, newDept: string) => {
        try {
            const userRef = doc(db, "users", userEmail);
            await updateDoc(userRef, {
                department: newDept,
            });

            setUsers(prev => prev.map(u =>
                u.email === userEmail ? { ...u, department: newDept } : u
            ));
        } catch (error) {
            console.error("Error updating department:", error);
        }
    };

    const handleDeleteStaff = async (userEmail: string) => {
        if (!confirm(`Are you sure you want to remove ${userEmail} from the directory?`)) return;

        try {
            await deleteDoc(doc(db, "users", userEmail));
            setUsers(prev => prev.filter(u => u.email !== userEmail));
        } catch (error) {
            console.error("Error deleting staff:", error);
            alert("Failed to delete staff member.");
        }
    };

    const startEditing = (user: UserRecord) => {
        setEditingEmail(user.email);
        setName(user.name);
        setEmail(user.email);
        setDepartment(user.department);
        setRole(user.role);
        setReportingManager(user.reportingManager || "");
        setHasAccess(user.hasAccess);

        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingEmail) return;

        setLoading(true);
        try {
            const userRef = doc(db, "users", editingEmail);
            const updateData = {
                name,
                role,
                roleLevel: ROLE_LEVELS[role],
                department,
                reportingManager: reportingManager.trim() || null,
                hasAccess,
            };

            await updateDoc(userRef, updateData);

            setMessage({ type: "success", text: `Successfully updated ${name}'s profile.` });
            resetForm();
            await fetchAllUsers();
        } catch (error) {
            console.error("Error updating user:", error);
            setMessage({ type: "error", text: "Failed to update staff profile." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-10">
            {/* 1. Add/Edit Staff Form */}
            <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                </div>

                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                        <h2 className="text-sm font-bold text-white uppercase tracking-tight">
                            {editingEmail ? "Edit Staff Profile" : "Staff Directory Creation"}
                        </h2>
                    </div>
                    {editingEmail && (
                        <button
                            onClick={resetForm}
                            className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
                        >
                            Cancel Edit
                        </button>
                    )}
                </div>

                <form onSubmit={editingEmail ? handleUpdateUser : handleAddUser} className="space-y-6 max-w-xl">
                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label htmlFor="userName" className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                                Employee Full Name
                            </label>
                            <input
                                id="userName"
                                type="text"
                                placeholder="Required for auto-fill"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full h-11 rounded-lg border border-zinc-800 bg-black px-4 text-sm text-zinc-300 focus:border-white focus:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-white transition-all placeholder:text-zinc-700"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="userEmail" className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                                Employee Email
                            </label>
                            <input
                                id="userEmail"
                                type="email"
                                placeholder="user@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={!!editingEmail}
                                className="w-full h-11 rounded-lg border border-zinc-800 bg-black px-4 text-sm text-zinc-300 focus:border-white focus:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-white transition-all disabled:opacity-50 placeholder:text-zinc-700"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="userDept" className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                                Department/Team
                            </label>
                            <input
                                id="userDept"
                                type="text"
                                placeholder="e.g. Platform Ops"
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                className="w-full h-11 rounded-lg border border-zinc-800 bg-black px-4 text-sm text-zinc-300 focus:border-white focus:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-white transition-all placeholder:text-zinc-700"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="userRole" className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                                Default Grade/Role
                            </label>
                            <select
                                id="userRole"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full h-11 rounded-lg border border-zinc-800 bg-black px-4 text-sm text-zinc-300 focus:border-white focus:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-white appearance-none cursor-pointer"
                            >
                                {Object.keys(ROLE_LEVELS).sort((a, b) => ROLE_LEVELS[b] - ROLE_LEVELS[a]).map((r) => (
                                    <option key={r} value={r}>{r} (Level {ROLE_LEVELS[r]})</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5 sm:col-span-2">
                            <label htmlFor="managerName" className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                                Primary Supervisor (Optional)
                            </label>
                            <Autocomplete
                                id="managerName"
                                placeholder="Search supervisor name..."
                                value={reportingManager}
                                onChange={setReportingManager}
                                suggestions={users
                                    .filter(u => u.roleLevel > (ROLE_LEVELS[role] || 0)) // Only show supervisors with higher rank
                                    .map(u => u.name)
                                    .filter(Boolean)
                                    .sort()
                                }
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setHasAccess(!hasAccess)}
                            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${hasAccess ? 'bg-indigo-600' : 'bg-zinc-700'}`}
                        >
                            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${hasAccess ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest text-[10px]">Enable Portal Login Access</span>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-lg text-xs font-bold uppercase tracking-widest ${message.type === "success" ? "bg-emerald-950/40 text-emerald-500 border border-emerald-900/50" : "bg-red-950/40 text-red-500 border border-red-900/50"
                            }`}>
                            {message.text}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-all active:scale-95 disabled:opacity-50 shadow-md ${editingEmail ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-900/20" : "bg-white text-black hover:bg-zinc-200"
                                }`}
                        >
                            {loading ? (
                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-400 border-t-zinc-900" />
                            ) : editingEmail ? (
                                <>
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Update Records
                                </>
                            ) : (
                                <>
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Register Staff Entry
                                </>
                            )}
                        </button>
                        {editingEmail && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="rounded-lg border border-zinc-800 bg-zinc-900 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all shadow-sm"
                            >
                                Discard Changes
                            </button>
                        )}
                    </div>
                </form>
            </section>

            {/* 2. Staff List & Edit Section */}
            <section className="rounded-xl border border-zinc-800 bg-zinc-900 shadow-sm overflow-hidden">
                <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between bg-black/40">
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
                        <h2 className="text-sm font-bold text-white uppercase tracking-tight">Ops Staff Directory</h2>
                    </div>
                    <span className="text-[10px] font-bold text-black uppercase tracking-widest bg-zinc-200 px-2 py-1 rounded">
                        {users.length} Records
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-zinc-800 bg-black/60">
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Employee</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Dept & Role</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-center">Portal Access</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {fetchingUsers ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 text-xs italic">Loading directory...</td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 text-xs italic">Staff list is currently empty.</td>
                                </tr>
                            ) : (
                                users.map((u) => (
                                    <tr key={u.email} className={`group hover:bg-zinc-800/50 transition-colors ${editingEmail === u.email ? "bg-indigo-900/10 ring-1 ring-inset ring-indigo-500/20" : ""}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-zinc-200">{u.name || "Unnamed User"}</span>
                                                <span className="text-[10px] text-zinc-500 font-medium">{u.email}</span>
                                                {u.reportingManager && (
                                                    <span className="text-[10px] text-zinc-400 font-medium mt-1 uppercase tracking-tighter ring-1 ring-inset ring-zinc-700 px-1.5 py-0.5 rounded-md w-fit bg-zinc-800">
                                                        Admin: {u.reportingManager}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-tight">{u.department || "No Dept"}</span>
                                                <span className="text-[10px] font-medium text-zinc-600">{u.role}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleToggleAccess(u.email, u.hasAccess)}
                                                className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter ring-1 ring-inset transition-all ${u.hasAccess
                                                    ? "bg-emerald-950/30 text-emerald-500 ring-emerald-900/50 hover:bg-emerald-900/40"
                                                    : "bg-zinc-800 text-zinc-500 ring-zinc-700 hover:bg-zinc-700"
                                                    }`}
                                            >
                                                {u.hasAccess ? "ON" : "OFF"}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => startEditing(u)}
                                                    className="p-2 text-zinc-500 hover:bg-zinc-800 hover:text-indigo-400 rounded-lg transition-all border border-transparent hover:border-zinc-700 shadow-sm"
                                                    title="Edit Profile"
                                                >
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteStaff(u.email)}
                                                    className="p-2 text-zinc-500 hover:bg-zinc-800 hover:text-red-500 rounded-lg transition-all border border-transparent hover:border-zinc-700 shadow-sm"
                                                    title="Remove Staff"
                                                >
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
