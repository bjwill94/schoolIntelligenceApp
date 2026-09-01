import React, { useState } from 'react';
import { ExamItem, SubjectItem, StudentItem } from '../types';
import { generateId } from '../data/seed';
import { isAbsent, isNA, isNumericMark, studentTotalDisplay } from '../utils/stats';
import { Plus, X, ArrowRight, FileSpreadsheet } from 'lucide-react';
import { ExcelImportModal } from './ExcelImportModal';

interface EnterMarksTabProps {
  exam: ExamItem;
  onUpdateExam: (updatedExam: ExamItem) => void;
  onGenerateInsights: () => void;
}

export const EnterMarksTab: React.FC<EnterMarksTabProps> = ({
  exam,
  onUpdateExam,
  onGenerateInsights,
}) => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const subjects = exam.subjects || [];
  const students = exam.students || [];

  const handleConfirmImport = (
    newExamName: string,
    newDateLabel: string,
    newSubjects: SubjectItem[],
    newStudents: StudentItem[]
  ) => {
    onUpdateExam({
      ...exam,
      name: newExamName || exam.name,
      dateLabel: newDateLabel || exam.dateLabel,
      subjects: newSubjects,
      students: newStudents,
      updatedLabel: 'Updated just now',
    });
  };

  const handleAddStudent = () => {
    const nextRoll = students.length > 0 ? Math.max(...students.map((s) => s.roll)) + 1 : 1;
    const initialMarks: Record<string, string> = {};
    subjects.forEach((s) => {
      initialMarks[s.id] = '';
    });

    const newStudent = {
      id: generateId('s'),
      roll: nextRoll,
      name: `Student ${nextRoll}`,
      marks: initialMarks,
    };

    onUpdateExam({
      ...exam,
      students: [...students, newStudent],
      updatedLabel: 'Updated just now',
    });
  };

  const handleAddSubject = () => {
    const newSubject: SubjectItem = {
      id: generateId('sub'),
      name: `Subject ${subjects.length + 1}`,
      max: 100,
      pass: 33,
    };

    const updatedStudents = students.map((st) => ({
      ...st,
      marks: {
        ...st.marks,
        [newSubject.id]: '',
      },
    }));

    onUpdateExam({
      ...exam,
      subjects: [...subjects, newSubject],
      students: updatedStudents,
      updatedLabel: 'Updated just now',
    });
  };

  const handleRemoveSubject = (subjectId: string) => {
    const updatedSubjects = subjects.filter((s) => s.id !== subjectId);
    const updatedStudents = students.map((st) => {
      const copyMarks = { ...st.marks };
      delete copyMarks[subjectId];
      return { ...st, marks: copyMarks };
    });

    onUpdateExam({
      ...exam,
      subjects: updatedSubjects,
      students: updatedStudents,
      updatedLabel: 'Updated just now',
    });
  };

  const handleRemoveStudent = (studentId: string) => {
    const updatedStudents = students.filter((s) => s.id !== studentId);
    onUpdateExam({
      ...exam,
      students: updatedStudents,
      updatedLabel: 'Updated just now',
    });
  };

  const handleUpdateStudentName = (studentId: string, name: string) => {
    const updatedStudents = students.map((s) =>
      s.id === studentId ? { ...s, name } : s
    );
    onUpdateExam({
      ...exam,
      students: updatedStudents,
      updatedLabel: 'Updated just now',
    });
  };

  const handleUpdateMark = (studentId: string, subjectId: string, rawVal: string) => {
    let markVal: number | string = rawVal.trim();

    if (markVal !== '') {
      const upper = markVal.toUpperCase();
      if (upper === 'AB' || upper === 'A' || upper === 'ABSENT') {
        markVal = 'AB';
      } else if (upper === 'NA' || upper === 'N' || upper === '-' || upper === 'N/A') {
        markVal = 'NA';
      } else {
        const num = Number(markVal);
        if (!isNaN(num)) {
          markVal = num;
        }
      }
    }

    const updatedStudents = students.map((s) => {
      if (s.id === studentId) {
        return {
          ...s,
          marks: {
            ...s.marks,
            [subjectId]: markVal,
          },
        };
      }
      return s;
    });

    onUpdateExam({
      ...exam,
      students: updatedStudents,
      updatedLabel: 'Updated just now',
    });
  };

  const handleUpdateSubjectName = (subjectId: string, name: string) => {
    const updatedSubjects = subjects.map((s) =>
      s.id === subjectId ? { ...s, name } : s
    );
    onUpdateExam({
      ...exam,
      subjects: updatedSubjects,
    });
  };

  const handleUpdateSubjectMax = (subjectId: string, maxVal: number) => {
    const updatedSubjects = subjects.map((s) =>
      s.id === subjectId ? { ...s, max: maxVal > 0 ? maxVal : 100 } : s
    );
    onUpdateExam({
      ...exam,
      subjects: updatedSubjects,
      updatedLabel: 'Updated just now',
    });
  };

  const handleUpdateSubjectPass = (subjectId: string, passVal: number) => {
    const updatedSubjects = subjects.map((s) =>
      s.id === subjectId ? { ...s, pass: passVal >= 0 ? passVal : 0 } : s
    );
    onUpdateExam({
      ...exam,
      subjects: updatedSubjects,
      updatedLabel: 'Updated just now',
    });
  };

  return (
    <div className="flex flex-col gap-4 animate-fade">
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onConfirmImport={handleConfirmImport}
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2.5 flex-wrap">
          <button
            onClick={handleAddStudent}
            className="font-sans-body font-semibold text-[13px] px-3.5 py-1.5 rounded-lg border-[1.5px] border-[#C3CCC7] bg-white text-[#1C2B39] hover:border-[#16232E] cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#5B6B78]" />
            <span>Add student</span>
          </button>
          <button
            onClick={handleAddSubject}
            className="font-sans-body font-semibold text-[13px] px-3.5 py-1.5 rounded-lg border-[1.5px] border-[#C3CCC7] bg-white text-[#1C2B39] hover:border-[#16232E] cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#5B6B78]" />
            <span>Add subject</span>
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="font-sans-body font-semibold text-[13px] px-3.5 py-1.5 rounded-lg border-[1.5px] border-[#C3CCC7] bg-[#FAFBF9] text-[#16232E] hover:border-[#16232E] hover:bg-white cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#3F7A5C]" />
            <span>Import / Update Marks from Sheet</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono-tag text-[#5B6B78]">
          <span className="inline-flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded bg-[#FBEED3] border border-[#E2A93B] text-[#B9852A] font-bold">AB</span>
            <span>Absent</span>
          </span>
          <span className="text-[#C3CCC7]">•</span>
          <span className="inline-flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded bg-[#EEF0EE] border border-[#DCE2DE] text-[#5B6B78] font-bold">NA</span>
            <span>Optional</span>
          </span>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-[10px] shadow-xs overflow-x-auto border border-[#DCE2DE]">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="bg-[#FAFBF9] border-b-2 border-[#16232E]">
              <th className="font-mono-tag text-[11px] uppercase tracking-wider text-[#5B6B78] py-3 px-2.5 w-[50px] text-center">
                Roll
              </th>
              <th className="font-mono-tag text-[11px] uppercase tracking-wider text-[#5B6B78] py-3 px-3 min-w-[170px]">
                Student Name
              </th>
              {subjects.map((sub) => (
                <th
                  key={sub.id}
                  className="font-mono-tag text-[11px] uppercase tracking-wider text-[#5B6B78] py-3 px-2.5 text-center min-w-[125px]"
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center justify-center gap-1.5 w-full">
                      <input
                        type="text"
                        value={sub.name}
                        onChange={(e) => handleUpdateSubjectName(sub.id, e.target.value)}
                        className="font-sans-body font-bold text-[12.5px] normal-case tracking-normal text-[#16232E] text-center bg-transparent focus:outline-none focus:bg-[#FBEED3] rounded px-1 py-0.5 w-full border-none"
                      />
                      <button
                        onClick={() => handleRemoveSubject(sub.id)}
                        title="Remove subject"
                        className="text-[#93A0AA] hover:text-[#B24A2C] cursor-pointer p-0.5 text-xs transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex gap-1.5 items-center text-[10px] text-[#93A0AA] normal-case">
                      <span>Max</span>
                      <input
                        type="number"
                        value={sub.max}
                        onChange={(e) => handleUpdateSubjectMax(sub.id, Number(e.target.value))}
                        className="w-[36px] font-mono-tag text-[10.5px] text-center border border-[#C3CCC7] rounded px-1 py-0.5 text-[#5B6B78] bg-white focus:outline-none focus:border-[#B9852A]"
                      />
                      <span>Pass</span>
                      <input
                        type="number"
                        value={sub.pass}
                        onChange={(e) => handleUpdateSubjectPass(sub.id, Number(e.target.value))}
                        className="w-[36px] font-mono-tag text-[10.5px] text-center border border-[#C3CCC7] rounded px-1 py-0.5 text-[#5B6B78] bg-white focus:outline-none focus:border-[#B9852A]"
                      />
                    </div>
                  </div>
                </th>
              ))}
              <th className="font-mono-tag text-[11px] uppercase tracking-wider text-[#5B6B78] py-3 px-3 text-center w-[90px]">
                Total
              </th>
              <th className="w-[36px]"></th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td
                  colSpan={subjects.length + 4}
                  className="text-center py-8 text-[13px] text-[#5B6B78]"
                >
                  No students in this class yet. Click "+ Add student" to start.
                </td>
              </tr>
            ) : (
              students.map((st) => {
                const totalDisplay = studentTotalDisplay(st, subjects);

                return (
                  <tr
                    key={st.id}
                    className="border-b border-[#DCE2DE] hover:bg-[#FAFBF9] transition-colors"
                  >
                    <td className="font-mono-tag text-[#93A0AA] text-[12.5px] text-center py-2 px-2.5">
                      {String(st.roll).padStart(2, '0')}
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={st.name}
                        onChange={(e) => handleUpdateStudentName(st.id, e.target.value)}
                        className="font-sans-body font-medium text-[13.5px] text-[#1C2B39] bg-transparent focus:outline-none focus:bg-[#FBEED3] rounded px-1.5 py-0.5 w-full border-none"
                      />
                    </td>
                    {subjects.map((sub) => {
                      const v = st.marks[sub.id];
                      const absent = isAbsent(v);
                      const na = isNA(v);
                      const belowPass = isNumericMark(v) && Number(v) < sub.pass;

                      let inputClasses = 'text-[#1C2B39] border-[#DCE2DE] bg-white focus:border-[#B9852A]';
                      if (absent) {
                        inputClasses = 'text-[#B9852A] border-[#E2A93B] bg-[#FBEED3] font-bold focus:border-[#B9852A]';
                      } else if (na) {
                        inputClasses = 'text-[#5B6B78] border-[#DCE2DE] bg-[#EEF0EE] font-bold focus:border-[#5B6B78]';
                      } else if (belowPass) {
                        inputClasses = 'text-[#B24A2C] border-[#B24A2C] bg-[#F7E4DC] font-semibold focus:border-[#B24A2C]';
                      }

                      return (
                        <td key={sub.id} className="py-2 px-2.5 text-center">
                          <input
                            type="text"
                            value={v === undefined || v === null ? '' : v}
                            onChange={(e) => handleUpdateMark(st.id, sub.id, e.target.value)}
                            placeholder="—"
                            className={`w-[54px] text-center font-mono-tag text-[13.5px] font-medium border rounded-[6px] py-1 px-1 focus:outline-none transition-all ${inputClasses}`}
                          />
                        </td>
                      );
                    })}
                    <td className="font-mono-tag font-semibold text-center text-[#16232E] text-[13px] py-2 px-3 whitespace-nowrap">
                      {totalDisplay}
                    </td>
                    <td className="text-center py-2 pr-3">
                      <button
                        onClick={() => handleRemoveStudent(st.id)}
                        title="Remove student"
                        className="text-[#93A0AA] hover:text-[#B24A2C] cursor-pointer p-1 text-xs transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Generate insights bar */}
      <div className="flex justify-between items-center gap-3 mt-3 flex-wrap">
        <span className="text-[12.5px] text-[#5B6B78]">
          Max &amp; pass marks are set per subject header. Enter numbers, <b>AB</b> for absent, or <b>NA</b> for optional.
        </span>
        <button
          onClick={onGenerateInsights}
          className="font-sans-body font-semibold text-[13px] px-4 py-2 rounded-lg bg-[#16232E] text-white hover:bg-[#0d1720] cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-xs"
        >
          <span>Generate insights</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

