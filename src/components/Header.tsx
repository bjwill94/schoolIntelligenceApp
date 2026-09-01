import React from 'react';
import { ClassItem, ExamItem, ScreenType } from '../types';
import { RotateCcw, Sparkles } from 'lucide-react';

interface HeaderProps {
  screen: ScreenType;
  currentClass: ClassItem | null;
  currentExam: ExamItem | null;
  onGoHome: () => void;
  onOpenClass: (classId: string) => void;
  onResetDemo: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  screen,
  currentClass,
  currentExam,
  onGoHome,
  onOpenClass,
  onResetDemo,
}) => {
  return (
    <header className="flex items-start justify-between pb-4 mb-6 border-b-2 border-[#16232E] flex-wrap gap-4">
      <div>
        <span
          onClick={onGoHome}
          className="font-mono-tag text-[11px] tracking-[0.14em] uppercase text-[#B9852A] font-semibold cursor-pointer hover:underline inline-block"
        >
          School Register
        </span>

        {/* Breadcrumb row */}
        <div className="font-mono-tag text-[12px] text-[#5B6B78] my-2 flex gap-1.5 items-center flex-wrap">
          {screen === 'class' && currentClass && (
            <span
              onClick={onGoHome}
              className="cursor-pointer hover:text-[#B9852A] hover:underline"
            >
              Your Classes
            </span>
          )}

          {screen === 'exam' && currentClass && currentExam && (
            <>
              <span
                onClick={onGoHome}
                className="cursor-pointer hover:text-[#B9852A] hover:underline"
              >
                Your Classes
              </span>
              <span className="text-[#93A0AA]">›</span>
              <span
                onClick={() => onOpenClass(currentClass.id)}
                className="cursor-pointer hover:text-[#B9852A] hover:underline"
              >
                Grade {currentClass.grade} · Section {currentClass.section}
              </span>
            </>
          )}
        </div>

        {/* Dynamic Page Title */}
        <h1 className="font-serif-title font-semibold text-[27px] m-0 text-[#16232E] tracking-tight">
          {screen === 'home' && 'Your Classes'}
          {screen === 'class' && currentClass && `Grade ${currentClass.grade} · Section ${currentClass.section}`}
          {screen === 'exam' && currentExam && currentExam.name}
        </h1>
      </div>

      <div className="flex flex-col items-end gap-2">
        <button
          onClick={onResetDemo}
          title="Reset to default demo data"
          className="inline-flex items-center gap-1.5 text-xs font-mono-tag text-[#5B6B78] hover:text-[#16232E] bg-white border border-[#DCE2DE] hover:border-[#16232E] rounded-md px-2.5 py-1 transition-all cursor-pointer shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Demo Data
        </button>
      </div>
    </header>
  );
};
