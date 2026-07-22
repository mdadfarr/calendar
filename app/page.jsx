"use client";

import { useEffect, useState } from "react";

function fmt(d) {
  const y = d.getFullYear(),
    m = String(d.getMonth() + 1).padStart(2, "0"),
    day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function levelFor(count) {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}

function makeId() {
  return Date.now() + "-" + Math.random().toString(36).slice(2, 7);
}

function generateWeeks() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const totalWeeks = 53;
  const end = new Date(today);
  const endDow = end.getDay();
  end.setDate(end.getDate() + (6 - endDow));
  const start = new Date(end);
  start.setDate(start.getDate() - (totalWeeks * 7 - 1));
  const startDow = start.getDay();
  start.setDate(start.getDate() - startDow);

  let cursor = new Date(start);
  let lastMonth = -1;
  const weeks = [];
  for (let w = 0; w < totalWeeks; w++) {
    const colFirstDate = new Date(cursor);
    let monthLabel = "";
    if (colFirstDate.getMonth() !== lastMonth && colFirstDate <= today) {
      lastMonth = colFirstDate.getMonth();
      monthLabel = colFirstDate.toLocaleDateString(undefined, { month: "short" });
    }
    const cells = [];
    for (let d = 0; d < 7; d++) {
      cells.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push({ monthLabel, cells });
  }
  return { weeks, today };
}

export default function Page() {
  const [data, setData] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [taskInput, setTaskInput] = useState("");
  const [taskStartH, setTaskStartH] = useState("");
  const [taskStartM, setTaskStartM] = useState("");
  const [taskEndH, setTaskEndH] = useState("");
  const [taskEndM, setTaskEndM] = useState("");
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    fetch("/api/data")
      .then((r) => r.json())
      .then((d) => {
        setData(d || {});
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  function persist(newData) {
    setData(newData);
    fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newData),
    }).catch(() => {});
  }

  function completedCount(key) {
    const list = data[key] || [];
    return list.filter((t) => t.done).length;
  }

  function pad2(v) {
    const n = parseInt(v, 10);
    if (isNaN(n)) return "00";
    return String(n).padStart(2, "0");
  }

  function buildTime(h, m) {
    // only produce a time if the user actually typed something in either field
    if (h.trim() === "" && m.trim() === "") return null;
    return `${pad2(h)}:${pad2(m)}`;
  }

  function addTask() {
    const text = taskInput.trim();
    if (!text) return;
    const key = fmt(selectedDate);
    const newData = { ...data };
    newData[key] = [
      ...(newData[key] || []),
      {
        id: makeId(),
        text,
        done: false,
        startTime: buildTime(taskStartH, taskStartM),
        endTime: buildTime(taskEndH, taskEndM),
      },
    ];
    persist(newData);
    setTaskInput("");
    setTaskStartH("");
    setTaskStartM("");
    setTaskEndH("");
    setTaskEndM("");
  }

  function formatTime(t) {
    if (!t) return null;
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return { main: `${h12}:${String(m).padStart(2, "0")}`, ampm };
  }

  function toggleTask(key, id) {
    const newData = { ...data };
    newData[key] = (newData[key] || []).map((t) =>
      t.id === id ? { ...t, done: !t.done } : t
    );
    persist(newData);
  }

  function deleteTask(key, id) {
    const newData = { ...data };
    newData[key] = (newData[key] || []).filter((t) => t.id !== id);
    if (newData[key].length === 0) delete newData[key];
    persist(newData);
  }

  function calcStreak() {
    let streak = 0;
    let cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    if (completedCount(fmt(cursor)) === 0) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (completedCount(fmt(cursor)) > 0) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  if (!loaded) {
    return <div className="loading">Loading your tasks…</div>;
  }

  const todayKey = fmt(new Date());
  const selKey = fmt(selectedDate);
  const list = data[selKey] || [];
  const { weeks, today } = generateWeeks();

  return (
    <div className="wrap">
      <header>
        <div>
          <h1>
            daily<span>.</span>
          </h1>
          <div className="today-label">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
        <div className="stats">
          <div className="stat">
            <div className="num">{calcStreak()}</div>
            <div className="label">day streak</div>
          </div>
          <div className="stat">
            <div className="num">{completedCount(todayKey)}</div>
            <div className="label">done today</div>
          </div>
        </div>
      </header>

      <div className="panel">
        <div className="panel-head">
          <div className="panel-title">{selKey === todayKey ? "Today" : selKey}</div>
          <div className="day-nav">
            <button
              onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() - 1);
                setSelectedDate(d);
              }}
            >
              &larr;
            </button>
            <div className="date">
              {selectedDate.toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            <button
              onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() + 1);
                setSelectedDate(d);
              }}
            >
              &rarr;
            </button>
            <button
              title="Jump to today"
              onClick={() => {
                const d = new Date();
                d.setHours(0, 0, 0, 0);
                setSelectedDate(d);
              }}
            >
              •
            </button>
          </div>
        </div>
        <div className="add-row">
          <input
            type="text"
            placeholder="Add a task for this day"
            maxLength={140}
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addTask();
            }}
          />
          <div className="time-pair" title="Start time (optional)">
            <input
              type="text"
              inputMode="numeric"
              className="time-box"
              placeholder="00"
              maxLength={2}
              value={taskStartH}
              onChange={(e) => setTaskStartH(e.target.value.replace(/\D/g, "").slice(0, 2))}
            />
            <span className="time-colon">:</span>
            <input
              type="text"
              inputMode="numeric"
              className="time-box"
              placeholder="00"
              maxLength={2}
              value={taskStartM}
              onChange={(e) => setTaskStartM(e.target.value.replace(/\D/g, "").slice(0, 2))}
            />
          </div>
          <div className="time-pair" title="End time (optional)">
            <input
              type="text"
              inputMode="numeric"
              className="time-box"
              placeholder="00"
              maxLength={2}
              value={taskEndH}
              onChange={(e) => setTaskEndH(e.target.value.replace(/\D/g, "").slice(0, 2))}
            />
            <span className="time-colon">:</span>
            <input
              type="text"
              inputMode="numeric"
              className="time-box"
              placeholder="00"
              maxLength={2}
              value={taskEndM}
              onChange={(e) => setTaskEndM(e.target.value.replace(/\D/g, "").slice(0, 2))}
            />
          </div>
          <button onClick={addTask}>Add</button>
        </div>
        <ul className="tasks">
          {list.length === 0 && <div className="empty">No tasks for this day yet</div>}
          {list.map((task) => (
            <li key={task.id} className={task.done ? "done" : ""}>
              <div className="check" onClick={() => toggleTask(selKey, task.id)}>
                {task.done ? "\u2713" : ""}
              </div>
              <div className="text">{task.text}</div>
              {(task.startTime || task.endTime) && (
                <div className="time-slot">
                  {task.startTime && (
                    <>
                      <span>{formatTime(task.startTime).main}</span>
                      <span className="time-meridiem">{formatTime(task.startTime).ampm}</span>
                    </>
                  )}
                  {task.startTime && task.endTime ? <span>&nbsp;–&nbsp;</span> : null}
                  {task.endTime && (
                    <>
                      <span>{formatTime(task.endTime).main}</span>
                      <span className="time-meridiem">{formatTime(task.endTime).ampm}</span>
                    </>
                  )}
                </div>
              )}
              <button className="del" onClick={() => deleteTask(selKey, task.id)}>
                &times;
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div className="panel-title">Past year</div>
        </div>
        <div className="heatmap-scroll">
          <div className="months">
            {weeks.map((w, i) => (
              <div key={i} style={{ width: 15 }}>
                {w.monthLabel}
              </div>
            ))}
          </div>
          <div className="heatmap">
            {weeks.map((w, wi) => (
              <div className="col" key={wi}>
                {w.cells.map((cellDate, di) => {
                  const key = fmt(cellDate);
                  if (cellDate > today) {
                    return (
                      <div
                        className="cell"
                        key={di}
                        style={{ visibility: "hidden" }}
                      ></div>
                    );
                  }
                  const count = completedCount(key);
                  const classes = ["cell", "l" + levelFor(count)];
                  if (key === todayKey) classes.push("today-cell");
                  if (key === selKey) classes.push("selected");
                  return (
                    <div
                      key={di}
                      className={classes.join(" ")}
                      onClick={() => setSelectedDate(cellDate)}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltip({
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                          text: `${count} task${count === 1 ? "" : "s"} — ${cellDate.toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric", year: "numeric" }
                          )}`,
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    ></div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="legend">
          <span>Less</span>
          <div className="cell"></div>
          <div className="cell l1"></div>
          <div className="cell l2"></div>
          <div className="cell l3"></div>
          <div className="cell l4"></div>
          <span>More</span>
        </div>
      </div>

      <footer>Saved to your database — same data on every device.</footer>

      {tooltip && (
        <div
          className="tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
