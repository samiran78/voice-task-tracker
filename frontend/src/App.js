// ============================================================
// App.js — Root Orchestrator Component
//
// SELF-NOTE: App.js is the "brain" of the entire frontend.
// It holds ALL shared state and acts as the single source of
// truth for data that multiple components need.
//
// WHY KEEP STATE HERE (not in each component)?
//   Because both VoiceInput AND TaskForm need to share the
//   "current task being created". If state lived in VoiceInput,
//   TaskForm couldn't see it. So we "lift state up" to their
//   common ancestor: App.js.
//
//   This is a core React pattern: "Lifting State Up".
//   Rule of thumb: state lives at the LOWEST COMMON ANCESTOR
//   of all components that need to read/write it.
//
// STATE MANAGED HERE:
//   user         — the authenticated user (from localStorage / login)
//   tasks        — array of all tasks from the backend
//   loading      — true while fetching tasks
//   error        — global error message (e.g. "Backend offline")
//   showForm     — boolean: is the TaskForm modal open?
//   editingTask  — the task being edited (null = create mode)
//   filterStatus — which tab is selected: 'all'|'todo'|'in-progress'|'done'
//   voiceData    — pre-fill data from VoiceInput, passed to TaskForm
// ============================================================

import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import "./App-Additions.css";

// Components
import TaskCard  from "./components/TaskCard";
import Auth      from "./components/Auth";
import VoiceInput from "./components/VoiceInput";
import TaskForm  from "./components/TaskForm";

// API Service — single source of all backend calls
import api from "./services/api";

// ============================================================
// FILTER TABS CONFIG
//
// SELF-NOTE: Defining config as a constant outside the component
// prevents it from being recreated on every render.
// Since it never changes, there's no need for useState/useEffect.
// ============================================================
const FILTER_TABS = [
  { key: "all",         label: "All" },
  { key: "todo",        label: "📋 Todo" },
  { key: "in-progress", label: "🔄 In Progress" },
  { key: "done",        label: "✅ Done" },
];

