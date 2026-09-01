import { ClassItem, ExamItem, StudentItem, SubjectItem } from '../types';

const STORAGE_KEY = 'school_register_classes_v1';

export function getInitialData(): ClassItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse saved classes from localStorage', e);
  }
  return createDemoSeedData();
}

export function saveClassesData(classes: ClassItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(classes));
  } catch (e) {
    console.error('Failed to save classes to localStorage', e);
  }
}

export function createDemoSeedData(): ClassItem[] {
  let cid = 1;
  let eid = 1;
  let sid = 1;
  let tid = 1;

  const names15 = [
    'Aarav Sharma',
    'Priya Nair',
    'Rohan Verma',
    'Ishita Gupta',
    'Kabir Khan',
    'Ananya Reddy',
    'Vivaan Joshi',
    'Diya Patel',
    'Arjun Menon',
    'Sneha Iyer',
    'Aditya Rao',
    'Meera Pillai',
    'Karan Malhotra',
    'Tanvi Desai',
    'Yash Kulkarni',
  ];

  const raw15 = [
    [78, 65, 82, 70],
    [45, 38, 55, 50],
    [92, 88, 90, 85],
    [30, 28, 40, 35],
    [60, 72, 58, 66],
    [88, 91, 85, 89],
    [25, 32, 30, 29],
    [70, 68, 75, 72],
    [55, 48, 60, 52],
    [95, 90, 93, 96],
    [40, 35, 45, 38],
    [66, 70, 62, 68],
    [82, 79, 84, 80],
    [52, 55, 50, 58],
    [75, 80, 72, 77],
  ];

  // Class 10-A
  const subjA: SubjectItem[] = [
    { id: 'sub' + tid++, name: 'Mathematics', max: 100, pass: 33 },
    { id: 'sub' + tid++, name: 'Science', max: 100, pass: 33 },
    { id: 'sub' + tid++, name: 'English', max: 100, pass: 33 },
    { id: 'sub' + tid++, name: 'Social Science', max: 100, pass: 33 },
  ];

  const stuA1: StudentItem[] = names15.map((n, i) => ({
    id: 's' + sid++,
    roll: i + 1,
    name: n,
    marks: {
      [subjA[0].id]: raw15[i][0],
      [subjA[1].id]: raw15[i][1],
      [subjA[2].id]: i === 14 ? 'AB' : raw15[i][2], // Yash was absent for English in Term 1
      [subjA[3].id]: raw15[i][3],
    },
  }));

  const examA1: ExamItem = {
    id: 'e' + eid++,
    name: 'Term 1 Assessment',
    dateLabel: 'Jun 2026',
    attendance: 91,
    subjects: subjA,
    students: stuA1,
    updatedLabel: 'Updated 5 days ago',
  };

  // Term 2 for 10-A: copy roster/subjects, first 6 students filled
  const stuA2: StudentItem[] = stuA1.map((st) => ({
    id: st.id,
    roll: st.roll,
    name: st.name,
    marks: Object.fromEntries(subjA.map((s) => [s.id, ''])),
  }));

  const partial = [
    [70, 60, 75, 68],
    [50, 42, 58, 55],
    [88, 85, 86, 80],
    [35, 30, 42, 38],
    [65, 70, 60, 64],
    [80, 84, 79, 82],
  ];

  for (let i = 0; i < 6; i++) {
    subjA.forEach((s, j) => {
      stuA2[i].marks[s.id] = partial[i][j];
    });
  }

  const examA2: ExamItem = {
    id: 'e' + eid++,
    name: 'Term 2 Assessment',
    dateLabel: 'Sep 2026',
    attendance: '',
    subjects: subjA.map((s) => ({ ...s })),
    students: stuA2,
    updatedLabel: 'Updated today',
  };

  const class10A: ClassItem = {
    id: 'c' + cid++,
    grade: '10',
    section: 'A',
    exams: [examA1, examA2],
  };

  // Class 10-B
  const namesB = names15.slice(0, 8);
  const rawB = [
    [80, 75, 88],
    [55, 60, 58],
    [40, 35, 45],
    [92, 90, 95],
    [65, 70, 62],
    [30, 28, 38],
    [73, 68, 76],
    [85, 82, 88],
  ];

  const subjB: SubjectItem[] = [
    { id: 'sub' + tid++, name: 'Mathematics', max: 100, pass: 33 },
    { id: 'sub' + tid++, name: 'Science', max: 100, pass: 33 },
    { id: 'sub' + tid++, name: 'English', max: 100, pass: 33 },
  ];

  const stuB1: StudentItem[] = namesB.map((n, i) => ({
    id: 's' + sid++,
    roll: i + 1,
    name: n,
    marks: {
      [subjB[0].id]: rawB[i][0],
      [subjB[1].id]: rawB[i][1],
      [subjB[2].id]: rawB[i][2],
    },
  }));

  const examB1: ExamItem = {
    id: 'e' + eid++,
    name: 'Term 1 Assessment',
    dateLabel: 'Jun 2026',
    attendance: 88,
    subjects: subjB,
    students: stuB1,
    updatedLabel: 'Updated 3 days ago',
  };

  const class10B: ClassItem = {
    id: 'c' + cid++,
    grade: '10',
    section: 'B',
    exams: [examB1],
  };

  // Class 6-A (no exams yet)
  const class6A: ClassItem = {
    id: 'c' + cid++,
    grade: '6',
    section: 'A',
    exams: [],
  };

  return [class10A, class10B, class6A];
}

export function generateId(prefix: string): string {
  return prefix + Math.random().toString(36).substring(2, 9);
}
