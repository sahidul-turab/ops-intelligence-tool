import { Category, IssueRecord } from "../types/issue";

export type SummarySectionProps = {
  issues: IssueRecord[];
  title?: string;
};

export default function SummarySection({ issues, title = "Key Metrics" }: SummarySectionProps) {
  const totalRecords = issues.length;
  // Calculate counts for each category
  const countIssue = issues.filter((i) => i.category === Category.Issue).length;
  const countRisk = issues.filter((i) => i.category === Category.RiskWarning).length;
  const countAvailability = issues.filter((i) => i.category === Category.Availability).length;
  const countSuccess = issues.filter((i) => i.category === Category.Success).length;
  const countAppreciation = issues.filter((i) => i.category === Category.Appreciation).length;

  const cards = [
    { key: "total", label: "Total Logs", value: totalRecords, desc: "All recorded events", color: "zinc" },
    { key: "issue", label: "Issues", value: countIssue, desc: "Blockers/Problems", color: "red" },
    { key: "risk", label: "Potential Problem", value: countRisk, desc: "Risk Assessment", color: "amber" },
    { key: "availability", label: "Punctuality/Behaviour", value: countAvailability, desc: "Status Updates", color: "sky" },
    { key: "success", label: "Successes", value: countSuccess, desc: "Wins/Achievements", color: "emerald" },
    { key: "appreciation", label: "Appreciation", value: countAppreciation, desc: "Recognition", color: "pink" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.key}
          className={`rounded-xl border p-6 shadow-sm transition-colors ${card.color === "red" ? "border-red-900/30 bg-red-950/20" :
            card.color === "emerald" ? "border-emerald-900/30 bg-emerald-950/20" :
              card.color === "amber" ? "border-amber-900/30 bg-amber-950/20" :
                card.color === "sky" ? "border-sky-900/30 bg-sky-950/20" :
                  card.color === "pink" ? "border-pink-900/30 bg-pink-950/20" :
                    "border-zinc-800 bg-zinc-900/50"
            }`}
        >
          <div className="space-y-1">
            <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${card.color === "red" ? "text-red-400" :
              card.color === "emerald" ? "text-emerald-400" :
                card.color === "amber" ? "text-amber-400" :
                  card.color === "sky" ? "text-sky-400" :
                    card.color === "pink" ? "text-pink-400" :
                      "text-zinc-500"
              }`}>
              {card.label}
            </p>
            <p className="text-3xl font-bold tracking-tight text-zinc-100">
              {card.value.toLocaleString()}
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1.5">
            <div className={`h-1.5 w-1.5 rounded-full ${card.color === "red" ? "bg-red-500" :
              card.color === "emerald" ? "bg-emerald-500" :
                card.color === "amber" ? "bg-amber-500" :
                  card.color === "sky" ? "bg-sky-500" :
                    card.color === "pink" ? "bg-pink-500" :
                      "bg-zinc-600"
              }`} />
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{card.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
