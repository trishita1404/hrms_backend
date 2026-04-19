const express = require('express');
const router = express.Router();
const upload = require('../middleware/multer'); // 1. Import your multer middleware
const { 
  getEmployees, 
  addEmployee, 
  updateEmployee, 
  deleteEmployee 
} = require('../controller/employeeController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Protect all employee routes (User must be logged in)
router.use(protect);

// 1. GET all employees
router.get('/', getEmployees);  


// Added upload.single('cv') to handle the file upload
router.post(
  '/', 
  authorize('admin', 'hr'), 
  upload.single('cv'), 
  addEmployee
);



router.put(
  '/:id', 
  authorize('admin', 'hr'), 
  upload.single('cv'), 
  updateEmployee
);

// 4. DELETE employee
router.delete('/:id', authorize('admin'), deleteEmployee);

module.exports = router;