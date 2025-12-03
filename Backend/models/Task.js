// ==========================================
// IMPORT MONGOOSE
// ==========================================
const mongoose = require('mongoose');

// DEFINE TASK SCHEMA

const taskSchema = new mongoose.Schema({
  
  // TITLE - Required
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  
  // DESCRIPTION - Optional
  description: {
    type: String,
    trim: true,
    default: ''
  },
  
  // STATUS - Workflow stage (todo, in-progress, done)
  status: {
    type: String,
    enum: {
      values: ['todo', 'in-progress', 'done'],
      message: '{VALUE} is not a valid status'
    },
    default: 'todo'
  },
  
  // PRIORITY - Importance level (low, medium, high)
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high'],
      message: '{VALUE} is not a valid priority'
    },
    default: 'medium'
  },
  
  // DUE DATE - Deadline (optional)
  dueDate: {  // ← camelCase!
    type: Date,
    default: null
  }
  
}, {
  timestamps: true  // Auto-adds createdAt and updatedAt
});

// ==========================================
// CREATE MODEL
// ==========================================
const Task = mongoose.model('Task', taskSchema);  // Singular!

// ==========================================
// EXPORT MODEL
// ==========================================
module.exports = Task;
