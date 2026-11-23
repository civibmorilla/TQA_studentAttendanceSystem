import { useEffect, useState } from 'react';
import API from '../services/api';
import TermSelect from '../components/TermSelect';
import { useToast, errMsg } from '../components/Toast';
import { downloadCsv } from '../utils/date';

const TARGET = 80;

// Turnout per class meeting: one series, one hue, 80% target line, hover tooltip.
function TurnoutChart({ trend }) {
  const [hover, setHover] = useState(null);
  if (!trend.length) return <p className="text-sm text-slate-500 py-6 text-center">No class meetings recorded in this period yet.</p>;

  const W = 720, H = 220, padL = 40, padR = 72, padB = 28, padT = 12;
  const plotW = W - padL - padR, plotH = H - padB - padT;
  const slot = plotW / trend.length;
  const barW = Math.max(4, Math.min(36, slot - 2)); // 2px gap between bars
  const y = (pct) => padT + plotH - (pct / 100) * plotH;
  const labelEvery = Math.ceil(trend.length / 8);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img"
        aria-label={`Turnout per class meeting, ${trend.length} meetings. Target ${TARGET} percent.`}>
        {[0, 50, 100].map((v) => (
          <g key={v}>
            <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke="#e2e8f0" strokeWidth="1" />
            <text x={padL - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#64748b">{v}%</text>
          </g>
        ))}
        {trend.map((t, i) => {
          const x = padL + i * slot + (slot - barW) / 2;
          const h = Math.max(0, y(0) - y(t.pct));
          const r = Math.min(4, barW / 2, h);
          // Rounded top only, anchored to the baseline
          const d = h <= 0 ? '' : `M${x},${y(0)} V${y(t.pct) + r} Q${x},${y(t.pct)} ${x + r},${y(t.pct)} H${x + barW - r} Q${x + barW},${y(t.pct)} ${x + barW},${y(t.pct) + r} V${y(0)} Z`;
          return (
            <g key={t.date} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={padL + i * slot} y={padT} width={slot} height={plotH} fill="transparent" />
              {d && <path d={d} fill={hover === i ? '#1d4ed8' : '#2563eb'} />}
              {i % labelEvery === 0 && (
                <text x={x + barW / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="#64748b">{t.date.slice(5)}</text>
              )}
            </g>
          );
        })}
        <line x1={padL} x2={W - padR + 4} y1={y(TARGET)} y2={y(TARGET)} stroke="#334155" strokeWidth="1.5" strokeDasharray="5 4" />
        <text x={W - padR + 8} y={y(TARGET) + 4} textAnchor="start" fontSize="11" fill="#334155">{TARGET}% target</text>
      </svg>
      {hover !== null && (
        <div className="absolute top-0 right-0 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 pointer-events-none">
          <strong>{trend[hover].date}</strong> · {trend[hover].pct}% ({trend[hover].attended}/{trend[hover].total} attended)
        </div>
      )}
    </div>
  );
}

export default function Reports() {
  const toast = useToast();
  const [termId, setTermId] = useState(undefined);
  const [summaries, setSummaries] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const termQuery = termId ? `termId=${termId}` : '';

  useEffect(() => {
    if (termId === undefined) return;
    let alive = true;
    API.get(`/attendance/summary${termQuery ? `?${termQuery}` : ''}`)
      .then((res) => {
        if (!alive) return;
        const data = res.data.data || [];
        setSummaries(data);
        setSelectedId((cur) => cur || data[0]?.subject._id || '');
      })
      .catch((err) => toast.error(errMsg(err, 'Failed to load reports.')))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termId]);

  useEffect(() => {
    if (!selectedId || termId === undefined) return;
    let alive = true;
    API.get(`/attendance/report?subjectId=${selectedId}${termQuery ? `&${termQuery}` : ''}`)
      .then((res) => { if (alive) setReport(res.data.data); })
      .catch((err) => toast.error(errMsg(err, 'Failed to load the class report.')));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, termId]);

  const exportCsv = () => {
    if (!report) return;
    const { subject, dates, rows } = report;
    const header = ['Student ID', 'Full Name', ...dates, 'Present', 'Late', 'Absent', 'Excused', 'Rate %', 'Below 80%'];
    const lines = rows.map((r) => [
      r.userCustomId, r.fullName,
      ...dates.map((d) => (r.statusByDate[d] ? r.statusByDate[d][0] : '')),
      r.stats.present, r.stats.late, r.stats.absent, r.stats.excused, r.stats.rate, r.stats.isBelowTarget ? 'YES' : ''
    ]);
    downloadCsv(`${subject.code}_${subject.section}${report.term ? `_${report.term.name}` : ''}_attendance.csv`.replace(/[^\w.-]+/g, '_'), [header, ...lines]);
  };

  return (
    <div className="p-6 md:p-8 bg-slate-50 min-h-screen">
      <div className="flex flex-wrap justify-between items-end gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Attendance Reports</h1>
          <p className="text-sm text-slate-600 mt-1">Class averages, turnout per meeting, and students below the {TARGET}% requirement.</p>
        </div>
        <TermSelect value={termId} onChange={(v) => { setLoading(true); setTermId(v); }} />
      </div>

      {loading ? <p className="text-sm text-slate-500 py-8 text-center">Loading…</p>
        : summaries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <p className="text-sm font-semibold text-slate-700">No classes yet</p>
            <p className="text-sm text-slate-500 mt-1">Reports appear once classes are created and attendance is taken.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
              {summaries.map(({ subject, summary }) => {
                const active = subject._id === selectedId;
                return (
                  <button key={subject._id} onClick={() => setSelectedId(subject._id)} aria-pressed={active}
                    className={`text-left bg-white p-5 rounded-2xl border shadow-sm transition ${active ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'}`}>
                    <p className="text-xs font-bold text-blue-700 uppercase">{subject.code} · {subject.section}</p>
                    <p className="font-bold text-slate-800 truncate">{subject.title}</p>
                    {subject.instructor && <p className="text-xs text-slate-500">{subject.instructor}</p>}
                    <div className="flex items-end justify-between mt-3">
                      <div>
                        <p className="text-3xl font-bold text-slate-800">{summary.avgRate === null ? '—' : `${summary.avgRate}%`}</p>
                        <p className="text-xs text-slate-500">avg. rate · {summary.meetings} meetings · {summary.rosterSize} students</p>
                      </div>
                      {summary.atRisk.length > 0 && (
                        <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">⚠ {summary.atRisk.length} below {TARGET}%</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {report && (
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                <div className="xl:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-4 gap-2">
                    <h2 className="text-base font-bold text-slate-800">Turnout per meeting · {report.subject.code}</h2>
                    <button onClick={exportCsv} className="px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50">⬇ Export CSV</button>
                  </div>
                  <TurnoutChart trend={report.trend} />
                </div>

                <div className="xl:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h2 className="text-base font-bold text-slate-800 mb-1">Students below {TARGET}%</h2>
                  <p className="text-xs text-slate-500 mb-3">Late counts as half. Excused days are not counted.</p>
                  {report.summary.atRisk.length === 0 ? (
                    <p className="text-sm text-emerald-700 font-semibold py-4">✅ Everyone is at or above {TARGET}%.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {report.summary.atRisk.map((s) => (
                        <li key={s.studentId} className="py-2.5 flex justify-between text-sm">
                          <span><span className="font-semibold text-slate-800">{s.fullName}</span> <span className="text-slate-500">· {s.userCustomId}</span></span>
                          <span className="font-bold text-rose-700">{s.rate}% · {s.absent} absent</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="xl:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
                  <h2 className="text-base font-bold text-slate-800 mb-3">All students</h2>
                  <table className="w-full text-left text-sm min-w-[560px]">
                    <thead><tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                      <th className="py-2.5 px-3">Student</th><th className="py-2.5 px-3 text-right">Present</th><th className="py-2.5 px-3 text-right">Late</th>
                      <th className="py-2.5 px-3 text-right">Absent</th><th className="py-2.5 px-3 text-right">Excused</th><th className="py-2.5 px-3 text-right">Rate</th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {report.rows.map((r) => (
                        <tr key={r.studentId}>
                          <td className="py-2.5 px-3"><span className="font-semibold text-slate-800">{r.fullName}</span> <span className="text-slate-500">· {r.userCustomId}</span></td>
                          <td className="py-2.5 px-3 text-right tabular-nums">{r.stats.present}</td>
                          <td className="py-2.5 px-3 text-right tabular-nums">{r.stats.late}</td>
                          <td className="py-2.5 px-3 text-right tabular-nums">{r.stats.absent}</td>
                          <td className="py-2.5 px-3 text-right tabular-nums">{r.stats.excused}</td>
                          <td className={`py-2.5 px-3 text-right font-bold tabular-nums ${r.stats.isBelowTarget ? 'text-rose-700' : 'text-slate-800'}`}>
                            {r.stats.total ? `${r.stats.rate}%` : '—'}{r.stats.isBelowTarget ? ' ⚠' : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
    </div>
  );
}
