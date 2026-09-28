import React, { useEffect, useRef, useState } from 'react';
import { SubjectItem } from '../types';
import { Check, ChevronDown } from 'lucide-react';

interface SubjectMultiSelectProps {
  subjects: SubjectItem[];
  counts: Record<string, number>;
  selected: string[]; // empty = all subjects
  onChange: (ids: string[]) => void;
}

export const SubjectMultiSelect: React.FC<SubjectMultiSelectProps> = ({
  subjects,
  counts,
  selected,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const isAll = selected.length === 0;

  const toggleSubject = (id: string) => {
    const next = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id];
    onChange(next.length === subjects.length ? [] : next);
  };

  let buttonLabel = 'All subjects';
  if (selected.length === 1) {
    buttonLabel = subjects.find((s) => s.id === selected[0])?.name || 'All subjects';
  } else if (selected.length > 1) {
    buttonLabel = `${selected.length} subjects`;
  }

  const renderCheckbox = (checked: boolean) => (
    <span
      className={`w-4 h-4 rounded-[4px] border-[1.5px] flex items-center justify-center shrink-0 transition-colors ${
        checked ? 'bg-[#16232E] border-[#16232E]' : 'bg-white border-[#C3CCC7]'
      }`}
    >
      {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
    </span>
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`font-sans-body font-semibold text-[13px] py-1.5 pl-3 pr-2 rounded-lg border-[1.5px] bg-white text-[#16232E] cursor-pointer inline-flex items-center gap-1.5 transition-colors focus:outline-none ${
          isOpen ? 'border-[#B9852A]' : 'border-[#C3CCC7] hover:border-[#16232E]'
        }`}
      >
        <span className="max-w-[160px] truncate">{buttonLabel}</span>
        <ChevronDown
          className={`w-4 h-4 text-[#5B6B78] transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-multiselectable="true"
          className="absolute right-0 mt-1.5 z-20 w-[240px] max-h-[280px] overflow-y-auto bg-white border border-[#DCE2DE] rounded-[10px] shadow-lg py-1.5 animate-fade"
        >
          <button
            type="button"
            role="option"
            aria-selected={isAll}
            onClick={() => onChange([])}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] font-semibold text-[#16232E] hover:bg-[#FAFBF9] cursor-pointer"
          >
            {renderCheckbox(isAll)}
            <span>All subjects</span>
          </button>
          <div className="h-[1px] bg-[#DCE2DE] my-1" />
          {subjects.map((sub) => {
            const checked = selected.includes(sub.id);
            const count = counts[sub.id] || 0;
            return (
              <button
                key={sub.id}
                type="button"
                role="option"
                aria-selected={checked}
                onClick={() => toggleSubject(sub.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] text-[#1C2B39] hover:bg-[#FAFBF9] cursor-pointer"
              >
                {renderCheckbox(checked)}
                <span className="flex-1 truncate">{sub.name}</span>
                <span
                  className={`font-mono-tag text-[11px] font-semibold px-1.5 rounded ${
                    count > 0 ? 'bg-[#F7E4DC] text-[#B24A2C]' : 'bg-[#EEF0EE] text-[#93A0AA]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
