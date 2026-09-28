import React from 'react';
import { ClassItem, ExamItem, ExamTabType } from '../types';
import { EnterMarksTab } from './EnterMarksTab';
import { ClassInsightsTab } from './ClassInsightsTab';

interface ExamScreenProps {
  currentClass: ClassItem;
  currentExam: ExamItem;
  activeTab: ExamTabType;
  onTabChange: (tab: ExamTabType) => void;
  onUpdateExam: (updatedExam: ExamItem) => void;
}

export const ExamScreen: React.FC<ExamScreenProps> = ({
  currentExam,
  activeTab,
  onTabChange,
  onUpdateExam,
}) => {
  const handleNameChange = (name: string) => {
    onUpdateExam({
      ...currentExam,
      name,
    });
  };

  const handleDateChange = (dateLabel: string) => {
    onUpdateExam({
      ...currentExam,
      dateLabel,
    });
  };

  const handleAttendanceChange = (rawVal: string) => {
    const attendance = rawVal === '' ? '' : Number(rawVal);
    onUpdateExam({
      ...currentExam,
      attendance,
    });
  };

  return (
    <section className="animate-fade">
      {/* Top Metadata Row */}
      <div className="flex gap-4 sm:gap-6 flex-wrap items-end mb-4">
        <div className="flex flex-col gap-1 min-w-[200px] flex-1">
          <label className="font-mono-tag text-[10px] uppercase text-[#93A0AA]">
            Exam name
          </label>
          <input
            type="text"
            value={currentExam.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="font-sans-body font-semibold text-[13.5px] px-2.5 py-1.5 border border-[#C3CCC7] rounded-[7px] text-[#1C2B39] bg-white focus:outline-none focus:border-[#B9852A]"
          />
        </div>

        <div className="flex flex-col gap-1 w-[140px]">
          <label className="font-mono-tag text-[10px] uppercase text-[#93A0AA]">
            Date
          </label>
          <input
            type="text"
            placeholder="e.g., Aug 2026"
            value={currentExam.dateLabel}
            onChange={(e) => handleDateChange(e.target.value)}
            className="font-mono-tag text-[13px] px-2.5 py-1.5 border border-[#C3CCC7] rounded-[7px] text-[#1C2B39] bg-white focus:outline-none focus:border-[#B9852A]"
          />
        </div>

        <div className="flex flex-col gap-1 w-[160px]">
          <label className="font-mono-tag text-[10px] uppercase text-[#93A0AA]">
            Class avg. attendance %
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={currentExam.attendance === undefined ? '' : currentExam.attendance}
            onChange={(e) => handleAttendanceChange(e.target.value)}
            placeholder="e.g. 90"
            className="font-mono-tag text-[13px] px-2.5 py-1.5 border border-[#C3CCC7] rounded-[7px] text-[#1C2B39] bg-white focus:outline-none focus:border-[#B9852A]"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => onTabChange('entry')}
          className={`font-sans-body font-semibold text-[13.5px] px-4 py-2 rounded-full border-[1.5px] cursor-pointer transition-all ${activeTab === 'entry'
              ? 'bg-[#16232E] border-[#16232E] text-white'
              : 'bg-white border-[#C3CCC7] text-[#5B6B78] hover:border-[#5B6B78] hover:text-[#1C2B39]'
            }`}
        >
          Enter Marks
        </button>
        <button
          onClick={() => onTabChange('insights')}
          className={`font-sans-body font-semibold text-[13.5px] px-4 py-2 rounded-full border-[1.5px] cursor-pointer transition-all ${activeTab === 'insights'
              ? 'bg-[#16232E] border-[#16232E] text-white'
              : 'bg-white border-[#C3CCC7] text-[#5B6B78] hover:border-[#5B6B78] hover:text-[#1C2B39]'
            }`}
        >
          Class Insights
        </button>
      </div>

      {/* Active Tab Body */}
      {activeTab === 'entry' ? (
        <EnterMarksTab
          exam={currentExam}
          onUpdateExam={onUpdateExam}
          onGenerateInsights={() => onTabChange('insights')}
        />
      ) : (
        <ClassInsightsTab
          exam={currentExam}
          onGoToEnterMarks={() => onTabChange('entry')}
        />
      )}
    </section>
  );
};
