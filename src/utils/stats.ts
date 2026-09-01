import { AttentionIssue, AttentionItem, ClassItem, ExamItem, ExamStatusType, InsightsData, StudentItem, SubjectItem, SubjectStat } from '../types';

export const bandColors: Record<number, string> = {
  1: 'var(--band1, #B24A2C)',
  2: 'var(--band2, #D98A4E)',
  3: 'var(--band3, #E2A93B)',
  4: 'var(--band4, #8CAE7C)',
  5: 'var(--band5, #3F7A5C)',
};

export const bandColorsHex: Record<number, string> = {
  1: '#B24A2C',
  2: '#D98A4E',
  3: '#E2A93B',
  4: '#8CAE7C',
  5: '#3F7A5C',
};

export const bandLabels: Record<number, string> = {
  1: 'Below passing',
  2: 'Needs practice',
  3: 'Satisfactory',
  4: 'Good',
  5: 'Excellent',
};

export function isAbsent(v: any): boolean {
  if (v === null || v === undefined) return false;
  const s = String(v).trim().toUpperCase();
  return s === 'AB' || s === 'ABSENT' || s === 'A';
}

export function isNA(v: any): boolean {
  if (v === null || v === undefined) return false;
  const s = String(v).trim().toUpperCase();
  return s === 'NA' || s === 'N/A' || s === '-';
}

export function isNumericMark(v: any): boolean {
  if (v === '' || v === null || v === undefined) return false;
  if (isAbsent(v) || isNA(v)) return false;
  return !isNaN(Number(v));
}

export function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function bandForMark(v: number, sub: SubjectItem): number {
  if (sub.max <= 0) return 1;
  const pct = (v / sub.max) * 100;
  if (pct >= 90) return 5;
  if (pct >= 75) return 4;
  if (pct >= 60) return 3;
  if (v >= sub.pass) return 2;
  return 1;
}

export function overallBand(pct: number): number {
  if (pct >= 90) return 5;
  if (pct >= 75) return 4;
  if (pct >= 60) return 3;
  if (pct >= 35) return 2;
  return 1;
}

export function studentPct(st: StudentItem, subjects: SubjectItem[]): number | null {
  let got = 0;
  let max = 0;
  let hasNumeric = false;
  subjects.forEach((sub) => {
    const v = st.marks[sub.id];
    if (isNumericMark(v)) {
      got += Number(v);
      max += sub.max;
      hasNumeric = true;
    }
  });
  return hasNumeric && max > 0 ? (got / max) * 100 : null;
}

export function studentTotalDisplay(st: StudentItem, subjects: SubjectItem[]): string {
  let got = 0;
  let max = 0;
  let numericCount = 0;
  let abCount = 0;
  let naCount = 0;

  subjects.forEach((sub) => {
    const v = st.marks[sub.id];
    if (isNumericMark(v)) {
      got += Number(v);
      max += sub.max;
      numericCount++;
    } else if (isAbsent(v)) {
      abCount++;
    } else if (isNA(v)) {
      naCount++;
    }
  });

  if (numericCount > 0 && max > 0) {
    const pct = ((got / max) * 100).toFixed(0);
    return abCount > 0 ? `${pct}% (AB)` : `${pct}%`;
  }

  if (abCount > 0 && numericCount === 0) {
    return 'AB';
  }

  if (naCount > 0 && numericCount === 0 && abCount === 0) {
    return 'NA';
  }

  return '—';
}

export function examStatus(exam: ExamItem): ExamStatusType {
  if (!exam.subjects || exam.subjects.length === 0 || !exam.students || exam.students.length === 0) {
    return 'not-started';
  }
  let total = 0;
  let filled = 0;
  exam.students.forEach((st) => {
    exam.subjects.forEach((sub) => {
      total++;
      const val = st.marks[sub.id];
      if (val !== '' && val !== undefined && val !== null) {
        filled++;
      }
    });
  });
  if (filled === 0) return 'not-started';
  if (filled === total) return 'completed';
  return 'in-progress';
}

export function statusLabel(s: ExamStatusType): string {
  switch (s) {
    case 'completed':
      return 'Completed';
    case 'in-progress':
      return 'In progress';
    case 'not-started':
    default:
      return 'Not started';
  }
}

export function computeInsights(exam: ExamItem): InsightsData | null {
  const subjects = exam.subjects || [];
  const students = exam.students || [];

  // Valid students are those who have at least one accounted mark (numeric, AB, or NA)
  const validStudents = students.filter((st) =>
    subjects.some((sub) => {
      const v = st.marks[sub.id];
      return v !== '' && v !== undefined && v !== null;
    })
  );

  if (subjects.length === 0 || validStudents.length === 0) {
    return null;
  }

  const attendance =
    exam.attendance === '' || exam.attendance === null || isNaN(Number(exam.attendance))
      ? null
      : Number(exam.attendance);

  const overallPcts = validStudents
    .map((st) => studentPct(st, subjects))
    .filter((v): v is number => v !== null);

  // Overall pass: for all enrolled subjects (not NA), student must not be AB and must have scored >= pass mark
  const overallPassCount = validStudents.filter((st) =>
    subjects.every((sub) => {
      const v = st.marks[sub.id];
      if (isNA(v) || v === '' || v === undefined || v === null) return true; // not taking or unassigned
      if (isAbsent(v)) return false; // absent counts as not passing
      return isNumericMark(v) && Number(v) >= sub.pass;
    })
  ).length;

  const passPct = validStudents.length > 0 ? (overallPassCount / validStudents.length) * 100 : 0;

  const subjStats: SubjectStat[] = subjects.map((sub) => {
    // Only include students who took the exam and have numeric scores
    const vals = validStudents
      .map((st) => st.marks[sub.id])
      .filter((v) => isNumericMark(v))
      .map(Number);

    if (vals.length === 0) {
      return { sub, avgPct: 0, n: 0, onTrack: 0, needsSupport: 0 };
    }
    const pcts = vals.map((v) => (v / sub.max) * 100);
    const onTrack = pcts.filter((p) => p >= 60).length;
    return {
      sub,
      avgPct: mean(pcts),
      n: vals.length,
      onTrack,
      needsSupport: pcts.length - onTrack,
    };
  });

  const sortedSubj = [...subjStats].sort((a, b) => a.avgPct - b.avgPct);
  const weakest = sortedSubj[0] || { sub: subjects[0], avgPct: 0, n: 0, onTrack: 0, needsSupport: 0 };
  const strongest = sortedSubj[sortedSubj.length - 1] || weakest;

  const distCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  overallPcts.forEach((p) => {
    distCounts[overallBand(p)]++;
  });

  const attention: AttentionItem[] = validStudents
    .map((st) => {
      const issues: AttentionIssue[] = [];
      const failing: SubjectItem[] = [];

      subjects.forEach((sub) => {
        const v = st.marks[sub.id];
        if (isNA(v) || v === '' || v === undefined || v === null) return;
        if (isAbsent(v)) {
          issues.push({ subject: sub, reason: 'absent' });
        } else if (isNumericMark(v) && Number(v) < sub.pass) {
          issues.push({ subject: sub, reason: 'below_pass' });
          failing.push(sub);
        }
      });

      return { st, issues, failing };
    })
    .filter((a) => a.issues.length > 0)
    .sort((a, b) => b.issues.length - a.issues.length);

  return {
    validStudents,
    overallPassCount,
    passPct,
    weakest,
    strongest,
    subjStats,
    distCounts,
    attention,
    attendance,
  };
}
