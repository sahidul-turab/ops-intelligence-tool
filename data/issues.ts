import { Category, IssueRecord } from "../types/issue";

export const issues: IssueRecord[] = [
  {
    id: "ISS-1001",
    date: new Date("2026-01-03"),
    employeeName: "Amina Farouk",
    subTeamName: "Platform Ops",
    workTitle: "On-call handoff notes missing",
    workDetails:
      "Incoming on-call engineer reported incomplete handoff notes; updated the runbook template and added a checklist to the rotation handoff doc.",
    category: Category.Issue,
    reportingManager: "Daniel Okafor",
    studentEnd: false,
    employeeRoleLevel: 2,
  },
  {
    id: "ISS-1002",
    date: new Date("2026-01-06"),
    employeeName: "Jacob Miller",
    subTeamName: "Customer Support",
    workTitle: "Reduced ticket backlog",
    workDetails:
      "Cleared 42 aging tickets by batching triage and creating canned responses for the top 5 issue types; documented new workflow for the team.",
    category: Category.Success,
    reportingManager: "Priya Nair",
    studentEnd: false,
    employeeRoleLevel: 2,
  },
  {
    id: "ISS-1003",
    date: new Date("2026-01-09"),
    employeeName: "Sofia Alvarez",
    subTeamName: "Data Quality",
    workTitle: "Inconsistent daily report totals",
    workDetails:
      "Daily totals differed between dashboard and warehouse. Root cause: timezone conversion bug in one transform. Fixed and backfilled last 14 days.",
    category: Category.Issue,
    reportingManager: "Marcus Chen",
    studentEnd: true,
    employeeRoleLevel: 2,
  },
  {
    id: "ISS-1004",
    date: new Date("2026-01-12"),
    employeeName: "Noah Kim",
    subTeamName: "SRE",
    workTitle: "Improved alert signal-to-noise",
    workDetails:
      "Tuned alert thresholds and grouped noisy alerts; reduced paging volume by ~30% while keeping coverage for critical services.",
    category: Category.Success,
    reportingManager: "Elena Petrova",
    studentEnd: false,
    employeeRoleLevel: 2,
  },
  {
    id: "ISS-1005",
    date: new Date("2026-01-16"),
    employeeName: "Fatima Hassan",
    subTeamName: "Release Engineering",
    workTitle: "CI pipeline flaky tests",
    workDetails:
      "Intermittent failures in integration suite. Isolated to shared test fixtures; stabilized by resetting state and adding deterministic seed.",
    category: Category.Issue,
    reportingManager: "Thomas Reid",
    studentEnd: true,
    employeeRoleLevel: 2,
  },
  {
    id: "ISS-1006",
    date: new Date("2026-01-21"),
    employeeName: "Ethan Brooks",
    subTeamName: "Security Ops",
    workTitle: "Closed audit findings ahead of deadline",
    workDetails:
      "Coordinated remediation for 3 medium findings, verified controls, and provided evidence to auditors; all items accepted with no rework.",
    category: Category.Success,
    reportingManager: "Grace Liu",
    studentEnd: false,
    employeeRoleLevel: 2,
  },
];