// ============================================================
// ROOT COMPONENT: App
// ============================================================
function App() {

  // -----------------------------------------------------------
  // STATE: USER AUTHENTICATION
  //
  // SELF-NOTE: useState can take a "lazy initializer" — a function.
  // Instead of useState(null), we pass () => { ... }.
  // React only calls this function on the FIRST render.
  // This is important for localStorage reads — we don't want to
  // call JSON.parse on every single re-render, just once.
  // -----------------------------------------------------------
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    // If localStorage has a user object, parse and use it.
    // Otherwise start as null (not logged in).
    return saved ? JSON.parse(saved) : null;
  });

  // -----------------------------------------------------------
  // STATE: TASKS
  // The master list. All display and mutations flow through here.
  // -----------------------------------------------------------
  const [tasks, setTasks]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  // -----------------------------------------------------------
  // STATE: MODAL CONTROL
  //
  // SELF-NOTE: showForm is a boolean gate for the modal.
  // editingTask: null → create mode | task object → edit mode
  // voiceData: null → empty form | parsedTask object → pre-filled form
  // -----------------------------------------------------------
  const [showForm, setShowForm]       = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [voiceData, setVoiceData]     = useState(null);

  // -----------------------------------------------------------
  // STATE: FILTER
  // Which status tab the user has selected.
  // -----------------------------------------------------------
  const [filterStatus, setFilterStatus] = useState("all");

  // -----------------------------------------------------------
  // handleLogout — Clear session and reset all state
  //
  // SELF-NOTE: We reset ALL state (not just user) because if we
  // only reset user, the next login would start with the previous
  // user's tasks still visible for a split second. 
  // -----------------------------------------------------------
  const handleLogout = () => {
    api.logout(); // Removes 'user' from localStorage
    setUser(null);
    setTasks([]);
    setError(null);
    setShowForm(false);
    setEditingTask(null);
    setVoiceData(null);
  };

  // -----------------------------------------------------------
  // fetchTasks — Load tasks from the backend
  //
  // SELF-NOTE: useCallback memoizes this function.
  // Without it, fetchTasks would be recreated every render,
  // which would make the useEffect below run infinitely
  // (because fetchTasks reference changes → effect re-runs → fetchTasks changes → ...)
  //
  // The [user] dependency means: "recreate this function only
  // when `user` changes." This is correct — if user logs out
  // and a different user logs in, we want a fresh function.
  // -----------------------------------------------------------
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.getAllTasks();

      if (response.success) {
        // Update state with the tasks array from the backend
        setTasks(response.data);
      }
    } catch (err) {
      // SELF-NOTE: err.response.status 401 = token expired or invalid.
      // We log the user out automatically — better UX than showing
      // a cryptic "401 Unauthorized" message.
      if (err.response && err.response.status === 401) {
        handleLogout();
        setError("Session expired. Please log in again.");
      } else {
        setError("Cannot connect to backend. Is the server running?");
      }
      console.error("fetchTasks error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // -----------------------------------------------------------
  // useEffect: Fetch tasks when user logs in
  //
  // SELF-NOTE: useEffect(fn, [deps]) runs fn:
  //   - On first render (mount)
  //   - Every time a value in the deps array changes
  //
  // Here: when `user` changes (login/logout), re-run fetchTasks.
  // If user is null (logged out), skip the fetch.
  //
  // CLEANUP: We don't return a cleanup function here because
  // we're not setting up subscriptions or timers.
  // -----------------------------------------------------------
  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user, fetchTasks]);
  // ^^^ Both user and fetchTasks in deps, because both are used inside.
  // ESLint react-hooks/exhaustive-deps rule enforces this.

  // -----------------------------------------------------------
  // TASK MUTATION CALLBACKS
  //
  // These are functions we pass DOWN to child components (TaskCard, TaskForm).
  // Children call them to notify us of data changes.
  // We then update the tasks[] state here.
  //
  // SELF-NOTE: This is "inverse data flow" (data flows down via props,
  // events flow up via callbacks). It's the React way of doing things.
  // -----------------------------------------------------------

  /**
   * handleTaskCreated — called when TaskForm successfully creates a task.
   * We prepend the new task to the front of the list (newest first).
   */
  const handleTaskCreated = (newTask) => {
    // SELF-NOTE: Functional state update — use the callback form of useState
    // when new state depends on previous state. Avoids stale closure issues.
    setTasks((prev) => [newTask, ...prev]);
    closeForm();
  };

  /**
   * handleTaskUpdated — called when TaskCard or TaskForm updates a task.
   * We find the task by _id and replace it with the updated version.
   */
  const handleTaskUpdated = (updatedTask) => {
    setTasks((prev) =>
      prev.map((t) =>
        // SELF-NOTE: .map() creates a NEW array — never mutate state directly.
        // We find the matching task by _id and swap it for the updated one.
        // All other tasks pass through unchanged.
        t._id === updatedTask._id ? updatedTask : t
      )
    );
    closeForm();
  };

  /**
   * handleTaskDeleted — called when TaskCard successfully deletes a task.
   * We filter OUT the deleted task by its _id.
   */
  const handleTaskDeleted = (deletedId) => {
    setTasks((prev) =>
      // .filter() creates a NEW array with only tasks that DON'T match the deleted id
      prev.filter((t) => t._id !== deletedId)
    );
  };

  /**
   * handleEditTask — called when user clicks "edit" on a TaskCard.
   * We store the task being edited and open the form in edit mode.
   */
  const handleEditTask = (task) => {
    setEditingTask(task);
    setVoiceData(null); // Clear any previous voice data
    setShowForm(true);
  };

  // ---
  // Open form in CREATE mode (fresh, empty form)
  //
  const openCreateForm = () => {
    setEditingTask(null);
    setVoiceData(null);
    setShowForm(true);
  };

  // Close form and reset all form-related state
  const closeForm = () => {
    setShowForm(false);
    setEditingTask(null);
    setVoiceData(null);
  };

  // -----------------------------------------------------------
  // handleVoiceParsed — called by VoiceInput after Gemini AI processes the speech
  //
  // SELF-NOTE: This is the "glue" between VoiceInput and TaskForm.
  // VoiceInput gives us { title, priority, dueDate, status }.
  // We store it in voiceData state and open the TaskForm.
  // TaskForm receives it as `initialData`, so all fields are pre-filled.
  // The user can review/edit before confirming.
  // -----------------------------------------------------------
  const handleVoiceParsed = (parsedTask) => {
    setVoiceData(parsedTask);
    setEditingTask(null); // Make sure we're in create mode
    setShowForm(true);    // Open the form
  };

  // -----------------------------------------------------------
  // COMPUTED: filteredTasks
  //
  // SELF-NOTE: This is a "derived value" — computed from existing state.
  // We do NOT store filtered tasks in state (that would be redundant).
  // Every render, we just re-compute the filter from the master tasks[] array.
  // This is efficient because array filtering is cheap for small lists.
  // -----------------------------------------------------------
  const filteredTasks = filterStatus === "all"
    ? tasks
    : tasks.filter((t) => t.status === filterStatus);

  // -----------------------------------------------------------
  // RENDER: Not logged in → show Auth screen
  // -----------------------------------------------------------
  if (!user) {
    return (
      <div className="App">
        <header className="app-header">
          <div className="header-brand">
            <span className="header-icon">🎤</span>
            <div>
              <h1>Voice Task Tracker</h1>
              <p>Your AI-powered task manager</p>
            </div>
          </div>
        </header>
        <main>
          <Auth onLogin={(loggedInUser) => setUser(loggedInUser)} />
        </main>
      </div>
    );
  }

  // -----------------------------------------------------------
  // RENDER: Logged-in — show the full dashboard
  // -----------------------------------------------------------
  return (
    <div className="App">

      {/* ---- APP HEADER ---- */}
      <header className="app-header">
        <div className="header-brand">
          <span className="header-icon">🎤</span>
          <div>
            <h1>Voice Task Tracker</h1>
            <p>Your AI-powered task manager</p>
          </div>
        </div>

        {/* User info + logout */}
        <div className="header-user">
          <span className="user-greeting">
            👋 {user.name}
          </span>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main>

        {/* ---- VOICE INPUT SECTION ---- */}
        {/* SELF-NOTE: onParsed is the callback prop. When VoiceInput
            successfully parses speech, it calls this function with the data. */}
        <VoiceInput onParsed={handleVoiceParsed} />

        {/* ---- TASKS SECTION HEADER ---- */}
        <div className="tasks-section-header">
          {/* Title with live task count */}
          <h2>
            Your Tasks
            <span className="task-count">{filteredTasks.length}</span>
          </h2>

          {/* Add Task button — opens empty TaskForm */}
          <button className="btn-add-task" onClick={openCreateForm}>
            ➕ Add Task
          </button>
        </div>

        {/* ---- STATUS FILTER TABS ---- */}
        {/* SELF-NOTE: We map over our FILTER_TABS config array.
            Each tab button sets filterStatus on click.
            The 'active' class is applied when the tab matches current filter.
            CSS makes the active tab visually distinct. */}
        <div className="filter-tabs" role="tablist">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              className={`filter-tab ${filterStatus === tab.key ? "active" : ""}`}
              onClick={() => setFilterStatus(tab.key)}
              role="tab"
              aria-selected={filterStatus === tab.key}
            >
              {tab.label}
              {/* Count badge per tab */}
              <span className="tab-count">
                {tab.key === "all"
                  ? tasks.length
                  : tasks.filter((t) => t.status === tab.key).length}
              </span>
            </button>
          ))}
        </div>

        {/* ---- LOADING STATE ---- */}
        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your tasks...</p>
          </div>
        )}

        {/* ---- GLOBAL ERROR STATE ---- */}
        {error && !loading && (
          <div className="error-state">
            <p>⚠️ {error}</p>
            <button onClick={fetchTasks} className="retry-btn">
              Retry
            </button>
          </div>
        )}

        {/* ---- EMPTY STATE ---- */}
        {!loading && !error && filteredTasks.length === 0 && (
          <div className="empty-state">
            {filterStatus === "all" ? (
              <>
                <p className="empty-emoji">🎙</p>
                <p>No tasks yet!</p>
                <p className="empty-sub">
                  Speak into the mic or click <strong>Add Task</strong> to get started.
                </p>
              </>
            ) : (
              <>
                <p className="empty-emoji">🔍</p>
                <p>No <strong>{filterStatus}</strong> tasks.</p>
              </>
            )}
          </div>
        )}

        {/* ---- TASKS GRID ---- */}
        {/* SELF-NOTE: We always render the grid (even if empty) so there's no
            layout shift when tasks appear. The empty-state div above handles 
            the "no tasks" message. */}
        {!loading && !error && filteredTasks.length > 0 && (
          <div className="tasks-grid">
            {filteredTasks.map((task) => (
              // SELF-NOTE: key prop is REQUIRED when rendering lists.
              // React uses it to efficiently diff the DOM when the list changes.
              // We use task._id (MongoDB ObjectId) — guaranteed unique.
              // NEVER use array index as key (causes bugs when list reorders).
              <TaskCard
                key={task._id}
                task={task}
                onUpdate={handleTaskUpdated}
                onDelete={handleTaskDeleted}
                onEdit={handleEditTask}
              />
            ))}
          </div>
        )}

      </main>

      {/* ---- TASK FORM MODAL ---- */}
      {/* SELF-NOTE: Conditional rendering with &&.
          If showForm is false, nothing renders. No modal in DOM.
          If showForm is true, TaskForm renders as a modal overlay.
          
          The ternary for initialData:
            - If editingTask exists → we're editing, pass the task
            - Else if voiceData exists → pre-fill from voice AI
            - Else → empty object (fresh create form) */}
      {showForm && (
        <TaskForm
          initialData={editingTask || voiceData || {}}
          isEdit={Boolean(editingTask)}
          onSubmit={editingTask ? handleTaskUpdated : handleTaskCreated}
          onClose={closeForm}
        />
      )}

    </div>
  );
}

export default App;