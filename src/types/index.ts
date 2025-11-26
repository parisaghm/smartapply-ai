
export type JobStatus = "interested" | "applied" | "interview" | "rejected" | "offer";

export interface JobApplication {
  id: string;
  companyName: string;
  jobTitle: string;
  dateApplied: string;
  jobLink?: string;
  location?: string;
  contactPerson?: string;
  interviewStep?: string;
  status: JobStatus;
  reasonOutcome?: string;
  resumeText?: string;
  notes?: string;
  followUpDate?: string;
  lastUpdated: string;
}

export interface ResumeAnalysis {
  strengths: string[];
  improvements: string[];
  tailoring: string[];
  customizedResume?: string;
  specificChanges?: string;
  coverLetter?: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  isGuest: boolean;
}

export interface JobFilter {
  status?: JobStatus;
  search?: string;
  dateRange?: [Date | null, Date | null];
  sortBy?: 'dateApplied' | 'companyName' | 'lastUpdated';
  sortDirection?: 'asc' | 'desc';
}
