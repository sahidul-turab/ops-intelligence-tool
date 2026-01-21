"use client";

import { useEffect, useMemo, useState } from "react";
import SummarySection from "../components/SummarySection";
import CalendarView from "../components/CalendarView";
import IssueTable from "../components/IssueTable";
import IssueDrawer from "../components/IssueDrawer";
import Autocomplete from "../components/Autocomplete";
import { issues as initialIssues } from "../data/issues";
import { Category, IssueRecord } from "../types/issue";

export default function Home() {
  const [issues, setIssues] = useState<IssueRecord[]>(initialIssues);
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [subTeamFilter, setSubTeamFilter] = useState("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [selectedIssue, setSelectedIssue] = useState<IssueRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Persistence: Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("ops-intelligence-records");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const hydrated = parsed.map((it: any) => ({
          ...it,
          date: new Date(it.date),
        }));
        setIssues(hydrated);
      } catch (err) {
        console.error("Failed to load records from storage:", err);
      }
    }
  }, []);

  // Persistence: Save to localStorage on change
  useEffect(() => {
    localStorage.setItem("ops-intelligence-records", JSON.stringify(issues));
  }, [issues]);

  const filteredIssues = useMemo<IssueRecord[]>(() => {
    return issues.filter((issue) => {
      if (employeeFilter && !issue.employeeName.toLowerCase().includes(employeeFilter.toLowerCase())) {
        return false;
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
        // include the entire end day
        to.setHours(23, 59, 59, 999);
        if (issue.date > to) return false;
      }
      return true;
    });
  }, [issues, employeeFilter, subTeamFilter, fromDate, toDate]);

  const employeeSuggestions = useMemo(() => Array.from(new Set(issues.map(it => it.employeeName))).filter(Boolean).sort(), [issues]);
  const subTeamSuggestions = useMemo(() => Array.from(new Set(issues.map(it => it.subTeamName))).filter(Boolean).sort(), [issues]);

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
    };
    setSelectedIssue(newRecord);
    setDrawerOpen(true);
  };

  const handleSaveIssue = (updated: IssueRecord) => {
    setIssues((prev) => {
      const exists = prev.some((it) => it.id === updated.id);
      if (exists) {
        return prev.map((it) => (it.id === updated.id ? updated : it));
      } else {
        return [updated, ...prev];
      }
    });
    setSelectedIssue(updated);
  };

  return (
    <main className="min-h-screen bg-zinc-50/50 px-4 py-8 md:px-8 lg:py-12">
      <div className="mx-auto max-w-7xl space-y-10">
        <header className="flex flex-col gap-4 border-b border-zinc-200 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-6 w-1 bg-zinc-900" aria-hidden="true" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Operations Department
              </p>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Ops Intelligence</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
              Internal monitoring dashboard for operational records. Track, filter, and analyze incident logs
              across summary views, activity calendars, and detailed data tables.
            </p>
          </div>
          <div className="flex flex-col items-start gap-4 text-right md:items-end">
            <button
              onClick={handleCreateRecord}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-zinc-800 active:scale-95 shadow-sm"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Add Record
            </button>
            <div className="flex flex-col items-start gap-1 text-right md:items-end">
              <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 ring-1 ring-inset ring-emerald-100">
                Live Feed
              </span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Synced: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </header>

        <div className="grid gap-10">
          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
              <h2 className="text-sm font-semibold text-zinc-900 uppercase tracking-wide">Filters & Controls</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <label htmlFor="fromDate" className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400">
                  Start Date
                </label>
                <input
                  id="fromDate"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full h-10 rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 text-sm text-zinc-500 transition-colors focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="toDate" className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400">
                  End Date
                </label>
                <input
                  id="toDate"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full h-10 rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 text-sm text-zinc-500 transition-colors focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="employeeFilter" className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400">
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
                <label htmlFor="subTeamFilter" className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400">
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
                <div className="h-1.5 w-1.5 rounded-full bg-zinc-900" />
                <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-tight">Executive Summary</h2>
              </div>
              <SummarySection issues={filteredIssues} />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="h-1.5 w-1.5 rounded-full bg-zinc-900" />
                <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-tight">Timeline View</h2>
              </div>
              <CalendarView issues={filteredIssues} onSelectIssue={handleSelectIssue} />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <div className="h-1.5 w-1.5 rounded-full bg-zinc-900" />
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-900">Granular Data</h2>
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
        employeeSuggestions={employeeSuggestions}
        subTeamSuggestions={subTeamSuggestions}
      />
    </main>
  );
}
