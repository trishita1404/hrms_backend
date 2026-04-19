const Leave = require('../model/Leave');
const Employee = require('../model/Employee');
const User = require('../model/User'); // ✅ Added
const { createNotification } = require('../utils/notificationHelper'); // ✅ Added


// @desc    Create Leave Request
// @route   POST /api/leaves
const createLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    const employee = await Employee.findOne({ email: req.user.email }); 

    if (!employee) {
      return res.status(404).json({ 
        message: "Employee record not found. Please ensure your HR profile is created with the same email as your login." 
      });
    }

    const leave = await Leave.create({
      employee: employee._id, 
      leaveType,
      startDate,
      endDate,
      reason,
      status: 'Pending' 
    });

    // 🔔 STEP 1: Notify Admin & HR
    const io = req.app.get('io');

    const adminsAndHR = await User.find({
      role: { $in: ['admin', 'hr'] }
    });

    for (const user of adminsAndHR) {
      await createNotification(io, {
        recipient: user._id,
        sender: req.user._id,
        type: 'LEAVE_REQUEST',
        message: `${employee.name} applied for ${leaveType} leave`
      });
    }

    res.status(201).json(leave);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


// @desc    Get All Leaves (With Pagination)
// @route   GET /api/leaves
const getAllLeaves = async (req, res) => {
  try {
    let query = {};
    const userRole = req.user.role?.toLowerCase();
    const isAdminOrHR = userRole === 'admin' || userRole === 'hr';

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    const employeeProfile = await Employee.findOne({ email: req.user.email });

    if (!isAdminOrHR) {
      if (!employeeProfile) {
        return res.status(200).json({ leaves: [], pagination: { totalRecords: 0, totalPages: 0, currentPage: page } }); 
      }
      query = { employee: employeeProfile._id };
    }

    const totalRecords = await Leave.countDocuments(query);

    const leaves = await Leave.find(query)
      .populate('employee', 'name email role department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      leaves,
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


// @desc    Update Leave Status
// @route   PUT /api/leaves/:id
const updateLeaveStatus = async (req, res) => { 
  try {
    const { status, adminMessage } = req.body;
    const { id } = req.params;
    const userRole = req.user.role?.toLowerCase();

    if (userRole !== 'admin' && userRole !== 'hr') {
      return res.status(403).json({ message: "Not authorized to update leave status" });
    }

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: "Invalid status update. Must be Approved or Rejected" });
    }

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    leave.status = status;
    leave.adminMessage = adminMessage || '';
    leave.processedBy = req.user._id; 

    await leave.save();

// 🔔 STEP 2: Notify Employee
const io = req.app.get('io');

// Get employee details
const employee = await Employee.findById(leave.employee);

// Find corresponding user
const user = await User.findOne({ email: employee.email });

if (user) {
  await createNotification(io, {
    recipient: user._id,
    sender: req.user._id,
    type: 'LEAVE_REQUEST',
    message: `Your leave request has been ${status}`
  });
}

res.status(200).json(leave);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


// @desc    Delete Leave Request
// @route   DELETE /api/leaves/:id
const deleteLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role?.toLowerCase();
    const leave = await Leave.findById(id);

    if (!leave) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    if (userRole !== 'admin' && userRole !== 'hr') {
      const employeeProfile = await Employee.findOne({ email: req.user.email });
      if (!employeeProfile || leave.employee.toString() !== employeeProfile._id.toString()) {
        return res.status(403).json({ message: "Not authorized to delete this request" });
      }
      if (leave.status !== 'Pending') {
        return res.status(400).json({ message: "Cannot delete a request that has already been processed" });
      }
    }

    await Leave.findByIdAndDelete(id);
    res.status(200).json({ message: "Leave request deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createLeave,
  getAllLeaves,
  updateLeaveStatus,
  deleteLeave 
};