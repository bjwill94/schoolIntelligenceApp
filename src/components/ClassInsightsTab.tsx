import React, { useState } from 'react';
import { ExamItem } from '../types';
import {
  bandColors,
  bandForMark,
  bandLabels,
  computeInsights,
  overallBand,
  studentTotals,
} from '../utils/stats';
import {
  DistributionChart,
  OverviewChart,
  DetailChart,
} from './ChartComponents';
import { ChevronRight } from 'lucide-react';
import { SubjectMultiSelect } from './SubjectMultiSelect';

type GridSortType = 'roll' | 'pctDesc' | 'pctAsc';

const GRID_SORT_OPTIONS: { id: GridSortType; label: string }[] = [
  { id: 'roll', label: 'Roll no.' },
  { id: 'pctDesc', label: 'Highest %' },
  { id: 'pctAsc', label: 'Lowest %' },
];

interface ClassInsightsTabProps {
  exam: ExamItem;
  onGoToEnterMarks: () => void;
}

export const ClassInsightsTab: React.FC<ClassInsightsTabProps> = ({
  exam,
  onGoToEnterMarks,
}) => {
  const insights = computeInsights(exam);
  const subjects = exam.subjects || [];

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    subjects.length > 0 ? subjects[0].id : ''
  );
  const [isGridOpen, setIsGridOpen] = useState(false);
  const [attentionSubs, setAttentionSubs] = useState<string[]>([]);
  const [gridSort, setGridSort] = useState<GridSortType>('roll');

  if (!insights || insights.validStudents.length === 0) {
    return (
      <div className="bg-white border border-[#DCE2DE] rounded-[10px] p-12 text-center my-4 shadow-xs">
        <h3 className="font-serif-title text-[20px] font-semibold text-[#16232E] mb-2">
          No marks entered yet
        </h3>
        <p className="text-[13px] text-[#5B6B78] mb-4 max-w-md mx-auto">
          Switch to &ldquo;Enter Marks&rdquo; and fill in scores for this exam to see insights here.
        </p>
        <button
          onClick={onGoToEnterMarks}
          className="font-sans-body font-semibold text-[13px] px-4 py-2 rounded-lg bg-[#16232E] text-white hover:bg-[#0d1720] cursor-pointer transition-all shadow-xs"
        >
          Go to Enter Marks
        </button>
      </div>
    );
  }

  const {
    validStudents,
    overallPassCount,
    passPct,
    weakest,
    strongest,
    subjStats,
    distCounts,
    attention,
    attendance,
  } = insights;

  const currentSelectedSub =
    subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  const sortedSubjStats = [...subjStats].sort(
    (a, b) =>
      (b.n > 0 ? 1 : 0) - (a.n > 0 ? 1 : 0) ||
      b.avgPct - a.avgPct ||
      a.sub.name.localeCompare(b.sub.name)
  );

  const gridRows = validStudents
    .map((st) => ({ st, totals: studentTotals(st, subjects) }))
    .sort((a, b) => {
      if (gridSort === 'roll') return a.st.roll - b.st.roll;
      if (a.totals.pct === null || b.totals.pct === null) {
        return (a.totals.pct === null ? 1 : 0) - (b.totals.pct === null ? 1 : 0) || a.st.roll - b.st.roll;
      }
      const d = gridSort === 'pctDesc' ? b.totals.pct - a.totals.pct : a.totals.pct - b.totals.pct;
      return d || a.st.roll - b.st.roll;
    });

  const gridPcts = gridRows
    .map((r) => r.totals.pct)
    .filter((p): p is number => p !== null);
  const gridClassAvgPct =
    gridPcts.length > 0 ? gridPcts.reduce((a, b) => a + b, 0) / gridPcts.length : null;

  const attentionCounts: Record<string, number> = {};
  attention.forEach((a) => {
    a.issues.forEach((i) => {
      attentionCounts[i.subject.id] = (attentionCounts[i.subject.id] || 0) + 1;
    });
  });

  const activeAttentionSubs = attentionSubs.filter((id) => subjects.some((s) => s.id === id));
  const isAttentionFiltered = activeAttentionSubs.length > 0;
  const filteredAttention = !isAttentionFiltered
    ? attention
    : attention
        .map((a) => ({
          ...a,
          issues: a.issues.filter((i) => activeAttentionSubs.includes(i.subject.id)),
        }))
        .filter((a) => a.issues.length > 0)
        .sort((x, y) => y.issues.length - x.issues.length || x.st.roll - y.st.roll);

  return (
    <div className="flex flex-col gap-5 animate-fade">
      {/* 5 Headline Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-[1px] bg-[#DCE2DE] border border-[#DCE2DE] rounded-[10px] overflow-hidden shadow-xs">
        {/* Weakest Subject */}
        <div className="bg-white p-4 flex flex-col justify-between gap-1">
          <span className="font-mono-tag text-[10px] uppercase tracking-wider text-[#5B6B78]">
            Needs the most support
          </span>
          <div className="font-serif-title font-semibold text-[22px] text-[#B24A2C] leading-tight line-clamp-1">
            {weakest.sub.name}
          </div>
          <div className="text-[12px] text-[#5B6B78] leading-relaxed">
            Avg {weakest.avgScore.toFixed(1)} / {weakest.sub.max} ({weakest.avgPct.toFixed(0)}%) — lowest in class.
          </div>
        </div>

        {/* Strongest Subject */}
        <div className="bg-white p-4 flex flex-col justify-between gap-1">
          <span className="font-mono-tag text-[10px] uppercase tracking-wider text-[#5B6B78]">
            Doing well
          </span>
          <div className="font-serif-title font-semibold text-[22px] text-[#3F7A5C] leading-tight line-clamp-1">
            {strongest.sub.name}
          </div>
          <div className="text-[12px] text-[#5B6B78] leading-relaxed">
            Avg {strongest.avgScore.toFixed(1)} / {strongest.sub.max} ({strongest.avgPct.toFixed(0)}%) — strongest in class.
          </div>
        </div>

        {/* Pass Rate */}
        <div className="bg-white p-4 flex flex-col justify-between gap-1">
          <span className="font-mono-tag text-[10px] uppercase tracking-wider text-[#5B6B78]">
            Pass rate
          </span>
          <div
            className={`font-serif-title font-semibold text-[22px] leading-tight ${passPct < 70 ? 'text-[#B24A2C]' : 'text-[#16232E]'
              }`}
          >
            {overallPassCount} / {validStudents.length}
          </div>
          <div className="text-[12px] text-[#5B6B78] leading-relaxed">
            {passPct.toFixed(0)}% of students passed every subject.
          </div>
        </div>

        {/* Needs Attention */}
        <div className="bg-white p-4 flex flex-col justify-between gap-1">
          <span className="font-mono-tag text-[10px] uppercase tracking-wider text-[#5B6B78]">
            Needs attention
          </span>
          <div
            className={`font-serif-title font-semibold text-[22px] leading-tight ${attention.length > 0 ? 'text-[#B24A2C]' : 'text-[#3F7A5C]'
              }`}
          >
            {attention.length}
          </div>
          <div className="text-[12px] text-[#5B6B78] leading-relaxed">
            {attention.length === 0
              ? 'No students below passing right now.'
              : `${attention.length} student${attention.length !== 1 ? 's' : ''} below passing in at least one subject.`}
          </div>
        </div>

        {/* Class Attendance */}
        <div className="bg-white p-4 flex flex-col justify-between gap-1">
          <span className="font-mono-tag text-[10px] uppercase tracking-wider text-[#5B6B78]">
            Class attendance
          </span>
          <div
            className={`font-serif-title font-semibold text-[22px] leading-tight ${attendance === null
                ? 'text-[#16232E]'
                : attendance < 75
                  ? 'text-[#B24A2C]'
                  : 'text-[#3F7A5C]'
              }`}
          >
            {attendance === null ? '—' : `${attendance}%`}
          </div>
          <div className="text-[12px] text-[#5B6B78] leading-relaxed">
            {attendance === null
              ? 'Not entered for this exam yet.'
              : 'Average attendance for this exam period.'}
          </div>
        </div>
      </div>

      {/* Whole class performance chart */}
      <div className="bg-white border border-[#DCE2DE] rounded-[10px] p-[18px] sm:p-5 shadow-xs">
        <h3 className="font-serif-title text-[16px] font-semibold text-[#16232E] m-0 mb-1">
          How the whole class performed
        </h3>
        <p className="text-[12px] text-[#5B6B78] m-0 mb-3.5">
          Every student&apos;s overall score, grouped into simple performance bands.
        </p>
        <div className="h-[240px] w-full relative">
          <DistributionChart distCounts={distCounts} />
        </div>
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Subjects at a glance */}
        <div className="bg-white border border-[#DCE2DE] rounded-[10px] p-[18px] sm:p-5 shadow-xs flex flex-col">
          <h3 className="font-serif-title text-[16px] font-semibold text-[#16232E] m-0 mb-1">
            Subjects at a glance
          </h3>
          <p className="text-[12px] text-[#5B6B78] m-0 mb-3.5">
            Share of students on track (60%+) vs. needing support, per subject.
          </p>
          <div className="h-[220px] w-full relative">
            <OverviewChart subjStats={subjStats} />
          </div>
        </div>

        {/* Full breakdown for one subject */}
        <div className="bg-white border border-[#DCE2DE] rounded-[10px] p-[18px] sm:p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
            <h3 className="font-serif-title text-[16px] font-semibold text-[#16232E] m-0">
              Full breakdown for one subject
            </h3>
            <select
              value={currentSelectedSub?.id || ''}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="font-sans-body font-semibold text-[13px] py-1.5 px-3 rounded-lg border-[1.5px] border-[#C3CCC7] bg-white text-[#16232E] cursor-pointer focus:outline-none focus:border-[#B9852A]"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <p className="text-[12px] text-[#5B6B78] m-0 mb-2">
            Pick a subject to see its complete performance split.
          </p>
          {currentSelectedSub && (
            (() => {
              const st = subjStats.find((s) => s.sub.id === currentSelectedSub.id);
              if (!st) return null;
              return (
                <div className="flex items-center justify-between gap-2 bg-[#FAFBF9] border border-[#DCE2DE] rounded-lg px-3 py-2 mb-2 flex-wrap text-xs">
                  <div>
                    <span className="font-mono-tag text-[9px] uppercase text-[#5B6B78] block">Class Average</span>
                    {st.n > 0 ? (
                      <span className="font-bold text-[13px] text-[#16232E]">
                        {st.avgScore.toFixed(1)}{' '}
                        <span className="text-[10px] font-normal text-[#5B6B78]">/ {st.sub.max}</span>{' '}
                        <span className="text-[11px] font-semibold text-[#5B6B78]">({st.avgPct.toFixed(0)}%)</span>
                      </span>
                    ) : (
                      <span className="font-bold text-[13px] text-[#16232E]">—</span>
                    )}
                  </div>
                  {st.absent > 0 && (
                    <span
                      className="font-mono-tag text-[11px] font-semibold px-2 py-0.5 rounded bg-[#FBEED3] text-[#B9852A] border border-[#E2A93B] cursor-help"
                      title={
                        st.appeared > 0
                          ? `Average of the ${st.appeared} who appeared: ${st.appearedAvgScore.toFixed(1)} (${st.appearedAvgPct.toFixed(0)}%)`
                          : 'Every student was absent'
                      }
                    >
                      Absent: {st.absent}
                    </span>
                  )}
                  <div className="h-5 w-[1px] bg-[#DCE2DE] hidden sm:block" />
                  <div>
                    <span className="font-mono-tag text-[9px] uppercase text-[#5B6B78] block">Range</span>
                    <span className="font-mono-tag text-[11.5px] text-[#16232E]">{st.appeared > 0 ? `${st.minScore}–${st.maxScore}` : '—'}</span>
                  </div>
                  <div className="h-5 w-[1px] bg-[#DCE2DE] hidden sm:block" />
                  <div>
                    <span className="font-mono-tag text-[9px] uppercase text-[#5B6B78] block">On Track</span>
                    <span className="font-bold text-[12px] text-[#3F7A5C]">{st.n > 0 ? `${st.onTrack}/${st.n}` : '—'}</span>
                  </div>
                </div>
              );
            })()
          )}
          <div className="h-[180px] w-full relative">
            {currentSelectedSub && (
              <DetailChart
                validStudents={validStudents}
                selectedSubject={currentSelectedSub}
              />
            )}
          </div>
        </div>
      </div>

      {/* Subject Performance Breakdown Table */}
      <div className="bg-white border border-[#DCE2DE] rounded-[10px] p-[18px] sm:p-5 shadow-xs">
        <h3 className="font-serif-title text-[16px] font-semibold text-[#16232E] m-0 mb-1">
          Subject Average Marks &amp; Breakdown
        </h3>
        <p className="text-[12px] text-[#5B6B78] m-0 mb-3.5">
          Absent students count as 0; NA is excluded. Sorted from highest to lowest average %.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b-2 border-[#16232E] bg-[#FAFBF9]">
                <th className="font-mono-tag text-[10.5px] uppercase text-[#5B6B78] py-2.5 px-3">Subject</th>
                <th className="font-mono-tag text-[10.5px] uppercase text-[#5B6B78] py-2.5 px-3 text-center">Max</th>
                <th className="font-mono-tag text-[10.5px] uppercase text-[#5B6B78] py-2.5 px-3 text-center">Pass</th>
                <th className="font-mono-tag text-[10.5px] uppercase text-[#5B6B78] py-2.5 px-3 text-center">Appeared</th>
                <th className="font-mono-tag text-[10.5px] uppercase text-[#5B6B78] py-2.5 px-3 text-center">Class Avg Score</th>
                <th className="font-mono-tag text-[10.5px] uppercase text-[#5B6B78] py-2.5 px-3 text-center">Avg %</th>
                <th className="font-mono-tag text-[10.5px] uppercase text-[#5B6B78] py-2.5 px-3 text-center">Avg (Appeared)</th>
                <th className="font-mono-tag text-[10.5px] uppercase text-[#5B6B78] py-2.5 px-3 text-center">Highest / Lowest</th>
                <th className="font-mono-tag text-[10.5px] uppercase text-[#5B6B78] py-2.5 px-3 text-right pr-3">On Track (60%+)</th>
              </tr>
            </thead>
            <tbody>
              {sortedSubjStats.map((st) => (
                <tr key={st.sub.id} className="border-b border-[#DCE2DE] hover:bg-[#FAFBF9] transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-[#1C2B39]">{st.sub.name}</td>
                  <td className="py-2.5 px-3 text-center font-mono-tag text-[#5B6B78]">{st.sub.max}</td>
                  <td className="py-2.5 px-3 text-center font-mono-tag text-[#5B6B78]">{st.sub.pass}</td>
                  <td className="py-2.5 px-3 text-center font-mono-tag text-[12px] text-[#16232E]">
                    {st.n > 0 ? (
                      <div className="flex flex-col items-center leading-tight">
                        <span>{st.appeared} / {st.n}</span>
                        {st.absent > 0 && (
                          <span className="text-[10px] font-semibold text-[#B9852A]">{st.absent} AB</span>
                        )}
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono-tag font-bold text-[#16232E]">
                    {st.n > 0 ? (
                      <span>
                        {st.avgScore.toFixed(1)} <span className="font-normal text-[11px] text-[#5B6B78]">/ {st.sub.max}</span>
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono-tag">
                    <span className={`px-2 py-0.5 rounded text-[11.5px] font-semibold ${st.avgPct >= 60 ? 'bg-[#E1F0E7] text-[#3F7A5C]' : 'bg-[#F7E4DC] text-[#B24A2C]'}`}>
                      {st.n > 0 ? `${st.avgPct.toFixed(1)}%` : '—'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono-tag text-[12px] text-[#5B6B78]">
                    {st.appeared > 0 ? (
                      <div className="flex flex-col items-center leading-tight">
                        <span>
                          {st.appearedAvgScore.toFixed(1)} <span className="text-[11px]">/ {st.sub.max}</span>
                        </span>
                        <span className="text-[10px]">{st.appearedAvgPct.toFixed(1)}%</span>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono-tag text-[12px] text-[#5B6B78]">
                    {st.appeared > 0 ? `${st.maxScore} / ${st.minScore}` : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right pr-3 font-mono-tag text-[12px] text-[#16232E]">
                    {st.n > 0 ? `${st.onTrack} / ${st.n}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Needs Attention Card */}
      <div className="bg-white border border-[#DCE2DE] rounded-[10px] p-[18px] sm:p-5 shadow-xs">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
          <h3 className="font-serif-title text-[16px] font-semibold text-[#16232E] m-0">
            Needs attention
          </h3>
          {subjects.length > 1 && (
            <SubjectMultiSelect
              subjects={subjects}
              counts={attentionCounts}
              selected={activeAttentionSubs}
              onChange={setAttentionSubs}
            />
          )}
        </div>
        <p className="text-[12px] text-[#5B6B78] m-0 mb-3">
          Students below passing mark or absent in evaluated subjects.
          {isAttentionFiltered && (
            <>
              {' '}
              <span className="text-[#16232E] font-medium">
                Showing {filteredAttention.length} of {attention.length} student
                {attention.length !== 1 ? 's' : ''}.
              </span>{' '}
              <button
                type="button"
                onClick={() => setAttentionSubs([])}
                className="text-[#B9852A] hover:text-[#16232E] font-semibold underline cursor-pointer"
              >
                Clear
              </button>
            </>
          )}
        </p>

        {filteredAttention.length === 0 ? (
          <div className="text-[13px] text-[#3F7A5C] py-2 font-medium">
            {isAttentionFiltered
              ? 'No one is below passing or absent in the selected subject(s).'
              : 'Nobody is below passing or absent in any subject. 🎉'}
          </div>
        ) : (
          <div className="divide-y divide-[#DCE2DE]">
            {filteredAttention.map((a) => (
              <div
                key={a.st.id}
                className="flex items-center justify-between py-2.5 text-[13px] gap-2 flex-wrap"
              >
                <span className="font-semibold text-[#1C2B39] flex items-center">
                  <span className="font-mono-tag text-[#93A0AA] text-[11px] mr-2">
                    {String(a.st.roll).padStart(2, '0')}
                  </span>
                  {a.st.name}
                </span>
                <div className="flex gap-1.5 flex-wrap items-center">
                  {a.issues.map((issue) => {
                    const rawVal = a.st.marks[issue.subject.id];
                    if (issue.reason === 'absent') {
                      return (
                        <span
                          key={issue.subject.id}
                          className="font-mono-tag text-[11px] font-semibold px-2 py-0.5 rounded bg-[#FBEED3] text-[#B9852A] border border-[#E2A93B]"
                        >
                          {issue.subject.name} (Absent)
                        </span>
                      );
                    }
                    return (
                      <span
                        key={issue.subject.id}
                        className="font-mono-tag text-[11px] font-semibold px-2 py-0.5 rounded bg-[#F7E4DC] text-[#B24A2C] border border-[#B24A2C]"
                      >
                        {issue.subject.name} ({rawVal}/{issue.subject.max})
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Collapsible Full Class Grid (Heatmap) */}
      <div className="bg-white border border-[#DCE2DE] rounded-[10px] p-[18px] sm:p-5 shadow-xs">
        <div
          onClick={() => setIsGridOpen(!isGridOpen)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <h3 className="font-serif-title text-[16px] font-semibold text-[#16232E] m-0">
            View full class grid
          </h3>
          <div className="flex items-center gap-3">
            {isGridOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 cursor-default"
              >
                <span className="font-mono-tag text-[10px] uppercase text-[#93A0AA] hidden sm:inline">
                  Sort
                </span>
                <div className="inline-flex rounded-lg border-[1.5px] border-[#C3CCC7] overflow-hidden">
                  {GRID_SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setGridSort(opt.id)}
                      aria-pressed={gridSort === opt.id}
                      className={`font-sans-body font-semibold text-[12px] px-2.5 py-1 cursor-pointer transition-colors border-l border-[#DCE2DE] first:border-l-0 ${
                        gridSort === opt.id
                          ? 'bg-[#16232E] text-white'
                          : 'bg-white text-[#5B6B78] hover:text-[#16232E]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <ChevronRight
              className={`w-4 h-4 text-[#5B6B78] transition-transform duration-200 ${isGridOpen ? 'rotate-90' : ''
                }`}
            />
          </div>
        </div>
        <p className="text-[12px] text-[#5B6B78] mt-1 mb-0">
          Every student, every subject, colour-coded by band with AB and NA indicators, plus each student&apos;s total and %.
        </p>

        {isGridOpen && (
          <div className="mt-4 pt-3 border-t border-[#F4F6F3] animate-fade">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-center">
                <thead>
                  <tr className="border-b-2 border-[#16232E]">
                    <th className="font-mono-tag text-[10.5px] uppercase text-[#5B6B78] py-2 px-1.5 text-left pl-1">
                      Student
                    </th>
                    {subjects.map((s) => (
                      <th
                        key={s.id}
                        className="font-mono-tag text-[10.5px] uppercase text-[#5B6B78] py-2 px-1.5"
                      >
                        {s.name}
                      </th>
                    ))}
                    <th className="font-mono-tag text-[10.5px] uppercase text-[#5B6B78] py-2 px-1.5 border-l border-[#DCE2DE]">
                      Total
                    </th>
                    <th className="font-mono-tag text-[10.5px] uppercase text-[#5B6B78] py-2 px-1.5">%</th>
                  </tr>
                </thead>
                <tbody>
                  {gridRows.map(({ st, totals }) => (
                    <tr key={st.id} className="border-b border-[#DCE2DE]">
                      <td className="text-left text-[12.5px] font-medium text-[#1C2B39] whitespace-nowrap py-1.5 px-1.5 pl-1">
                        <span className="font-mono-tag text-[#93A0AA] text-[10.5px] mr-1.5">
                          {String(st.roll).padStart(2, '0')}
                        </span>
                        {st.name}
                      </td>
                      {subjects.map((sub) => {
                        const v = st.marks[sub.id];
                        if (v === '' || v === undefined || v === null) {
                          return (
                            <td key={sub.id} className="py-1 px-1.5 text-[#93A0AA] font-mono-tag text-xs">
                              —
                            </td>
                          );
                        }

                        const sStr = String(v).trim().toUpperCase();
                        if (sStr === 'AB' || sStr === 'ABSENT' || sStr === 'A') {
                          return (
                            <td key={sub.id} className="py-1 px-1.5">
                              <span
                                className="inline-flex items-center justify-center w-[40px] h-[26px] rounded-[6px] font-mono-tag text-[11px] font-bold text-[#B9852A] bg-[#FBEED3] border border-[#E2A93B] shadow-xs"
                                title="Absent"
                              >
                                AB
                              </span>
                            </td>
                          );
                        }

                        if (sStr === 'NA' || sStr === 'N/A' || sStr === '-') {
                          return (
                            <td key={sub.id} className="py-1 px-1.5">
                              <span
                                className="inline-flex items-center justify-center w-[40px] h-[26px] rounded-[6px] font-mono-tag text-[11px] font-bold text-[#5B6B78] bg-[#EEF0EE] border border-[#DCE2DE] shadow-xs"
                                title="Not applicable / Optional"
                              >
                                NA
                              </span>
                            </td>
                          );
                        }

                        const num = Number(v);
                        if (isNaN(num)) {
                          return (
                            <td key={sub.id} className="py-1 px-1.5 text-[#93A0AA] font-mono-tag text-xs">
                              —
                            </td>
                          );
                        }

                        const b = bandForMark(num, sub);
                        const isBelow = num < sub.pass;

                        return (
                          <td key={sub.id} className="py-1 px-1.5">
                            <span
                              className="relative inline-flex items-center justify-center w-[40px] h-[26px] rounded-[6px] font-mono-tag text-[11.5px] font-semibold text-white shadow-xs"
                              style={{ backgroundColor: bandColors[b] }}
                              title={`${bandLabels[b]} (${num}/${sub.max})`}
                            >
                              {num}
                              {isBelow && (
                                <span
                                  className="absolute -top-0.5 -right-0.5 w-[7px] h-[7px] rounded-full bg-[#E2A93B] border-[1.5px] border-white"
                                  title="Below passing mark"
                                />
                              )}
                            </span>
                          </td>
                        );
                      })}
                      <td className="py-1 px-1.5 font-mono-tag text-[12px] text-[#16232E] whitespace-nowrap border-l border-[#DCE2DE]">
                        {totals.pct !== null ? (
                          <>
                            <span className="font-semibold">{+totals.got.toFixed(2)}</span>
                            <span className="text-[#5B6B78]"> / {totals.max}</span>
                          </>
                        ) : (
                          <span className="text-[#93A0AA]">—</span>
                        )}
                      </td>
                      <td className="py-1 px-1.5">
                        {totals.pct !== null ? (
                          <span
                            className="inline-flex items-center justify-center min-w-[46px] h-[26px] px-1.5 rounded-[6px] font-mono-tag text-[11.5px] font-semibold text-white shadow-xs"
                            style={{ backgroundColor: bandColors[overallBand(totals.pct)] }}
                            title={bandLabels[overallBand(totals.pct)]}
                          >
                            {totals.pct.toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-[#93A0AA] font-mono-tag text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#16232E] bg-[#FAFBF9]">
                    <td className="text-left text-[11.5px] font-bold text-[#16232E] font-mono-tag uppercase py-2 px-1.5 pl-1">
                      Class Avg
                    </td>
                    {subjects.map((sub) => {
                      const st = subjStats.find((s) => s.sub.id === sub.id);
                      if (!st || st.n === 0) {
                        return (
                          <td key={sub.id} className="py-2 px-1.5 font-mono-tag text-xs text-[#93A0AA]">
                            —
                          </td>
                        );
                      }
                      return (
                        <td key={sub.id} className="py-2 px-1.5 font-mono-tag font-bold text-[12px] text-[#16232E]">
                          <div className="flex flex-col items-center leading-tight">
                            <span>{st.avgScore.toFixed(1)}</span>
                            <span className="text-[9.5px] text-[#5B6B78] font-normal">{st.avgPct.toFixed(0)}%</span>
                          </div>
                        </td>
                      );
                    })}
                    <td className="py-2 px-1.5 font-mono-tag text-xs text-[#93A0AA] border-l border-[#DCE2DE]">
                      —
                    </td>
                    <td className="py-2 px-1.5 font-mono-tag font-bold text-[12px] text-[#16232E]">
                      {gridClassAvgPct !== null ? `${gridClassAvgPct.toFixed(0)}%` : '—'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Legend */}
            <div className="flex gap-3.5 items-center mt-3 text-[11px] text-[#5B6B78] flex-wrap pt-2">
              {[5, 4, 3, 2, 1].map((b) => (
                <span key={b} className="flex items-center gap-1.5">
                  <span
                    className="w-[11px] h-[11px] rounded-[3px] inline-block"
                    style={{ backgroundColor: bandColors[b] }}
                  />
                  <span>{bandLabels[b]}</span>
                </span>
              ))}
              <span className="flex items-center gap-1.5">
                <span className="w-[11px] h-[11px] rounded-[3px] inline-block bg-white border-2 border-[#E2A93B]" />
                <span>flagged (below pass)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="px-1 py-0.2 rounded bg-[#FBEED3] border border-[#E2A93B] text-[#B9852A] font-bold text-[9.5px]">AB</span>
                <span>Absent</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="px-1 py-0.2 rounded bg-[#EEF0EE] border border-[#DCE2DE] text-[#5B6B78] font-bold text-[9.5px]">NA</span>
                <span>Optional / Not applicable</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
