// DailyPowerhousePlanner.jsx
// Single-file React component (copy into a CRA/Vite project).
// Features:
// - Original 10-hour time-slot layout (5×90 rule + breaks)
// - Daily history saved by date (localStorage)
// - Add / edit tasks (titles editable inline)
// - Edit B.Tech 3 subjects daily (subtasks on the B.Tech task)
// - Clickable calendar to load previous days' history
//
// Usage: import DailyPowerhousePlanner from './DailyPowerhousePlanner.jsx' and render in your app.

import React, { useEffect, useState } from 'react';

export default function DailyPowerhousePlanner() {
  // Default time-slot blocks (keeps the previous schedule/durations)
  const defaultBlocks = [
    { id: 't1', title: 'Internship hunt', durationMin: 90, isBreak: false },
    { id: 'b1', title: 'Break #1', durationMin: 20, isBreak: true },
    { id: 't2', title: 'Apply for jobs', durationMin: 90, isBreak: false },
    { id: 'b2', title: 'Break #2', durationMin: 20, isBreak: true },
    { id: 't3', title: 'B.Tech Subjects', durationMin: 90, isBreak: false, subtasks: ['Subject 1','Subject 2','Subject 3'] },
    { id: 'l',  title: 'Lunch + recharge', durationMin: 50, isBreak: true },
    { id: 't4', title: 'DSA + NxtWave revision', durationMin: 90, isBreak: false },
    { id: 'b3', title: 'Break #3', durationMin: 20, isBreak: true },
    { id: 't5', title: 'Embedded Systems', durationMin: 90, isBreak: false },
    { id: 'b4', title: 'Break #4', durationMin: 20, isBreak: true },
    { id: 't3c', title: 'B.Tech Practice', durationMin: 90, isBreak: false }
  ];

  // Local state
  const [startHour, setStartHour] = useState(8);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0,0,0,0);
    return d;
  });
  const [plannerHistory, setPlannerHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('plannerHistory') || '{}');
    } catch (e) {
      return {};
    }
  });

  // tasks for the currently selected date (editable)
  const [tasks, setTasks] = useState(() => {
    const key = new Date().toDateString();
    return plannerHistory[key] ?? defaultBlocks;
  });

  // sync tasks -> plannerHistory whenever tasks or selectedDate change
  useEffect(() => {
    const key = selectedDate.toDateString();
    const updated = { ...plannerHistory, [key]: tasks };
    setPlannerHistory(updated);
    localStorage.setItem('plannerHistory', JSON.stringify(updated));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, selectedDate]);

  // When selectedDate changes, load tasks for that date (or default)
  useEffect(() => {
    const key = selectedDate.toDateString();
    setTasks(plannerHistory[key] ?? structuredClone(defaultBlocks));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // Utility: deep clone fallback (structuredClone may not be available in some envs)
  function structuredClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // compute schedule times from startHour
  function computeSchedule(blocks) {
    let cursor = startHour * 60; // minutes since midnight
    return blocks.map(b => {
      const from = cursor;
      const to = cursor + b.durationMin;
      cursor = to;
      return { ...b, from: minsToTime(from), to: minsToTime(to) };
    });
  }
  function minsToTime(mins) {
    const h = Math.floor(mins / 60) % 12;
    const m = mins % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }

  const schedule = computeSchedule(tasks);

  // Toggle done - store 'done' flag on task
  const toggleDone = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  // Edit task title
  const editTaskTitle = (id, newTitle) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, title: newTitle } : t));
  };

  // Edit B.Tech subtasks (3 subjects)
  const editBtechSubtask = (taskId, index, newValue) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const subtasks = Array.isArray(t.subtasks) ? [...t.subtasks] : ['','',''];
        subtasks[index] = newValue;
        return { ...t, subtasks };
      }
      return t;
    }));
  };

  // Add task (adds before the final B.Tech Practice block by default)
  const addTask = () => {
    const newTask = {
      id: 'x' + Date.now(),
      title: 'New Task',
      durationMin: 60,
      isBreak: false
    };
    // insert before last block (t3c)
    setTasks(prev => {
      const copy = [...prev];
      // insert before last work block (keep breaks structure by placing at end before final)
      copy.splice(copy.length - 1, 0, newTask);
      return copy;
    });
  };

  // Remove task
  const removeTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // Export today's schedule as text
  const exportText = () => {
    const lines = schedule.map(s => `${s.from} - ${s.to} | ${s.title}${s.subtasks? ' | ' + s.subtasks.join(', '): ''}`);
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `plan-${selectedDate.toDateString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calendar: build month grid for selectedDate's month
  const calendarMonth = (() => {
    const d = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month+1, 0).getDate();
    const cells = [];
    for (let i=0;i<firstDay;i++) cells.push(null);
    for (let day=1; day<=daysInMonth; day++) cells.push(day);
    return { year, month, cells };
  })();

  // Calculate progress for a given date key
  const progressForDate = (date) => {
    const key = date.toDateString();
    const dayTasks = plannerHistory[key];
    if (!dayTasks) return 0;
    const work = dayTasks.filter(t=>!t.isBreak);
    if (work.length === 0) return 0;
    const doneCount = work.filter(t => t.done).length;
    return Math.round((doneCount / work.length) * 100);
  };

  // Handle clicking a date cell
  const handleDateClick = (day) => {
    if (!day) return;
    const newDate = new Date(calendarMonth.year, calendarMonth.month, day);
    newDate.setHours(0,0,0,0);
    setSelectedDate(newDate);
  };

  // Reset tasks for selected date to defaults
  const resetDay = () => {
    setTasks(structuredClone(defaultBlocks));
  };

  // Simple styles inline block: keep similar look to previous
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <header style={styles.header}>
          <div>
            <h1 style={{margin:0}}>10-Hour Powerhouse Planner</h1>
            <div style={{color:'#6b7280',marginTop:6}}>5×90 deep-focus schedule — time slots preserved</div>
            <div style={{marginTop:6,fontSize:13,color:'#4b5563'}}>Date: <strong>{selectedDate.toDateString()}</strong></div>
          </div>

          <div style={{display:'flex',gap:10,alignItems:'center'}}>
            <label style={{fontSize:13,color:'#374151'}}>Start hour</label>
            <input
              type="number"
              min={0}
              max={23}
              value={startHour}
              onChange={e => setStartHour(Math.max(0,Math.min(23,Number(e.target.value||0))))}
              style={styles.input}
            />
            <button onClick={exportText} style={styles.btn}>Export</button>
            <button onClick={addTask} style={{...styles.btn,background:'#10b981',color:'#fff'}}>+ Task</button>
          </div>
        </header>

        <div style={{marginTop:14}}>
          <div style={styles.progressBarOuter}>
            <div style={{...styles.progressBarInner, width: `${progressForDate(selectedDate)}%`}} />
          </div>
          <div style={{fontSize:13,color:'#6b7280',marginTop:8}}>Day progress: <strong>{progressForDate(selectedDate)}%</strong></div>
        </div>

        <main style={{marginTop:18}}>
          {schedule.map(block => (
            <div key={block.id} style={{...styles.block, background: block.isBreak ? '#f8fafc' : '#fff'}}>
              <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                <div style={{textAlign:'center',color:'#6b7280',width:68,fontSize:12}}>
                  <div>{block.from}</div>
                  <div style={{fontSize:11,marginTop:6}}>to</div>
                  <div style={{marginTop:6}}>{block.to}</div>
                </div>

                <div style={{minWidth:0}}>
                  <input
                    value={block.title}
                    onChange={(e) => editTaskTitle(block.id, e.target.value)}
                    style={{...styles.titleInput, background: block.isBreak ? 'transparent' : '#fff'}}
                  />
                  {block.subtasks && Array.isArray(block.subtasks) && (
                    <div style={{marginTop:8,display:'flex',gap:8,flexWrap:'wrap'}}>
                      {block.subtasks.map((sub, idx) => (
                        <input
                          key={idx}
                          value={sub}
                          onChange={(e) => editBtechSubtask(block.id, idx, e.target.value)}
                          style={styles.subInput}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{display:'flex',alignItems:'center',gap:8}}>
                {!block.isBreak && (
                  <>
                    <button
                      onClick={() => toggleDone(block.id)}
                      style={ block.done ? {...styles.doneBtn, background:'#059669', color:'#fff'} : styles.doneBtn }
                    >
                      {block.done ? 'Done' : 'Mark Done'}
                    </button>
                    <button onClick={() => removeTask(block.id)} style={styles.deleteBtn}>Remove</button>
                  </>
                )}
                <div style={{fontSize:12,color:'#6b7280'}}>{block.isBreak ? 'Break' : 'Work'}</div>
              </div>
            </div>
          ))}
        </main>

        <footer style={{marginTop:18,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{color:'#6b7280',fontSize:13}}>Tip: edit titles, update B.Tech subjects, click dates to load history.</div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={resetDay} style={styles.btn}>Reset Day</button>
            <button onClick={() => { setTasks(prev => prev.map(t => ({ ...t, done: false })))}} style={styles.btn}>Unmark All</button>
            <button onClick={() => window.print()} style={styles.btn}>Print</button>
          </div>
        </footer>
      </div>

      {/* Calendar side */}
      <aside style={styles.calendarCard}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{fontWeight:700}}>{selectedDate.toLocaleString('default',{month:'long'})} {selectedDate.getFullYear()}</div>
          <div style={{fontSize:12,color:'#6b7280'}}>Click a day</div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:6,marginTop:10,marginBottom:6, textAlign:'center',color:'#6b7280'}}>
          {['S','M','T','W','T','F','S'].map(d => <div key={d} style={{fontSize:12,fontWeight:600}}>{d}</div>)}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:6}}>
          {calendarMonth.cells.map((day, i) => {
            if (!day) return <div key={i} style={styles.calendarEmpty} />;
            const dateObj = new Date(calendarMonth.year, calendarMonth.month, day);
            const prog = progressForDate(dateObj);
            const isActive = dateObj.toDateString() === selectedDate.toDateString();
            return (
              <div
                key={i}
                onClick={() => handleDateClick(day)}
                style={{
                  ...styles.calendarDay,
                  background: isActive ? '#059669' : '#f8fafc',
                  color: isActive ? '#fff' : '#111',
                }}
              >
                <div style={{fontWeight:700}}>{day}</div>
                <div style={{height:6, width:'100%', marginTop:6, background:'#e6eaf0', borderRadius:6, overflow:'hidden'}}>
                  <div style={{height:'100%', width: `${prog}%`, background: 'linear-gradient(90deg,#10b981,#059669)'}} />
                </div>
                <div style={{fontSize:11,marginTop:6,color: isActive ? 'rgba(255,255,255,0.85)' : '#6b7280'}}>{prog}%</div>
              </div>
            );
          })}
        </div>

        <div style={{marginTop:12,fontSize:13,color:'#6b7280'}}>Stored days: {Object.keys(plannerHistory).length}</div>
        <div style={{marginTop:8,display:'flex',gap:8}}>
          <button onClick={() => {
            // go to today
            const d = new Date();
            d.setHours(0,0,0,0);
            setSelectedDate(d);
          }} style={styles.btn}>Today</button>
          <button onClick={() => {
            // clear history (confirm)
            if (!window.confirm('Clear all saved history?')) return;
            localStorage.removeItem('plannerHistory');
            setPlannerHistory({});
            // reset current day tasks to defaults
            setTasks(structuredClone(defaultBlocks));
          }} style={{...styles.btn, background:'#ef4444', color:'#fff'}}>Clear All</button>
        </div>
      </aside>
    </div>
  );
}

// ----- basic styles -----
const styles = {
  page: {
    display: 'flex',
    gap: 20,
    padding: 20,
    fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
    background: '#f1f5f9',
    alignItems: 'flex-start',
  },
  card: {
    flex: 1,
    background: '#fff',
    borderRadius: 14,
    padding: 18,
    boxShadow: '0 8px 32px rgba(2,6,23,0.06)'
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  input: { width: 64, padding: 6, borderRadius: 8, border: '1px solid #e5e7eb', textAlign: 'center' },
  btn: { padding: '8px 12px', borderRadius: 8, border: '1px solid #e6e9ee', background: '#fff', cursor: 'pointer' },
  progressBarOuter: { height: 10, background: '#eef2f6', borderRadius: 999, overflow: 'hidden', marginTop: 10 },
  progressBarInner: { height: '100%', background: 'linear-gradient(90deg,#34d399,#059669)', width: '0%' },

  block: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    border: '1px solid #eef2f6',
    marginBottom: 10
  },
  titleInput: { fontSize: 16, fontWeight: 700, border: 'none', width: '100%', outline: 'none' },
  subInput: { padding: 6, borderRadius:8, border: '1px solid #e6e9ee', minWidth:120 },

  doneBtn: { padding: '8px 12px', borderRadius: 999, border: '1px solid #d1fae5', cursor: 'pointer' },
  deleteBtn: { padding: '6px 8px', borderRadius: 8, border: '1px solid #f3f4f6', background: '#fff', cursor: 'pointer', color:'#ef4444' },

  calendarCard: {
    width: 320,
    background: '#fff',
    borderRadius: 12,
    padding: 16,
    boxShadow: '0 8px 28px rgba(2,6,23,0.06)'
  },
  calendarDay: {
    padding: 8,
    borderRadius: 10,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    transition: 'all .15s ease',
    minHeight: 78
  },
  calendarEmpty: { minHeight: 78 }
};
import React, { useState, useEffect } from 'react';

const PowerhousePlanner = () => {
  const defaultTasks = [
    { id: 1, title: 'Get Internship', done: false },
    { id: 2, title: 'Apply for Jobs', done: false },
    { id: 3, title: 'B.Tech Subjects', done: false, subtasks: ['Subject 1', 'Subject 2', 'Subject 3'] },
    { id: 4, title: 'DSA + Nxtwave Revision', done: false },
    { id: 5, title: 'Embedded Systems Learning', done: false }
  ];

  const [tasks, setTasks] = useState(() => {
    const today = new Date().toLocaleDateString();
    const savedData = JSON.parse(localStorage.getItem('plannerHistory')) || {};
    return savedData[today] || defaultTasks;
  });

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [plannerHistory, setPlannerHistory] = useState(() => JSON.parse(localStorage.getItem('plannerHistory')) || {});

  // Save daily history by date
  useEffect(() => {
    const dateKey = selectedDate.toLocaleDateString();
    const updatedHistory = { ...plannerHistory, [dateKey]: tasks };
    setPlannerHistory(updatedHistory);
    localStorage.setItem('plannerHistory', JSON.stringify(updatedHistory));
  }, [tasks, selectedDate]);

  // Toggle task completion
  const toggleTask = (id) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, done: !task.done } : task));
  };

  // Edit task title
  const editTaskTitle = (id, newTitle) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, title: newTitle } : task));
  };

  // Add new task
  const addTask = () => {
    const newTask = { id: Date.now(), title: 'New Task', done: false };
    setTasks([...tasks, newTask]);
  };

  // Handle date change from calendar
  const handleDateChange = (date) => {
    setSelectedDate(date);
    const dateKey = date.toLocaleDateString();
    const savedTasks = plannerHistory[dateKey] || defaultTasks;
    setTasks(savedTasks);
  };

  // Render mini calendar with progress
  const renderCalendar = () => {
    const current = new Date();
    const year = current.getFullYear();
    const month = current.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const dayCells = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = date.toLocaleDateString();
      const progressData = plannerHistory[dateKey];
      const completedCount = progressData ? progressData.filter(t => t.done).length : 0;
      const totalCount = progressData ? progressData.length : 0;
      const progressRatio = totalCount > 0 ? completedCount / totalCount : 0;

      dayCells.push(
        <div
          key={day}
          className={`calendar-day ${selectedDate.toDateString() === date.toDateString() ? 'active' : ''}`}
          onClick={() => handleDateChange(date)}
        >
          <div className="day-number">{day}</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressRatio * 100}%` }}></div>
          </div>
        </div>
      );
    }

    return <div className="calendar-grid">{dayCells}</div>;
  };

  // Edit B.Tech subjects
  const editBtechSubjects = (index, newSubtask) => {
    const updatedTasks = tasks.map(task => {
      if (task.title === 'B.Tech Subjects') {
        const newSubtasks = [...task.subtasks];
        newSubtasks[index] = newSubtask;
        return { ...task, subtasks: newSubtasks };
      }
      return task;
    });
    setTasks(updatedTasks);
  };

  return (
    <div className="planner-container">
      <aside className="calendar-section">
        <h2>📅 {selectedDate.toLocaleDateString()}</h2>
        {renderCalendar()}
      </aside>

      <main className="tasks-section">
        <h1>⚡ 10-Hour Powerhouse Planner</h1>
        <button className="add-btn" onClick={addTask}>+ Add Task</button>

        {tasks.map(task => (
          <div key={task.id} className={`task-card ${task.done ? 'done' : ''}`}>
            <input
              type="text"
              value={task.title}
              onChange={(e) => editTaskTitle(task.id, e.target.value)}
              className="task-input"
            />
            <button onClick={() => toggleTask(task.id)}>✔</button>

            {task.title === 'B.Tech Subjects' && (
              <div className="subtasks">
                {task.subtasks.map((sub, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={sub}
                    onChange={(e) => editBtechSubjects(idx, e.target.value)}
                    className="subtask-input"
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </main>

      <style>{`
        .planner-container { display: flex; gap: 20px; padding: 20px; font-family: 'Poppins', sans-serif; }
        .calendar-section { width: 300px; background: #fff; border-radius: 16px; padding: 16px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-top: 10px; }
        .calendar-day { text-align: center; background: #f9fafb; border-radius: 8px; padding: 6px; cursor: pointer; transition: all 0.3s; }
        .calendar-day:hover { background: #e5f6ff; }
        .calendar-day.active { background: #10b981; color: white; }
        .day-number { font-size: 14px; font-weight: 600; }
        .progress-bar { height: 4px; background: #e5e7eb; border-radius: 2px; margin-top: 4px; overflow: hidden; }
        .progress-fill { height: 100%; background: #10b981; }
        .tasks-section { flex-grow: 1; background: #fff; border-radius: 16px; padding: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        .task-card { display: flex; align-items: center; justify-content: space-between; background: #f9fafb; margin: 8px 0; padding: 10px; border-radius: 12px; }
        .task-card.done { background: #d1fae5; }
        .task-input { flex: 1; border: none; background: transparent; font-size: 16px; }
        .task-input:focus { outline: none; }
        .subtasks { display: flex; flex-direction: column; margin-top: 8px; }
        .subtask-input { margin: 4px 0; border: none; border-bottom: 1px solid #ccc; background: transparent; padding: 4px; }
        .add-btn { background: #10b981; color: white; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; }
      `}</style>
    </div>
  );
};

export default PowerhousePlanner;
