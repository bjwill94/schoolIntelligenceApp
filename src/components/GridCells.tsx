import React from 'react';
import { SubjectItem } from '../types';
import { bandColors, bandForMark, bandLabels, isAbsent, isNA, overallBand } from '../utils/stats';

interface MarkCellContentProps {
  value: number | string | undefined | null;
  sub: SubjectItem;
  compact?: boolean;
}

/** Band-coloured mark chip used by the class grid on screen and in the printed report. */
export const MarkCellContent: React.FC<MarkCellContentProps> = ({ value, sub, compact = false }) => {
  const size = compact
    ? 'w-[34px] h-[20px] rounded-[4px] text-[10px]'
    : 'w-[40px] h-[26px] rounded-[6px] text-[11px] shadow-xs';

  if (value === '' || value === undefined || value === null) {
    return <span className="text-[#93A0AA] font-mono-tag text-xs">—</span>;
  }

  if (isAbsent(value)) {
    return (
      <span
        className={`inline-flex items-center justify-center font-mono-tag font-bold text-[#B9852A] bg-[#FBEED3] border border-[#E2A93B] ${size}`}
        title="Absent"
      >
        AB
      </span>
    );
  }

  if (isNA(value)) {
    return (
      <span
        className={`inline-flex items-center justify-center font-mono-tag font-bold text-[#5B6B78] bg-[#EEF0EE] border border-[#DCE2DE] ${size}`}
        title="Not applicable / Optional"
      >
        NA
      </span>
    );
  }

  const num = Number(value);
  if (isNaN(num)) {
    return <span className="text-[#93A0AA] font-mono-tag text-xs">—</span>;
  }

  const b = bandForMark(num, sub);
  const isBelow = num < sub.pass;

  return (
    <span
      className={`relative inline-flex items-center justify-center font-mono-tag font-semibold text-white ${size}`}
      style={{ backgroundColor: bandColors[b] }}
      title={`${bandLabels[b]} (${num}/${sub.max})`}
    >
      {num}
      {isBelow && (
        <span
          className={`absolute -top-0.5 -right-0.5 rounded-full bg-[#E2A93B] border-[1.5px] border-white ${
            compact ? 'w-[6px] h-[6px]' : 'w-[7px] h-[7px]'
          }`}
          title="Below passing mark"
        />
      )}
    </span>
  );
};

interface PctPillProps {
  pct: number | null;
  compact?: boolean;
}

/** Overall % chip coloured by the overall performance band. */
export const PctPill: React.FC<PctPillProps> = ({ pct, compact = false }) => {
  if (pct === null) {
    return <span className="text-[#93A0AA] font-mono-tag text-xs">—</span>;
  }
  const b = overallBand(pct);
  return (
    <span
      className={`inline-flex items-center justify-center px-1.5 font-mono-tag font-semibold text-white ${
        compact
          ? 'min-w-[38px] h-[20px] rounded-[4px] text-[10px]'
          : 'min-w-[46px] h-[26px] rounded-[6px] text-[11.5px] shadow-xs'
      }`}
      style={{ backgroundColor: bandColors[b] }}
      title={bandLabels[b]}
    >
      {pct.toFixed(0)}%
    </span>
  );
};
