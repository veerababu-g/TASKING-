import React, { useState,  } from 'react';

export default function DailyPowerhousePlanner() {
  const [startHour, setStartHour] = useState(8);
  const [completed, setCompleted] = useState({});
  const [today, ] = useState(new Date());
  const [progressByDate, setProgressByDate] = useState({});

  const blocks = [
    { id: 't1', title: 'Internship hunt', durationMin: 90, note: 'Search, shortlist & apply (3 targeted apps)'},
    { id: 'b1', title: 'Break #1', durationMin: 20, isBreak: true },
    { id: 't2', title: 'Apply for jobs', durationMin: 90, note: '5 quality applications' },
    { id: 'b2', title: 'Break #2', durationMin: 20, isBreak: true },
    { id: 't3', title: 'B.Tech Subject (Study)', durationMin: 90, note: 'Core topic focus' },
    { id: 'l', title: 'Lunch + recharge', durationMin: 50, isBreak: true },
    { id: 't4', title: 'DSA + NxtWave revision', durationMin: 90, note: '8–10 problems / 1 module' },
    { id: 'b3', title: 'Break #3', durationMin: 20, isBreak: true },
    { id: 't5', title: 'Embedded Systems', durationMin: 90, note: 'New concept or mini-project' },
    { id: 'b4', title: 'Break #4', durationMin: 20, isBreak: true },
    { id: 't3c', title: 'B.Tech Subject (Practice)', durationMin: 90, note: 'Practice / past papers' },
  ];

  function minutesToTime(mins) {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }

  let cursor = startHour * 60;
  const schedule = blocks.map(b => {
    const from = cursor;
    const to = cursor + b.durationMin;
    cursor = to;
    return { ...b, from: minutesToTime(from), to: minutesToTime(to) };
  });

  const toggleDone = id => {
    const newCompleted = { ...completed, [id]: !completed[id] };
    setCompleted(newCompleted);
    const percent = Math.round((Object.values(newCompleted).filter(Boolean).length / schedule.filter(s=>!s.isBreak).length) * 100);
    const key = today.toDateString();
    setProgressByDate(prev => ({ ...prev, [key]: percent }));
  };

  const percentDone = Math.round((Object.values(completed).filter(Boolean).length / schedule.filter(s=>!s.isBreak).length) * 100);

  const exportText = () => {
    const lines = schedule.map(s => `${s.from} - ${s.to} | ${s.title} ${s.note?'- '+s.note:''}`);
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'daily-plan.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  // Calendar rendering with progress indicators
  const renderCalendar = () => {
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const weeks = [];
    let day = 1 - firstDay;

    for (let w = 0; w < 6; w++) {
      const weekDays = [];
      for (let d = 0; d < 7; d++) {
        if (day < 1 || day > daysInMonth) {
          weekDays.push(<td key={d} className="empty"/>);
        } else {
          const isToday = day === today.getDate();
          const dateObj = new Date(year, month, day);
          const key = dateObj.toDateString();
          const progress = progressByDate[key] || 0;
          weekDays.push(
            <td key={d} className={isToday ? 'today' : ''}>
              <div className="cal-cell">
                <span>{day}</span>
                {progress > 0 && <div className="progress-dot" style={{background:`linear-gradient(to top, #10b981 ${progress}%, #e5e7eb ${progress}%)`}}/>}
              </div>
            </td>
          );
        }
        day++;
      }
      weeks.push(<tr key={w}>{weekDays}</tr>);
    }

    return (
      <div className="calendar">
        <div className="cal-header">{today.toLocaleString('default', { month: 'long' })} {year}</div>
        <table>
          <thead>
            <tr>
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>(<th key={d}>{d}</th>))}
            </tr>
          </thead>
          <tbody>{weeks}</tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="planner-container">
      <div className="calendar-side">{renderCalendar()}</div>
      <div className="planner">
        <header>
          <div>
            <h1>10‑Hour Powerhouse Planner</h1>
            <p>Based on the 5×90 deep‑focus system — optimized for energy and outputs.</p>
          </div>
          <div className="controls">
            <label>Start hour</label>
            <input type="number" min="0" max="23" value={startHour}
              onChange={e=>setStartHour(Math.max(0, Math.min(23, Number(e.target.value))))} />
            <button onClick={exportText}>Export</button>
          </div>
        </header>

        <div className="progress">
          <div className="bar"><div style={{width:`${percentDone}%`}}/></div>
          <p>Progress: {percentDone}%</p>
        </div>

        <main>
          {schedule.map((s) => (
            <div key={s.id} className={`task ${s.isBreak? 'break':''}`}>
              <div className="time">{s.from} - {s.to}</div>
              <div className="details">
                <h3>{s.title}</h3>
                {s.note && <p>{s.note}</p>}
                <small>{s.durationMin} min</small>
              </div>
              {!s.isBreak && (
                <button onClick={()=>toggleDone(s.id)} className={completed[s.id]? 'done':''}>
                  {completed[s.id]? 'Done':'Work Done'}
                </button>
              )}
            </div>
          ))}
        </main>

        <footer>
          <button onClick={()=>setCompleted({})}>Reset</button>
          <button onClick={()=>window.print()}>Print Plan</button>
        </footer>
      </div>

      <style>{`
        .planner-container { display:flex; gap:20px; padding:20px; background:#f9fafb; }
        .planner { flex:1; background:white; border-radius:12px; padding:20px; box-shadow:0 4px 12px rgba(0,0,0,0.08); }
        header { display:flex; justify-content:space-between; align-items:center; }
        header h1 { font-size:1.5rem; margin:0; }
        header p { font-size:0.9rem; color:#555; margin-top:4px; }
        .controls { display:flex; align-items:center; gap:8px; }
        .controls input { width:60px; padding:4px; text-align:center; border-radius:6px; border:1px solid #ccc; }
        .controls button { padding:6px 12px; border-radius:8px; border:1px solid #333; background:#fff; cursor:pointer; }
        .progress { margin:20px 0; }
        .bar { width:100%; height:10px; background:#eee; border-radius:6px; overflow:hidden; }
        .bar div { height:100%; background:linear-gradient(to right,#34d399,#059669); }
        main { display:grid; gap:12px; }
        .task { display:flex; justify-content:space-between; align-items:center; padding:12px; border:1px solid #ddd; border-radius:10px; background:#fafafa; }
        .task.break { background:#f0f9ff; }
        .time { font-size:0.8rem; color:#666; width:80px; }
        .details h3 { margin:0; font-size:1rem; }
        .details p { margin:4px 0; font-size:0.85rem; color:#555; }
        .details small { color:#999; }
        .task button { padding:6px 12px; border-radius:20px; border:1px solid #444; background:white; cursor:pointer; }
        .task button.done { background:#059669; color:white; border:none; }
        footer { margin-top:20px; display:flex; justify-content:flex-end; gap:10px; }
        footer button { padding:8px 14px; border-radius:8px; border:1px solid #333; cursor:pointer; }
        .calendar { background:white; border-radius:12px; padding:16px; box-shadow:0 4px 12px rgba(0,0,0,0.1); }
        .calendar .cal-header { font-weight:bold; text-align:center; margin-bottom:8px; font-size:1.1rem; }
        .calendar table { width:100%; border-collapse:collapse; text-align:center; }
        .calendar th { font-size:0.8rem; padding:4px; color:#666; }
        .calendar td { width:40px; height:40px; border-radius:8px; cursor:pointer; vertical-align:middle; }
        .calendar td:hover { background:#e5e7eb; }
        .calendar td.today { background:#059669; color:white; font-weight:bold; }
        .calendar td.empty { background:transparent; cursor:default; }
        .cal-cell { position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center; }
        .progress-dot { width:24px; height:4px; border-radius:2px; margin-top:2px; }
      `}</style>
    </div>
  );
}
