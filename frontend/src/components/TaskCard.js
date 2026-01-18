import React from "react";
// Define TaskCard component
// props = data passed from parent (like function parameters) ..like functions'
//import from tailwind css
import './TaskCard.css';
function TaskCard(props) {
    // This component will return HTML (JSX)
    return (
        <div className="task-card">
            <p>Task card goes here</p>
            {/* structure the page */}
            <div className="task-header">
                <h3>{props.title}</h3>
                <span className={`priority ${props.priority || "medium"}`}>
                    {props.priority}
                </span>
            </div>
            {/* Description */}
            <p className="task-description">{props.description || "No description"}</p>
            <div className="task-footer">
                <span className="status">{props.status}</span>
                {
                    props.dueDate && (<span className="due-date">Due: {props.dueDate}</span>
                    )
                }

            </div>
        </div>
    )
}
// Export so other files can import and use it
export default TaskCard;