const express = require('express');
const router = express.Router();
const { 
  checkIn, 
  checkOut, 
  getMyAttendance, 
  getAllAttendance,
  deleteAttendance 
} = require('../controller/attendanceController');


const { protect, admin } = require('../middleware/authMiddleware'); 

// --- Employee Routes ---
router.post('/check-in', protect, checkIn);
router.put('/check-out', protect, checkOut);
router.get('/my-history', protect, getMyAttendance);

// --- Admin/HR Routes ---

router.get('/all', protect, admin, getAllAttendance); 

   
router.delete('/:id', protect, admin, deleteAttendance); 

module.exports = router;