"use client";

import { useEffect, useMemo, useState } from "react";
import SummarySection from "../components/SummarySection";
import CalendarView from "../components/CalendarView";
import IssueTable from "../components/IssueTable";
import IssueDrawer from "../components/IssueDrawer";
import Autocomplete from "../components/Autocomplete";
import { Category, IssueRecord } from "../types/issue";
import { fetchIssues, saveIssue, deleteIssueById } from "../lib/firestoreIssues";
import { useAuth } from "@/context/AuthContext";
import Login from "../components/Login";
import UserManagement from "../components/UserManagement";

export default function Home() {
  // --- 1. React States (useState) ---
  const [issues, setIssues] = useState<IssueRecord[]>([]);
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [subTeamFilter, setSubTeamFilter] = useState("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [selectedIssue, setSelectedIssue] = useState<IssueRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [syncTime, setSyncTime] = useState("");
  const [directoryUsers, setDirectoryUsers] = useState<any[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // --- 2. Auth Context (useAuth) ---
  const { user, loading: authLoading, isAuthorized, roleLevel, logout } = useAuth();

  // --- 3. Effects (useEffect) ---
  // Client hydration check
  useEffect(() => {
    setMounted(true);
    setSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, []);

  const hydrateRecords = (data: any[]) => {
    return data.map((it) => {
      let category = it.category;
      if (category === "Risk / Warning") category = Category.RiskWarning;
      if (category === "Availability Update") category = Category.Availability;

      return {
        ...it,
        category,
        date: it.date?.toDate ? it.date.toDate() : new Date(it.date),
      };
    });
  };

  // Firestore Data Loader
  useEffect(() => {
    if (!user || !isAuthorized) return;

    const loadData = async () => {
      try {
        const firestoreData = await fetchIssues();
        const hydrated = hydrateRecords(firestoreData);
        console.log("Firestore: Successfully fetched", hydrated.length, "records");
        setIssues(hydrated);
      } catch (err) {
        console.error("Firestore: Error fetching records:", err);
      }
    };
    loadData();
  }, [user, isAuthorized]);

  // Fetch Full User Directory for Auto-fill Profiles
  useEffect(() => {
    if (!user || !isAuthorized) return;
    const fetchDirectory = async () => {
      try {
        const { getDocs, collection } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        const snapshot = await getDocs(collection(db, "users"));
        const userList = snapshot.docs.map(doc => ({
          email: doc.id,
          ...doc.data()
        }));
        setDirectoryUsers(userList);
      } catch (err) {
        console.error("Error fetching user directory:", err);
      }
    };
    fetchDirectory();
  }, [user, isAuthorized]);

  // --- 4. Memoized Values (useMemo) ---
  // --- 4. Memoized Values (useMemo) ---
  const [simulatedRoleLevel, setSimulatedRoleLevel] = useState<number | null>(null);
  const effectiveRoleLevel = simulatedRoleLevel ?? roleLevel ?? 0;

  // Build Hierarchy Map: Manager -> [Direct Reports]
  const hierarchyMap = useMemo(() => {
    const map = new Map<string, string[]>();

    directoryUsers.forEach(u => {
      if (!u.name) return;

      const managers = new Set<string>();

      // 1. Check new assignments array
      if (Array.isArray(u.assignments)) {
        u.assignments.forEach((a: any) => {
          if (a.reportingManager) managers.add(a.reportingManager.toLowerCase().trim());
        });
      }

      // 2. Fallback for legacy reportingManager field
      if (u.reportingManager) {
        managers.add(u.reportingManager.toLowerCase().trim());
      }

      // Add user to each of their managers' report lists
      managers.forEach(mgr => {
        if (!map.has(mgr)) {
          map.set(mgr, []);
        }
        map.get(mgr)?.push(u.name);
      });
    });
    return map;
  }, [directoryUsers]);

  const getAllSubordinates = (rootName: string): Set<string> => {
    const subordinates = new Set<string>();
    const queue = [rootName.toLowerCase()];

    while (queue.length > 0) {
      const currentMgr = queue.shift()!;
      const directReports = hierarchyMap.get(currentMgr);
      if (directReports) {
        directReports.forEach(report => {
          if (!subordinates.has(report)) { // Prevent cycles
            subordinates.add(report);
            queue.push(report.toLowerCase());
          }
        });
      }
    }
    return subordinates;
  };

  const filteredIssues = useMemo<IssueRecord[]>(() => {
    return issues.filter((issue) => {
      // 1. Role-based Visibility:
      // Managers (Level 5) can see ALL records ("Manager can do and see all")
      if (effectiveRoleLevel === 5) {
        // Continue to other filters
      } else {
        // For others: Strictly hide same-level or higher-level issues
        const issueLevel = issue.employeeRoleLevel || 0;
        if (effectiveRoleLevel <= issueLevel) {
          return false;
        }
      }

      // 2. Existing Dashboard Filters
      // Employee Filter with Hierarchy Recursion
      if (employeeFilter) {
        const query = employeeFilter.toLowerCase().trim();
        const exactUserMatch = directoryUsers.find(u => u.name.toLowerCase() === query);

        if (exactUserMatch) {
          const allSubordinates = getAllSubordinates(exactUserMatch.name);
          const lowerSubordinates = new Set(Array.from(allSubordinates).map(s => s.toLowerCase()));

          const isTarget = issue.employeeName.toLowerCase() === query;
          const isSubordinate = lowerSubordinates.has(issue.employeeName.toLowerCase());
          const isSupervisorOnRecord = issue.reportingManager.toLowerCase() === query;

          if (!isTarget && !isSubordinate && !isSupervisorOnRecord) {
            return false;
          }
        } else {
          // Fallback: Simple String Match (partial name or supervisor name)
          const matchesEmployee = issue.employeeName.toLowerCase().includes(query);
          const matchesManager = issue.reportingManager.toLowerCase().includes(query);

          if (!matchesEmployee && !matchesManager) {
            return false;
          }
        }
      }

      if (subTeamFilter && !issue.subTeamName.toLowerCase().includes(subTeamFilter.toLowerCase())) {
        return false;
      }
      if (fromDate) {
        const from = new Date(fromDate);
        if (issue.date < from) return false;
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        if (issue.date > to) return false;
      }
      return true;
    });
  }, [issues, employeeFilter, subTeamFilter, fromDate, toDate, effectiveRoleLevel, hierarchyMap, directoryUsers]);

  const employeeSuggestions = useMemo(() => {
    // Filter suggestions based on visibility rules
    // 1. From Directory: distinct names
    const visibleDirectoryUsers = directoryUsers.filter(u => {
      if (effectiveRoleLevel === 5) return true;
      // Strict hierarchy: can only see names of people BELOW them
      return (u.roleLevel || 0) < effectiveRoleLevel;
    });

    // 2. From Issues: distinct names
    const visibleIssueNames = issues
      .filter(issue => {
        if (effectiveRoleLevel === 5) return true;
        // Strict hierarchy
        return (issue.employeeRoleLevel || 0) < effectiveRoleLevel;
      })
      .map(it => it.employeeName);

    const fromDirectory = visibleDirectoryUsers.map(it => it.name);

    return Array.from(new Set([...visibleIssueNames, ...fromDirectory])).filter(Boolean).sort();
  }, [issues, directoryUsers, effectiveRoleLevel]);

  const subTeamSuggestions = useMemo(() => {
    const fromIssues = issues.map(it => it.subTeamName);
    const fromDirectory = directoryUsers.map(it => it.department);
    return Array.from(new Set([...fromIssues, ...fromDirectory])).filter(Boolean).sort();
  }, [issues, directoryUsers]);

  const employeeProfiles = useMemo(() => {
    const profiles: Array<{ name: string; subTeamName: string; reportingManager: string; employeeRoleLevel: number }> = [];

    // 1. Base data from User Directory (Provisioned data)
    directoryUsers.forEach(u => {
      if (u.name) {
        // Flatten assignments into individual profile lookups
        if (Array.isArray(u.assignments) && u.assignments.length > 0) {
          u.assignments.forEach((assign: any) => {
            profiles.push({
              name: u.name,
              subTeamName: assign.department || "",
              reportingManager: assign.reportingManager || "",
              employeeRoleLevel: u.roleLevel || 2,
            });
          });
        } else {
          // Fallback for legacy records
          profiles.push({
            name: u.name,
            subTeamName: u.department || "",
            reportingManager: u.reportingManager || "",
            employeeRoleLevel: u.roleLevel || 2,
          });
        }
      }
    });

    // 2. Enhance with Historical Issue Data (Unique combinations)
    // We want to capture historical assignments that might not be in the current directory
    issues.forEach(issue => {
      if (issue.employeeName && issue.subTeamName) {
        const alreadyExists = profiles.some(p => p.name === issue.employeeName && p.subTeamName === issue.subTeamName);
        if (!alreadyExists) {
          profiles.push({
            name: issue.employeeName,
            subTeamName: issue.subTeamName,
            reportingManager: issue.reportingManager,
            employeeRoleLevel: issue.employeeRoleLevel,
          });
        }
      }
    });
    return profiles;
  }, [issues, directoryUsers]);

  // --- 5. Event Handlers ---
  const handleSelectIssue = (issue: IssueRecord) => {
    setSelectedIssue(issue);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedIssue(null);
  };

  const handleCreateRecord = () => {
    const newRecord: IssueRecord = {
      id: `OPS-${Math.floor(Math.random() * 9000) + 1000}`,
      date: new Date(),
      employeeName: "",
      subTeamName: "",
      workTitle: "",
      workDetails: "",
      category: Category.Issue,
      reportingManager: "",
      studentEnd: false,
      employeeRoleLevel: 2, // Default to Executive
    };
    setSelectedIssue(newRecord);
    setDrawerOpen(true);
  };

  const handleAddEventOnDate = (date: Date) => {
    const newRecord: IssueRecord = {
      id: `OPS-${Math.floor(Math.random() * 9000) + 1000}`,
      date: date,
      employeeName: "",
      subTeamName: "",
      workTitle: "",
      workDetails: "",
      category: Category.Issue,
      reportingManager: "",
      studentEnd: false,
      employeeRoleLevel: 2,
    };
    setSelectedIssue(newRecord);
    setDrawerOpen(true);
  };

  const handleSaveIssue = async (updated: IssueRecord) => {
    // Permission Guard: Cannot modify records at or above own level
    // Exception: Managers (Level 5) can do "all"
    const currentLevel = roleLevel ?? 0;

    if (currentLevel < 5 && currentLevel <= updated.employeeRoleLevel) {
      alert("Permission Denied: You cannot create or modify records for employees at or above your own rank.");
      return;
    }

    try {
      await saveIssue(updated);

      const firestoreData = await fetchIssues();
      const hydrated = firestoreData.map((it: any) => ({
        ...it,
        date: it.date?.toDate ? it.date.toDate() : new Date(it.date),
      }));
      setIssues(hydrated);
      setDrawerOpen(false);
    } catch (err) {
      console.error("Failed to save issue", err);
      alert("Failed to save entry");
    }
  };

  const handleDeleteIssue = async (id: string) => {
    // Permission Guard: Cannot delete records at or above own level
    // Exception: Managers (Level 5) can do "all"
    const issueToDelete = issues.find(it => it.id === id);
    const currentLevel = roleLevel ?? 0;

    if (currentLevel < 5 && issueToDelete && currentLevel <= issueToDelete.employeeRoleLevel) {
      alert("Permission Denied: You cannot delete records for employees at or above your own rank.");
      return;
    }

    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      await deleteIssueById(id);
      const firestoreData = await fetchIssues();
      const hydrated = firestoreData.map((it: any) => ({
        ...it,
        date: it.date?.toDate ? it.date.toDate() : new Date(it.date),
      }));
      setIssues(hydrated);
      setDrawerOpen(false);
    } catch (err) {
      console.error("Failed to delete issue", err);
      alert("Failed to delete entry");
    }
  };

  // --- 6. Auth Render Guards (MUST BE AFTER ALL HOOKS) ---
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-800 border-t-white" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Verifying Authorization...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (!isAuthorized) {
    return null;
  }

  // --- 7. Main Dashboard Render ---
  return (
    <main className="min-h-screen bg-black px-4 py-8 md:px-8 lg:py-12 text-zinc-200">
      <div className="mx-auto max-w-7xl space-y-10">
        <header className="flex flex-col gap-4 border-b border-zinc-800 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-6 w-1 bg-white" aria-hidden="true" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Operations Department
              </p>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Ops Intelligence</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
              Internal monitoring dashboard for operational records. Track, filter, and analyze incident logs
              across summary views, activity calendars, and detailed data tables.
            </p>
          </div>
          <div className="flex flex-col items-start gap-4 text-right md:items-end">
            <div className="flex items-center gap-3">
              {user && roleLevel === 5 && (
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 transition-all hover:bg-zinc-800 hover:text-white shadow-sm"
                  title="Admin Settings"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}
              <button
                onClick={handleCreateRecord}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-black transition-all hover:bg-zinc-200 active:scale-95 shadow-sm"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Add Record
              </button>
            </div>
            <div className="flex flex-col items-start gap-1 text-right md:items-end">
              <span className="inline-flex items-center rounded-md bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500">
                Live Feed
              </span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Synced: {mounted ? syncTime : "--:--"}
              </p>
            </div>
          </div>
        </header>

        <div className="grid gap-10">


          <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
              <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Filters & Controls</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <label htmlFor="fromDate" className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                  Start Date
                </label>
                <input
                  id="fromDate"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full h-10 rounded-lg border border-zinc-800 bg-black px-3 text-sm text-zinc-300 transition-colors focus:border-white focus:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-white color-scheme-dark"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="toDate" className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                  End Date
                </label>
                <input
                  id="toDate"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full h-10 rounded-lg border border-zinc-800 bg-black px-3 text-sm text-zinc-300 transition-colors focus:border-white focus:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-white color-scheme-dark"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="employeeFilter" className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                  Employee
                </label>
                <Autocomplete
                  id="employeeFilter"
                  placeholder="Records filter..."
                  value={employeeFilter}
                  onChange={setEmployeeFilter}
                  suggestions={employeeSuggestions}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="subTeamFilter" className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                  Department
                </label>
                <Autocomplete
                  id="subTeamFilter"
                  placeholder="Team filter..."
                  value={subTeamFilter}
                  onChange={setSubTeamFilter}
                  suggestions={subTeamSuggestions}
                />
              </div>
            </div>
          </section>

          <section className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="h-1.5 w-1.5 rounded-full bg-white" />
                <h2 className="text-sm font-bold text-white uppercase tracking-tight">Executive Summary</h2>
              </div>
              <SummarySection issues={filteredIssues} />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="h-1.5 w-1.5 rounded-full bg-white" />
                <h2 className="text-sm font-bold text-white uppercase tracking-tight">Timeline View</h2>
              </div>
              <CalendarView issues={filteredIssues} onSelectIssue={handleSelectIssue} onAddEvent={handleAddEventOnDate} />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <div className="h-1.5 w-1.5 rounded-full bg-white" />
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">Granular Data</h2>
            </div>
            <IssueTable issues={filteredIssues} onSelectIssue={handleSelectIssue} />
          </section>
        </div>
      </div>

      <IssueDrawer
        open={drawerOpen}
        issue={selectedIssue}
        onClose={handleCloseDrawer}
        onSave={handleSaveIssue}
        onDelete={handleDeleteIssue}
        employeeSuggestions={employeeSuggestions}
        subTeamSuggestions={subTeamSuggestions}
        employeeProfiles={employeeProfiles}
      />

      {/* Settings & Admin Drawer */}
      {settingsOpen && (
        <div className="fixed inset-0 z-[60]">
          <button
            type="button"
            className="absolute inset-0 bg-zinc-900/80 backdrop-blur-sm transition-opacity"
            onClick={() => setSettingsOpen(false)}
          />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-4xl flex-col bg-black shadow-2xl overflow-y-auto no-scrollbar border-l border-zinc-800">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800 bg-black/95 px-8 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white border border-zinc-800">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-white">Administration Panel</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Settings & Team Management</p>
                </div>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                className="rounded-full p-2 text-zinc-500 hover:bg-zinc-900 hover:text-white transition-colors"
                title="Close Panel"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-8 py-10 space-y-12">
              {/* User Profile Section */}
              <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="relative h-20 w-20 overflow-hidden rounded-3xl ring-4 ring-zinc-800 shadow-inner">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName || "User"} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-black text-2xl font-bold text-white uppercase">
                          {user.displayName?.charAt(0) || user.email?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">{user.displayName || "Ops Executive"}</h3>
                      <div className="group relative flex items-center gap-1">
                        <p className={`text-sm font-bold cursor-help transition-colors ${simulatedRoleLevel !== null ? "text-amber-500" : "text-zinc-400"}`} title="Effective Role Level">
                          Lvl {effectiveRoleLevel} {simulatedRoleLevel !== null && "(Simulated)"}
                        </p>
                        {/* Role Simulator for Testing */}
                        <div className="absolute left-0 top-full mt-2 hidden w-56 rounded-lg border border-zinc-700 bg-zinc-800 p-2 shadow-xl group-hover:block z-50">
                          <div className="mb-2 flex items-center justify-between border-b border-zinc-700 pb-2">
                            <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Simulate Role</p>
                            {simulatedRoleLevel !== null && (
                              <button
                                onClick={() => setSimulatedRoleLevel(null)}
                                className="text-[10px] font-bold text-red-400 hover:underline"
                              >
                                RESET
                              </button>
                            )}
                          </div>
                          {[5, 4, 3, 2, 1].map((lvl) => (
                            <button
                              key={lvl}
                              onClick={() => setSimulatedRoleLevel(lvl)}
                              className={`w-full rounded px-2 py-1.5 text-left text-xs font-medium transition-colors hover:bg-zinc-700 ${effectiveRoleLevel === lvl ? "bg-zinc-700 text-white font-bold" : "text-zinc-400"}`}
                            >
                              Level {lvl}
                              {lvl === 5 && " (Manager)"}
                              {lvl === 4 && " (Lead)"}
                              {lvl === 3 && " (Sr. Exec)"}
                              {lvl === 2 && " (Exec)"}
                              {lvl === 1 && " (Jr. Exec)"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-indigo-900/40 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      Active Session
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 rounded-xl bg-red-900/20 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-red-500 transition-all hover:bg-red-900/40 border border-red-900/30"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout System
                  </button>
                </div>
              </section>

              {user && roleLevel === 5 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 px-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    <h2 className="text-sm font-bold text-white uppercase tracking-tight">Organization Control</h2>
                  </div>
                  <UserManagement />
                </div>
              )}
            </div>
          </aside>
        </div >
      )
      }
    </main >
  );
}
