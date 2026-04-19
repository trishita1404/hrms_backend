const express = require('express');
const router = express.Router();


const { 
  createLeave, 
  getAllLeaves, 
  updateLeaveStatus,
  deleteLeave //
} = require('../controller/leaveController');

const { protect } = require('../middleware/authMiddleware');


router.use(protect);

// --- ROUTES ---
router.get('/', getAllLeaves);           
router.post('/', createLeave);         
router.put('/:id', updateLeaveStatus); 


router.delete('/:id', deleteLeave); 

module.exports = router;