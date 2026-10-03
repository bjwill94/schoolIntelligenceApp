export type ReportSectionId =
  | 'summary'
  | 'distribution'
  | 'glance'
  | 'breakdown'
  | 'attention'
  | 'grid';

export const REPORT_SECTIONS: { id: ReportSectionId; label: string }[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'distribution', label: 'Class distribution' },
  { id: 'glance', label: 'Subjects at a glance' },
  { id: 'breakdown', label: 'Subject breakdown table' },
  { id: 'attention', label: 'Needs attention' },
  { id: 'grid', label: 'Full class grid' },
];

export interface ReportOptions {
  schoolName: string;
  preparedBy: string;
  sections: Record<ReportSectionId, boolean>;
  showNames: boolean;
}

const PREFS_KEY = 'school_register_report_prefs_v1';

export const defaultReportOptions = (): ReportOptions => ({
  schoolName: '',
  preparedBy: '',
  sections: {
    summary: true,
    distribution: true,
    glance: true,
    breakdown: true,
    attention: true,
    grid: true,
  },
  showNames: true,
});

export function loadReportOptions(): ReportOptions {
  const defaults = defaultReportOptions();
  try {
    const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null');
    if (!saved || typeof saved !== 'object') return defaults;
    return {
      schoolName: typeof saved.schoolName === 'string' ? saved.schoolName : '',
      preparedBy: typeof saved.preparedBy === 'string' ? saved.preparedBy : '',
      sections: { ...defaults.sections, ...(saved.sections || {}) },
      showNames: typeof saved.showNames === 'boolean' ? saved.showNames : true,
    };
  } catch {
    return defaults;
  }
}

export function saveReportOptions(options: ReportOptions) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(options));
  } catch (e) {
    console.error('Failed to save report preferences', e);
  }
}
