// Import React
import React, { useState,useEffect } from 'react';
import './App.css';
//import from 
// Main App component
import TaskCard from './components/TaskCard';
//import api
import api from './services/api';

function App() {
  // STATE: Array of tasks (starts empty)
  const[tasks,setTasks] = useState([]);
    // STATE: Loading indicator
  const [loading, setLoading] = useState(true);
  //error message
  const[error,setError]=useState(null);
   // useEffect: Runs when component loads (like componentDidMount)
  useEffect(() => {
    fetchTasks();  // Fetch tasks from backend
  }, []);  // Empty array = run only once when component loads
  
  // Function to fetch tasks from backend
  const fetchTasks = async()=>{
    try {
      setLoading(true);
      const response  = await api.getAllTasks();
      if(response.success){
        setTasks(response.data); // Update state with tasks
      }
    } catch (error) {
       setError('Failed to load tasks. Make sure backend is running!');
      console.error(error);
    }finally{
      setLoading(false); // false when something occurs bad
    }
  }
  // // Sample task data (hardcoded for now - we'll fetch from API later!)
  // const sampleTask = {
  //   title: "Buy groceries",
  //   description: "Get milk, eggs, bread, and vegetables from the store",
  //   priority: "high",
  //   status: "todo",
  //   dueDate: "2025-12-27"
  // };
  // const task2 = {
  //   title: "Review pull request",
  //   description: "Check authentication module code",
  //   priority: "medium",
  //   status: "in-progress",
  //   dueDate: "2025-12-28"
  // };

  // const task3 = {
  //   title: "Clean desk",
  //   description: "Organize workspace",
  //   priority: "low",
  //   status: "todo",
  //   dueDate: null  // No deadline!
  // };


  return (
    <div className="App">
      <header>
        <h1>🎤 Voice Task Tracker</h1>
        <p>Your AI-powered task manager</p>
      </header>

      <main>
        <h2>Your Tasks <span className="task-count">{tasks.length}</span></h2>
        
         {/* Show loading state */}
         {loading && <div className="loading-state"><p>Loading tasks with AI...</p></div>}
         
          {/* Show error if any */}
        {error && <div className="error-state"><p>{error}</p></div>}
        
        {/* show tasks when no task show 0 in custom way */}
        {!loading && !error && tasks.length===0 &&(
          <div className="empty-state">
            <p>No tasks yet! Speak to add your first task.</p>
          </div>
        )}
        
        {/* grids for tasks */}
        <div className="tasks-grid">
          {
            tasks.map(task =>(
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