import React from 'react';
import { AttentionItem, ExamItem, InsightsData, StudentItem, SubjectStat } from '../../types';
import { bandColors, bandLabels } from '../../utils/stats';
import { DistributionChart, OverviewChart } from '../ChartComponents';
import { MarkCellContent, PctPill } from '../GridCells';
import { ReportOptions } from './reportTypes';

export interface ReportGridRow {
  st: StudentItem;
  totals: { got: number; max: number; pct: number | null };
}

export interface PrintReportProps {
  classLabel: string;
  exam: ExamItem;
  insights: InsightsData;
  sortedSubjStats: SubjectStat[];
  attention: AttentionItem[];
  attentionFilterLabel: string | null;
  gridRows: ReportGridRow[];
  gridSortLabel: string;
  gridClassAvgPct: number | null;
  options: ReportOptions;
}

// A4 portrait content width at 12mm margins is 186mm, roughly 700 CSS px
const PORTRAIT_CHART_WIDTH = 680;

const pad2 = (n: number) => String(n).padStart(2, '0');

const SectionTitle: React.FC<{ title: string; note?: string | null }> = ({ title, note }) => (
  <div className="flex items-baseline justify-between gap-3 border-b-2 border-[#16232E] pb-1 mb-2.5">
    <h2 className="font-serif-title text-[15px] font-semibold text-[#16232E] m-0">{title}</h2>
    {note && <span className="text-[10.5px] text-[#5B6B78]">{note}</span>}
  </div>
);

const th = 'font-mono-tag text-[9.5px] uppercase text-[#5B6B78] py-1.5 px-2 font-semibold';
const td = 'py-1.5 px-2 border-b border-[#DCE2DE]';

