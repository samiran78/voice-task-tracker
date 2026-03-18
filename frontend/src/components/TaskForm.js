// ============================================================
// TaskForm.js — Create & Edit Task Modal
//
// SELF-NOTE: This is a "controlled component" form.
// In React, a "controlled" form means React STATE owns the
// input values, not the DOM. Every keystroke updates state,
// and the input renders from state. The DOM is just a view.
//
// DUALITY: This one component handles both CREATE and EDIT.
//   CREATE: called from App.js with no `task` prop (initialData = {})
//   EDIT:   called from TaskCard with a full `task` object as `initialData`
//
// PROPS:
//   initialData   — { title, description, priority, status, dueDate }
//                   (empty for create, full task for edit)
//   onSubmit(data) — parent callback. What happens after form submit.
//   onClose()     — parent callback. Close this modal.
//   isEdit        — boolean flag. Determines button label.
// ============================================================

import React, { useState } from "react";
import api from "../services/api";
import "./TaskForm.css";

// ============================================================
// COMPONENT: TaskForm
// ============================================================
const TaskForm = ({ initialData = {}, onSubmit, onClose, isEdit = false }) => {

  // -----------------------------------------------------------
  // STATE: formData
  //
  // SELF-NOTE: We initialize state with initialData so:
  //   - For CREATE: all fields start empty/default
  //   - For EDIT: fields start pre-filled with the task's current values
  //
  // The `|| ""` and `|| "todo"` are DEFAULT VALUES — safe fallbacks
  // in case initialData is empty (create mode).
  // -----------------------------------------------------------
  const [formData, setFormData] = useState({
    title: initialData.title || "",
    description: initialData.description || "",
    priority: initialData.priority || "medium",
    status: initialData.status || "todo",
    dueDate: initialData.dueDate
      ? initialData.dueDate.split("T")[0] // Format ISO date to YYYY-MM-DD for <input type="date">
      : "",
  });

  // Loading state while the API call is in flight
  const [loading, setLoading] = useState(false);

  // Error message from the API (e.g. "An active task with this title already exists")
  const [error, setError] = useState("");

  // -----------------------------------------------------------
  // handleChange — Single handler for ALL inputs
  //
  // SELF-NOTE: Instead of writing separate onChange for each field,
  // we use ONE generic handler with a computed property key.
  //
  //   e.target.name  — the `name` attribute of the input (e.g. "title")
  //   e.target.value — what the user typed
  //
  // [e.target.name]: e.target.value
  //   This is "computed property name" syntax. It's equivalent to:
  //   { title: "some value" }  when name is "title"
  //
  // The spread operator (...formData) keeps ALL other fields unchanged
  // and only overwrites the one that just changed.
  // -----------------------------------------------------------
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // -----------------------------------------------------------
  // handleSubmit — Validate + Call API + Notify Parent
  //
  // SELF-NOTE: We use async/await inside the event handler.
  // e.preventDefault() is CRITICAL — it stops the browser's
  // default form submission behavior (which would reload the page).
  // -----------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault(); // Block the browser's default submit
    setError("");
    setLoading(true);

    // Client-side validation (the backend validates too, but we want
    // instant feedback without an API round-trip)
    if (formData.title.trim().length < 3) {
      setError("Title must be at least 3 characters.");
      setLoading(false);
      return; // Stop execution
    }

    try {
      // Build the payload — only include dueDate if user actually set one
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        status: formData.status,
        ...(formData.dueDate && { dueDate: formData.dueDate }),
        // ^^^ SELF-NOTE: Spread a conditional object.
        //   If dueDate is truthy: { dueDate: "2025-03-20" }
        //   If dueDate is empty:  {} (nothing added)
        // This avoids sending dueDate: "" which could confuse the backend.
      };

      let result;

      if (isEdit) {
        // UPDATE MODE: task has an _id, call updateTask
        // SELF-NOTE: initialData._id is the MongoDB ObjectId string
        result = await api.updateTask(initialData._id, payload);
      } else {
        // CREATE MODE: no _id yet, call createTask
        result = await api.createTask(payload);
      }

      if (result.success) {
        // Lift the result up to the parent (App.js) to update the task list
        // SELF-NOTE: The parent decides what to DO with this data.
        // The form's job is just to collect data and report success.
        onSubmit(result.data);
      }
    } catch (err) {
      // SELF-NOTE: err.response.data is our backend's JSON error body.
      // We handle the duplicate task conflict (409) specifically.
      if (err.response?.status === 409) {
        setError(
          "An active task with this title already exists. Complete it first!"
        );
      } else {
        setError(
          err.response?.data?.error ||
          "Something went wrong. Please try again."
        );
      }
    } finally {
      setLoading(false); // Always reset loading, success or fail
    }
  };

  // -----------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------
  return (
    // Modal overlay — clicking outside the card closes the form
    <div className="modal-overlay" onClick={onClose}>

      {/* stopPropagation prevents the click from reaching the overlay
          SELF-NOTE: Event bubbling = child events "bubble up" to parent handlers.
          We stop it here so clicking INSIDE the card doesn't trigger onClose. */}
      <div
        className="task-form-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="task-form-header">
          <h2>{isEdit ? "✏️ Edit Task" : "➕ New Task"}</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Error Banner */}
        {error && <div className="form-error">{error}</div>}

        {/* The Form */}
        <form onSubmit={handleSubmit} className="task-form">

          {/* TITLE — Required */}
          <div className="form-group">
            <label htmlFor="title">
              Task Title <span className="required">*</span>
            </label>
            <input
              id="title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Review the project report"
              required
              autoFocus
              // SELF-NOTE: autoFocus places cursor here when modal opens.
              // Small UX detail that makes the form feel faster to use.
            />
            <span className="char-count">
              {formData.title.length}/200
            </span>
          </div>

          {/* DESCRIPTION — Optional */}
          <div className="form-group">
            <label htmlFor="description">Description (optional)</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Any extra context about this task..."
              rows={3}
            />
          </div>

          {/* PRIORITY & STATUS — side by side */}
          <div className="form-row">

            {/* PRIORITY SELECT */}
            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
              >
                {/* SELF-NOTE: <option value="..."> — value is what gets stored
                    in state/sent to backend. Text is just what user sees. */}
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </div>

            {/* STATUS SELECT */}
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="todo">📋 Todo</option>
                <option value="in-progress">🔄 In Progress</option>
                <option value="done">✅ Done</option>
              </select>
            </div>

          </div>

          {/* DUE DATE — Optional */}
          <div className="form-group">
            <label htmlFor="dueDate">Due Date (optional)</label>
            <input
              id="dueDate"
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              // SELF-NOTE: min prevents picking dates in the past.
              // new Date().toISOString().split('T')[0] returns "YYYY-MM-DD" today.
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* Submit & Cancel buttons */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : isEdit
                ? "Save Changes"
                : "Create Task"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default TaskForm;
