import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Printer } from 'lucide-react';
import { ChartModal } from '../ChartModal';
import { PrintReport, PrintReportProps } from './PrintReport';
import {
  REPORT_SECTIONS,
  ReportOptions,
  ReportSectionId,
  loadReportOptions,
  saveReportOptions,
} from './reportTypes';

type ExportReportDialogProps = Omit<PrintReportProps, 'options'> & {
  isOpen: boolean;
  onClose: () => void;
};

const PRINT_ROOT_ID = 'print-root';
const PRINTING_BODY_CLASS = 'printing-report';

function getPrintRoot(): HTMLElement {
  let el = document.getElementById(PRINT_ROOT_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = PRINT_ROOT_ID;
    document.body.appendChild(el);
  }
  return el;
}

const Checkbox: React.FC<{ checked: boolean }> = ({ checked }) => (
  <span
    className={`w-4 h-4 rounded-[4px] border-[1.5px] flex items-center justify-center shrink-0 transition-colors ${
      checked ? 'bg-[#16232E] border-[#16232E]' : 'bg-white border-[#C3CCC7]'
    }`}
  >
    {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
  </span>
);

export const ExportReportDialog: React.FC<ExportReportDialogProps> = ({
  isOpen,
  onClose,
  ...reportProps
}) => {
  const [options, setOptions] = useState<ReportOptions>(loadReportOptions);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (isOpen) setOptions(loadReportOptions());
  }, [isOpen]);

  const updateOptions = (patch: Partial<ReportOptions>) => {
    setOptions((prev) => {
      const next = { ...prev, ...patch };
      saveReportOptions(next);
      return next;
    });
  };

  const toggleSection = (id: ReportSectionId) => {
    updateOptions({ sections: { ...options.sections, [id]: !options.sections[id] } });
  };

  const anySection = REPORT_SECTIONS.some((s) => options.sections[s.id]);

  useEffect(() => {
    if (!isPrinting) return;
    let cancelled = false;
    const finish = () => setIsPrinting(false);
    document.body.classList.add(PRINTING_BODY_CLASS);
    window.addEventListener('afterprint', finish);
    // Two frames: let React commit the print portal and the canvases paint before printing
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (!cancelled) window.print();
      })
    );
    return () => {
      cancelled = true;
      document.body.classList.remove(PRINTING_BODY_CLASS);
      window.removeEventListener('afterprint', finish);
    };
  }, [isPrinting]);

  const inputClass =
    'font-sans-body text-[13px] px-2.5 py-1.5 border border-[#C3CCC7] rounded-[7px] text-[#1C2B39] bg-white focus:outline-none focus:border-[#B9852A] w-full';
  const labelClass = 'font-mono-tag text-[10px] uppercase text-[#5B6B78] font-semibold';

  return (
    <>
      <ChartModal
        isOpen={isOpen}
        onClose={onClose}
        title="Export report"
        subtitle="Choose what to include. The report follows your current filters and sort order."
        headerExtra={
          <button
            type="button"
            onClick={() => setIsPrinting(true)}
            disabled={!anySection || isPrinting}
            className="font-sans-body font-semibold text-[13px] px-3.5 py-1.5 rounded-lg bg-[#16232E] text-white hover:bg-[#0d1720] cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-5">
          {/* Options */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="report-school">
                School name
              </label>
              <input
                id="report-school"
                type="text"
                value={options.schoolName}
                onChange={(e) => updateOptions({ schoolName: e.target.value })}
                placeholder="e.g. Kendriya Vidyalaya, Pune"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="report-prepared-by">
                Prepared by
              </label>
              <input
                id="report-prepared-by"
                type="text"
                value={options.preparedBy}
                onChange={(e) => updateOptions({ preparedBy: e.target.value })}
                placeholder="Teacher name"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className={labelClass}>Sections</span>
              <div className="border border-[#DCE2DE] rounded-[10px] py-1 bg-white">
                {REPORT_SECTIONS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    role="checkbox"
                    aria-checked={options.sections[s.id]}
                    onClick={() => toggleSection(s.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-[13px] text-[#1C2B39] hover:bg-[#FAFBF9] cursor-pointer"
                  >
                    <Checkbox checked={options.sections[s.id]} />
                    <span>{s.label}</span>
                    {s.id === 'grid' && (
                      <span className="ml-auto font-mono-tag text-[9.5px] text-[#93A0AA]">landscape</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              role="checkbox"
              aria-checked={options.showNames}
              onClick={() => updateOptions({ showNames: !options.showNames })}
              className="flex items-start gap-2.5 text-left text-[13px] text-[#1C2B39] cursor-pointer"
            >
              <span className="mt-0.5">
                <Checkbox checked={options.showNames} />
              </span>
              <span>
                Show student names
                <span className="block text-[11px] text-[#5B6B78]">
                  Turn off to show roll numbers only.
                </span>
              </span>
            </button>

            <p className="text-[11px] text-[#5B6B78] leading-relaxed m-0 bg-[#FAFBF9] border border-[#DCE2DE] rounded-lg p-2.5">
              In the print dialog, choose <b>Save as PDF</b> as the destination to get a file. If the
              colours are missing, turn on <b>Background graphics</b>.
            </p>
          </div>

          {/* Live preview */}
          <div className="bg-[#EEF0EE] rounded-[10px] p-3 sm:p-4 overflow-auto max-h-[70vh]">
            {anySection ? (
              <div style={{ zoom: 0.85 }}>
                <div className="bg-white shadow-md mx-auto w-[210mm] p-[12mm]">
                  <PrintReport {...reportProps} options={options} />
                </div>
              </div>
            ) : (
              <div className="text-center text-[13px] text-[#5B6B78] py-16">
                Tick at least one section to preview the report.
              </div>
            )}
          </div>
        </div>
      </ChartModal>

      {isPrinting && createPortal(<PrintReport {...reportProps} options={options} />, getPrintRoot())}
    </>
  );
};
