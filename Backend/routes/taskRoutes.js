const express = require("express");
const router = express.Router();
//we need express framework coz it's ndejs service-side framework which Offers tools for HTTP methods, routing, middleware, and handling server-side logic.
const { 
  createTask,
  getAllTasks,
  getTaskById,
  updatedTasks,
  deleteTask
} = require("../Controller/taskController");

router.post("/createTask", createTask);
router.get("/getAllTasks", getAllTasks);
router.get("/getDataById/:id", getTaskById);
router.put("/updatedTask/:id", updatedTasks);
router.delete("/deleteById/:id", deleteTask);

module.exports = router;
