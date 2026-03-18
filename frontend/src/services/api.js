// ============================================================
// api.js — Central API service file
//
// SELF-NOTE: This is the SINGLE SOURCE OF TRUTH for all
// HTTP calls in this app. Every component that needs to talk
// to the backend imports this object and calls a method.
// This pattern is called the "Service Layer" pattern.
//
// WHY?
//   If the backend URL ever changes (e.g. localhost → Render),
//   I only update ONE file (this one), not every component.
// ============================================================

// axios is a promise-based HTTP client for the browser.
// It wraps the native fetch() with cleaner syntax + interceptors.
import axios from "axios";

// ---------------------------------------------------------------
// BASE URL — reads from .env file first, falls back to localhost.
// SELF-NOTE: In React, env variables MUST start with REACT_APP_
// At build time, Create-React-App replaces process.env.REACT_APP_*
// with the actual string values. They are baked into the bundle.
// For local dev: create a .env in /frontend with:
//   REACT_APP_API_URL=http://localhost:5000/api
// For Vercel: set the same var in the Vercel dashboard.
// ---------------------------------------------------------------
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://127.0.0.1:5001/api";
// ^^^ CRITICAL FIX: was hardcoded to :5001 — backend runs on :5001 (not 5000)
// Using 127.0.0.1 instead of localhost to avoid IPv6 resolution issues.

// ============================================================
// AXIOS REQUEST INTERCEPTOR
//
// SELF-NOTE: An "interceptor" runs BEFORE every request is sent.
// Think of it like a middleware but on the frontend.
//
// Here, we auto-attach the JWT token to every request's
// Authorization header so we don't have to do it manually
// in every api method.
//
// Flow:
//   login() → token saved in localStorage
//   any api call → interceptor reads token → injects it into header
//   backend authMiddleware → reads the header → allows/denies
// ============================================================
axios.interceptors.request.use(
  (config) => {
    // Read the stored user object (we saved the whole user+token object on login)
    const user = JSON.parse(localStorage.getItem("user"));

    if (user && user.token) {
      // Attach the JWT as a Bearer token.
      // SELF-NOTE: "Bearer" is an HTTP auth scheme. The backend
      // splits "Bearer <token>" and verifies <token> with jwt.verify()
      config.headers["Authorization"] = `Bearer ${user.token}`;
    }

    return config; // MUST return config or the request gets cancelled
  },
  (error) => {
    // If there's an error CONFIGURING the request (rare), reject it
    return Promise.reject(error);
  }
);

// ============================================================
// THE API SERVICE OBJECT
//
// SELF-NOTE: I export a plain object (not a class) because
// this app doesn't need multiple instances.
// Each method is an async function that:
//   1. Calls the corresponding backend route
//   2. Returns response.data (axios wraps response in .data)
//   3. Throws errors up to the calling component to handle
// ============================================================
const api = {

  // -----------------------------------------------------------
  // AUTH METHODS
  // These hit the /api/auth/* routes which do NOT need a token
  // (they are public routes — no protect middleware on them)
  // -----------------------------------------------------------

  /**
   * Register a new user account.
   * @param {Object} userData - { name, email, password }
   * @returns Backend response with user data + JWT token
   *
   * SELF-NOTE: After register, the backend returns the user object
   * WITH a token. We immediately save it to localStorage so the user
   * is "logged in" right after signup (common UX pattern).
   */
  register: async (userData) => {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);

    // Save user+token to localStorage for persistence across page refreshes
    // SELF-NOTE: localStorage is synchronous and stores strings only — that's
    // why we JSON.stringify when saving and JSON.parse when reading.
    if (response.data && response.data.data) {
      localStorage.setItem("user", JSON.stringify(response.data.data));
    }
    return response.data;
  },

  /**
   * Log in an existing user.
   * @param {Object} userData - { email, password }
   * @returns Backend response with user data + JWT token
   */
  login: async (userData) => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, userData);

    if (response.data && response.data.data) {
      localStorage.setItem("user", JSON.stringify(response.data.data));
    }
    return response.data;
  },

  /**
   * Log out the current user.
   * SELF-NOTE: There's no backend call needed here.
   * JWT is stateless — the server doesn't track sessions.
   * We just delete the token from localStorage and the user
   * is effectively logged out (no token = no access).
   */
  logout: () => {
    localStorage.removeItem("user");
  },

  // -----------------------------------------------------------
  // TASK METHODS
  // These hit the /api/tasks/* routes, all protected by the
  // authMiddleware. The interceptor above auto-attaches the token.
  // -----------------------------------------------------------

  /**
   * Get all tasks for the logged-in user (with pagination support).
   * @returns { success, data: Task[], pagination: {...} }
   *
   * SELF-NOTE: The backend filters by req.user.id (from the JWT),
   * so different users always see only THEIR own tasks.
   */
  getAllTasks: async () => {
    const response = await axios.get(`${API_BASE_URL}/tasks/getAllTasks`);
    return response.data;
  },

  /**
   * Create a new task.
   * @param {Object} taskData - { title, description, status, priority, dueDate }
   * @returns { success, data: newTask }
   *
   * SELF-NOTE: The backend auto-assigns req.user.id as the owner.
   * We never send userId from the frontend — that would be a security risk.
   */
  createTask: async (taskData) => {
    const response = await axios.post(
      `${API_BASE_URL}/tasks/createTask`,
      taskData
    );
    return response.data;
  },

  /**
   * Update an existing task by its MongoDB _id.
   * @param {string} id - MongoDB ObjectId string
   * @param {Object} updateData - any subset of { title, description, status, priority, dueDate }
   * @returns { success, data: updatedTask }
   *
   * SELF-NOTE: We use PUT (full or partial update). The backend
   * uses findOneAndUpdate with { new: true } which returns the
   * UPDATED document, not the original. This is why we can
   * directly replace the task in our React state with the response.
   */
  updateTask: async (id, updateData) => {
    const response = await axios.put(
      `${API_BASE_URL}/tasks/updatedTask/${id}`,
      updateData
    );
    return response.data;
  },

  /**
   * Delete a task by its MongoDB _id.
   * @param {string} id - MongoDB ObjectId string
   * @returns { success, message, data: deletedTask }
   *
   * SELF-NOTE: The backend has a BUSINESS RULE — only tasks
   * with status 'done' can be deleted. The frontend enforces
   * this by only showing the delete button on 'done' cards,
   * but the backend is the real enforcer (defense in depth).
   */
  deleteTask: async (id) => {
    const response = await axios.delete(
      `${API_BASE_URL}/tasks/deleteById/${id}`
    );
    return response.data;
  },

  // -----------------------------------------------------------
  // VOICE / AI METHOD
  // Hits the /api/voice/parse route which calls Google Gemini AI
  // to parse natural language into a structured task object.
  // -----------------------------------------------------------

  /**
   * Send a voice transcript to the backend for AI parsing.
   * @param {string} transcript - Raw text from the Web Speech API
   * @returns { success, data: { transcript, parsedResponse: { title, priority, dueDate, status } } }
   *
   * SELF-NOTE: The voice pipeline works like this:
   *   browser mic → Web Speech API → text transcript
   *   → this function → backend voiceController
   *   → Gemini AI prompt → JSON { title, priority, dueDate, status }
   *   → returned here → used to pre-fill the TaskForm
   */
  parseVoiceTranscript: async (transcript) => {
    const response = await axios.post(`${API_BASE_URL}/voice/parse`, {
      transcript,
    });
    return response.data;
  },
};

export default api;