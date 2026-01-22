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
  employeeProfiles?: Record<string, { subTeamName: string; reportingManager: string; employeeRoleLevel: number }>;
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
  employeeRoleLevel: number;
};

const ROLE_LEVEL_LABELS: Record<number, string> = {
  1: "Junior Executive",
  2: "Executive",
  3: "Senior Executive",
  4: "Lead",
  5: "Manager",
};

function formatDisplayDate(d: Date): string {
  return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function categoryBadgeClass(category: Category): string {
  switch (category) {
    case Category.Issue:
      return "bg-red-500/10 text-red-400 ring-red-500/20";
    case Category.Success:
      return "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20";
    case Category.RiskWarning:
      return "bg-amber-500/10 text-amber-400 ring-amber-500/20";
    case Category.Availability:
      return "bg-sky-500/10 text-sky-400 ring-sky-500/20";
    case Category.Appreciation:
      return "bg-pink-500/10 text-pink-400 ring-pink-500/20";
    default:
      return "bg-zinc-500/10 text-zinc-400 ring-zinc-500/20";
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
    employeeRoleLevel: issue.employeeRoleLevel ?? 2,
  };
}

/** Simple Markdown-to-JSX Parser for the logs */
function renderMarkdown(text: string) {
  if (!text) return null;

  // Split by lines to handle list items and blockquotes
  const lines = text.split('\n');
  return lines.map((line, i) => {
    let content: any = line;

    // Handle Blockquote
    if (line.startsWith('> ')) {
      return (
        <blockquote key={i} className="border-l-4 border-zinc-700 pl-4 py-1 my-2 bg-zinc-900/40 rounded-r-lg text-zinc-300 italic">
          {renderInlineMarkdown(line.slice(2))}
        </blockquote>
      );
    }

    // Handle Bullet Points
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return (
        <li key={i} className="ml-4 list-disc text-zinc-400 mb-1">
          {renderInlineMarkdown(line.slice(2))}
        </li>
      );
    }

    // Handle Numbered List
    if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+\.\s)(.*)/);
      return (
        <li key={i} className="ml-4 list-decimal text-zinc-400 mb-1">
          {renderInlineMarkdown(match ? match[2] : line)}
        </li>
      );
    }

    // Default line
    return (
      <div key={i} className="min-h-[1.2em] mb-1">
        {renderInlineMarkdown(line)}
      </div>
    );
  });
}

function renderInlineMarkdown(text: string) {
  let parts: (string | React.ReactNode)[] = [text];

  // Bold (**text**)
  parts = parts.flatMap(p => {
    if (typeof p !== 'string') return p;
    const split = p.split(/(\*\*.*?\*\*)/g);
    return split.map(s => s.startsWith('**') && s.endsWith('**') ? <strong className="text-zinc-100 font-bold">{s.slice(2, -2)}</strong> : s);
  });

  // Italic (_text_ or *text*)
  parts = parts.flatMap(p => {
    if (typeof p !== 'string') return p;
    const split = p.split(/(_.*?_|\*.*?\*)/g);
    return split.map(s => (s.startsWith('_') && s.endsWith('_')) || (s.startsWith('*') && s.endsWith('*')) ? <em className="italic text-zinc-300">{s.slice(1, -1)}</em> : s);
  });

  // Underline (<u>text</u>)
  parts = parts.flatMap(p => {
    if (typeof p !== 'string') return p;
    const split = p.split(/(<u>.*?<\/u>)/g);
    return split.map(s => s.startsWith('<u>') && s.endsWith('</u>') ? <span className="underline decoration-zinc-500">{s.slice(3, -4)}</span> : s);
  });

  return parts;
}

