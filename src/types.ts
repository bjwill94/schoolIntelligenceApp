export interface SubjectItem {
  id: string;
  name: string;
  max: number;
  pass: number;
}

export interface StudentItem {
  id: string;
  roll: number;
  name: string;
  marks: Record<string, number | string>; // subjectId -> mark score or ''
}

export interface ExamItem {
  id: string;
  name: string;
  dateLabel: string;
  attendance: number | string; // class avg attendance % or ''
  subjects: SubjectItem[];
  students: StudentItem[];
  updatedLabel: string;
}

export interface ClassItem {
  id: string;
  grade: string;
  section: string;
  exams: ExamItem[];
}

export type ExamStatusType = 'not-started' | 'in-progress' | 'completed';

export type ScreenType = 'login' | 'home' | 'class' | 'exam';

export type ExamTabType = 'entry' | 'insights';

export interface SubjectStat {
  sub: SubjectItem;
  avgScore: number;
  avgPct: number;
  n: number; // numeric + AB (absent counted as 0); NA and blank excluded
  appeared: number;
  absent: number;
  appearedAvgScore: number;
  appearedAvgPct: number;
  onTrack: number;
  needsSupport: number;
  minScore: number;
  maxScore: number;
}

export interface AttentionIssue {
  subject: SubjectItem;
  reason: 'below_pass' | 'absent';
}

export interface AttentionItem {
  st: StudentItem;
  issues: AttentionIssue[];
  failing: SubjectItem[];
}

export interface InsightsData {
  validStudents: StudentItem[];
  overallPassCount: number;
  passPct: number;
  weakest: SubjectStat;
  strongest: SubjectStat;
  subjStats: SubjectStat[];
  distCounts: Record<number, number>; // 1..5 -> count
  attention: AttentionItem[];
  attendance: number | null;
}
