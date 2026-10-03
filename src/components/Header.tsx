import React from 'react';
import { ClassItem, ExamItem, ScreenType } from '../types';
import { RotateCcw, Cloud, CloudCheck, CloudOff, LogIn, LogOut, User } from 'lucide-react';

interface HeaderProps {
  screen: ScreenType;
  currentClass: ClassItem | null;
  currentExam: ExamItem | null;
  onGoHome: () => void;
  onOpenClass: (classId: string) => void;
  onResetDemo: () => void;
  user: any | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  syncState: 'idle' | 'syncing' | 'saved' | 'error';
}

export const Header: React.FC<HeaderProps> = ({
  screen,
  currentClass,
  currentExam,
  onGoHome,
  onOpenClass,
  onResetDemo,
  user,
  onOpenAuth,
  onSignOut,
  syncState,
}) => {
  if (screen === 'login') return null;

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

      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2.5">
        {/* User Account / Auth Status */}
        {user ? (
          <div className="flex items-center gap-2 bg-[#F0F4F2] border border-[#DCE2DE] rounded-lg px-2.5 py-1">
            <div className="w-5 h-5 rounded-full bg-[#16232E] text-white flex items-center justify-center text-[10px] font-bold">
              {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-medium text-[#16232E] leading-tight max-w-[140px] truncate">
                {user.email}
              </span>
              <div className="flex items-center gap-1 text-[10px] text-[#5B6B78]">
                {syncState === 'syncing' ? (
                  <span className="text-[#B9852A] flex items-center gap-1">
                    <Cloud className="w-3 h-3 animate-spin" /> Saving...
                  </span>
                ) : syncState === 'error' ? (
                  <span className="text-red-500 flex items-center gap-1">
                    <CloudOff className="w-3 h-3" /> Sync error
                  </span>
                ) : (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CloudCheck className="w-3 h-3 text-emerald-600" /> Cloud Synced
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onSignOut}
              title="Sign Out"
              className="ml-1 p-1 text-[#788896] hover:text-[#16232E] rounded transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono-tag text-[#788896] bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
              Guest / Local Mode
            </span>
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#16232E] hover:bg-[#203140] rounded-md px-3 py-1.5 transition-all shadow-xs cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-[#B9852A]" />
              Sign In / Sync
            </button>
          </div>
        )}

        {!user && (
          <button
            onClick={onResetDemo}
            title="Reset to default demo data"
            className="inline-flex items-center gap-1.5 text-xs font-mono-tag text-[#5B6B78] hover:text-[#16232E] bg-white border border-[#DCE2DE] hover:border-[#16232E] rounded-md px-2.5 py-1.5 transition-all cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo
          </button>
        )}
      </div>
    </header>
  );
};
