import React, { useState } from 'react';
import { ClassItem, ExamItem, ExamStatusType, ExamTabType, StudentItem, SubjectItem } from '../types';
import { examStatus, statusLabel } from '../utils/stats';
import { Plus, Trash2, X, FileSpreadsheet } from 'lucide-react';
import { ExcelImportModal } from './ExcelImportModal';
import { generateId } from '../data/seed';

interface ClassScreenProps {
  currentClass: ClassItem;
  onOpenExam: (classId: string, examId: string, tab: ExamTabType) => void;
  onCreateExam: (classId: string, name: string, dateLabel: string) => void;
  onCreateExamWithData: (
    classId: string,
    name: string,
    dateLabel: string,
    subjects: SubjectItem[],
    students: StudentItem[]
  ) => void;
  onDeleteExam: (classId: string, examId: string) => void;
  onDeleteClass: (classId: string) => void;
}

export const ClassScreen: React.FC<ClassScreenProps> = ({
  currentClass,
  onOpenExam,
  onCreateExam,
  onCreateExamWithData,
  onDeleteExam,
  onDeleteClass,
}) => {
  const [isAddingExam, setIsAddingExam] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const name = examName.trim() || 'New Exam';
    const date = examDate.trim();
    onCreateExam(currentClass.id, name, date);
    setExamName('');
    setExamDate('');
    setIsAddingExam(false);
  };

  const handleConfirmImport = (
    name: string,
    dateLabel: string,
    subjects: SubjectItem[],
    students: StudentItem[]
  ) => {
    onCreateExamWithData(currentClass.id, name, dateLabel, subjects, students);
  };

  const getPillStyles = (status: ExamStatusType) => {
    switch (status) {
      case 'completed':
        return 'bg-[#E1F0E7] text-[#3F7A5C]';
      case 'in-progress':
        return 'bg-[#FBEED3] text-[#B9852A]';
      case 'not-started':
      default:
        return 'bg-[#EEF0EE] text-[#93A0AA]';
    }
  };

  const reversedExams = [...currentClass.exams].reverse();

  return (
    <section className="animate-fade">
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onConfirmImport={handleConfirmImport}
      />

      <p className="text-[13px] text-[#5B6B78] mb-4">
        {currentClass.exams.length} exam{currentClass.exams.length !== 1 ? 's' : ''} recorded for
        this class.
      </p>

      {/* Exam List */}
      <div className="mb-4">
        {reversedExams.length === 0 ? (
          <div className="text-[13px] text-[#5B6B78] bg-[#FAFBF9] border border-dashed border-[#C3CCC7] rounded-[10px] p-6 text-center mb-4">
            No exams yet for this class. Click "+ New Exam" or "Import from Excel" below to add the first one.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {reversedExams.map((exam) => {
              const status = examStatus(exam);
              const isNotStarted = status === 'not-started';

              return (
                <div
                  key={exam.id}
                  className="bg-white border border-[#DCE2DE] rounded-[10px] p-3.5 sm:px-4 sm:py-3.5 flex items-center justify-between gap-3 shadow-xs flex-wrap"
                >
                  <div className="flex-1 min-w-[170px]">
                    <div className="font-semibold text-[14px] text-[#1C2B39]">{exam.name}</div>
                    <div className="font-mono-tag text-[11px] text-[#93A0AA] mt-0.5">
                      {exam.dateLabel ? `${exam.dateLabel} · ` : ''}
                      {exam.updatedLabel}
                    </div>
                  </div>

                  <span
                    className={`font-mono-tag text-[10.5px] px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap ${getPillStyles(
                      status
                    )}`}
                  >
                    {statusLabel(status)}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenExam(currentClass.id, exam.id, 'entry')}
                      className="font-sans-body font-semibold text-[13px] px-3.5 py-1.5 rounded-lg border-[1.5px] border-[#C3CCC7] bg-white text-[#1C2B39] hover:border-[#16232E] cursor-pointer transition-all"
                    >
                      Enter Marks
                    </button>
                    <button
                      onClick={() => onOpenExam(currentClass.id, exam.id, 'insights')}
                      disabled={isNotStarted}
                      className="font-sans-body font-semibold text-[13px] px-3.5 py-1.5 rounded-lg bg-[#16232E] text-white hover:bg-[#0d1720] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all border border-[#16232E]"
                    >
                      View Insights
                    </button>
                    <button
                      onClick={() => {
                        if (
                          window.confirm('Delete this exam? This cannot be undone.')
                        ) {
                          onDeleteExam(currentClass.id, exam.id);
                        }
                      }}
                      title="Delete exam"
                      className="text-[#93A0AA] hover:text-[#B24A2C] p-1 text-sm transition-colors cursor-pointer ml-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Import Exam Zone */}
      <div className="mb-6 flex items-center gap-3 flex-wrap">
        {isAddingExam ? (
          <div className="bg-[#FAFBF9] border border-[#DCE2DE] rounded-[10px] p-4 inline-flex flex-col gap-3 max-w-lg w-full">
            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[160px] flex flex-col gap-1">
                  <label className="font-mono-tag text-[10px] uppercase text-[#5B6B78]">
                    Exam Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Term 2 Assessment"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    autoFocus
                    className="font-sans-body text-[13px] px-2.5 py-1.5 border border-[#C3CCC7] rounded-[7px] text-[#1C2B39] bg-white focus:outline-none focus:border-[#B9852A]"
                  />
                </div>
                <div className="w-[140px] flex flex-col gap-1">
                  <label className="font-mono-tag text-[10px] uppercase text-[#5B6B78]">
                    Date
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Sep 2026"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="font-sans-body text-[13px] px-2.5 py-1.5 border border-[#C3CCC7] rounded-[7px] text-[#1C2B39] bg-white focus:outline-none focus:border-[#B9852A]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <button
                  type="submit"
                  className="font-sans-body font-semibold text-[13px] px-3.5 py-1.5 rounded-lg bg-[#16232E] text-white hover:bg-[#0d1720] cursor-pointer transition-all"
                >
                  Create &amp; enter marks
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingExam(false)}
                  className="font-sans-body font-semibold text-[13px] px-3 py-1.5 rounded-lg text-[#5B6B78] hover:text-[#B24A2C] cursor-pointer transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            <button
              onClick={() => setIsAddingExam(true)}
              className="font-sans-body font-semibold text-[13px] px-4 py-2 rounded-lg bg-[#16232E] text-white hover:bg-[#0d1720] cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>New Exam</span>
            </button>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="font-sans-body font-semibold text-[13px] px-4 py-2 rounded-lg bg-[#FAFBF9] border border-[#C3CCC7] text-[#16232E] hover:border-[#16232E] hover:bg-white cursor-pointer transition-all inline-flex items-center gap-2 shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#3F7A5C]" />
              <span>Import Exam from Sheet (Excel/CSV)</span>
            </button>
          </>
        )}
      </div>

      {/* Delete class link */}
      <div>
        <button
          onClick={() => {
            if (
              window.confirm(
                'Delete this class and all its exams? This cannot be undone.'
              )
            ) {
              onDeleteClass(currentClass.id);
            }
          }}
          className="text-[12px] text-[#93A0AA] hover:text-[#B24A2C] cursor-pointer inline-flex items-center gap-1 transition-colors mt-2"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete this class</span>
        </button>
      </div>
    </section>
  );
};

