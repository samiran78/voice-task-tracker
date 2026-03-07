// Import React
import React, { useState, useEffect } from 'react';
import './App.css';

// Components
import TaskCard from './components/TaskCard';
import Auth from './components/Auth';

// API Service
import api from './services/api';

function App() {
  // STATE: Auth
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // STATE: Array of tasks (starts empty)
  const [tasks, setTasks] = useState([]);

  // STATE: Loading indicator
  const [loading, setLoading] = useState(false);

  // STATE: error message
  const [error, setError] = useState(null);

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setTasks([]);
  };

  // useEffect: Runs when component loads or user changes
  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  // Function to fetch tasks from backend
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getAllTasks();
      if (response.success) {
        setTasks(response.data); // Update state with tasks
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        handleLogout();
        setError('Session expired. Please log in again.');
      } else {
        setError('Failed to load tasks. Make sure backend is running!');
      }
      console.error(error);
    } finally {
      setLoading(false); // false when something occurs bad
    }
  };

  // If not logged in, show Auth component
  if (!user) {
    return (
      <div className="App">
        <header>
          <h1>🎤 Voice Task Tracker</h1>
          <p>Your AI-powered task manager</p>
        </header>
        <main>
          <Auth onLogin={(loggedInUser) => setUser(loggedInUser)} />
        </main>
      </div>
    );
  }

  return (
    <div className="App">
      <header>
        <h1>🎤 Voice Task Tracker</h1>
        <p>Your AI-powered task manager</p>
        <div className="header-user-info">
          <span>Welcome, {user.name}</span>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main>
        <h2>Your Tasks <span className="task-count">{tasks.length}</span></h2>

        {/* Show loading state */}
        {loading && <div className="loading-state"><p>Loading tasks with AI...</p></div>}

        {/* Show error if any */}
        {error && <div className="error-state"><p>{error}</p></div>}

        {/* show tasks when no task show 0 in custom way */}
        {!loading && !error && tasks.length === 0 && (
          <div className="empty-state">
            <p>No tasks yet! Speak to add your first task.</p>
          </div>
        )}

        {/* grids for tasks */}
        <div className="tasks-grid">
          {
            tasks.map(task => (
              <TaskCard
                key={task._id}
                title={task.title}
                description={task.description}
                priority={task.priority}
                status={task.status}
                dueDate={task.dueDate}
              />
            ))
          }
        </div>
      </main>
    </div>
  );
}

// Export so other files can use it
export default App;