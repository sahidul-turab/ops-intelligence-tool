export enum Category {
  Issue = "Issue",
  RiskWarning = "Risk / Warning",
  Availability = "Availability Update",
  Success = "Success / Achievement",
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
  employeeRoleLevel: number;
}
