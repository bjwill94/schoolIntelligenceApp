import React, { useState, useEffect, useRef } from 'react';
import { ClassItem, ExamItem, ExamTabType, ScreenType, StudentItem, SubjectItem } from './types';
import { createDemoSeedData, generateId, getInitialData, saveClassesData } from './data/seed';
import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { ClassScreen } from './components/ClassScreen';
import { ExamScreen } from './components/ExamScreen';
import { LoginScreen } from './components/LoginScreen';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import {
  loadAllClasses,
  fetchClass,
  insertClass,
  updateClass,
  deleteClass,
} from './services/dbService';
import { AlertTriangle, X } from 'lucide-react';

const SAVE_DEBOUNCE_MS = 600;

const classLabel = (cls: ClassItem) => `Grade ${cls.grade} · Section ${cls.section}`;

export default function App() {
  const [classes, setClasses] = useState<ClassItem[]>(getInitialData);
  const [screen, setScreen] = useState<ScreenType>('login');
  const [currentClassId, setCurrentClassId] = useState<string | null>(null);
  const [currentExamId, setCurrentExamId] = useState<string | null>(null);
  const [examTab, setExamTab] = useState<ExamTabType>('entry');

  const [user, setUser] = useState<any | null>(null);
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'saved' | 'error'>('saved');
  const [notice, setNotice] = useState<string | null>(null);

  // Refs let async save callbacks see the latest state without stale closures.
  const classesRef = useRef<ClassItem[]>(classes);
  const userRef = useRef<any | null>(null);
  const versionsRef = useRef(new Map<string, string>());
  const saveTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const inFlightRef = useRef(new Set<string>());
  const dirtyRef = useRef(new Set<string>());
  const deletedRef = useRef(new Set<string>());
  const lastSaveFailedRef = useRef(false);

  const commitClasses = (next: ClassItem[]) => {
    classesRef.current = next;
    setClasses(next);
  };

  const hasPendingSaves = () => saveTimersRef.current.size > 0 || inFlightRef.current.size > 0;

  const resetSyncTracking = () => {
    saveTimersRef.current.forEach((t) => clearTimeout(t));
    saveTimersRef.current.clear();
    inFlightRef.current.clear();
    dirtyRef.current.clear();
    deletedRef.current.clear();
    versionsRef.current.clear();
    lastSaveFailedRef.current = false;
  };

  const settleSyncState = () => {
    if (hasPendingSaves()) return;
    setSyncState(lastSaveFailedRef.current ? 'error' : 'saved');
  };

  const loadSharedClasses = async () => {
    setSyncState('syncing');
    try {
      const records = await loadAllClasses();
      if (!userRef.current || hasPendingSaves()) return;
      versionsRef.current = new Map(records.map((r) => [r.cls.id, r.version]));
      commitClasses(records.map((r) => r.cls));
      lastSaveFailedRef.current = false;
    } catch (err) {
      console.error('Failed to load classes:', err);
      lastSaveFailedRef.current = true;
    }
    settleSyncState();
  };

  const handleSaveConflict = async (classId: string) => {
    try {
      const latest = await fetchClass(classId);
      const local = classesRef.current.find((c) => c.id === classId);
      const label = local ? classLabel(local) : 'This class';
      if (!latest) {
        versionsRef.current.delete(classId);
        commitClasses(classesRef.current.filter((c) => c.id !== classId));
        setNotice(`${label} was deleted by another staff member.`);
        return;
      }
      versionsRef.current.set(classId, latest.version);
      commitClasses(classesRef.current.map((c) => (c.id === classId ? latest.cls : c)));
      setNotice(
        `${label} was changed by another staff member at the same time. Their version has been loaded, and your most recent change was not saved. Please check it and re-enter it if needed.`
      );
    } catch (err) {
      console.error('Failed to reload class after conflict:', err);
      lastSaveFailedRef.current = true;
    }
  };

  const flushSave = async (classId: string) => {
    if (inFlightRef.current.has(classId)) {
      dirtyRef.current.add(classId);
      return;
    }
    const signedInUser = userRef.current;
    const cls = classesRef.current.find((c) => c.id === classId);
    if (!signedInUser || !cls || deletedRef.current.has(classId)) {
      settleSyncState();
      return;
    }

    inFlightRef.current.add(classId);
    const version = versionsRef.current.get(classId);
    const result = version ? await updateClass(cls, version) : await insertClass(cls);
    inFlightRef.current.delete(classId);

    if (userRef.current?.id !== signedInUser.id) return;

    if (result.status === 'saved') {
      versionsRef.current.set(classId, result.version);
      lastSaveFailedRef.current = false;
      if (deletedRef.current.has(classId)) {
        await deleteClass(classId);
      }
    } else if (result.status === 'conflict') {
      dirtyRef.current.delete(classId);
      await handleSaveConflict(classId);
    } else {
      lastSaveFailedRef.current = true;
    }

    if (dirtyRef.current.has(classId)) {
      dirtyRef.current.delete(classId);
      void flushSave(classId);
      return;
    }
    settleSyncState();
  };

  const scheduleSave = (classId: string, delay = SAVE_DEBOUNCE_MS) => {
    if (!userRef.current || !isSupabaseConfigured) return;
    const existing = saveTimersRef.current.get(classId);
    if (existing) clearTimeout(existing);
    setSyncState('syncing');
    saveTimersRef.current.set(
      classId,
      setTimeout(() => {
        saveTimersRef.current.delete(classId);
        void flushSave(classId);
      }, delay)
    );
  };

  const resetToGuest = () => {
    resetSyncTracking();
    userRef.current = null;
    setUser(null);
    commitClasses(getInitialData());
    setScreen('login');
    setCurrentClassId(null);
    setCurrentExamId(null);
    setNotice(null);
    setSyncState('saved');
  };

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      const prevUser = userRef.current;

      if (nextUser && prevUser?.id === nextUser.id) {
        // Token refresh or profile update: same person, keep their in-progress state.
        userRef.current = nextUser;
        setUser(nextUser);
        return;
      }

      if (!nextUser) {
        if (prevUser) resetToGuest();
        return;
      }

      resetSyncTracking();
      userRef.current = nextUser;
      setUser(nextUser);
      commitClasses([]);
      setScreen((prev) => (prev === 'login' ? 'home' : prev));
      // Supabase warns against awaiting its own calls inside this callback.
      setTimeout(() => void loadSharedClasses(), 0);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Pick up other staff members' changes when the teacher comes back to the tab.
  useEffect(() => {
    if (!user) return;
    const refresh = () => {
      if (document.visibilityState === 'visible' && !hasPendingSaves()) {
        void loadSharedClasses();
      }
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [user]);

  // Only guest data lives on the device; shared school data stays in the cloud.
  useEffect(() => {
    if (!user) saveClassesData(classes);
  }, [classes, user]);

  const handleSignOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    resetToGuest();
  };

  const currentClass = classes.find((c) => c.id === currentClassId) || null;
  const currentExam = currentClass?.exams.find((e) => e.id === currentExamId) || null;

  // A refresh or conflict can remove the class or exam that is open on screen.
  useEffect(() => {
    if (screen === 'class' && !currentClass) setScreen('home');
    if (screen === 'exam' && !currentExam) setScreen(currentClass ? 'class' : 'home');
  }, [screen, currentClass, currentExam]);

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
    commitClasses([...classesRef.current, newClass]);
    setCurrentClassId(newClass.id);
    setScreen('class');
    scheduleSave(newClass.id, 0);
  };

  const handleCreateExam = (classId: string, name: string, dateLabel: string) => {
    const cls = classesRef.current.find((c) => c.id === classId);
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

    commitClasses(
      classesRef.current.map((c) => (c.id === classId ? { ...c, exams: [...c.exams, newExam] } : c))
    );
    setCurrentClassId(classId);
    setCurrentExamId(newExam.id);
    setExamTab('entry');
    setScreen('exam');
    scheduleSave(classId, 0);
  };

  // EXCEL / CSV / JSON IMPORT HANDLER: Stored directly into the Class and Supabase
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

    commitClasses(
      classesRef.current.map((c) => (c.id === classId ? { ...c, exams: [...c.exams, newExam] } : c))
    );
    setCurrentClassId(classId);
    setCurrentExamId(newExam.id);
    setExamTab('entry');
    setScreen('exam');
    scheduleSave(classId, 0);
  };

  const handleDeleteExam = (classId: string, examId: string) => {
    commitClasses(
      classesRef.current.map((c) =>
        c.id === classId ? { ...c, exams: c.exams.filter((e) => e.id !== examId) } : c
      )
    );
    if (currentExamId === examId) {
      setScreen('class');
    }
    scheduleSave(classId, 0);
  };

  const handleDeleteClass = async (classId: string) => {
    commitClasses(classesRef.current.filter((c) => c.id !== classId));
    setScreen('home');

    if (!userRef.current || !isSupabaseConfigured) return;
    const timer = saveTimersRef.current.get(classId);
    if (timer) clearTimeout(timer);
    saveTimersRef.current.delete(classId);
    dirtyRef.current.delete(classId);
    deletedRef.current.add(classId);
    versionsRef.current.delete(classId);

    // An in-flight save will delete the row itself once it lands.
    if (inFlightRef.current.has(classId)) return;
    setSyncState('syncing');
    const ok = await deleteClass(classId);
    if (!ok) lastSaveFailedRef.current = true;
    settleSyncState();
  };

  const handleUpdateExam = (updatedExam: ExamItem) => {
    if (!currentClassId) return;
    commitClasses(
      classesRef.current.map((c) =>
        c.id === currentClassId
          ? { ...c, exams: c.exams.map((e) => (e.id === updatedExam.id ? updatedExam : e)) }
          : c
      )
    );
    scheduleSave(currentClassId);
  };

  const handleResetDemo = () => {
    if (user) return;
    if (window.confirm('Reset all classes and exams to default sample demo data?')) {
      commitClasses(createDemoSeedData());
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

      {notice && screen !== 'login' && (
        <div className="mb-5 p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span className="flex-1">{notice}</span>
          <button
            onClick={() => setNotice(null)}
            title="Dismiss"
            className="p-0.5 text-amber-700 hover:text-amber-900 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <main>
        {screen === 'login' && (
          <LoginScreen
            onLoginSuccess={() => {
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
    </div>
  );
}
