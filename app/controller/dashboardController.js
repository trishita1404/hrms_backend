const User = require('../model/User');
const Attendance = require('../model/Attendance');
const Job = require('../model/Job'); // Ensure you have a Job model

const getDashboardStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // --- ADMIN & HR LOGIC ---
    if (req.user.role === 'admin' || req.user.role === 'hr') {
      const [
        totalEmployees, 
        onLeaveCount, 
        presentToday, 
        lateToday, 
        totalJobs
      ] = await Promise.all([
        User.countDocuments({ role: 'employee' }),
        User.countDocuments({ 
          role: 'employee', 
          status: { $regex: /^on leave$/i } 
        }),
        Attendance.countDocuments({ date: today }),
        Attendance.countDocuments({ date: today, status: 'Late' }), // Assuming status field in Attendance
        Job.countDocuments({}) // This makes the "Jobs" metric dynamic
      ]);

      const attendanceTrend = [
        { day: 'Mon', count: 10 },
        { day: 'Tue', count: 12 },
        { day: 'Wed', count: 8 },
        { day: 'Thu', count: 15 },
        { day: 'Fri', count: presentToday }, 
      ];

      return res.json({
        totalEmployees,
        onLeave: onLeaveCount,
        activeSessions: 5, 
        totalStaff: totalEmployees, // For HR View
        presentToday,
        lateToday,
        totalJobs, // New dynamic field
        attendanceTrend,
        role: req.user.role
      });
    } 
    
    // --- CANDIDATE LOGIC ---
    else if (req.user.role === 'candidate') {
      // Assuming you have an Applications collection or field
      const appliedJobsCount = await Job.countDocuments({ "applicants.userId": req.user._id });
      
      return res.json({
        appliedJobsCount,
        activeApplications: appliedJobsCount, // Simplified for now
        interviewShortlists: 0,
        role: 'candidate'
      });
    }

    // --- EMPLOYEE LOGIC ---
    else {
      const myRecords = await Attendance.find({ employee: req.user._id });
      const myTotalHours = myRecords.reduce((sum, rec) => sum + (rec.totalHours || 0), 0);
      const lastRecord = myRecords[myRecords.length - 1];

      return res.json({
        myTotalHours: parseFloat(myTotalHours.toFixed(1)),
        myAttendanceRate: 85,
        lastClockIn: lastRecord ? lastRecord.checkIn : 'No records',
        role: 'employee'
      });
    }
  } catch (error) {
    console.error("Dashboard Controller Error:", error);
    res.status(500).json({ message: "Server error fetching dashboard data" });
  }
};

module.exports = { getDashboardStats };