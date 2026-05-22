const express = require('express');
const router = express.Router();
const Performance = require('../models/Performance');
const Employee = require('../models/Employee');
const User = require('../models/User');
const { authMiddleware, requireRole } = require('../middleware/auth');

// Add performance review (HR/Admin only)
router.post('/', authMiddleware, requireRole(['admin', 'hr_manager']), async (req, res) => {
  try {
    const performance = new Performance({
      ...req.body,
      reviewer: req.user.id
    });
    
    await performance.save();
    res.status(201).json(performance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Get my performance reviews (Employee)
router.get('/my-performance', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const employee = await Employee.findOne({ email: user.email });
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee record not found' });
    }
    
    const reviews = await Performance.find({ employee: employee._id })
      .populate('reviewer', 'fullname')
      .sort({ reviewDate: -1 });
    
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Get all performance reviews (HR/Admin)
router.get('/', authMiddleware, requireRole(['admin', 'hr_manager']), async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query;
    let query = {};
    
    if (employeeId) query.employee = employeeId;
    if (startDate) query.reviewDate = { $gte: new Date(startDate) };
    if (endDate) query.reviewDate = { ...query.reviewDate, $lte: new Date(endDate) };
    
    const reviews = await Performance.find(query)
      .populate('employee', 'fullname email position department')
      .populate('reviewer', 'fullname')
      .sort({ reviewDate: -1 });
    
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Get single performance review
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const review = await Performance.findById(req.params.id)
      .populate('employee', 'fullname email')
      .populate('reviewer', 'fullname');
    
    if (!review) {
      return res.status(404).json({ message: 'Performance review not found' });
    }
    
    // Check permission
    if (req.user.role === 'employee') {
      const user = await User.findById(req.user.id);
      const employee = await Employee.findOne({ email: user.email });
      if (review.employee._id.toString() !== employee?._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    res.json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Update performance review (HR/Admin only)
router.put('/:id', authMiddleware, requireRole(['admin', 'hr_manager']), async (req, res) => {
  try {
    const review = await Performance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!review) {
      return res.status(404).json({ message: 'Performance review not found' });
    }
    
    res.json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Delete performance review (HR/Admin only)
router.delete('/:id', authMiddleware, requireRole(['admin', 'hr_manager']), async (req, res) => {
  try {
    const review = await Performance.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Performance review not found' });
    }
    res.json({ message: 'Performance review deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Get performance statistics (HR/Admin)
router.get('/statistics/average', authMiddleware, requireRole(['admin', 'hr_manager']), async (req, res) => {
  try {
    const stats = await Performance.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          minRating: { $min: '$rating' },
          maxRating: { $max: '$rating' }
        }
      }
    ]);
    
    const ratingDistribution = await Performance.aggregate([
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({ stats: stats[0] || {}, ratingDistribution });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

module.exports = router;