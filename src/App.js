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
