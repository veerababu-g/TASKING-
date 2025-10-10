// DailyPowerhousePlanner.jsx
// Single-file React component for a 10-hour 5×90 planner with:
// - Original time-slot layout (90-min work blocks + breaks)
// - Daily history stored by date (localStorage)
// - Add / edit tasks inline
// - Editable B.Tech 3 subjects (per day)
// - Checkboxes for task completion feeding calendar progress
//
// Usage: drop into a CRA / Vite app and import as <DailyPowerhousePlanner />.

import React, { useEffect, useState } from "react";

export default function DailyPowerhousePlanner() {
  // --- Defaults: the original time-slot blocks (keeps durations) ---
  const defaultBlocks = [
    { id: "t1", title: "Internship hunt", durationMin: 90, isBreak: false, done: false },
    { id: "b1", title: "Break #1", durationMin: 20, isBreak: true },
    { id: "t2", title: "DSA + NxtWave revision", durationMin: 130, isBreak: false, done: false},
    { id: "b2", title: "Break #2", durationMin: 20, isBreak: true },
    {
      id: "t3",
      title: "B.Tech Subjects",
      durationMin: 180,
      isBreak: false,
      done: false,
      subtasks: ["Subject 1", "Subject 2", "Subject 3"],
    },
    { id: "l", title: "Lunch + recharge", durationMin: 50, isBreak: true },
    { id: "t4", title: "B.Tech Subjects",
      durationMin: 90,
      isBreak: false,
      done: false,
      subtasks: ["Subject 1", "Subject 2", "Subject 3"], },
    { id: "b3", title: "Break #3", durationMin: 20, isBreak: true },
    { id: "t5", title: "Embedded Systems", durationMin: 120, isBreak: false, done: false },
    { id: "b4", title: "Break #4", durationMin: 20, isBreak: true },
    { id: "t3c", title: "B.Tech Practice", durationMin: 90, isBreak: false, done: false },
  ];

  // --- State ---
  const [startHour, setStartHour] = useState(8); // default start 08:00
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [plannerHistory, setPlannerHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("plannerHistory") || "{}");
    } catch {
      return {};
    }
  });
  const [tasks, setTasks] = useState(() => {
    const key = new Date().toDateString();
    return plannerHistory[key] ?? structuredClone(defaultBlocks);
  });

  // --- Persist whenever tasks or selectedDate changes ---
  useEffect(() => {
    const key = selectedDate.toDateString();
    const updated = { ...plannerHistory, [key]: tasks };
    setPlannerHistory(updated);
    localStorage.setItem("plannerHistory", JSON.stringify(updated));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, selectedDate]);

  // --- Load tasks when date changes ---
  useEffect(() => {
    const key = selectedDate.toDateString();
    setTasks(plannerHistory[key] ? structuredClone(plannerHistory[key]) : structuredClone(defaultBlocks));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // --- Utilities ---
  function structuredClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
  function minsToTime(mins) {
    const h = Math.floor(mins / 60) % 12 ;
    const m = mins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  function computeSchedule(blocks) {
    let cursor = startHour * 60;
    return blocks.map((b) => {
      const from = cursor;
      const to = cursor + b.durationMin;
      cursor = to;
      return { ...b, from: minsToTime(from), to: minsToTime(to) };
    });
  }
  const schedule = computeSchedule(tasks);

  // --- Feature actions ---
  const toggleDone = (id) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const editTaskTitle = (id, newTitle) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, title: newTitle } : t)));
  };

  const editSubtask = (taskId, idx, value) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const subs = Array.isArray(t.subtasks) ? [...t.subtasks] : ["", "", ""];
        subs[idx] = value;
        return { ...t, subtasks: subs };
      })
    );
  };

  const addTask = () => {
    const newTask = {
      id: "x" + Date.now(),
      title: "New Task",
      durationMin: 60,
      isBreak: false,
      done: false,
    };
    // insert before final B.Tech Practice (t3c) to preserve structure
    setTasks((prev) => {
      const copy = [...prev];
      // find index of t3c
      const idx = copy.findIndex((b) => b.id === "t3c");
      if (idx === -1) copy.push(newTask);
      else copy.splice(idx, 0, newTask);
      return copy;
    });
  };

  const removeTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const resetDay = () => {
    setTasks(structuredClone(defaultBlocks));
  };

  const unmarkAll = () => {
    setTasks((prev) => prev.map((t) => ({ ...t, done: false })));
  };

  const exportText = () => {
    const lines = schedule.map((s) => `${s.from} - ${s.to} | ${s.title}${s.subtasks ? " | " + s.subtasks.join(", ") : ""}`);
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plan-${selectedDate.toDateString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Calendar helpers ---
  const calendarMonth = (() => {
    const d = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) cells.push(day);
    return { year, month, cells };
  })();

  const progressForDate = (dateObj) => {
    const key = dateObj.toDateString();
    const dayTasks = plannerHistory[key];
    if (!dayTasks) return 0;
    const work = dayTasks.filter((t) => !t.isBreak);
    if (work.length === 0) return 0;
    const doneCount = work.filter((t) => t.done).length;
    return Math.round((doneCount / work.length) * 100);
  };

  const handleDateClick = (day) => {
    if (!day) return;
    const d = new Date(calendarMonth.year, calendarMonth.month, day);
    d.setHours(0, 0, 0, 0);
    setSelectedDate(d);
  };

  // --- Render ---
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Header */}
        <header style={styles.header}>
          <div>
            <h1 style={{ margin: 0 }}>VEERABABU DAILY PLAN</h1>
            <h1 style={{ margin: 0 }}>10-Hour Powerhouse </h1>
            <div style={{ color: "#6b7280", marginTop: 6 }}>5×90 deep-focus schedule — time slots preserved</div>
            <div style={{ marginTop: 8, fontSize: 13, color: "#374151" }}>
              Date: <strong>{selectedDate.toDateString()}</strong>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ fontSize: 13, color: "#374151" }}>Start hour</label>
            <input
              type="number"
              min={0}
              max={23}
              value={startHour}
              onChange={(e) => setStartHour(Math.max(0, Math.min(23, Number(e.target.value || 0))))}
              style={styles.input}
            />
            <button onClick={exportText} style={styles.btn}>
              Export
            </button>
            <button onClick={addTask} style={{ ...styles.btn, background: "#10b981", color: "#fff" }}>
              + Task
            </button>
          </div>
        </header>

        {/* Day progress */}
        <div style={{ marginTop: 14 }}>
          <div style={styles.progressBarOuter}>
            <div style={{ ...styles.progressBarInner, width: `${progressForDate(selectedDate)}%` }} />
          </div>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 8 }}>
            Day progress: <strong>{progressForDate(selectedDate)}%</strong>
          </div>
        </div>

        {/* Schedule */}
        <main style={{ marginTop: 18 }}>
          {schedule.map((block) => (
            <div key={block.id} style={{ ...styles.block, background: block.isBreak ? "#f8fafc" : "#fff" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start", minWidth: 0 }}>
                <div style={{ textAlign: "center", color: "#6b7280", width: 72, fontSize: 12 }}>
                  <div>{block.from}</div>
                  <div style={{ fontSize: 11, marginTop: 6 }}>to</div>
                  <div style={{ marginTop: 6 }}>{block.to}</div>
                </div>

                <div style={{ minWidth: 0, width: "100%" }}>
                  {/* Inline editable title */}
                  <input
                    value={block.title}
                    onChange={(e) => editTaskTitle(block.id, e.target.value)}
                    style={{ ...styles.titleInput, background: block.isBreak ? "transparent" : "#fff" }}
                  />

                  {/* B.Tech subtasks editing */}
                  {block.subtasks && Array.isArray(block.subtasks) && (
                    <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {block.subtasks.map((sub, idx) => (
                        <input
                          key={idx}
                          value={sub}
                          onChange={(e) => editSubtask(block.id, idx, e.target.value)}
                          style={styles.subInput}
                          placeholder={`Subject ${idx + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {!block.isBreak && (
                  <>
                    <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={!!block.done}
                        onChange={() => toggleDone(block.id)}
                      />
                      <span style={{ fontSize: 13 }}>{block.done ? "Done" : "Mark"}</span>
                    </label>

                    <button onClick={() => removeTask(block.id)} style={styles.deleteBtn}>
                      Remove
                    </button>
                  </>
                )}
                <div style={{ fontSize: 12, color: "#6b7280" }}>{block.isBreak ? "Break" : "Work"}</div>
              </div>
            </div>
          ))}
        </main>

        {/* Footer */}
        <footer style={{ marginTop: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: "#6b7280", fontSize: 13 }}>
            Tip: edit titles, update B.Tech subjects, mark tasks done to track progress across days.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={resetDay} style={styles.btn}>
              Reset Day
            </button>
            <button onClick={unmarkAll} style={styles.btn}>
              Unmark All
            </button>
            <button onClick={() => window.print()} style={styles.btn}>
              Print
            </button>
          </div>
        </footer>
      </div>

      {/* Calendar side */}
      <aside style={styles.calendarCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 700 }}>
            {selectedDate.toLocaleString("default", { month: "long" })} {selectedDate.getFullYear()}
          </div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Click a day</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, marginTop: 10, marginBottom: 6, textAlign: "center", color: "#6b7280" }}>
          {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
            <div key={d} style={{ fontSize: 12, fontWeight: 600 }}>
              {d}
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
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
                  background: isActive ? "#059669" : "#f8fafc",
                  color: isActive ? "#fff" : "#111",
                }}
              >
                <div style={{ fontWeight: 700 }}>{day}</div>
                <div style={{ height: 6, width: "100%", marginTop: 6, background: "#e6eaf0", borderRadius: 6, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${prog}%`, background: "linear-gradient(90deg,#10b981,#059669)" }} />
                </div>
                <div style={{ fontSize: 11, marginTop: 6, color: isActive ? "rgba(255,255,255,0.85)" : "#6b7280" }}>{prog}%</div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 12, fontSize: 13, color: "#6b7280" }}>Stored days: {Object.keys(plannerHistory).length}</div>
        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
          <button
            onClick={() => {
              const d = new Date();
              d.setHours(0, 0, 0, 0);
              setSelectedDate(d);
            }}
            style={styles.btn}
          >
            Today
          </button>
          <button
            onClick={() => {
              if (!window.confirm("Clear all saved history?")) return;
              localStorage.removeItem("plannerHistory");
              setPlannerHistory({});
              setTasks(structuredClone(defaultBlocks));
            }}
            style={{ ...styles.btn, background: "#ef4444", color: "#fff" }}
          >
            Clear All
          </button>
        </div>
      </aside>
    </div>
  );
}

// ---------- Styles ----------
const styles = {
  page: {
    display: "flex",
    gap: 20,
    padding: 20,
    fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
    background: "#f1f5f9",
    alignItems: "flex-start",
  },
  card: {
    flex: 1,
    background: "#fff",
    borderRadius: 14,
    padding: 18,
    boxShadow: "0 8px 32px rgba(2,6,23,0.06)",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  input: { width: 64, padding: 6, borderRadius: 8, border: "1px solid #e5e7eb", textAlign: "center" },
  btn: { padding: "8px 12px", borderRadius: 8, border: "1px solid #e6e9ee", background: "#fff", cursor: "pointer" },
  progressBarOuter: { height: 10, background: "#eef2f6", borderRadius: 999, overflow: "hidden", marginTop: 10 },
  progressBarInner: { height: "100%", background: "linear-gradient(90deg,#34d399,#059669)", width: "0%" },

  block: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    border: "1px solid #eef2f6",
    marginBottom: 10,
  },
  titleInput: { fontSize: 16, fontWeight: 700, border: "none", width: "100%", outline: "none" },
  subInput: { padding: 8, borderRadius: 8, border: "1px solid #e6e9ee", minWidth: 140 },

  deleteBtn: { padding: "6px 8px", borderRadius: 8, border: "1px solid #f3f4f6", background: "#fff", cursor: "pointer", color: "#ef4444" },

  calendarCard: {
    width: 320,
    background: "#fff",
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 8px 28px rgba(2,6,23,0.06)",
  },
  calendarDay: {
    padding: 8,
    borderRadius: 10,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    transition: "all .15s ease",
    minHeight: 78,
  },
  calendarEmpty: { minHeight: 78 },
};
