const Holiday = require('../model/Holiday');

// @desc    Get all holidays
// @route   GET /api/holidays
const getHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 }); // Sort by soonest date
    res.status(200).json(holidays);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a new holiday
// @route   POST /api/holidays
const addHoliday = async (req, res) => {
  try {
    const { title, date, type, description } = req.body;

    const holiday = await Holiday.create({
      title,
      date,
      type,
      description
    });

    res.status(201).json(holiday);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a holiday
// @route   DELETE /api/holidays/:id
const deleteHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndDelete(req.params.id);
    if (!holiday) {
      return res.status(404).json({ message: "Holiday not found" });
    }
    res.status(200).json({ message: "Holiday removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getHolidays,
  addHoliday,
  deleteHoliday
};