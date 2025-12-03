const express = require("express");
//create express app
// 4. MIDDLEWARE (Functions that process requests)
const router = express.Router();  // It's a function!
//we need express framework coz it's ndejs service-side framework which Offers tools for HTTP methods, routing, middleware, and handling server-side logic.
const { createTask } = require("../Controller/taskController");
router.post("/createTask", createTask);
module.exports = router;
