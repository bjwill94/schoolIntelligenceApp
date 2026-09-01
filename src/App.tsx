import React, { useState, useEffect } from 'react';
import { ClassItem, ExamItem, ExamTabType, ScreenType, StudentItem, SubjectItem } from './types';
import { createDemoSeedData, generateId, getInitialData, saveClassesData } from './data/seed';
import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { ClassScreen } from './components/ClassScreen';
import { ExamScreen } from './components/ExamScreen';

export default function App() {
  const [classes, setClasses] = useState<ClassItem[]>(getInitialData);
  const [screen, setScreen] = useState<ScreenType>('home');
  const [currentClassId, setCurrentClassId] = useState<string | null>(null);
  const [currentExamId, setCurrentExamId] = useState<string | null>(null);
  const [examTab, setExamTab] = useState<ExamTabType>('entry');

  // Save to localStorage on change
  useEffect(() => {
    saveClassesData(classes);
  }, [classes]);

  const currentClass = classes.find((c) => c.id === currentClassId) || null;
  const currentExam = currentClass?.exams.find((e) => e.id === currentExamId) || null;

  // Navigation handlers
  const handleGoHome = () => {
    setScreen('home');
  };

  const handleOpenClass = (classId: string) => {
    setCurrentClassId(classId);
    setScreen('class');
  };

  const handleOpenExam = (classId: string, examId: string, tab: ExamTabType = 'entry') => {
    setCurrentClassId(classId);
    setCurrentExamId(examId);
    setExamTab(tab);
    setScreen('exam');
  };

  const handleCreateClass = (grade: string, section: string) => {
    const newClass: ClassItem = {
      id: generateId('c'),
      grade,
      section,
      exams: [],
    };
    const updated = [...classes, newClass];
    setClasses(updated);
    setCurrentClassId(newClass.id);
    setScreen('class');
  };

  const handleCreateExam = (classId: string, name: string, dateLabel: string) => {
    const cls = classes.find((c) => c.id === classId);
    if (!cls) return;

    let subjects: SubjectItem[] = [];
    let students: StudentItem[] = [];

    // Copy forward roster and subjects from latest exam if any
    if (cls.exams.length > 0) {
      const latest = cls.exams[cls.exams.length - 1];
      // Reuse subject IDs
      subjects = latest.subjects.map((s) => ({ ...s }));
      // Reuse student IDs and blank marks, preserving NA for optional subjects
      students = latest.students.map((st) => {
        const initialMarks: Record<string, string> = {};
        subjects.forEach((s) => {
          const prevVal = String(st.marks[s.id] || '').trim().toUpperCase();
          if (prevVal === 'NA' || prevVal === 'N/A' || prevVal === '-') {
            initialMarks[s.id] = 'NA';
          } else {
            initialMarks[s.id] = '';
          }
        });
        return {
          id: st.id,
          roll: st.roll,
          name: st.name,
          marks: initialMarks,
        };
      });
    }

    const newExam: ExamItem = {
      id: generateId('e'),
      name: name || 'New Exam',
      dateLabel: dateLabel || '',
      attendance: '',
      subjects,
      students,
      updatedLabel: 'Updated just now',
    };

    const updatedClasses = classes.map((c) =>
      c.id === classId ? { ...c, exams: [...c.exams, newExam] } : c
    );

    setClasses(updatedClasses);
    setCurrentClassId(classId);
    setCurrentExamId(newExam.id);
    setExamTab('entry');
    setScreen('exam');
  };

  const handleCreateExamWithData = (
    classId: string,
    name: string,
    dateLabel: string,
    subjects: SubjectItem[],
    students: StudentItem[]
  ) => {
    const newExam: ExamItem = {
      id: generateId('e'),
      name: name || 'Imported Exam',
      dateLabel: dateLabel || '',
      attendance: '',
      subjects,
      students,
      updatedLabel: 'Imported just now',
    };

    const updatedClasses = classes.map((c) =>
      c.id === classId ? { ...c, exams: [...c.exams, newExam] } : c
    );

    setClasses(updatedClasses);
    setCurrentClassId(classId);
    setCurrentExamId(newExam.id);
    setExamTab('entry');
    setScreen('exam');
  };

  const handleDeleteExam = (classId: string, examId: string) => {
    const updatedClasses = classes.map((c) => {
      if (c.id === classId) {
        return {
          ...c,
          exams: c.exams.filter((e) => e.id !== examId),
        };
      }
      return c;
    });
    setClasses(updatedClasses);
    if (currentExamId === examId) {
      setScreen('class');
    }
  };

  const handleDeleteClass = (classId: string) => {
    const updatedClasses = classes.filter((c) => c.id !== classId);
    setClasses(updatedClasses);
    setScreen('home');
  };

  const handleUpdateExam = (updatedExam: ExamItem) => {
    if (!currentClassId) return;
    const updatedClasses = classes.map((c) => {
      if (c.id === currentClassId) {
        return {
          ...c,
          exams: c.exams.map((e) => (e.id === updatedExam.id ? updatedExam : e)),
        };
      }
      return c;
    });
    setClasses(updatedClasses);
  };

  const handleResetDemo = () => {
    if (window.confirm('Reset all classes and exams to default sample demo data?')) {
      const demo = createDemoSeedData();
      setClasses(demo);
      setScreen('home');
      setCurrentClassId(null);
      setCurrentExamId(null);
    }
  };

  return (
    <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-7 pb-20 min-h-screen">
      <Header
        screen={screen}
        currentClass={currentClass}
        currentExam={currentExam}
        onGoHome={handleGoHome}
        onOpenClass={handleOpenClass}
        onResetDemo={handleResetDemo}
      />

      <main>
        {screen === 'home' && (
          <HomeScreen
            classes={classes}
            onOpenClass={handleOpenClass}
            onCreateClass={handleCreateClass}
          />
        )}

        {screen === 'class' && currentClass && (
          <ClassScreen
            currentClass={currentClass}
            onOpenExam={handleOpenExam}
            onCreateExam={handleCreateExam}
            onCreateExamWithData={handleCreateExamWithData}
            onDeleteExam={handleDeleteExam}
            onDeleteClass={handleDeleteClass}
          />
        )}

        {screen === 'exam' && currentClass && currentExam && (
          <ExamScreen
            currentClass={currentClass}
            currentExam={currentExam}
            activeTab={examTab}
            onTabChange={setExamTab}
            onUpdateExam={handleUpdateExam}
          />
        )}
      </main>
    </div>
  );
}
