const express = require('express');
const router = express.Router();
const { getHolidays, addHoliday, deleteHoliday } = require('../controller/holidayController');
const { protect, admin } = require('../middleware/authMiddleware');

// Everyone can view holidays
router.get('/', protect, getHolidays);

// Only Admin and HR can add or delete holidays
router.post('/', protect, admin, addHoliday);
router.delete('/:id', protect, admin, deleteHoliday);

module.exports = router;