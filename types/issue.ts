export enum Category {
    Issue = "Issue",
    Success = "Success",
    Warning = "Warning",
    Escalation = "Escalation",
    Appreciation = "Appreciation",
  }
  
  export interface IssueRecord {
    id: string;
    date: Date;
    employeeName: string;
    subTeamName: string;
    workTitle: string;
    workDetails: string;
    category: Category;
    reportingManager: string;
    studentEnd: boolean;
  }
  