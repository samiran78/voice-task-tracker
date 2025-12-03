
// IMPORT MODEL
const Task = require('../models/Task');
// CREATE TASK
exports.createTask = async (req, res) => {  // ← Singular!
    try {
        // Extract data from request body
        const { title, description, status, priority, dueDate } = req.body;
        // INPUT VALIDATION layer :->
        // Validate title
        if (!title || title.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Title is required'
            });
        }
        //title length checking
        if (title.trim().length > 200) {
            return res.status(400).json({
                success: false,
                error: 'Title must be less than 200 characters'
            });
        }
        // Prevent gibberish ("a", "x")
        if (title.trim().length < 3) {
            return res.status(400).json({
                success: false,
                error: 'Title must be at least 3 characters'
            });
        }
        if (description && description.length > 1000) {
  return res.status(400).json({
    success: false,
    error: 'Description must be less than 1000 characters'
  });
}
const validStatuses = ['todo', 'in-progress', 'done'];

if (status && !validStatuses.includes(status)) {
  return res.status(400).json({
    success: false,
    error: `Status must be one of: ${validStatuses.join(', ')}`
  });
}
const validPriorities = ['low', 'medium', 'high'];

if (priority && !validPriorities.includes(priority)) {
  return res.status(400).json({
    success: false,
    error: `Priority must be one of: ${validPriorities.join(', ')}`
  });
}

        // Create task (automatically saves to database)
        const task = await Task.create({
            title,
            description,
            status,
            priority,
            dueDate
        });

        // Send success response
        res.status(201).json({  // ← 201 for creation!
            success: true,
            data: task  // ← "data"
        });

    } catch (error) {
        // Handle errors
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
//view-all task-GET All task
//view-one taskByID--GET TASK PER ID
//UPDATE TASK
//DELETE TASK
module.exports = { createTask: this.createTask };
