import React, { useState, useEffect, useRef } from 'react';
import { ClassItem, ExamItem, ExamTabType, ScreenType, StudentItem, SubjectItem } from './types';
import { createDemoSeedData, generateId, getInitialData, saveClassesData } from './data/seed';
import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { ClassScreen } from './components/ClassScreen';
import { ExamScreen } from './components/ExamScreen';
import { LoginScreen } from './components/LoginScreen';
import { AuthModal } from './components/AuthModal';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import {
  loadClassesForUser,
  syncClassToSupabase,
  syncAllClassesToSupabase,
  deleteClassFromSupabase,
} from './services/dbService';

export default function App() {
  const [classes, setClasses] = useState<ClassItem[]>(getInitialData);
  // Default to login screen so users can sign in to their Supabase account
  const [screen, setScreen] = useState<ScreenType>('login');
  const [currentClassId, setCurrentClassId] = useState<string | null>(null);
  const [currentExamId, setCurrentExamId] = useState<string | null>(null);
  const [examTab, setExamTab] = useState<ExamTabType>('entry');

  // Supabase Auth and Sync state
  const [user, setUser] = useState<any | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'saved' | 'error'>('saved');
  const [authChecked, setAuthChecked] = useState(false);
  const isInitialLoadRef = useRef(true);

  // Check initial Supabase session on app launch
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthChecked(true);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        handleUserSignedIn(session.user);
        setScreen('home');
      }
      setAuthChecked(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        handleUserSignedIn(session.user);
        setScreen((prev) => (prev === 'login' ? 'home' : prev));
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // When a user signs in, load their classes from Supabase
  const handleUserSignedIn = async (signedInUser: any) => {
    setSyncState('syncing');
    try {
      const userClasses = await loadClassesForUser(signedInUser.id);
      setClasses(userClasses);
      setSyncState('saved');
    } catch (err) {
      console.error('Failed to load user classes:', err);
      setSyncState('error');
    }
  };

  const handleSignOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setClasses(getInitialData());
    setScreen('login');
    setCurrentClassId(null);
    setCurrentExamId(null);
  };

  // Sync to localStorage and Supabase whenever classes update
  useEffect(() => {
    saveClassesData(classes);

    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }

    if (user && isSupabaseConfigured) {
      setSyncState('syncing');
      const debounceTimer = setTimeout(async () => {
        const success = await syncAllClassesToSupabase(user.id, classes);
        setSyncState(success ? 'saved' : 'error');
      }, 600);

      return () => clearTimeout(debounceTimer);
    }
  }, [classes, user]);

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

  const handleCreateClass = async (grade: string, section: string) => {
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

    // Immediate Supabase sync
    if (user && isSupabaseConfigured) {
      setSyncState('syncing');
      const success = await syncClassToSupabase(user.id, newClass);
      setSyncState(success ? 'saved' : 'error');
    }
  };

  const handleCreateExam = async (classId: string, name: string, dateLabel: string) => {
    const cls = classes.find((c) => c.id === classId);
    if (!cls) return;

    let subjects: SubjectItem[] = [];
    let students: StudentItem[] = [];

    // Copy forward roster and subjects from latest exam if any
    if (cls.exams.length > 0) {
      const latest = cls.exams[cls.exams.length - 1];
      subjects = latest.subjects.map((s) => ({ ...s }));
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

    // Immediate Supabase sync
    if (user && isSupabaseConfigured) {
      setSyncState('syncing');
      const targetClass = updatedClasses.find((c) => c.id === classId);
      if (targetClass) {
        const success = await syncClassToSupabase(user.id, targetClass);
        setSyncState(success ? 'saved' : 'error');
      }
    }
  };

  // EXCEL / CSV / JSON IMPORT HANDLER: Stored directly into the Class and Supabase
  const handleCreateExamWithData = async (
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

    // Persist immediately to Supabase
    if (user && isSupabaseConfigured) {
      setSyncState('syncing');
      const targetClass = updatedClasses.find((c) => c.id === classId);
      if (targetClass) {
        const success = await syncClassToSupabase(user.id, targetClass);
        setSyncState(success ? 'saved' : 'error');
      }
    }
  };

  const handleDeleteExam = async (classId: string, examId: string) => {
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

    if (user && isSupabaseConfigured) {
      setSyncState('syncing');
      const targetClass = updatedClasses.find((c) => c.id === classId);
      if (targetClass) {
        const success = await syncClassToSupabase(user.id, targetClass);
        setSyncState(success ? 'saved' : 'error');
      }
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (user && isSupabaseConfigured) {
      await deleteClassFromSupabase(user.id, classId);
    }
    const updatedClasses = classes.filter((c) => c.id !== classId);
    setClasses(updatedClasses);
    setScreen('home');
  };

  const handleUpdateExam = async (updatedExam: ExamItem) => {
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

    // Immediate Supabase sync for marks update
    if (user && isSupabaseConfigured) {
      setSyncState('syncing');
      const targetClass = updatedClasses.find((c) => c.id === currentClassId);
      if (targetClass) {
        const success = await syncClassToSupabase(user.id, targetClass);
        setSyncState(success ? 'saved' : 'error');
      }
    }
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
        user={user}
        onOpenAuth={() => setScreen('login')}
        onSignOut={handleSignOut}
        syncState={syncState}
      />

      <main>
        {screen === 'login' && (
          <LoginScreen
            onLoginSuccess={(authedUser) => {
              setUser(authedUser);
              handleUserSignedIn(authedUser);
              setScreen('home');
            }}
            onContinueGuest={() => {
              setScreen('home');
            }}
          />
        )}

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

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(authedUser) => {
          setUser(authedUser);
          handleUserSignedIn(authedUser);
        }}
      />
    </div>
  );
}
