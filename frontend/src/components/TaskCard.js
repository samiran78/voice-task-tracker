// ============================================================
// TaskCard.js — Individual Task Display + Actions
//
// SELF-NOTE: This component has been COMPLETELY REFACTORED.
// Old version: display-only (just showed props). Inert.
// New version: fully interactive with status cycling, edit, delete.
//
// DESIGN PATTERN: "Smart ↔ Dumb" Component
//   This component is "smart enough" to call the API,
//   but it reports results back to the PARENT (App.js) via callbacks.
//   Why? Because App.js owns the `tasks` array in state.
//   TaskCard doesn't know the whole list — it only knows itself.
//
// PROPS RECEIVED:
//   task        — Full task object from the DB:
//                 { _id, title, description, status, priority, dueDate, createdAt }
//   onUpdate(updatedTask) — Parent callback after status change / edit save
//   onDelete(taskId)      — Parent callback after successful delete
//   onEdit(task)          — Parent callback to open TaskForm in edit mode
//
// API CALLS MADE HERE:
//   api.updateTask(id, { status: nextStatus }) — status cycling
//   api.deleteTask(id)                         — delete a 'done' task
// ============================================================

import React, { useState } from "react";
import api from "../services/api";
import "./TaskCard.css";

// ============================================================
// STATUS CYCLE MAP
//
// SELF-NOTE: Instead of if/else, we use an object as a lookup table.
// This is cleaner and easier to extend.
// "todo" → "in-progress" → "done" → (no further cycling)
// ============================================================
const STATUS_NEXT = {
  "todo": "in-progress",
  "in-progress": "done",
  "done": null, // done is terminal — can only delete from here
};

// Human-readable labels & icons for each status
const STATUS_LABELS = {
  "todo": "📋 Todo",
  "in-progress": "🔄 In Progress",
  "done": "✅ Done",
};

