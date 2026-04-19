const express = require('express');
const router = express.Router();
const { 
  getAllJobs, 
  createJob, 
  deleteJob,         
  applyToJob, 
  getApplications, 
  getMyApplications, 
  updateApplicationStatus 
} = require('../controller/jobController');
const { protect, admin } = require('../middleware/authMiddleware');

// --- JOB ROUTES ---

// Anyone can see jobs on the landing page
router.get('/', getAllJobs);

// Only Admin/HR can create jobs
router.post('/', protect, admin, createJob);


router.delete('/:id', protect, admin, deleteJob);

// --- APPLICATION ROUTES ---

// Only logged-in candidates can apply
router.post('/apply', protect, applyToJob);


router.get('/my-applications', protect, getMyApplications);

// Only Admins can see the list of all applications
router.get('/applications', protect, admin, getApplications);

// Only Admins can approve or reject an application
router.put('/applications/:id', protect, admin, updateApplicationStatus);

module.exports = router;