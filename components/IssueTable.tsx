import { IssueRecord } from "../types/issue";

export type IssueTableProps = {
  issues: IssueRecord[];
  title?: string;
  onSelectIssue?: (issue: IssueRecord) => void;
};

function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

export default function IssueTable({ issues, title = "Granular Data", onSelectIssue }: IssueTableProps) {
  // Sort issues by date descending (Newest on top)
  const sortedIssues = [...issues].sort((a, b) => b.date.getTime() - a.date.getTime());
  const hasRows = sortedIssues.length > 0;

  const getCategoryStyles = (cat: string) => {
    switch (cat) {
      case "Issue":
      case "Risk / Warning":
        return "bg-red-950/40 text-red-400 ring-red-900/50";
      case "Success / Achievement":
      case "Appreciation":
        return "bg-emerald-950/40 text-emerald-400 ring-emerald-900/50";
      case "Availability Update":
        return "bg-sky-950/40 text-sky-400 ring-sky-900/50";
      default:
        return "bg-zinc-800 text-zinc-400 ring-zinc-700";
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black border border-zinc-800 shadow-sm">
            <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-tight">{title}</h2>
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">
              {issues.length} {issues.length === 1 ? 'Record' : 'Records'} total
            </p>
          </div>
        </div>
      </div>

      <div className="max-h-[500px] overflow-auto no-scrollbar">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 z-20 bg-black/95 backdrop-blur-sm">
            <tr className="border-b border-zinc-800">
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Date</th>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Employee</th>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Team</th>
              <th className="px-1 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Category</th>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Work Title</th>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Manager</th>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-center">Student End</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {!hasRows ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-zinc-500 bg-zinc-900">
                  No records found matching your criteria.
                </td>
              </tr>
            ) : (
              sortedIssues.map((it, idx) => (
                <tr
                  key={it.id}
                  onClick={onSelectIssue ? () => onSelectIssue(it) : undefined}
                  className={`group transition-colors overflow-hidden ${idx % 2 === 0 ? "bg-zinc-900" : "bg-zinc-900/50"
                    } ${onSelectIssue ? "cursor-pointer hover:bg-zinc-800" : ""}`}
                >
                  <td className="whitespace-nowrap px-6 py-3.5 text-[11px] font-medium text-zinc-400">
                    {formatDate(it.date)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3.5 text-xs font-bold text-zinc-200">
                    {it.employeeName}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3.5 text-[11px] font-medium text-zinc-400">
                    {it.subTeamName}
                  </td>
                  <td className="px-1 py-3.5">
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ring-1 ring-inset ${getCategoryStyles(it.category)}`}>
                      {it.category}
                    </span>
                  </td>
                  <td className="min-w-[240px] max-w-sm px-6 py-3.5">
                    <p className="line-clamp-1 text-xs font-semibold text-zinc-300" title={it.workTitle}>
                      {it.workTitle}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-6 py-3.5 text-[11px] font-medium text-zinc-500">
                    {it.reportingManager}
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <span
                      className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ring-1 ring-inset ${it.studentEnd
                        ? "bg-red-950/40 text-red-500 ring-red-900/50"
                        : "bg-zinc-800 text-zinc-500 ring-zinc-700"
                        }`}
                    >
                      {it.studentEnd ? "Yes" : "No"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