// ============================================================
// COMPONENT: TaskCard
// ============================================================
const TaskCard = ({ task, onUpdate, onDelete, onEdit }) => {

  // -----------------------------------------------------------
  // LOCAL STATE (specific to THIS card only)
  //
  // SELF-NOTE: We keep loading/delete states LOCAL because:
  //   - Each card needs its own independent loading state
  //   - Card A loading shouldn't affect Card B's button
  //   - If we put this in App.js, all cards would show loading simultaneously
  // -----------------------------------------------------------

  // Is the "advance status" button in a loading state?
  const [statusLoading, setStatusLoading] = useState(false);

  // Is the delete button in a loading state?
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Error message specific to THIS card (not the whole app)
  const [cardError, setCardError] = useState(null);

  // -----------------------------------------------------------
  // handleStatusAdvance — Cycle the task to its next status
  //
  // SELF-NOTE: This calls the API immediately (no confirmation needed —
  // advancing status is easily reversible by editing the task).
  // -----------------------------------------------------------
  const handleStatusAdvance = async () => {
    const nextStatus = STATUS_NEXT[task.status];

    // Guard: don't do anything if already at 'done' (terminal state)
    if (!nextStatus) return;

    setStatusLoading(true);
    setCardError(null);

    try {
      // Call backend PUT /api/tasks/updatedTask/:id with just the new status
      // SELF-NOTE: The backend accepts a PARTIAL update — we don't need to
      // send the entire task object, just the field(s) we want to change.
      const result = await api.updateTask(task._id, { status: nextStatus });

      if (result.success) {
        // Notify the parent with the FULL updated task from the backend
        // The parent will replace the old task in its tasks[] array
        onUpdate(result.data);
      }
    } catch (err) {
      setCardError(err.response?.data?.error || "Failed to update status.");
    } finally {
      setStatusLoading(false);
    }
  };

  // -----------------------------------------------------------
  // handleDelete — Delete this task (only allowed if status = 'done')
  //
  // SELF-NOTE: The button is only VISIBLE when task.status === 'done',
  // but we also guard here (defense-in-depth pattern).
  // -----------------------------------------------------------
  const handleDelete = async () => {
    // Defensive check — should never be true if UI is correct
    if (task.status !== "done") {
      setCardError("Only completed tasks can be deleted.");
      return;
    }

    // Confirm dialog before destructive action
    const confirmed = window.confirm(
      `Delete "${task.title}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeleteLoading(true);
    setCardError(null);

    try {
      const result = await api.deleteTask(task._id);

      if (result.success) {
        // Notify parent to REMOVE this task from the tasks[] array
        // SELF-NOTE: We pass the _id because the parent needs to know
        // WHICH task to filter out. It doesn't need the whole task object.
        onDelete(task._id);
      }
    } catch (err) {
      setCardError(err.response?.data?.error || "Failed to delete task.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // -----------------------------------------------------------
  // FORMAT DUE DATE for display
  //
  // SELF-NOTE: Dates come from MongoDB as ISO strings like
  // "2025-03-20T00:00:00.000Z". We format them to human-readable.
  // -----------------------------------------------------------
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    // toLocaleDateString converts to locale-specific format, e.g. "Mar 20, 2025"
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // -----------------------------------------------------------
  // OVERDUE CHECK — is the due date in the past?
  // -----------------------------------------------------------
  const isOverdue = () => {
    if (!task.dueDate || task.status === "done") return false;
    return new Date(task.dueDate) < new Date();
  };

  // -----------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------
  const nextStatus = STATUS_NEXT[task.status];
  const priorityClass = (task.priority || "medium").toLowerCase();

  return (
    <div
      className={`task-card priority-border-${priorityClass} ${
        task.status === "done" ? "done-card" : ""
      }`}
    >
      {/* ---- TOP SECTION: Title + Priority Badge ---- */}
      <div className="task-header">
        <h3
          className={`task-title ${task.status === "done" ? "strikethrough" : ""}`}
        >
          {task.title}
        </h3>

        {/* Priority badge — color class applied via CSS */}
        <span className={`priority ${priorityClass}`}>
          {task.priority}
        </span>
      </div>

      {/* ---- DESCRIPTION ---- */}
      {task.description && (
        <p className="task-description">{task.description}</p>
      )}

      {/* ---- STATUS + DUE DATE ROW ---- */}
      <div className="task-meta">
        {/* Current status badge */}
        <span className={`status status-${task.status}`}>
          {STATUS_LABELS[task.status]}
        </span>

        {/* Due date — shows in red if overdue */}
        {task.dueDate && (
          <span className={`due-date ${isOverdue() ? "overdue" : ""}`}>
            📅 {formatDate(task.dueDate)}
            {isOverdue() && <span className="overdue-tag"> (Overdue)</span>}
          </span>
        )}
      </div>

      {/* ---- ERROR MESSAGE (card-level) ---- */}
      {cardError && (
        <div className="card-error">
          ⚠️ {cardError}
          <button onClick={() => setCardError(null)} className="dismiss-card-error">✕</button>
        </div>
      )}

      {/* ---- ACTION BUTTONS ---- */}
      <div className="task-actions">

        {/* ADVANCE STATUS BUTTON — only shown if next status exists */}
        {nextStatus && (
          <button
            className="btn-advance-status"
            onClick={handleStatusAdvance}
            disabled={statusLoading || deleteLoading}
            title={`Mark as ${nextStatus}`}
          >
            {statusLoading
              ? "..."
              : `→ ${STATUS_LABELS[nextStatus]}`}
          </button>
        )}

        {/* EDIT BUTTON — opens TaskForm in edit mode via App.js */}
        {task.status !== "done" && (
          <button
            className="btn-edit"
            onClick={() => onEdit(task)}
            // SELF-NOTE: We pass the entire task object to onEdit.
            // App.js receives it and passes it as initialData to TaskForm.
            disabled={statusLoading || deleteLoading}
            title="Edit this task"
          >
            ✏️
          </button>
        )}

        {/* DELETE BUTTON — only appears when task is 'done' */}
        {task.status === "done" && (
          <button
            className="btn-delete"
            onClick={handleDelete}
            disabled={deleteLoading || statusLoading}
            title="Delete this completed task"
          >
            {deleteLoading ? "..." : "🗑️"}
          </button>
        )}

      </div>

      {/* ---- FOOTER: Creation date ---- */}
      <div className="task-footer">
        <span className="created-at">
          Created: {formatDate(task.createdAt)}
        </span>
      </div>
    </div>
  );
};

export default TaskCard;