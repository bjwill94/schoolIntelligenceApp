import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
}

export const ChartModal: React.FC<ChartModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  headerExtra,
  children,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Portal keeps the fixed overlay relative to the viewport even if an ancestor gets a transform
  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 bg-[#16232E]/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 animate-fade"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-[#DCE2DE] rounded-2xl shadow-2xl w-full max-w-[1100px] max-h-[92vh] flex flex-col overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-[#DCE2DE] bg-[#FAFBF9] flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-serif-title font-semibold text-[19px] text-[#16232E] m-0">{title}</h3>
            {subtitle && <p className="text-[12px] text-[#5B6B78] m-0 mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            {headerExtra}
            <button
              type="button"
              onClick={onClose}
              title="Close (Esc)"
              className="text-[#93A0AA] hover:text-[#16232E] p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>,
    document.body
  );
};
