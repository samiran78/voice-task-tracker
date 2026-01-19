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
      console.error(err);
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
        <h2>Your Tasks ({tasks.length})</h2>
         {/* Show loading state */}
         {loading && <p>Loading tasks...</p>}
          {/* Show error if any */}
        {error && <p style={{color: 'red'}}>{error}</p>}
        {/* show tasks when no task show 0 in  custom way */}
        {!loading && !error && tasks.length===0 &&(
          <p>No tasks yet! Create one from Postman or add create form.</p>
        )}
        {/* Use TaskCard component - pass data via props */}
        {/* <TaskCard
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
        /> */}
        {/* showing tasks from backend -- by usuing .map() over tasks Array */}
        {
          tasks.map(task =>(
            <TaskCard 
            key={task._id} //Unique key for each task
            title={task.title}
            description={task.description}
            priority={task.priority}
            status={task.status}
            dueDate={task.dueDate}
            />
          ))
        }
      </main>
    </div>
  );
}

// Export so other files can use it
export default App;