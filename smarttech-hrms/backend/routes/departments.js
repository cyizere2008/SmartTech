const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const Employee = require('../models/Employee');
const { authMiddleware, requireRole } = require('../middleware/auth');

// Get all departments with full employee details
router.get('/', authMiddleware, async (req, res) => {
  try {
    const departments = await Department.find()
      .populate({
        path: 'employees',
        select: 'fullname email position phone profilePhoto',
        populate: {
          path: 'department',
          select: 'name'
        }
      })
      .populate('headOfDepartment', 'fullname email position');
    
    // Format the response to ensure department names are included
    const formattedDepartments = departments.map(dept => ({
      ...dept.toObject(),
      employeeCount: dept.employees?.length || 0,
      employees: dept.employees?.map(emp => ({
        _id: emp._id,
        fullname: emp.fullname,
        email: emp.email,
        position: emp.position,
        phone: emp.phone,
        profilePhoto: emp.profilePhoto,
        departmentName: emp.department?.name || dept.name
      })) || []
    }));
    
    res.json(formattedDepartments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Get single department with full employee details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate({
        path: 'employees',
        select: 'fullname email position phone profilePhoto',
        populate: {
          path: 'department',
          select: 'name'
        }
      })
      .populate('headOfDepartment', 'fullname email position');
    
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    const formattedDept = {
      ...department.toObject(),
      employeeCount: department.employees?.length || 0,
      employees: department.employees?.map(emp => ({
        _id: emp._id,
        fullname: emp.fullname,
        email: emp.email,
        position: emp.position,
        phone: emp.phone,
        profilePhoto: emp.profilePhoto,
        departmentName: emp.department?.name || department.name
      })) || []
    };
    
    res.json(formattedDept);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Add department (HR/Admin only)
router.post('/', authMiddleware, requireRole(['admin', 'hr_manager']), async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const existingDept = await Department.findOne({ name });
    if (existingDept) {
      return res.status(400).json({ message: 'Department with this name already exists' });
    }
    
    const department = new Department({ name, description });
    await department.save();
    res.status(201).json(department);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Update department (HR/Admin only)
router.put('/:id', authMiddleware, requireRole(['admin', 'hr_manager']), async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    res.json(department);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Delete department (HR/Admin only)
router.delete('/:id', authMiddleware, requireRole(['admin', 'hr_manager']), async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    // Remove department reference from employees
    await Employee.updateMany(
      { department: req.params.id },
      { $unset: { department: "" } }
    );
    
    res.json({ message: 'Department deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Assign employee to department (HR/Admin only)
router.post('/assign', authMiddleware, requireRole(['admin', 'hr_manager']), async (req, res) => {
  try {
    const { employeeId, departmentId } = req.body;
    
    // Update employee's department
    const employee = await Employee.findByIdAndUpdate(
      employeeId,
      { department: departmentId },
      { new: true }
    ).populate('department', 'name');
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Add employee to department's employees array if not already there
    await Department.findByIdAndUpdate(
      departmentId,
      { $addToSet: { employees: employeeId } }
    );
    
    res.json({ 
      message: 'Employee assigned to department successfully', 
      employee: {
        ...employee.toObject(),
        departmentName: employee.department?.name || 'Unassigned'
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Remove employee from department (HR/Admin only)
router.post('/remove-employee', authMiddleware, requireRole(['admin', 'hr_manager']), async (req, res) => {
  try {
    const { employeeId, departmentId } = req.body;
    
    await Employee.findByIdAndUpdate(employeeId, { $unset: { department: "" } });
    await Department.findByIdAndUpdate(departmentId, { $pull: { employees: employeeId } });
    
    res.json({ message: 'Employee removed from department successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Get all employees with their department information
router.get('/employees/all', authMiddleware, requireRole(['admin', 'hr_manager']), async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate('department', 'name description')
      .select('fullname email position department profilePhoto phone');
    
    const formattedEmployees = employees.map(emp => ({
      ...emp.toObject(),
      departmentName: emp.department?.name || 'Unassigned',
      departmentId: emp.department?._id || null
    }));
    
    res.json(formattedEmployees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

module.exports = router;