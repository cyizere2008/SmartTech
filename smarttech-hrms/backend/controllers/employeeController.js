
const Employee = require("../models/Employee");

exports.createEmployee = async (req, res) => {
  const employee = await Employee.create(req.body);
  res.json(employee);
};

exports.getEmployees = async (req, res) => {
  const employees = await Employee.find();
  res.json(employees);
};

exports.updateEmployee = async (req, res) => {
  const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(employee);
};

exports.deleteEmployee = async (req, res) => {
  await Employee.findByIdAndDelete(req.params.id);
  res.json({ message: "Employee deleted" });
};