export default function IssueDrawer({
  open,
  issue,
  onClose,
  onSave,
  onDelete,
  employeeSuggestions,
  subTeamSuggestions,
  employeeProfiles,
}: IssueDrawerProps) {
  const [mode, setMode] = useState<"read" | "edit">("read");
  const [form, setForm] = useState<FormState | null>(null);

  const isCreate = issue ? !issue.employeeName : false;

  useEffect(() => {
    if (issue) {
      setForm(issueToForm(issue));
      if (isCreate) {
        setMode("edit");
      } else {
        setMode("read");
      }
    }
  }, [issue, isCreate]);

  if (!open || !issue || !form) return null;

  const handleChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => {
      if (!prev) return prev;
      const newState = { ...prev, [key]: value };

      if (key === "employeeName" && employeeProfiles) {
        const profile = employeeProfiles[value as string];
        if (profile) {
          newState.subTeamName = profile.subTeamName;
          newState.reportingManager = profile.reportingManager;
          newState.employeeRoleLevel = profile.employeeRoleLevel;
        }
      }

      return newState;
    });
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
      employeeRoleLevel: form.employeeRoleLevel,
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

  const insertFormatting = (type: 'bold' | 'italic' | 'underline' | 'bullet' | 'number' | 'quote' | 'clear') => {
    const textarea = document.getElementById("workDetails-textarea") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    let result = text;
    let newCursorPos = start;

    switch (type) {
      case 'bold':
        result = text.substring(0, start) + "**" + selected + "**" + text.substring(end);
        newCursorPos = start + 2;
        break;
      case 'italic':
        result = text.substring(0, start) + "_" + selected + "_" + text.substring(end);
        newCursorPos = start + 1;
        break;
      case 'underline':
        result = text.substring(0, start) + "<u>" + selected + "</u>" + text.substring(end);
        newCursorPos = start + 3;
        break;
      case 'bullet':
        result = text.substring(0, start) + "\n- " + selected + text.substring(end);
        newCursorPos = start + 3;
        break;
      case 'number':
        result = text.substring(0, start) + "\n1. " + selected + text.substring(end);
        newCursorPos = start + 4;
        break;
      case 'quote':
        result = text.substring(0, start) + "\n> " + selected + text.substring(end);
        newCursorPos = start + 3;
        break;
      case 'clear':
        // Strip markdown-like symbols
        const cleared = selected
          .replace(/\*\*|\*|_/g, '')
          .replace(/<u>|<\/u>/g, '')
          .replace(/^[\s]*[-*+]\s+/gm, '')
          .replace(/^[\s]*\d+\.\s+/gm, '')
          .replace(/^[\s]*>\s+/gm, '');
        result = text.substring(0, start) + cleared + text.substring(end);
        newCursorPos = start;
        break;
    }

    handleChange("workDetails", result);

    setTimeout(() => {
      textarea.focus();
      if (selected.length > 0) {
        textarea.setSelectionRange(start, start + (result.length - text.length + selected.length));
      } else {
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 10);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        aria-label="Close details"
        onClick={onClose}
      />

      <aside className="relative flex max-h-[90vh] w-full max-w-5xl flex-col rounded-3xl bg-black border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="border-b border-zinc-800 px-8 py-5 bg-black">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-tight ring-1 ring-inset ${isCreate ? "bg-zinc-800 text-zinc-300 ring-zinc-700" :
                  isEdit ? "bg-zinc-800 text-zinc-300 ring-zinc-700" : categoryBadgeClass(issue.category)
                  }`}>
                  {isCreate ? "NEW RECORD" : (isEdit ? form.category : issue.category)}
                </span>
                <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">
                  {isCreate ? "DRAFT" : `LOG #${isEdit ? form.id.slice(-6) : issue.id.slice(-6)}`}
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white line-clamp-1">
                {isEdit ? (isCreate ? "Create New Incident Log" : "Edit Incident Log") : issue.workTitle}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-zinc-500 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-8 no-scrollbar">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* LEFT COLUMN */}
            <div className="w-full lg:w-5/12 space-y-10">
              <section className="space-y-4">
                <div className="border-b border-zinc-800/50 pb-2">
                  <h3 className="text-xs font-semibold text-zinc-400">Context</h3>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">Incident Date <span className="text-red-500">*</span></p>
                    {isEdit ? (
                      <input
                        type="date"
                        value={form.date}
                        onChange={(e) => handleChange("date", e.target.value)}
                        className="w-full h-10 rounded-xl border border-white/5 bg-zinc-900/50 px-3 text-xs text-zinc-300 focus:border-white/20 focus:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-white/20 color-scheme-dark transition-all"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-zinc-200">{formatDisplayDate(issue.date)}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">Student Facing</p>
                    {isEdit ? (
                      <button
                        type="button"
                        onClick={() => handleChange("studentEnd", !form.studentEnd)}
                        className={`inline-flex items-center gap-2 rounded-xl border px-3 text-[10px] font-medium transition-all w-full h-10 justify-center ${form.studentEnd
                          ? "border-red-500/20 bg-red-500/5 text-red-400"
                          : "border-white/5 bg-zinc-900/50 text-zinc-500"
                          }`}
                      >
                        <div className={`h-1 w-1 rounded-full ${form.studentEnd ? "bg-red-400 animate-pulse" : "bg-zinc-600"}`} />
                        {form.studentEnd ? "YES, USER FACING" : "NO, INTERNAL"}
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 h-10">
                        <div className={`h-1.5 w-1.5 rounded-full ${issue.studentEnd ? "bg-red-500" : "bg-zinc-600"}`} />
                        <p className={`text-xs font-bold uppercase tracking-tight ${issue.studentEnd ? "text-red-500" : "text-zinc-500"}`}>
                          {issue.studentEnd ? "User Facing" : "Internal"}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">Classification <span className="text-red-500">*</span></p>
                    {isEdit ? (
                      <select
                        value={form.category}
                        onChange={(e) => handleChange("category", e.target.value as Category)}
                        className="w-full h-10 rounded-xl border border-white/5 bg-zinc-900/50 px-3 text-xs text-zinc-300 focus:border-white/20 focus:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
                      >
                        {Object.values(Category).map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center h-10">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-tight ring-1 ring-inset ${categoryBadgeClass(issue.category)}`}>
                          {issue.category}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="border-b border-zinc-800/50 pb-2">
                  <h3 className="text-xs font-semibold text-zinc-400">Stakeholders</h3>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">Ops Executive <span className="text-red-500">*</span></p>
                    {isEdit ? (
                      <Autocomplete
                        value={form.employeeName}
                        onChange={(val) => handleChange("employeeName", val)}
                        suggestions={employeeSuggestions}
                        placeholder="Name"
                      />
                    ) : (
                      <p className="text-sm font-bold text-zinc-200">{issue.employeeName}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">Department <span className="text-red-500">*</span></p>
                    {isEdit ? (
                      <Autocomplete
                        value={form.subTeamName}
                        onChange={(val) => handleChange("subTeamName", val)}
                        suggestions={subTeamSuggestions}
                        placeholder="Department"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-zinc-400">{issue.subTeamName}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">Role Level</p>
                    {isEdit ? (
                      <select
                        value={form.employeeRoleLevel}
                        onChange={(e) => handleChange("employeeRoleLevel", parseInt(e.target.value, 10))}
                        className="w-full h-10 rounded-xl border border-white/5 bg-zinc-900/50 px-3 text-xs text-zinc-300 focus:border-white/20 focus:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
                      >
                        {Object.entries(ROLE_LEVEL_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm font-semibold text-zinc-200">{ROLE_LEVEL_LABELS[form.employeeRoleLevel] || `Level ${form.employeeRoleLevel}`}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">Supervisor</p>
                    {isEdit ? (
                      <Autocomplete
                        value={form.reportingManager}
                        onChange={(val) => handleChange("reportingManager", val)}
                        suggestions={employeeSuggestions}
                        placeholder="Supervisor"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-zinc-400">{issue.reportingManager}</p>
                    )}
                  </div>
                </div>
              </section>
            </div>

            {/* RIGHT COLUMN */}
            <div className="w-full lg:w-7/12">
              <section className="space-y-4 h-full flex flex-col">
                <div className="border-b border-zinc-800/50 pb-2">
                  <h3 className="text-xs font-semibold text-zinc-400">Narrative</h3>
                </div>
                <div className="space-y-6 flex-1 flex flex-col pt-2">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">Summary Statement <span className="text-red-500">*</span></p>
                    {isEdit ? (
                      <input
                        type="text"
                        value={form.workTitle}
                        onChange={(e) => handleChange("workTitle", e.target.value)}
                        className="w-full h-10 rounded-xl border border-white/5 bg-zinc-900/50 px-4 text-sm text-zinc-300 focus:border-white/20 focus:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
                        placeholder="Headline"
                      />
                    ) : (
                      <p className="text-lg font-bold text-zinc-100 leading-snug">{issue.workTitle}</p>
                    )}
                  </div>
                  <div className="space-y-1.5 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">Comprehensive Logs</p>
                      {isEdit && (
                        <div className="flex gap-1">
                          <ToolbarButton onClick={() => insertFormatting('bold')} title="Bold">B</ToolbarButton>
                          <ToolbarButton onClick={() => insertFormatting('italic')} title="Italic"><span className="italic">I</span></ToolbarButton>
                          <ToolbarButton onClick={() => insertFormatting('underline')} title="Underline"><span className="underline">U</span></ToolbarButton>
                          <ToolbarSeparator />
                          <ToolbarButton onClick={() => insertFormatting('bullet')} title="Bullets">•</ToolbarButton>
                          <ToolbarButton onClick={() => insertFormatting('number')} title="Numbers">1.</ToolbarButton>
                          <ToolbarButton onClick={() => insertFormatting('quote')} title="Quote">”</ToolbarButton>
                          <ToolbarSeparator />
                          <ToolbarButton onClick={() => insertFormatting('clear')} title="Clear Formatting">Tx</ToolbarButton>
                        </div>
                      )}
                    </div>
                    {isEdit ? (
                      <textarea
                        id="workDetails-textarea"
                        value={form.workDetails}
                        onChange={(e) => handleChange("workDetails", e.target.value)}
                        className="w-full rounded-2xl border border-white/5 bg-zinc-900/50 px-4 py-4 text-sm text-zinc-300 focus:border-white/20 focus:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-white/20 resize-none flex-1 transition-all"
                        placeholder="Enter detailed logs..."
                      />
                    ) : (
                      <div className="flex-1 bg-zinc-900/30 rounded-2xl border border-white/5 p-6 mt-1 overflow-y-auto max-h-[400px]">
                        <div className="text-sm leading-relaxed text-zinc-400">
                          {renderMarkdown(issue.workDetails)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 bg-black px-8 py-5">
          {isEdit ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className={`h-1.5 w-1.5 rounded-full ${isValid ? "bg-emerald-500" : "bg-zinc-700"}`} />
                <span className="text-[10px] font-medium tracking-tight text-zinc-500 uppercase">
                  {isValid ? "Ready to commit" : "Required fields missing"}
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => isCreate ? onClose() : (setForm(issueToForm(issue!)), setMode("read"))}
                  className="rounded-xl border border-white/5 bg-zinc-900/50 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:bg-zinc-900 hover:text-white transition-all"
                >
                  {isCreate ? "Cancel" : "Discard"}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!isValid}
                  className="rounded-xl bg-white px-8 py-2.5 text-xs font-bold uppercase tracking-widest text-black transition-all hover:bg-zinc-200 disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  {isCreate ? "Create Record" : "Commit Entry"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              {!isCreate && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500/50 hover:text-red-500 transition-colors"
                >
                  Archive Record
                </button>
              )}
              <div className="flex gap-3 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-white/5 bg-zinc-900/50 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:bg-zinc-900 hover:text-white transition-all"
                >
                  Exit
                </button>
                <button
                  type="button"
                  onClick={() => setMode("edit")}
                  className="rounded-xl bg-white border border-zinc-200 px-8 py-2.5 text-xs font-bold uppercase tracking-widest text-zinc-900 transition-all hover:bg-zinc-200"
                >
                  Modify
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function ToolbarButton({ onClick, children, title }: { onClick: () => void, children: React.ReactNode, title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="h-7 w-7 flex items-center justify-center rounded-md border border-white/5 bg-zinc-900 text-[11px] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all active:scale-95"
    >
      {children}
    </button>
  );
}

function ToolbarSeparator() {
  return <div className="w-[1px] h-4 bg-zinc-800 mx-1 self-center" />;
}
