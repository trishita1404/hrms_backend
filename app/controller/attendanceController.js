const Attendance = require('../model/Attendance');
const { createNotification } = require('../utils/notificationHelper'); 

// @desc    Check In
// @route   POST /api/attendance/check-in
const checkIn = async (req, res) => {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const existingRecord = await Attendance.findOne({ employee: req.user._id, date: today });
    if (existingRecord) {
      return res.status(400).json({ message: 'Already checked in for today' });
    }

    let status = 'Present';
    const lateThreshold = new Date(now);
    lateThreshold.setHours(10, 15, 0, 0); 

    if (now > lateThreshold) {
      status = 'Late';
    }

    const attendance = await Attendance.create({
      employee: req.user._id,
      date: today,
      checkIn: now,
      status
    });

    // 🔔 STEP 3: Notify if Late
    if (status === 'Late') {
      const io = req.app.get('io');

      await createNotification(io, {
        recipient: req.user._id,
        sender: req.user._id,
        type: 'ATTENDANCE_ALERT',
        message: 'You checked in late today'
      });
    }

    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Check Out
// @route   PUT /api/attendance/check-out
const checkOut = async (req, res) => {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const record = await Attendance.findOne({ employee: req.user._id, date: today });

    if (!record) {
      return res.status(404).json({ message: 'No check-in record found for today' });
    }
    if (record.checkOut) {
      return res.status(400).json({ message: 'Already checked out for today' });
    }

    const diffInMs = now - new Date(record.checkIn);
    const hours = (diffInMs / (1000 * 60 * 60)).toFixed(2);

    record.checkOut = now;
    record.totalHours = parseFloat(hours);
    await record.save();

    res.status(200).json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Get Personal History (For Employee) - UPDATED WITH PAGINATION
// @route   GET /api/attendance/my-history
const getMyAttendance = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    const totalRecords = await Attendance.countDocuments({ employee: req.user._id });

    const history = await Attendance.find({ employee: req.user._id })
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      history,
      pagination: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Get All Employee Attendance (For Admin/HR)
const getAllAttendance = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    const totalRecords = await Attendance.countDocuments();

    const allHistory = await Attendance.find({})
      .populate('employee', 'name email role department')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    res.json({
      history: allHistory,
      pagination: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Delete Attendance Log (For Admin/HR)
const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role?.toLowerCase();

    if (userRole !== 'admin' && userRole !== 'hr') {
      return res.status(403).json({ message: "Not authorized to delete attendance logs" });
    }

    const record = await Attendance.findByIdAndDelete(id);

    if (!record) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    res.status(200).json({ message: "Attendance record deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  checkIn, 
  checkOut, 
  getMyAttendance, 
  getAllAttendance,
  deleteAttendance,
};