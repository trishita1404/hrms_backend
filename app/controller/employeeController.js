const Employee = require('../model/Employee');
const path = require('path');
const fs = require('fs');

// @desc    Get all employees (With Pagination)
// @route   GET /api/employees
const getEmployees = async (req, res) => {
  try {
    // 1. Get page and limit from query parameters (defaults: page 1, limit 10)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    // 2. Get total count for frontend pagination math
    const totalEmployees = await Employee.countDocuments();

    // 3. Fetch paginated data
    const employees = await Employee.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // 4. Return data + pagination metadata
    res.status(200).json({
      employees,
      pagination: {
        totalEmployees,
        totalPages: Math.ceil(totalEmployees / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Add new employee
// @route   POST /api/employees
const addEmployee = async (req, res) => {
  try {
    const { name, email, role, joinedDate, department, contactInfo } = req.body;

    // Manual Validation Check
    if (!name || !email || !joinedDate) {
      return res.status(400).json({ 
        message: 'Validation Failed: name, email, and joinedDate are required.'
      });
    }

    // Check for existing email
    const employeeExists = await Employee.findOne({ email });
    if (employeeExists) {
      return res.status(400).json({ message: 'Employee with this email already exists' });
    }

    // Handle Local File Storage
    let cvUrl = '';
    if (req.file) {
      cvUrl = req.file.path.replace(/\\/g, "/"); 
    }

    const employee = await Employee.create({
      name,
      email,
      role: role || 'Developer',
      joinedDate,
      department: department || 'General',
      contactInfo,
      cvUrl,
      addedBy: req.user?._id || req.user?.id 
    });

    res.status(201).json(employee);
  } catch (error) {
    res.status(400).json({ message: 'Invalid employee data', error: error.message });
  }
};

// @desc    Update employee details
// @route   PUT /api/employees/:id
const updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    if (req.file) {
      if (employee.cvUrl && fs.existsSync(employee.cvUrl)) {
        fs.unlinkSync(employee.cvUrl);
      }
      employee.cvUrl = req.file.path.replace(/\\/g, "/");
    }

    employee.name = req.body.name || employee.name;
    employee.email = req.body.email || employee.email;
    employee.role = req.body.role || employee.role;
    employee.department = req.body.department || employee.department;
    employee.contactInfo = req.body.contactInfo || employee.contactInfo;
    employee.joinedDate = req.body.joinedDate || employee.joinedDate;
    employee.status = req.body.status || employee.status;

    const updatedEmployee = await employee.save();
    res.status(200).json(updatedEmployee);
  } catch (error) {
    res.status(400).json({ message: 'Update failed', error: error.message });
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    if (employee.cvUrl && fs.existsSync(employee.cvUrl)) {
      fs.unlinkSync(employee.cvUrl);
    }

    await employee.deleteOne();
    res.status(200).json({ id: req.params.id, message: 'Employee removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getEmployees,
  addEmployee,
  updateEmployee,
  deleteEmployee
};