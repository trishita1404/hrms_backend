const Job = require('../model/Job');
const Application = require('../model/Application');
const mongoose = require('mongoose');
const User = require('../model/User');
const { createNotification } = require('../utils/notificationHelper');

/**
 * @desc Get all open jobs for candidates
 * @route GET /api/jobs
 */
const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ status: 'Open' }).sort({ createdAt: -1 });
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc Create a new job post (Admin only)
 * @route POST /api/jobs
 */
const createJob = async (req, res) => {
  try {
    const { title, description, requirements, location, salary, type } = req.body;

    if (!req.user || !mongoose.Types.ObjectId.isValid(req.user._id)) {
      return res.status(401).json({ message: "Invalid session. Please login again." });
    }

    const job = await Job.create({
      title,
      description,
      requirements: Array.isArray(requirements) ? requirements : [requirements], 
      location,
      salary,
      type,
      createdBy: req.user._id 
    });

    res.status(201).json(job);
  } catch (error) {
    console.error("MONGODB SAVE ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc Delete a job post (Admin only)
 * @route DELETE /api/jobs/:id
 * ADDED: This function handles the actual database deletion
 */
const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Job ID" });
    }

    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // 1. Delete the job
    await Job.findByIdAndDelete(id);

    // 2. Optional but Recommended: Delete all applications associated with this job
    await Application.deleteMany({ jobId: id });

    res.status(200).json({ message: "Job and associated applications deleted successfully" });
  } catch (error) {
    console.error("DELETE ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc Candidate submits an application
 * @route POST /api/jobs/apply
 */
const applyToJob = async (req, res) => {
  try {
    const { jobId, jobTitle, candidateName, email, resumeLink, coverLetter } = req.body;

    const jobExists = await Job.findById(jobId);
    if (!jobExists) {
      return res.status(404).json({ message: "Job not found" });
    }

    const application = await Application.create({
      jobId,
      jobTitle,
      candidateName,
      email,
      resumeLink,
      coverLetter
    });

    // 🔔 Notify Admin & HR
    const io = req.app.get('io');
    const adminsAndHR = await User.find({ role: { $in: ['admin', 'hr'] } });

    for (const user of adminsAndHR) {
      await createNotification(io, {
        recipient: user._id,
        sender: null,
        type: 'JOB_APPLICATION',
        message: `New application from ${candidateName} for ${jobTitle}`
      });
    }

    res.status(201).json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc Fetch applications for logged-in candidate
 */
const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ email: req.user.email }).sort({ createdAt: -1 });
    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc Admin fetches all applications
 */
const getApplications = async (req, res) => {
  try {
    const applications = await Application.find().sort({ createdAt: -1 });
    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc Admin updates application status
 */
const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const updatedApplication = await Application.findByIdAndUpdate(
      id,
      { status },
      { returnDocument: 'after' } 
    );

    if (!updatedApplication) {
      return res.status(404).json({ message: "Application not found" });
    }

    // 🔔 Notify Candidate
    const io = req.app.get('io');
    const candidateUser = await User.findOne({ email: updatedApplication.email });

    if (candidateUser) {
      await createNotification(io, {
        recipient: candidateUser._id,
        sender: req.user._id,
        type: 'JOB_APPLICATION',
        message: `Your application for ${updatedApplication.jobTitle} has been ${status}`
      });
    }

    res.status(200).json(updatedApplication);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  getAllJobs, 
  createJob, 
  deleteJob, 
  applyToJob, 
  getMyApplications,
  getApplications, 
  updateApplicationStatus  
};