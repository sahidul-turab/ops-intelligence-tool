import { useState, useEffect } from "react";
import { Category, IssueRecord } from "../types/issue";

export type CalendarViewProps = {
  issues: IssueRecord[];
  title?: string;
  onSelectIssue?: (issue: IssueRecord) => void;
  onAddEvent?: (date: Date) => void;
};

function toDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function categoryStyles(category: Category): string {
  switch (category) {
    case Category.Issue:
      return "border-l-2 border-red-900 bg-red-950/30 text-red-400 hover:bg-red-900/50 transition-colors";
    case Category.Success:
      return "border-l-2 border-emerald-900 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-900/50 transition-colors";
    case Category.RiskWarning:
      return "border-l-2 border-amber-900 bg-amber-950/30 text-amber-400 hover:bg-amber-900/50 transition-colors";
    case Category.Availability:
      return "border-l-2 border-sky-900 bg-sky-950/30 text-sky-400 hover:bg-sky-900/50 transition-colors";
    case Category.Appreciation:
      return "border-l-2 border-pink-900 bg-pink-950/30 text-pink-400 hover:bg-pink-900/50 transition-colors";
    default:
      return "border-l-2 border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors";
  }
}

export default function CalendarView({ issues, title = "Calendar View", onSelectIssue, onAddEvent }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  if (!currentDate) return null; // Prevent hydration mismatch

  const monthStart = startOfMonth(currentDate);
  const firstWeekday = monthStart.getDay(); // 0 = Sunday
  const dim = daysInMonth(currentDate);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const issuesByDay = issues.reduce<Record<string, IssueRecord[]>>((acc, issue) => {
    const key = toDayKey(issue.date);
    if (!acc[key]) acc[key] = [];
    acc[key].push(issue);
    return acc;
  }, {});

  const cells: Array<{ date: Date | null }> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ date: null });
  for (let day = 1; day <= dim; day++) {
    cells.push({ date: new Date(currentDate.getFullYear(), currentDate.getMonth(), day) });
  }
  while (cells.length % 7 !== 0) cells.push({ date: null });

  const monthLabel = currentDate.toLocaleString(undefined, { month: "long", year: "numeric" });

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-black shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 bg-zinc-900/30 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          {/* Date Display */}
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-white tracking-tight leading-none">{monthLabel}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{currentDate.getFullYear()}</span>
              <span className="h-0.5 w-0.5 rounded-full bg-zinc-600" />
              <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest">{title}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 rounded-lg bg-zinc-900/50 p-1 border border-zinc-800">
          <button
            type="button"
            onClick={prevMonth}
            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all"
          >
            <span className="text-lg leading-none -mt-0.5">‹</span>
          </button>
          <button
            type="button"
            onClick={goToToday}
            className="px-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
          >
            Today
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all"
          >
            <span className="text-lg leading-none -mt-0.5">›</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="bg-zinc-900/20">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b border-zinc-800/50">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
            <div key={label} className="py-3 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 border-l border-zinc-800/50">
          {cells.map((cell, idx) => {
            // Empty filler cells
            if (!cell.date) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="min-h-[6rem] border-b border-r border-zinc-800/50 bg-zinc-900/10"
                />
              );
            }

            const key = toDayKey(cell.date);
            const events = issuesByDay[key] ?? [];
            const isToday = toDayKey(new Date()) === key;
            const hasEvents = events.length > 0;

            // Limit shown events
            const MAX_VISIBLE_EVENTS = 2;
            const visibleEvents = events.slice(0, MAX_VISIBLE_EVENTS);
            const remaining = events.length - MAX_VISIBLE_EVENTS;

            return (
              <div
                key={key}
                className={`relative flex min-h-[6rem] flex-col border-b border-r border-zinc-800/50 p-2 transition-all duration-200 group
                    ${isToday ? "bg-zinc-900/80" : "hover:bg-zinc-900/40"}
                `}
              >
                {/* Date Number */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors
                            ${isToday
                        ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                        : "text-zinc-500 group-hover:text-zinc-300"
                      }
                        `}
                  >
                    {cell.date.getDate()}
                  </span>
                  {/* Add Button (visible on hover) */}
                  {onAddEvent && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddEvent(cell.date!);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-white"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Events Stack */}
                <div className="flex-1 space-y-1">
                  {visibleEvents.map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={onSelectIssue ? (e) => { e.stopPropagation(); onSelectIssue(ev); } : undefined}
                      className={`w-full text-left px-1.5 py-1 rounded border-l-2 text-[9px] leading-tight transition-all hover:scale-[1.02] active:scale-[0.98] ${categoryStyles(ev.category)}`}
                    >
                      <p className="font-bold truncate opacity-90">{ev.employeeName}</p>
                      <p className="truncate opacity-70 font-medium">{ev.workTitle}</p>
                    </button>
                  ))}

                  {/* More Indicator */}
                  {remaining > 0 && (
                    <div className="px-1.5 py-1">
                      <span className="text-[9px] font-bold text-zinc-500 group-hover:text-zinc-400 transition-colors">
                        +{remaining} more...
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {issues.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center border-t border-zinc-800">
          <div className="mb-4 rounded-full bg-zinc-900 p-4 border border-zinc-800">
            <svg className="h-6 w-6 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-zinc-500">No events scheduled</p>
        </div>
      )}
    </section>
  );
}
