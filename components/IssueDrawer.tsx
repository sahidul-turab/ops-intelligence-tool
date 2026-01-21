import { useEffect, useState } from "react";
import { Category, IssueRecord } from "../types/issue";
import Autocomplete from "./Autocomplete";

export type IssueDrawerProps = {
  open: boolean;
  issue: IssueRecord | null;
  onClose: () => void;
  onSave: (updated: IssueRecord) => void;
  onDelete?: (id: string) => void;
  employeeSuggestions: string[];
  subTeamSuggestions: string[];
};

type FormState = {
  id: string;
  date: string;
  employeeName: string;
  subTeamName: string;
  workTitle: string;
  workDetails: string;
  category: Category;
  reportingManager: string;
  studentEnd: boolean;
};

function formatDisplayDate(d: Date): string {
  return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function categoryBadgeClass(category: Category): string {
  switch (category) {
    case Category.Issue:
      return "bg-red-50 text-red-600 ring-red-100";
    case Category.Success:
      return "bg-emerald-50 text-emerald-600 ring-emerald-100";
    case Category.Warning:
      return "bg-amber-50 text-amber-600 ring-amber-100";
    default:
      return "bg-zinc-50 text-zinc-500 ring-zinc-100";
  }
}

function toInputDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function issueToForm(issue: IssueRecord): FormState {
  return {
    id: issue.id,
    date: toInputDate(issue.date),
    employeeName: issue.employeeName,
    subTeamName: issue.subTeamName,
    workTitle: issue.workTitle,
    workDetails: issue.workDetails,
    category: issue.category,
    reportingManager: issue.reportingManager,
    studentEnd: issue.studentEnd,
  };
}


export default function IssueDrawer({
  open,
  issue,
  onClose,
  onSave,
  onDelete,
  employeeSuggestions,
  subTeamSuggestions,
}: IssueDrawerProps) {
  const [mode, setMode] = useState<"read" | "edit">("read");
  const [form, setForm] = useState<FormState | null>(null);

  const isCreate = issue ? !issue.employeeName : false;

  useEffect(() => {
    if (issue) {
      setForm(issueToForm(issue));
      // Auto-enter edit mode if creating a new record
      if (isCreate) {
        setMode("edit");
      } else {
        setMode("read");
      }
    }
  }, [issue, isCreate]);

  if (!open || !issue || !form) return null;

  const handleChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = () => {
    const updated: IssueRecord = {
      ...issue,
      id: form.id,
      date: new Date(form.date),
      employeeName: form.employeeName,
      subTeamName: form.subTeamName,
      workTitle: form.workTitle,
      workDetails: form.workDetails,
      category: form.category,
      reportingManager: form.reportingManager,
      studentEnd: form.studentEnd,
    };
    onSave(updated);
    if (isCreate) {
      onClose();
    } else {
      setMode("read");
    }
  };

  const handleDelete = () => {
    if (onDelete && issue.id) {
      onDelete(issue.id);
      onClose();
    }
  };

  const isEdit = mode === "edit";

  const validation = {
    date: !!form.date,
    employeeName: !!form.employeeName.trim(),
    subTeamName: !!form.subTeamName.trim(),
    workTitle: !!form.workTitle.trim(),
    category: !!form.category,
  };

  const isValid = Object.values(validation).every(v => v);

  const ValidationHint = ({ valid }: { valid: boolean }) => (
    isEdit && !valid ? (
      <span className="ml-2 text-[9px] font-bold text-red-500 uppercase tracking-tight">Required</span>
    ) : null
  );

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm transition-opacity"
        aria-label="Close details"
        onClick={onClose}
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl transition-transform">
        {/* Header */}
        <div className={`border-b border-zinc-100 px-8 py-6 ${isCreate ? "bg-zinc-900" : "bg-zinc-50/50"}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-2">
                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ring-1 ring-inset ${isCreate ? "bg-white/10 text-white ring-white/20" : categoryBadgeClass(isEdit ? form.category : issue.category)
                  }`}>
                  {isCreate ? "NEW RECORD" : (isEdit ? form.category : issue.category)}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isCreate ? "text-zinc-400" : "text-zinc-400"}`}>
                  {isCreate ? "Draft Entry" : `ID: ${isEdit ? form.id : issue.id}`}
                </span>
              </div>
              <h2 className={`text-xl font-bold tracking-tight leading-tight ${isCreate ? "text-white" : "text-zinc-900"}`}>
                {isEdit ? (
                  <input
                    type="text"
                    value={form.workTitle}
                    onChange={(e) => handleChange("workTitle", e.target.value)}
                    placeholder="Work Title"
                    className={`w-full bg-transparent border-none p-0 focus:ring-0 ${isCreate ? "placeholder:text-zinc-600 text-white" : "placeholder:text-zinc-300 text-zinc-900"}`}
                  />
                ) : (
                  issue.workTitle
                )}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`rounded-full p-2 transition-colors ${isCreate ? "text-zinc-400 hover:bg-white/10" : "text-zinc-400 hover:bg-zinc-100"}`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-10 no-scrollbar">
          <div className="space-y-12">
            {/* Meta Information */}
            <section className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="h-1 w-4 rounded-full bg-zinc-900" />
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Section 1: Meta Information</h3>
              </div>
              <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                <div className="space-y-1.5">
                  <div className="flex items-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Incident Date</p>
                    <ValidationHint valid={validation.date} />
                  </div>
                  {isEdit ? (
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => handleChange("date", e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-zinc-900">{formatDisplayDate(issue.date)}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Student Facing</p>
                  {isEdit ? (
                    <button
                      type="button"
                      onClick={() => handleChange("studentEnd", !form.studentEnd)}
                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${form.studentEnd
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-zinc-200 bg-zinc-50 text-zinc-500"
                        }`}
                    >
                      <div className={`h-2 w-2 rounded-full ${form.studentEnd ? "bg-emerald-500 animate-pulse" : "bg-zinc-300"}`} />
                      {form.studentEnd ? "YES, USER FACING" : "NO, INTERNAL ONLY"}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${issue.studentEnd ? "bg-emerald-500" : "bg-zinc-300"}`} />
                      <p className={`text-sm font-bold uppercase tracking-tight ${issue.studentEnd ? "text-emerald-700" : "text-zinc-500"}`}>
                        {issue.studentEnd ? "Yes, Student End" : "No, Back office"}
                      </p>
                    </div>
                  )}
                </div>
                <div className="col-span-2 space-y-1.5">
                  <div className="flex items-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Record Classification</p>
                    <ValidationHint valid={validation.category} />
                  </div>
                  {isEdit ? (
                    <select
                      value={form.category}
                      onChange={(e) => handleChange("category", e.target.value as Category)}
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    >
                      {Object.values(Category).map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ring-1 ring-inset ${categoryBadgeClass(issue.category)}`}>
                      {issue.category}
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* Employee Information */}
            <section className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="h-1 w-4 rounded-full bg-zinc-900" />
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Section 2: Stakeholders</h3>
              </div>
              <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                <div className="space-y-1.5">
                  <div className="flex items-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Ops Executive</p>
                    <ValidationHint valid={validation.employeeName} />
                  </div>
                  {isEdit ? (
                    <Autocomplete
                      value={form.employeeName}
                      onChange={(val) => handleChange("employeeName", val)}
                      suggestions={employeeSuggestions}
                      placeholder="Enter name..."
                    />
                  ) : (
                    <p className="text-sm font-bold text-zinc-900">{issue.employeeName}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Department/Team</p>
                    <ValidationHint valid={validation.subTeamName} />
                  </div>
                  {isEdit ? (
                    <Autocomplete
                      value={form.subTeamName}
                      onChange={(val) => handleChange("subTeamName", val)}
                      suggestions={subTeamSuggestions}
                      placeholder="Enter team..."
                    />
                  ) : (
                    <p className="text-sm font-semibold text-zinc-700">{issue.subTeamName}</p>
                  )}
                </div>
                <div className="col-span-2 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Supervising Manager</p>
                  {isEdit ? (
                    <input
                      type="text"
                      value={form.reportingManager}
                      onChange={(e) => handleChange("reportingManager", e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-zinc-700">{issue.reportingManager}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Work Details */}
            <section className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="h-1 w-4 rounded-full bg-zinc-900" />
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Section 3: Primary Narrative</h3>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Summary Statement</p>
                    <ValidationHint valid={validation.workTitle} />
                  </div>
                  {isEdit ? (
                    <input
                      type="text"
                      value={form.workTitle}
                      onChange={(e) => handleChange("workTitle", e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  ) : (
                    <p className="text-base font-bold text-zinc-900 leading-snug">{issue.workTitle}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Comprehensive Logs</p>
                  {isEdit ? (
                    <textarea
                      value={form.workDetails}
                      onChange={(e) => handleChange("workDetails", e.target.value)}
                      rows={8}
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  ) : (
                    <p className="text-sm leading-relaxed text-zinc-600 border-l-2 border-zinc-100 pl-4 py-1 italic">
                      "{issue.workDetails}"
                    </p>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-100 bg-zinc-50/30 px-8 py-6">
          {isEdit ? (
            <div className="space-y-4">
              {!isValid && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-[10px] font-bold uppercase tracking-tight text-red-700 ring-1 ring-inset ring-red-200">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Fields marked "Required" must be completed to proceed
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!isValid}
                  className="flex-1 rounded-xl bg-zinc-900 px-4 py-3 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreate ? "Create Record" : "Commit Entry"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isCreate) {
                      onClose();
                    } else {
                      setForm(issueToForm(issue));
                      setMode("read");
                    }
                  }}
                  className="rounded-xl border border-zinc-200 bg-white px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:bg-zinc-50 transition-all"
                >
                  {isCreate ? "Cancel" : "Discard"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMode("edit")}
                className="flex-1 rounded-xl bg-white border border-zinc-200 px-4 py-3 text-xs font-bold uppercase tracking-widest text-zinc-900 transition-all hover:bg-zinc-50 hover:border-zinc-300"
              >
                Modify Record
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-transparent bg-zinc-100 px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:bg-zinc-200 transition-all"
              >
                Exit
              </button>
              {!isCreate && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-xl border border-red-100 bg-red-50 px-6 py-3 text-xs font-bold uppercase tracking-widest text-red-600 hover:bg-red-100 transition-all ml-auto"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
