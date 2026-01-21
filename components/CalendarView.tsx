import { Category, IssueRecord } from "../types/issue";

export type CalendarViewProps = {
  issues: IssueRecord[];
  title?: string;
  onSelectIssue?: (issue: IssueRecord) => void;
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
      return "border-l-2 border-red-200 bg-red-50/50 text-red-700 hover:bg-red-50 transition-colors";
    case Category.Success:
      return "border-l-2 border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-50 transition-colors";
    case Category.Warning:
      return "border-l-2 border-amber-200 bg-amber-50/50 text-amber-700 hover:bg-amber-50 transition-colors";
    default:
      return "border-l-2 border-zinc-200 bg-zinc-50/50 text-zinc-500 hover:bg-zinc-100 transition-colors";
  }
}

export default function CalendarView({ issues, title = "Calendar View", onSelectIssue }: CalendarViewProps) {
  const sorted = [...issues].sort((a, b) => a.date.getTime() - b.date.getTime());
  const baseDate = sorted[0]?.date ?? new Date();

  const monthStart = startOfMonth(baseDate);
  const firstWeekday = monthStart.getDay(); // 0 = Sunday
  const dim = daysInMonth(baseDate);

  const issuesByDay = issues.reduce<Record<string, IssueRecord[]>>((acc, issue) => {
    const key = toDayKey(issue.date);
    if (!acc[key]) acc[key] = [];
    acc[key].push(issue);
    return acc;
  }, {});

  const cells: Array<{ date: Date | null }> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ date: null });
  for (let day = 1; day <= dim; day++) {
    cells.push({ date: new Date(baseDate.getFullYear(), baseDate.getMonth(), day) });
  }
  while (cells.length % 7 !== 0) cells.push({ date: null });

  const monthLabel = baseDate.toLocaleString(undefined, { month: "long", year: "numeric" });

  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-zinc-200 shadow-sm">
            <svg className="h-4 w-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-tight">{monthLabel}</h2>
            <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest">{title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-400 hover:text-zinc-600 hover:border-zinc-300 transition-colors disabled:opacity-50"
            disabled
          >
            <span className="text-lg leading-none">‹</span>
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-400 hover:text-zinc-600 hover:border-zinc-300 transition-colors disabled:opacity-50"
            disabled
          >
            <span className="text-lg leading-none">›</span>
          </button>
        </div>
      </div>

      <div className="p-1">
        <div className="grid grid-cols-7 border-b border-zinc-100 pb-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
            <div key={label} className="py-2 text-center text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-zinc-100">
          {cells.map((cell, idx) => {
            if (!cell.date) {
              return <div key={`empty-${idx}`} className="h-32 bg-zinc-50/50" />;
            }

            const key = toDayKey(cell.date);
            const events = issuesByDay[key] ?? [];
            const isToday = toDayKey(new Date()) === key;

            return (
              <div
                key={key}
                className={`relative flex h-32 flex-col gap-1 bg-white p-2 transition-colors hover:bg-zinc-50/30 ${isToday ? "ring-1 ring-inset ring-zinc-900 z-10" : ""
                  }`}
              >
                <div className="flex items-center justify-between">
                  {events.length > 0 ? (
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">
                      {events.length} {events.length === 1 ? 'event' : 'events'}
                    </span>
                  ) : <span />}
                  <span className={`text-xs font-bold ${isToday ? "text-zinc-900" : "text-zinc-400"}`}>
                    {cell.date.getDate()}
                  </span>
                </div>

                <div className="mt-1 space-y-1 overflow-y-auto no-scrollbar">
                  {events.map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={onSelectIssue ? () => onSelectIssue(ev) : undefined}
                      className={`group flex w-full flex-col rounded px-2 py-1 text-left transition-all ${categoryStyles(
                        ev.category,
                      )} ${onSelectIssue ? "cursor-pointer" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate text-[9px] font-bold uppercase tracking-tight">
                          {ev.employeeName}
                        </span>
                      </div>
                      <span className="truncate text-[10px] leading-tight font-medium opacity-80">
                        {ev.workTitle}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {issues.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="mb-3 rounded-full bg-zinc-100 p-3">
            <svg className="h-6 w-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-zinc-500">No events scheduled for this period</p>
        </div>
      )}
    </section>
  );
}
