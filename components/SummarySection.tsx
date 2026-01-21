import { Category, IssueRecord } from "../types/issue";

export type SummarySectionProps = {
  issues: IssueRecord[];
  title?: string;
};

export default function SummarySection({ issues, title = "Key Metrics" }: SummarySectionProps) {
  const totalRecords = issues.length;
  const totalIssues = issues.filter((i) => i.category === Category.Issue).length;
  const totalSuccesses = issues.filter((i) => i.category === Category.Success).length;
  const totalStudentEndIssues = issues.filter((i) => i.studentEnd).length;

  const cards = [
    { key: "total", label: "Total Records", value: totalRecords, desc: "Total logs in period", color: "zinc" },
    { key: "issues", label: "Total Issues", value: totalIssues, desc: "Action required", color: "red" },
    { key: "successes", label: "Total Successes", value: totalSuccesses, desc: "Resolutions", color: "emerald" },
    { key: "studentEnd", label: "Student-End", value: totalStudentEndIssues, desc: "User impacting", color: "amber" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.key}
          className={`rounded-xl border p-6 shadow-sm transition-colors ${card.color === "red" ? "border-red-100 bg-red-50/50" :
              card.color === "emerald" ? "border-emerald-100 bg-emerald-50/50" :
                card.color === "amber" ? "border-amber-100 bg-amber-50/50" :
                  "border-zinc-200 bg-white"
            }`}
        >
          <div className="space-y-1">
            <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${card.color === "red" ? "text-red-600" :
                card.color === "emerald" ? "text-emerald-600" :
                  card.color === "amber" ? "text-amber-600" :
                    "text-zinc-400"
              }`}>
              {card.label}
            </p>
            <p className="text-3xl font-bold tracking-tight text-zinc-900">
              {card.value.toLocaleString()}
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1.5">
            <div className={`h-1.5 w-1.5 rounded-full ${card.color === "red" ? "bg-red-400" :
                card.color === "emerald" ? "bg-emerald-400" :
                  card.color === "amber" ? "bg-amber-400" :
                    "bg-zinc-300"
              }`} />
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{card.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
