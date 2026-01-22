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

interface Assignment {
    department: string;
    reportingManager: string | null;
}

interface UserRecord {
    email: string;
    name: string;
    role: string;
    roleLevel: number;
    assignments: Assignment[];
    uid?: string | null;
    hasAccess: boolean;
}

export default function UserManagement() {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [role, setRole] = useState("Executive");
    const [assignments, setAssignments] = useState<Assignment[]>([{ department: "", reportingManager: "" }]);
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
                // Migration: Handle old data format (single department/manager) or new Format (assignments array)
                let finalAssignments: Assignment[] = [];
                if (Array.isArray(data.assignments)) {
                    finalAssignments = data.assignments;
                } else {
                    finalAssignments = [{
                        department: data.department || "",
                        reportingManager: data.reportingManager || null
                    }];
                }

                userList.push({
                    email: doc.id,
                    name: data.name || "",
                    role: data.role,
                    roleLevel: data.roleLevel,
                    assignments: finalAssignments,
                    uid: data.uid,
                    hasAccess: data.hasAccess ?? true,
                });
            });
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

    const handleAssignmentChange = (index: number, key: keyof Assignment, value: string) => {
        setAssignments(prev => prev.map((a, i) => i === index ? { ...a, [key]: value } : a));
    };

    const addAssignment = () => setAssignments([...assignments, { department: "", reportingManager: "" }]);
    const removeAssignment = (index: number) => setAssignments(assignments.filter((_, i) => i !== index));

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !name) return;

        setLoading(true);
        setMessage(null);

        try {
            const userRef = doc(db, "users", email.toLowerCase());
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                setMessage({ type: "error", text: "User already exists. Please edit their existing profile instead." });
                setLoading(false);
                return;
            }

            const newUser = {
                name,
                role,
                roleLevel: ROLE_LEVELS[role],
                assignments: assignments.filter(a => a.department.trim()),
                uid: null,
                hasAccess,
                createdAt: new Date().toISOString(),
            };

            await setDoc(userRef, newUser);
            setMessage({ type: "success", text: `Successfully registered ${name} with ${newUser.assignments.length} assignments.` });
            resetForm();
            await fetchAllUsers();
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
        setAssignments([{ department: "", reportingManager: "" }]);
        setRole("Executive");
        setHasAccess(false);
        setEditingEmail(null);
        setMessage(null);
    };

    const startEditing = (user: UserRecord) => {
        setEditingEmail(user.email);
        setName(user.name);
        setEmail(user.email);
        setRole(user.role);
        setAssignments(user.assignments.length > 0 ? user.assignments : [{ department: "", reportingManager: "" }]);
        setHasAccess(user.hasAccess);
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
                assignments: assignments.filter(a => a.department.trim()),
                hasAccess,
            };

            await updateDoc(userRef, updateData);
            setMessage({ type: "success", text: `Updated ${name}'s profile successfully.` });
            resetForm();
            await fetchAllUsers();
        } catch (error) {
            console.error("Error updating user:", error);
            setMessage({ type: "error", text: "Failed to update staff profile." });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteStaff = async (userEmail: string) => {
        if (!confirm(`Remove ${userEmail} from directory?`)) return;
        try {
            await deleteDoc(doc(db, "users", userEmail));
            setUsers(prev => prev.filter(u => u.email !== userEmail));
        } catch (error) { console.error(error); }
    };

    const handleToggleAccess = async (userEmail: string, currentAccess: boolean) => {
        try {
            await updateDoc(doc(db, "users", userEmail), { hasAccess: !currentAccess });
            setUsers(prev => prev.map(u => u.email === userEmail ? { ...u, hasAccess: !currentAccess } : u));
        } catch (error) { console.error(error); }
    };

    return (
        <div className="space-y-10">
            {/* Form Section */}
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 px-8 py-8 shadow-sm">
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                        <h2 className="text-sm font-black text-white uppercase tracking-widest">
                            {editingEmail ? "Profile Modification" : "Staff Directory Enrollment"}
                        </h2>
                    </div>
                </div>

                <form onSubmit={editingEmail ? handleUpdateUser : handleAddUser} className="space-y-8">
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Employee Full Name</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full h-11 rounded-xl border border-zinc-800 bg-black px-4 text-sm text-zinc-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Enterprise Email</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={!!editingEmail} className="w-full h-11 rounded-xl border border-zinc-800 bg-black px-4 text-sm text-zinc-200 focus:border-indigo-500 transition-all disabled:opacity-30" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Corporate Grade</label>
                            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full h-11 rounded-xl border border-zinc-800 bg-black px-4 text-sm text-zinc-200 focus:border-indigo-500 cursor-pointer">
                                {Object.keys(ROLE_LEVELS).sort((a, b) => ROLE_LEVELS[b] - ROLE_LEVELS[a]).map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Departmental Assignments</label>
                            <button type="button" onClick={addAssignment} className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors">+ Add Dept</button>
                        </div>

                        {assignments.map((assignment, index) => (
                            <div key={index} className="flex flex-wrap items-end gap-4 p-4 rounded-xl bg-black/40 border border-zinc-800/50 group">
                                <div className="flex-1 min-w-[200px] space-y-1.5">
                                    <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Target Department</p>
                                    <input type="text" value={assignment.department} onChange={(e) => handleAssignmentChange(index, 'department', e.target.value)} placeholder="e.g. Schedule" className="w-full h-10 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 text-sm text-zinc-300 focus:border-zinc-700 transition-all" />
                                </div>
                                <div className="flex-1 min-w-[200px] space-y-1.5">
                                    <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Pre-defined Supervisor</p>
                                    <Autocomplete
                                        value={assignment.reportingManager || ""}
                                        onChange={(val) => handleAssignmentChange(index, 'reportingManager', val)}
                                        suggestions={users.filter(u => u.roleLevel > ROLE_LEVELS[role]).map(u => u.name)}
                                        placeholder="Search manager..."
                                        className="h-10 text-sm"
                                    />
                                </div>
                                {assignments.length > 1 && (
                                    <button type="button" onClick={() => removeAssignment(index)} className="h-10 px-3 rounded-lg text-zinc-600 hover:text-red-500 hover:bg-red-500/10 transition-all">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-6 pt-4">
                        <button type="button" onClick={() => setHasAccess(!hasAccess)} className="flex items-center gap-3 group">
                            <div className={`w-10 h-5 rounded-full relative transition-colors ${hasAccess ? 'bg-indigo-600' : 'bg-zinc-800'}`}>
                                <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform ${hasAccess ? 'translate-x-5' : ''}`} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-zinc-400">Enable Portal Access</span>
                        </button>

                        <div className="flex-1 flex justify-end gap-3">
                            <button type="button" onClick={resetForm} className="px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">Discard</button>
                            <button type="submit" disabled={loading} className="px-8 py-3 rounded-xl bg-white text-black text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95 disabled:opacity-50">
                                {editingEmail ? "Commit Changes" : "Register Staff"}
                            </button>
                        </div>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-xl text-[10px] font-bold uppercase tracking-widest text-center ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                            {message.text}
                        </div>
                    )}
                </form>
            </section>

            {/* List Section */}
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 shadow-sm overflow-hidden">
                <div className="px-8 py-5 bg-black/20 border-b border-zinc-800 flex justify-between items-center">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Active Directory</h3>
                    <div className="text-[10px] font-bold text-zinc-600">{users.length} Total Heads</div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-black/40 border-b border-zinc-800">
                                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Employee</th>
                                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Role & Assignments</th>
                                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-center">Cloud Access</th>
                                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-right">Menu</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {fetchingUsers ? (
                                <tr><td colSpan={4} className="py-12 text-center text-xs text-zinc-600 animate-pulse italic uppercase tracking-widest">Connecting to directory...</td></tr>
                            ) : users.map(u => (
                                <tr key={u.email} className="group hover:bg-zinc-800/30 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="text-sm font-bold text-zinc-200">{u.name}</div>
                                        <div className="text-[10px] text-zinc-500 font-medium">{u.email}</div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">{u.role}</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {u.assignments.map((a, i) => (
                                                <div key={i} className="px-2 py-0.5 rounded bg-zinc-800 border border-white/5 text-[9px] font-medium text-zinc-400">
                                                    {a.department} <span className="text-zinc-600 mx-1">→</span> {a.reportingManager || 'No Mgr'}
                                                </div>
                                            ))}
                                            {u.assignments.length === 0 && <span className="text-[9px] text-zinc-700 italic">No Assignments</span>}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <button onClick={() => handleToggleAccess(u.email, u.hasAccess)} className={`text-[9px] font-black px-3 py-1 rounded-full border transition-all ${u.hasAccess ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-zinc-800 text-zinc-600 border-zinc-700 hover:border-zinc-500'}`}>
                                            {u.hasAccess ? 'AUTHORIZED' : 'RESTRICTED'}
                                        </button>
                                    </td>
                                    <td className="px-8 py-5 text-right flex justify-end gap-2">
                                        <button onClick={() => startEditing(u)} className="p-2 text-zinc-600 hover:text-indigo-400 transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                        <button onClick={() => handleDeleteStaff(u.email)} className="p-2 text-zinc-600 hover:text-red-500 transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
