import React, { useState, useRef } from 'react';
import { SubjectItem, StudentItem } from '../types';
import { parseFileToExamData, ParsedExamData } from '../utils/excelParser';
import { UploadCloud, FileSpreadsheet, X, Check, AlertTriangle, Trash2, ArrowRight } from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmImport: (
    examName: string,
    dateLabel: string,
    subjects: SubjectItem[],
    students: StudentItem[]
  ) => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onConfirmImport,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [parsedData, setParsedData] = useState<ParsedExamData | null>(null);
  const [examName, setExamName] = useState('');
  const [dateLabel, setDateLabel] = useState('Sep 2026');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessFile = async (file: File) => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await parseFileToExamData(file);
      setParsedData(result);
      setExamName(result.examName || 'Imported Exam');
    } catch (err: any) {
      setError(err.message || 'Failed to parse the uploaded file.');
      setParsedData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleRemoveSubject = (id: string) => {
    if (!parsedData) return;
    const updatedSubjects = parsedData.subjects.filter((s) => s.id !== id);

    const updatedStudents = parsedData.students.map((st) => {
      const copy = { ...st.marks };
      delete copy[id];
      return { ...st, marks: copy };
    });

    setParsedData({
      ...parsedData,
      subjects: updatedSubjects,
      students: updatedStudents,
    });
  };

  const handleSubjectMaxChange = (id: string, newMax: number) => {
    if (!parsedData) return;
    const pass = Math.round(newMax * 0.33);

    const updatedSubjects = parsedData.subjects.map((s) =>
      s.id === id ? { ...s, max: newMax, pass } : s
    );

    setParsedData({
      ...parsedData,
      subjects: updatedSubjects,
    });
  };

  const handleSubjectNameChange = (id: string, newName: string) => {
    if (!parsedData) return;
    const updatedSubjects = parsedData.subjects.map((s) =>
      s.id === id ? { ...s, name: newName } : s
    );

    setParsedData({
      ...parsedData,
      subjects: updatedSubjects,
    });
  };

  const handleConfirm = () => {
    if (!parsedData) return;
    if (!examName.trim()) {
      alert('Please enter an exam name.');
      return;
    }
    onConfirmImport(examName.trim(), dateLabel.trim(), parsedData.subjects, parsedData.students);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#16232E]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade">
      <div className="bg-white border border-[#DCE2DE] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:px-6 sm:py-4 border-b border-[#DCE2DE] flex items-center justify-between bg-[#FAFBF9]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#E1F0E7] text-[#3F7A5C] rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-title font-semibold text-[18px] text-[#16232E] m-0">
                Import Exam from Excel / CSV / JSON
              </h3>
              <p className="text-[12px] text-[#5B6B78] m-0">
                Drag and drop your spreadsheet to auto-populate subjects, max marks, and student marks.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#93A0AA] hover:text-[#16232E] p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx,.xls,.csv,.json"
            className="hidden"
          />

          {error && (
            <div className="bg-[#FDF2F2] border border-[#F8B4B4] rounded-xl p-3.5 flex items-start gap-2.5 text-red-800 text-[13px]">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {!parsedData ? (
            /* Upload Dropzone */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 min-h-[220px] ${
                isDragging
                  ? 'border-[#B9852A] bg-[#FBEED3]/30'
                  : 'border-[#C3CCC7] hover:border-[#16232E] bg-[#FAFBF9]'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-white border border-[#DCE2DE] flex items-center justify-center shadow-xs text-[#B9852A]">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-[14px] text-[#16232E] m-0">
                  {isLoading ? 'Parsing file...' : 'Click to upload or drag & drop sheet here'}
                </p>
                <p className="text-[12px] text-[#5B6B78] mt-1">
                  Supports Excel (.xlsx, .xls), CSV (.csv), or JSON (.json)
                </p>
              </div>
              <span className="font-mono-tag text-[11px] font-semibold text-[#16232E] bg-white border border-[#C3CCC7] rounded-md px-3 py-1 mt-1 shadow-xs">
                Select Spreadsheet File
              </span>
            </div>
          ) : (
            /* Parsed Data Preview & Customization */
            <div className="space-y-4">
              {/* Warnings if any */}
              {parsedData.warnings.length > 0 && (
                <div className="bg-[#FFFBEB] border border-[#FCD34D] rounded-xl p-3 text-[12px] text-[#92400E] flex flex-col gap-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-[#D97706]" /> Parser Notice:
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5">
                    {parsedData.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Exam Info Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#FAFBF9] border border-[#DCE2DE] p-3.5 rounded-xl">
                <div className="flex flex-col gap-1">
                  <label className="font-mono-tag text-[10px] uppercase font-bold text-[#5B6B78]">
                    Exam Name
                  </label>
                  <input
                    type="text"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    className="font-sans-body text-[13px] px-3 py-1.5 border border-[#C3CCC7] rounded-lg text-[#16232E] bg-white focus:outline-none focus:border-[#B9852A]"
                    placeholder="e.g. Mid-Term Exam 2026"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-mono-tag text-[10px] uppercase font-bold text-[#5B6B78]">
                    Date / Term Label
                  </label>
                  <input
                    type="text"
                    value={dateLabel}
                    onChange={(e) => setDateLabel(e.target.value)}
                    className="font-sans-body text-[13px] px-3 py-1.5 border border-[#C3CCC7] rounded-lg text-[#16232E] bg-white focus:outline-none focus:border-[#B9852A]"
                    placeholder="e.g. Sep 2026"
                  />
                </div>
              </div>

              {/* Summary Badges */}
              <div className="flex items-center gap-3 text-[12.5px] font-mono-tag">
                <span className="bg-[#E1F0E7] text-[#3F7A5C] px-2.5 py-1 rounded-full font-semibold">
                  ✓ {parsedData.subjects.length} Subjects Extracted
                </span>
                <span className="bg-[#FBEED3] text-[#B9852A] px-2.5 py-1 rounded-full font-semibold">
                  ✓ {parsedData.students.length} Students Extracted
                </span>
              </div>

              {/* Subject & Max Marks Editor */}
              <div>
                <h4 className="font-serif-title font-semibold text-[14px] text-[#16232E] mb-2">
                  Detected Subjects &amp; Max Marks
                </h4>
                <div className="border border-[#DCE2DE] rounded-xl overflow-x-auto max-h-44 overflow-y-auto">
                  <table className="w-full text-left text-[12.5px] border-collapse">
                    <thead className="bg-[#F4F6F3] font-mono-tag text-[10.5px] uppercase text-[#5B6B78] sticky top-0">
                      <tr>
                        <th className="p-2 pl-3">Subject Name</th>
                        <th className="p-2 w-28">Max Marks</th>
                        <th className="p-2 w-28">Pass Marks</th>
                        <th className="p-2 w-12 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F4F6F3]">
                      {parsedData.subjects.map((sub) => (
                        <tr key={sub.id} className="hover:bg-[#FAFBF9]">
                          <td className="p-2 pl-3">
                            <input
                              type="text"
                              value={sub.name}
                              onChange={(e) => handleSubjectNameChange(sub.id, e.target.value)}
                              className="font-sans-body font-semibold text-[13px] px-2 py-1 border border-[#DCE2DE] rounded-md w-full"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={sub.max}
                              onChange={(e) => handleSubjectMaxChange(sub.id, parseInt(e.target.value, 10) || 100)}
                              className="font-sans-body text-[13px] px-2 py-1 border border-[#DCE2DE] rounded-md w-20"
                            />
                          </td>
                          <td className="p-2 font-mono-tag text-[12px] text-[#5B6B78]">
                            {sub.pass} pts (33%)
                          </td>
                          <td className="p-2 text-center">
                            <button
                              onClick={() => handleRemoveSubject(sub.id)}
                              title="Remove subject"
                              className="text-[#93A0AA] hover:text-[#B24A2C] p-1 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Student Roster Preview */}
              <div>
                <h4 className="font-serif-title font-semibold text-[14px] text-[#16232E] mb-2">
                  Student Roster Preview (First 5 of {parsedData.students.length})
                </h4>
                <div className="border border-[#DCE2DE] rounded-xl overflow-x-auto max-h-40 overflow-y-auto">
                  <table className="w-full text-left text-[12px] border-collapse">
                    <thead className="bg-[#F4F6F3] font-mono-tag text-[10px] uppercase text-[#5B6B78] sticky top-0">
                      <tr>
                        <th className="p-2 pl-3 w-14">Roll</th>
                        <th className="p-2">Name</th>
                        {parsedData.subjects.map((sub) => (
                          <th key={sub.id} className="p-2 text-center">
                            {sub.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F4F6F3]">
                      {parsedData.students.slice(0, 5).map((st) => (
                        <tr key={st.id} className="hover:bg-[#FAFBF9]">
                          <td className="p-2 pl-3 font-mono-tag text-[#5B6B78]">{st.roll}</td>
                          <td className="p-2 font-semibold text-[#16232E] whitespace-nowrap">
                            {st.name}
                          </td>
                          {parsedData.subjects.map((sub) => (
                            <td key={sub.id} className="p-2 text-center font-mono-tag">
                              {st.marks[sub.id] ?? '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#DCE2DE] bg-[#FAFBF9] flex items-center justify-between">
          {parsedData ? (
            <button
              type="button"
              onClick={() => {
                setParsedData(null);
                setError(null);
              }}
              className="text-xs font-semibold text-[#5B6B78] hover:text-[#16232E] underline cursor-pointer"
            >
              ← Choose Different File
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="font-sans-body font-semibold text-[13px] px-4 py-2 rounded-lg text-[#5B6B78] hover:bg-[#EEF0EE] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            {parsedData && (
              <button
                type="button"
                onClick={handleConfirm}
                className="font-sans-body font-semibold text-[13px] px-4 py-2 rounded-lg bg-[#16232E] text-white hover:bg-[#0d1720] transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
              >
                <span>Confirm &amp; Import Exam</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
