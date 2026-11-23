import { useEffect, useState } from 'react';
import API from '../services/api';

// Dropdown of academic terms. value = termId or '' (all dates).
// Picks the active term automatically the first time if `defaultActive` is set.
export default function TermSelect({ value, onChange, defaultActive = true, className = '' }) {
  const [terms, setTerms] = useState([]);

  useEffect(() => {
    let alive = true;
    API.get('/terms')
      .then((res) => {
        if (!alive) return;
        setTerms(res.data.data || []);
        if (defaultActive && value === undefined && res.data.active) onChange(res.data.active._id);
        else if (value === undefined) onChange('');
      })
      .catch(() => { if (alive && value === undefined) onChange(''); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <select
      aria-label="Academic term"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className={`border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 bg-white outline-none focus:border-blue-600 ${className}`}
    >
      <option value="">All dates</option>
      {terms.map((t) => (
        <option key={t._id} value={t._id}>{t.name}{t.isActive ? ' (current)' : ''}</option>
      ))}
    </select>
  );
}
