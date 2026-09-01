import React, { useState } from 'react';
import { ClassItem, ExamStatusType } from '../types';
import { examStatus, statusLabel } from '../utils/stats';
import { Plus } from 'lucide-react';

interface HomeScreenProps {
  classes: ClassItem[];
  onOpenClass: (classId: string) => void;
  onCreateClass: (grade: string, section: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  classes,
  onOpenClass,
  onCreateClass,
}) => {
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [gradeInput, setGradeInput] = useState('');
  const [sectionInput, setSectionInput] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const g = gradeInput.trim() || '—';
    const s = sectionInput.trim() || '—';
    onCreateClass(g, s);
    setGradeInput('');
    setSectionInput('');
    setIsAddingClass(false);
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

  return (
    <section className="animate-fade">
      <p className="text-[13px] text-[#5B6B78] mb-5">
        All classes across the school — click a class to view its exams.
      </p>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4 mt-1">
        {classes.map((cls) => {
          const latest = cls.exams.length > 0 ? cls.exams[cls.exams.length - 1] : null;
          const status = latest ? examStatus(latest) : 'not-started';
          const studentCount = latest ? latest.students.length : 0;

          return (
            <div
              key={cls.id}
              onClick={() => onOpenClass(cls.id)}
              className="bg-white border border-[#DCE2DE] rounded-[10px] p-[18px] cursor-pointer transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-md shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-2.5">
                  <h3 className="font-serif-title text-[17px] font-semibold text-[#16232E] m-0">
                    Grade {cls.grade} · Sec {cls.section}
                  </h3>
                  {latest ? (
                    <span
                      className={`font-mono-tag text-[10.5px] px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap ${getPillStyles(
                        status
                      )}`}
                    >
                      {statusLabel(status)}
                    </span>
                  ) : (
                    <span className="font-mono-tag text-[10.5px] px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap bg-[#EEF0EE] text-[#93A0AA]">
                      No exams
                    </span>
                  )}
                </div>

                <div className="text-[12.5px] text-[#5B6B78] mb-1">
                  {studentCount} student{studentCount !== 1 ? 's' : ''} · {cls.exams.length} exam
                  {cls.exams.length !== 1 ? 's' : ''}
                </div>

                <div className="text-[12.5px] text-[#1C2B39] font-medium mb-1.5 line-clamp-1">
                  {latest ? `Latest: ${latest.name}` : 'No exams yet'}
                </div>
              </div>

              <div className="font-mono-tag text-[11px] text-[#93A0AA] mt-2 pt-2 border-t border-[#F4F6F3]">
                {latest ? latest.updatedLabel : 'Add the first exam to get started'}
              </div>
            </div>
          );
        })}

        {/* Add Class card / inline form */}
        {isAddingClass ? (
          <div className="bg-[#FAFBF9] border border-[#DCE2DE] rounded-[10px] p-4 flex flex-col justify-center">
            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <div className="flex gap-2">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="font-mono-tag text-[10px] uppercase text-[#5B6B78]">
                    Grade
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9"
                    value={gradeInput}
                    onChange={(e) => setGradeInput(e.target.value)}
                    autoFocus
                    className="font-sans-body text-[13px] px-2.5 py-1.5 border border-[#C3CCC7] rounded-[7px] text-[#1C2B39] bg-white focus:outline-none focus:border-[#B9852A]"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <label className="font-mono-tag text-[10px] uppercase text-[#5B6B78]">
                    Section
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. C"
                    value={sectionInput}
                    onChange={(e) => setSectionInput(e.target.value)}
                    className="font-sans-body text-[13px] px-2.5 py-1.5 border border-[#C3CCC7] rounded-[7px] text-[#1C2B39] bg-white focus:outline-none focus:border-[#B9852A]"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="submit"
                  className="font-sans-body font-semibold text-[13px] px-3.5 py-1.5 rounded-lg bg-[#16232E] text-white hover:bg-[#0d1720] cursor-pointer transition-all"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingClass(false)}
                  className="font-sans-body font-semibold text-[13px] px-3 py-1.5 rounded-lg border-transparent text-[#5B6B78] hover:text-[#B24A2C] cursor-pointer transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div
            onClick={() => setIsAddingClass(true)}
            className="border-[1.5px] border-dashed border-[#C3CCC7] rounded-[10px] flex items-center justify-center text-[#5B6B78] hover:text-[#B9852A] hover:border-[#B9852A] font-semibold min-h-[135px] cursor-pointer transition-all text-sm gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Class</span>
          </div>
        )}
      </div>
    </section>
  );
};