export const PrintReport: React.FC<PrintReportProps> = ({
  classLabel,
  exam,
  insights,
  sortedSubjStats,
  attention,
  attentionFilterLabel,
  gridRows,
  gridSortLabel,
  gridClassAvgPct,
  options,
}) => {
  const { sections, showNames } = options;
  const subjects = exam.subjects || [];
  const {
    validStudents,
    overallPassCount,
    passPct,
    weakest,
    strongest,
    subjStats,
    distCounts,
    attendance,
  } = insights;

  const generatedOn = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const studentCell = (st: StudentItem) => (
    <>
      <span className="font-mono-tag text-[#93A0AA] mr-1.5">{pad2(st.roll)}</span>
      {showNames ? st.name : <span className="text-[#5B6B78]">Roll {pad2(st.roll)}</span>}
    </>
  );

  return (
    <div className="print-report font-sans-body text-[#1C2B39] bg-white text-[11.5px] leading-snug">
      {/* Header */}
      <header className="report-section mb-4">
        <div className="flex items-start justify-between gap-4 border-b-[3px] border-[#16232E] pb-2.5">
          <div>
            {options.schoolName.trim() && (
              <div className="font-mono-tag text-[10.5px] tracking-[0.12em] uppercase text-[#B9852A] font-semibold mb-0.5">
                {options.schoolName.trim()}
              </div>
            )}
            <h1 className="font-serif-title text-[22px] font-semibold text-[#16232E] m-0 leading-tight">
              Class Performance Report
            </h1>
            <div className="text-[12.5px] text-[#16232E] font-semibold mt-1">
              {classLabel} · {exam.name}
              {exam.dateLabel ? ` · ${exam.dateLabel}` : ''}
            </div>
          </div>
          <div className="text-right text-[10.5px] text-[#5B6B78] leading-relaxed shrink-0">
            <div>Generated {generatedOn}</div>
            <div>{validStudents.length} students counted</div>
            <div>Attendance {attendance === null ? 'not entered' : `${attendance}%`}</div>
          </div>
        </div>
        <p className="text-[9.5px] text-[#5B6B78] mt-1.5 mb-0">
          Absent (AB) counts as 0; NA (optional / not taken) is excluded. For staff use only.
        </p>
      </header>

      {sections.summary && (
        <section className="report-section mb-5">
          <SectionTitle title="Summary" />
          <div className="grid grid-cols-5 border border-[#DCE2DE] rounded-md overflow-hidden">
            {[
              {
                label: 'Needs the most support',
                value: weakest.sub.name,
                detail: `Avg ${weakest.avgScore.toFixed(1)} / ${weakest.sub.max} (${weakest.avgPct.toFixed(0)}%)`,
                color: '#B24A2C',
              },
              {
                label: 'Doing well',
                value: strongest.sub.name,
                detail: `Avg ${strongest.avgScore.toFixed(1)} / ${strongest.sub.max} (${strongest.avgPct.toFixed(0)}%)`,
                color: '#3F7A5C',
              },
              {
                label: 'Pass rate',
                value: `${overallPassCount} / ${validStudents.length}`,
                detail: `${passPct.toFixed(0)}% passed every subject`,
                color: passPct < 70 ? '#B24A2C' : '#16232E',
              },
              {
                label: 'Needs attention',
                value: String(insights.attention.length),
                detail: 'below pass or absent in 1+ subject',
                color: insights.attention.length > 0 ? '#B24A2C' : '#3F7A5C',
              },
              {
                label: 'Class attendance',
                value: attendance === null ? '—' : `${attendance}%`,
                detail: attendance === null ? 'Not entered' : 'Exam period average',
                color: attendance !== null && attendance < 75 ? '#B24A2C' : '#16232E',
              },
            ].map((card, i) => (
              <div key={card.label} className={`p-2.5 ${i > 0 ? 'border-l border-[#DCE2DE]' : ''}`}>
                <div className="font-mono-tag text-[8.5px] uppercase text-[#5B6B78]">{card.label}</div>
                <div
                  className="font-serif-title font-semibold text-[15px] leading-tight mt-0.5"
                  style={{ color: card.color }}
                >
                  {card.value}
                </div>
                <div className="text-[9.5px] text-[#5B6B78] mt-0.5">{card.detail}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {sections.distribution && (
        <section className="report-section mb-5">
          <SectionTitle title="How the whole class performed" note="Overall % grouped into bands" />
          <DistributionChart distCounts={distCounts} print={{ width: PORTRAIT_CHART_WIDTH, height: 200 }} />
          <table className="w-full border-collapse text-center mt-2">
            <thead>
              <tr>
                {[1, 2, 3, 4, 5].map((b) => (
                  <th key={b} className={th}>
                    <span
                      className="inline-block w-[8px] h-[8px] rounded-[2px] mr-1 align-middle"
                      style={{ backgroundColor: bandColors[b] }}
                    />
                    {bandLabels[b]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {[1, 2, 3, 4, 5].map((b) => (
                  <td key={b} className={`${td} font-mono-tag font-semibold`}>
                    {distCounts[b] || 0}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </section>
      )}

      {sections.glance && (
        <section className="report-section mb-5">
          <SectionTitle
            title="Subjects at a glance"
            note="On track = 60%+; needs support = below 60%; absent shown separately"
          />
          <OverviewChart
            subjStats={subjStats}
            print={{ width: PORTRAIT_CHART_WIDTH, height: Math.max(160, subjStats.length * 28 + 70) }}
          />
        </section>
      )}

      {sections.breakdown && (
        <section className="mb-5">
          <SectionTitle title="Subject average marks & breakdown" note="Sorted from highest to lowest average %" />
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#FAFBF9] border-b border-[#16232E]">
                <th className={th}>Subject</th>
                <th className={`${th} text-center`}>Max / Pass</th>
                <th className={`${th} text-center`}>Appeared</th>
                <th className={`${th} text-center`}>Class avg</th>
                <th className={`${th} text-center`}>Avg %</th>
                <th className={`${th} text-center`}>Avg (appeared)</th>
                <th className={`${th} text-center`}>High / Low</th>
                <th className={`${th} text-right`}>On track</th>
              </tr>
            </thead>
            <tbody>
              {sortedSubjStats.map((st) => (
                <tr key={st.sub.id} className="break-inside-avoid">
                  <td className={`${td} font-semibold`}>{st.sub.name}</td>
                  <td className={`${td} text-center font-mono-tag text-[#5B6B78]`}>
                    {st.sub.max} / {st.sub.pass}
                  </td>
                  <td className={`${td} text-center font-mono-tag`}>
                    {st.n > 0 ? `${st.appeared} / ${st.n}` : '—'}
                    {st.absent > 0 && <span className="text-[#B9852A]"> ({st.absent} AB)</span>}
                  </td>
                  <td className={`${td} text-center font-mono-tag font-semibold`}>
                    {st.n > 0 ? st.avgScore.toFixed(1) : '—'}
                  </td>
                  <td
                    className={`${td} text-center font-mono-tag font-semibold`}
                    style={{ color: st.n > 0 ? (st.avgPct >= 60 ? '#3F7A5C' : '#B24A2C') : undefined }}
                  >
                    {st.n > 0 ? `${st.avgPct.toFixed(1)}%` : '—'}
                  </td>
                  <td className={`${td} text-center font-mono-tag text-[#5B6B78]`}>
                    {st.appeared > 0 ? `${st.appearedAvgScore.toFixed(1)} (${st.appearedAvgPct.toFixed(0)}%)` : '—'}
                  </td>
                  <td className={`${td} text-center font-mono-tag text-[#5B6B78]`}>
                    {st.appeared > 0 ? `${st.maxScore} / ${st.minScore}` : '—'}
                  </td>
                  <td className={`${td} text-right font-mono-tag`}>
                    {st.n > 0 ? `${st.onTrack} / ${st.n}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {sections.attention && (
        <section className="mb-5">
          <SectionTitle
            title="Needs attention"
            note={
              attentionFilterLabel
                ? `Filtered: ${attentionFilterLabel} · ${attention.length} student${attention.length !== 1 ? 's' : ''}`
                : `${attention.length} student${attention.length !== 1 ? 's' : ''} below pass or absent`
            }
          />
          {attention.length === 0 ? (
            <p className="text-[#3F7A5C] font-medium m-0">
              {attentionFilterLabel
                ? 'No one is below passing or absent in the selected subject(s).'
                : 'Nobody is below passing or absent in any subject.'}
            </p>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#FAFBF9] border-b border-[#16232E]">
                  <th className={`${th} w-[34%]`}>Student</th>
                  <th className={th}>Subjects</th>
                </tr>
              </thead>
              <tbody>
                {attention.map((a) => (
                  <tr key={a.st.id} className="break-inside-avoid">
                    <td className={`${td} font-semibold whitespace-nowrap`}>{studentCell(a.st)}</td>
                    <td className={td}>
                      <div className="flex flex-wrap gap-1">
                        {a.issues.map((issue) =>
                          issue.reason === 'absent' ? (
                            <span
                              key={issue.subject.id}
                              className="font-mono-tag text-[9.5px] font-semibold px-1.5 py-[1px] rounded bg-[#FBEED3] text-[#B9852A] border border-[#E2A93B]"
                            >
                              {issue.subject.name} (Absent)
                            </span>
                          ) : (
                            <span
                              key={issue.subject.id}
                              className="font-mono-tag text-[9.5px] font-semibold px-1.5 py-[1px] rounded bg-[#F7E4DC] text-[#B24A2C] border border-[#B24A2C]"
                            >
                              {issue.subject.name} ({a.st.marks[issue.subject.id]}/{issue.subject.max})
                            </span>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {sections.grid && (
        <section className="report-landscape mb-5">
          <SectionTitle title="Full class grid" note={`Sorted by ${gridSortLabel}`} />
          <table className="w-full border-collapse text-center">
            <thead>
              <tr className="bg-[#FAFBF9] border-b border-[#16232E]">
                <th className={`${th} text-left`}>Student</th>
                {subjects.map((s) => (
                  <th key={s.id} className={th}>
                    {s.name}
                  </th>
                ))}
                <th className={`${th} border-l border-[#DCE2DE]`}>Total</th>
                <th className={th}>%</th>
              </tr>
            </thead>
            <tbody>
              {gridRows.map(({ st, totals }) => (
                <tr key={st.id} className="break-inside-avoid">
                  <td className="py-[3px] px-2 border-b border-[#DCE2DE] text-left font-medium whitespace-nowrap">
                    {studentCell(st)}
                  </td>
                  {subjects.map((sub) => (
                    <td key={sub.id} className="py-[3px] px-1 border-b border-[#DCE2DE]">
                      <MarkCellContent value={st.marks[sub.id]} sub={sub} compact />
                    </td>
                  ))}
                  <td className="py-[3px] px-2 border-b border-l border-[#DCE2DE] font-mono-tag whitespace-nowrap">
                    {totals.pct !== null ? `${+totals.got.toFixed(2)} / ${totals.max}` : '—'}
                  </td>
                  <td className="py-[3px] px-1 border-b border-[#DCE2DE]">
                    <PctPill pct={totals.pct} compact />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#16232E] bg-[#FAFBF9]">
                <td className="py-1.5 px-2 text-left font-mono-tag text-[9.5px] uppercase font-bold">Class avg</td>
                {subjects.map((sub) => {
                  const st = subjStats.find((s) => s.sub.id === sub.id);
                  return (
                    <td key={sub.id} className="py-1.5 px-1 font-mono-tag font-semibold">
                      {st && st.n > 0 ? `${st.avgScore.toFixed(1)} (${st.avgPct.toFixed(0)}%)` : '—'}
                    </td>
                  );
                })}
                <td className="py-1.5 px-2 font-mono-tag text-[#93A0AA] border-l border-[#DCE2DE]">—</td>
                <td className="py-1.5 px-1 font-mono-tag font-bold">
                  {gridClassAvgPct !== null ? `${gridClassAvgPct.toFixed(0)}%` : '—'}
                </td>
              </tr>
            </tfoot>
          </table>
          <div className="flex gap-3 items-center mt-2 text-[9.5px] text-[#5B6B78] flex-wrap">
            {[5, 4, 3, 2, 1].map((b) => (
              <span key={b} className="flex items-center gap-1">
                <span className="w-[9px] h-[9px] rounded-[2px] inline-block" style={{ backgroundColor: bandColors[b] }} />
                {bandLabels[b]}
              </span>
            ))}
            <span className="flex items-center gap-1">
              <span className="w-[7px] h-[7px] rounded-full inline-block bg-[#E2A93B]" /> below pass
            </span>
            <span>AB = absent · NA = optional / not taken</span>
          </div>
        </section>
      )}

      {/* Sign-off */}
      <footer className="report-section mt-8 pt-3 border-t border-[#DCE2DE]">
        <div className="grid grid-cols-3 gap-6 text-[11px]">
          {[
            { label: 'Prepared by', value: options.preparedBy.trim() },
            { label: 'Signature', value: '' },
            { label: 'Date', value: '' },
          ].map((f) => (
            <div key={f.label}>
              <div className="h-[22px] border-b border-[#16232E] font-medium flex items-end pb-0.5">
                {f.value}
              </div>
              <div className="font-mono-tag text-[9px] uppercase text-[#5B6B78] mt-1">{f.label}</div>
            </div>
          ))}
        </div>
        <p className="text-[9px] text-[#93A0AA] mt-4 mb-0 text-center">
          For staff use only. Contains student performance data. Generated by School Register.
        </p>
      </footer>
    </div>
  );
};
