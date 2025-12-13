// IMPORT MODEL
const mongoose = require("mongoose");
const Task = require('../models/Task');
//helper function :->
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};
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
        // VALIDATION 5: Due Date  :->(later)
        // VALIDATION 6: Check for Duplicate (Active Tasks):-> todo && in-progress tasks should complete first--PREVENT DUPLICATION+UNIQUE
        const normalizedTitle = title.trim().toLowerCase();
        //check in db - if this tasks present in todo or in-progress state
        const existingTask = await Task.findOne({
            title: { $regex: new RegExp(`^${normalizedTitle}$`, 'i') },  // Case-insensitive
            status: { $in: ['todo', 'in-progress'] } //only-active state
        })
        if (existingTask) {
            //conflict
            return res.status(409).json({
                success: false,
                error: 'An active task with this title already exists',
                existingTask: {
                    _id: existingTask._id, //mongodb generated id-  96bit
                    title: existingTask.title,
                    status: existingTask.status
                }
            });
        }
        //Rate Limiting step --later **

        // Create task (automatically saves to database)
        const task = await Task.create({
            title: title.trim(),
            description: description ? description.trim() : '',
            status: status || 'todo',//by-default
            priority: priority || 'low', //by-default
            dueDate: dueDate || null
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
// GET ALL TASKS (WITH PAGINATION)
exports.getAllTasks = async (req, res) => {
    try {
        // STEP 1: Extract and validate pagination params
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;

        // Validate page (must be >= 1)
        if (page < 1) {
            page = 1;
        }

        // Validate limit (prevent DOS attacks)
        if (limit < 1 || limit > 100) {
            limit = 10;  // Default to 10 if invalid
        }
        //(future implementation)
        // STEP 2: Calculate skip value
        // skip = how many documents to skip
        // Example: page=1, limit=10 → skip=0 (show first 10)
        //          page=2, limit=10 → skip=10 (skip first 10, show next 10)
        //          page=3, limit=10 → skip=20 (skip first 20, show next 10)
        const skip = (page - 1) * limit;

        // STEP 3: Get total count (for pagination metadata)

        const totalTasks = await Task.countDocuments();

        // STEP 4: Get paginated tasks
        const tasks = await Task.find()
            .sort({ createdAt: -1 })  // Newest first
            .skip(skip)               // Skip previous pages
            .limit(limit);            // Limit results per page

        // STEP 5: Calculate pagination metadata
        const totalPages = Math.ceil(totalTasks / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        // STEP 6: Send response with pagination info

        res.status(200).json({
            success: true,
            data: tasks,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalTasks: totalTasks,
                tasksPerPage: limit,
                hasNextPage: hasNextPage,
                hasPrevPage: hasPrevPage
            }
        });

    } catch (error) {
        console.error('Get all tasks error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
//view-one taskByID--> GET TASK PER ID
exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID format → 400
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid task ID format'
      });
    }
    
    // Find task
    const task = await Task.findById(id);
    
    // Check if exists → 404
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    
    // Return task
    res.status(200).json({
      success: true,
      data: task
    });
    
  } catch (error) {
    console.error('Get task by ID error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
//UPDATE TASK :

//for update we need condition to pass
exports.updatedTasks = async (req, res) => {
    try {
        //Extract ID from URL params (req.params.id)
        const { id } = req.params;
        //validate  id:->
        if (!isValidObjectId(id)) {
            return res.status(404).json({
                message: "unknown id can't proceed !"
            })
        }
        // STEP 2: Extract update data
        const { title, description, status, priority, dueDate } = req.body;
        //we can't consider to update : id/createdat/updatedat...
        if (status) {
            const validstatuses = ['todo', 'in-progress', 'done'];
            if (!validstatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: `Status must be one of: ${validstatuses.join(', ')}`
                });
            }
        }

        // Validate priority if provided :->
        if (priority) {
            const validPriorities = ['low', 'medium', 'high'];
            if (!validPriorities.includes(priority)) {
                return res.status(400).json({
                    success: false,
                    error: `Priority must be one of: ${validPriorities.join(', ')}`
                });
            }
        }
        // Validate title length if provided :->
        if (title) {
            if (title.trim().length < 3 || title.trim().length > 200) {
                return res.status(400).json({
                    success: false,
                    error: 'Title must be between 3 and 200 characters'
                });
            }
        }

        // STEP 4: Build update object (only include provided fields)
        const updateData = {};
        if (title) updateData.title = title.trim();
        if (description !== undefined) updateData.description = description.trim();
        if (status) updateData.status = status;
        if (priority) updateData.priority = priority;
        if (dueDate !== undefined) updateData.dueDate = dueDate;
        //update the task..
        const updatedTask = await Task.findByIdAndUpdate(
            id,
            updateData,
            {
                new: true,           // Return updated document
                runValidators: true  // Run mongoose validations
            }
        )
          // STEP 6: Check if task exists :->
    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    
    // STEP 7: Return updated task
    res.status(200).json({
      success: true,
      data: updatedTask
    });
    } catch (error) {
     return res.json({
        message: error
     })
    }
}
// DELETE TASK (Only if status is 'done')
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    
    // STEP 1: Validate ID format
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid task ID format'
      });
    }
    
    // STEP 2: Find task first (need to check status before deleting)
    const task = await Task.findById(id);
    
    // STEP 3: Check if task exists
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    
    // STEP 4: Business Rule - Only delete completed tasks
    if (task.status !== 'done') {
      return res.status(403).json({  // 403 = Forbidden
        success: false,
        error: 'Cannot delete active task. Please mark as done first.',
        currentStatus: task.status,
        hint: 'Update task status to "done" before deleting'
      });
    }
    
    // STEP 5: Delete task (status is 'done')
    await Task.findByIdAndDelete(id);
    
    // STEP 6: Return success
    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: task
    });
    
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
//DELETE TASK
module.exports = { 
  createTask: this.createTask,
  getAllTasks:this.getAllTasks,
  getTaskById: this.getTaskById,
  updatedTasks:this.updatedTasks,
  deleteTask : this.deleteTask
};

