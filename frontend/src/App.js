// Import React
import React from 'react';
import './App.css';
//import from 
// Main App component
import TaskCard from './components/TaskCard';

function App() {
  // Sample task data (hardcoded for now - we'll fetch from API later!)
  const sampleTask = {
    title: "Buy groceries",
    description: "Get milk, eggs, bread, and vegetables from the store",
    priority: "high",
    status: "todo",
    dueDate: "2025-12-27"
  };
  const task2 = {
    title: "Review pull request",
    description: "Check authentication module code",
    priority: "medium",
    status: "in-progress",
    dueDate: "2025-12-28"
  };

  const task3 = {
    title: "Clean desk",
    description: "Organize workspace",
    priority: "low",
    status: "todo",
    dueDate: null  // No deadline!
  };


  return (
    <div className="App">
      <header>
        <h1>🎤 Voice Task Tracker</h1>
        <p>Your AI-powered task manager</p>
      </header>

      <main>
        <p>Let's build this step by step!</p>
        {/* Use TaskCard component - pass data via props */}
        <TaskCard
          title={sampleTask.title}
          description={sampleTask.description}
          priority={sampleTask.priority}
          status={sampleTask.status}
          dueDate={sampleTask.dueDate}
        />
        <TaskCard
          title={task2.title}
          description={task2.description}
          priority={task2.priority}
          status={task2.status}
          dueDate={task2.dueDate}
        />
        <TaskCard
          title={task3.title}
          description={task3.description}
          priority={task3.priority}
          status={task3.status}
          dueDate={task3.dueDate}
        />
      </main>
    </div>
  );
}

// Export so other files can use it
export default App;