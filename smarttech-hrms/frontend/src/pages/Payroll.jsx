import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaDownload, FaMoneyBillWave, FaChartLine, FaFilter, FaPrint, FaPlus, FaUndo } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext.jsx';

const Payroll = () => {
  const { user } = useAuth();
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Get current date - FORCE to use current date
  const currentDate = new Date();
  const currentMonthNumber = currentDate.getMonth() + 1;
  const currentYearNumber = currentDate.getFullYear();
  
  const [selectedMonth, setSelectedMonth] = useState(currentMonthNumber);
  const [selectedYear, setSelectedYear] = useState(currentYearNumber);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [summary, setSummary] = useState({
    totalEmployees: 0,
    totalPayroll: 0,
    averageSalary: 0,
    paidCount: 0,
    pendingCount: 0
  });
  
  const [formData, setFormData] = useState({
    employeeId: '',
    month: currentMonthNumber,
    year: currentYearNumber,
    overtime: 0,
    allowances: 0,
    bonuses: 0,
    deductions: 0
  });

  // Force reset to current date on mount
  useEffect(() => {
    console.log('Component mounted - Current date:', currentMonthNumber, currentYearNumber);
    setSelectedMonth(currentMonthNumber);
    setSelectedYear(currentYearNumber);
  }, []);

  useEffect(() => {
    fetchPayrolls();
    if (user?.role !== 'employee') {
      fetchEmployees();
      fetchSummary();
    }
  }, []);

  useEffect(() => {
    if (user?.role !== 'employee') {
      fetchSummary();
      fetchPayrolls();
    }
  }, [selectedMonth, selectedYear, selectedEmployee]);

  const resetFilters = () => {
    const newMonth = new Date().getMonth() + 1;
    const newYear = new Date().getFullYear();
    console.log('Resetting filters to:', newMonth, newYear);
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
    setSelectedEmployee('');
    toast.info(`Filters reset to ${getMonthName(newMonth)} ${newYear}`);
  };

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      let url = 'http://localhost:5000/api/payroll';
      const params = [];
      
      if (selectedEmployee) {
        params.push(`employeeId=${selectedEmployee}`);
      }
      if (selectedMonth) {
        params.push(`month=${selectedMonth}`);
      }
      if (selectedYear) {
        params.push(`year=${selectedYear}`);
      }
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      
      console.log('Fetching from URL:', url);
      console.log('Selected Month/Year:', selectedMonth, selectedYear);
      
      const res = await axios.get(url);
      console.log('Payroll records found:', res.data.length);
      setPayrolls(res.data);
    } catch (err) {
      console.error('Failed to fetch payroll records:', err);
      toast.error('Failed to fetch payroll records');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch employees');
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/payroll/summary/overview', {
        params: { month: selectedMonth, year: selectedYear }
      });
      console.log('Summary for', selectedMonth, selectedYear, ':', res.data);
      setSummary(res.data);
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    
    if (!formData.employeeId) {
      toast.error('Please select an employee');
      return;
    }
    
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/payroll/calculate', formData);
      toast.success('Payroll calculated successfully!');
      setShowModal(false);
      resetForm();
      fetchPayrolls();
      fetchSummary();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Calculation failed';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (payrollId) => {
    try {
      await axios.put(`http://localhost:5000/api/payroll/${payrollId}/paid`);
      toast.success('Payroll marked as paid');
      fetchPayrolls();
      fetchSummary();
    } catch (err) {
      toast.error('Failed to update payment status');
    }
  };

  const generatePDF = (payroll) => {
    try {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Payslip - ${payroll.employee?.fullname}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; }
              .header { text-align: center; margin-bottom: 30px; }
              .company { font-size: 24px; font-weight: bold; color: #2563eb; }
              .title { font-size: 18px; margin-top: 10px; }
              .payslip { border: 1px solid #ddd; padding: 20px; margin-top: 20px; }
              .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
              .label { font-weight: bold; }
              .total { font-size: 18px; font-weight: bold; color: #16a34a; margin-top: 20px; padding-top: 10px; border-top: 2px solid #ddd; }
              .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="company">SmartTech HRMS</div>
              <div class="title">Salary Payslip</div>
            </div>
            <div class="payslip">
              <div class="row">
                <span class="label">Employee Name:</span>
                <span>${payroll.employee?.fullname || 'N/A'}</span>
              </div>
              <div class="row">
                <span class="label">Position:</span>
                <span>${payroll.employee?.position || 'N/A'}</span>
              </div>
              <div class="row">
                <span class="label">Month/Year:</span>
                <span>${getMonthName(payroll.month)} ${payroll.year}</span>
              </div>
              <div class="row">
                <span class="label">Basic Salary:</span>
                <span>$${payroll.basicSalary?.toLocaleString() || 0}</span>
              </div>
              <div class="row">
                <span class="label">Overtime:</span>
                <span>$${payroll.overtime?.toLocaleString() || 0}</span>
              </div>
              <div class="row">
                <span class="label">Allowances:</span>
                <span>$${payroll.allowances?.toLocaleString() || 0}</span>
              </div>
              <div class="row">
                <span class="label">Bonuses:</span>
                <span>$${payroll.bonuses?.toLocaleString() || 0}</span>
              </div>
              <div class="row">
                <span class="label">Tax Deductions (10%):</span>
                <span>$${payroll.taxDeductions?.toLocaleString() || 0}</span>
              </div>
              <div class="row">
                <span class="label">Other Deductions:</span>
                <span>$${payroll.deductions?.toLocaleString() || 0}</span>
              </div>
              <div class="total">
                <div class="row">
                  <span>Net Salary:</span>
                  <span>$${payroll.netSalary?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>
            <div class="footer">
              <p>This is a computer-generated document. No signature required.</p>
              <p>Generated on: ${new Date().toLocaleString()}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    } catch (err) {
      toast.error('Failed to generate PDF');
    }
  };

  const resetForm = () => {
    const currentDate = new Date();
    setFormData({
      employeeId: '',
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
      overtime: 0,
      allowances: 0,
      bonuses: 0,
      deductions: 0
    });
  };

  const getMonthName = (month) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
  };

  const handlePrintReport = () => {
    if (payrolls.length === 0) {
      toast.warning('No data to print');
      return;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Payroll Report - ${getMonthName(selectedMonth)} ${selectedYear}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .company { font-size: 24px; font-weight: bold; color: #2563eb; }
            .title { font-size: 18px; margin-top: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f3f4f6; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company">SmartTech HRMS</div>
            <div class="title">Payroll Report - ${getMonthName(selectedMonth)} ${selectedYear}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Position</th>
                <th>Basic Salary</th>
                <th>Net Salary</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${payrolls.map(pay => `
                <tr>
                  <td>${pay.employee?.fullname || 'N/A'}</td>
                  <td>${pay.employee?.position || 'N/A'}</td>
                  <td>$${pay.basicSalary?.toLocaleString() || 0}</td>
                  <td>$${pay.netSalary?.toLocaleString() || 0}</td>
                  <td>${pay.isPaid ? 'Paid' : 'Pending'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>Total Employees: ${summary.totalEmployees}</p>
            <p>Total Payroll: $${summary.totalPayroll?.toLocaleString()}</p>
            <p>Average Salary: $${summary.averageSalary?.toLocaleString()}</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const NoDataMessage = () => (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">💰</div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">No Payroll Records Found</h3>
      <p className="text-gray-500 mb-4">
        No payroll data available for {getMonthName(selectedMonth)} {selectedYear}.
      </p>
      <p className="text-sm text-gray-400 mb-4">
        Current date is: {getMonthName(currentMonthNumber)} {currentYearNumber}
      </p>
      {user?.role !== 'employee' && (
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition inline-flex items-center gap-2"
        >
          <FaPlus /> Calculate Payroll for {getMonthName(selectedMonth)} {selectedYear}
        </button>
      )}
    </div>
  );

  const availableYears = [2023, 2024, 2025, 2026, currentYearNumber];

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Payroll Management</h1>
            <p className="text-gray-500 text-sm mt-1">Manage employee salaries and payment records</p>
          </div>
          {user?.role !== 'employee' && (
            <button 
              onClick={() => setShowModal(true)} 
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-md"
            >
              <FaMoneyBillWave /> Calculate Payroll
            </button>
          )}
        </div>

        {/* Statistics Cards */}
        {user?.role !== 'employee' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
              <p className="text-sm text-gray-500">Total Employees</p>
              <p className="text-2xl font-bold">{summary.totalEmployees}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
              <p className="text-sm text-gray-500">Total Payroll</p>
              <p className="text-2xl font-bold">${summary.totalPayroll?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
              <p className="text-sm text-gray-500">Average Salary</p>
              <p className="text-2xl font-bold">${summary.averageSalary?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-500">
              <p className="text-sm text-gray-500">Payment Status</p>
              <p className="text-2xl font-bold">
                <span className="text-green-600">{summary.paidCount}</span>
                <span className="text-gray-400 text-sm"> / </span>
                <span className="text-yellow-600">{summary.pendingCount}</span>
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        {user?.role !== 'employee' && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                <select 
                  className="w-full border rounded-lg px-3 py-2"
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                >
                  <option value="">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.fullname}</option>
                  ))}
                </select>
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <select 
                  className="w-full border rounded-lg px-3 py-2"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                >
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                    <option key={m} value={m}>{getMonthName(m)}</option>
                  ))}
                </select>
              </div>
              <div className="w-24">
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <select 
                  className="w-full border rounded-lg px-3 py-2"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                >
                  {availableYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <button 
                  onClick={fetchPayrolls}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
                >
                  <FaFilter /> Apply Filters
                </button>
              </div>
              <div>
                <button 
                  onClick={resetFilters}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <FaUndo /> Reset to Current Month
                </button>
              </div>
              <div>
                <button 
                  onClick={handlePrintReport}
                  disabled={payrolls.length === 0}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaPrint /> Print Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payroll Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : payrolls.length === 0 ? (
            <NoDataMessage />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month/Year</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Basic Salary</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Allowances</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deductions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Salary</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payrolls.map(pay => (
                    <tr key={pay._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-medium text-gray-900">{pay.employee?.fullname || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-600">{pay.employee?.position || 'N/A'}</td>
                      <td className="px-6 py-4">{getMonthName(pay.month)} {pay.year}</td>
                      <td className="px-6 py-4 text-green-600 font-medium">${pay.basicSalary?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-blue-600">${(pay.overtime + pay.allowances + pay.bonuses).toLocaleString()}</td>
                      <td className="px-6 py-4 text-red-600">${(pay.taxDeductions + pay.deductions).toLocaleString()}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">${pay.netSalary?.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        {user?.role !== 'employee' ? (
                          <button
                            onClick={() => handleMarkAsPaid(pay._id)}
                            disabled={pay.isPaid}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                              pay.isPaid 
                                ? 'bg-green-100 text-green-800 cursor-default' 
                                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 cursor-pointer'
                            }`}
                          >
                            {pay.isPaid ? 'Paid' : 'Mark as Paid'}
                          </button>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            pay.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {pay.isPaid ? 'Paid' : 'Pending'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => generatePDF(pay)} 
                          className="text-blue-600 hover:text-blue-800 transition flex items-center gap-1"
                          title="Download Payslip"
                        >
                          <FaDownload /> PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        

        {/* Payroll Calculation Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b px-6 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Calculate Employee Payroll</h2>
                    <p className="text-sm text-gray-500 mt-1">Enter salary components for the selected employee</p>
                  </div>
                  <button 
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              {/* Modal Body - Form */}
              <form onSubmit={handleCalculate}>
                <div className="p-6 space-y-6">
                  
                  {/* Employee Selection */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Select Employee <span className="text-red-500">*</span>
                    </label>
                    <select 
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      value={formData.employeeId} 
                      onChange={(e) => setFormData({...formData, employeeId: e.target.value})} 
                      required
                    >
                      <option value="">-- Choose an employee --</option>
                      {employees.map(emp => (
                        <option key={emp._id} value={emp._id}>
                          {emp.fullname} - {emp.position} (${emp.salary?.toLocaleString()})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-2">Select the employee for payroll calculation</p>
                  </div>
                  
                  {/* Period Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Month <span className="text-red-500">*</span>
                      </label>
                      <select 
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.month} 
                        onChange={(e) => setFormData({...formData, month: parseInt(e.target.value)})} 
                        required
                      >
                        <option value="1">January</option>
                        <option value="2">February</option>
                        <option value="3">March</option>
                        <option value="4">April</option>
                        <option value="5">May</option>
                        <option value="6">June</option>
                        <option value="7">July</option>
                        <option value="8">August</option>
                        <option value="9">September</option>
                        <option value="10">October</option>
                        <option value="11">November</option>
                        <option value="12">December</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Year <span className="text-red-500">*</span>
                      </label>
                      <select 
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.year} 
                        onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})} 
                        required
                      >
                        {availableYears.map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* Salary Components - Earnings Section */}
                  <div className="border-2 border-green-200 rounded-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-5 py-3 border-b border-green-200">
                      <h3 className="font-semibold text-green-800 text-lg flex items-center gap-2">
                        <span>💰</span> Earnings (Additions)
                      </h3>
                    </div>
                    <div className="p-5 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Overtime Pay
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                          <input 
                            type="number" 
                            min="0"
                            step="100"
                            className="w-full pl-8 border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500" 
                            placeholder="0.00" 
                            value={formData.overtime} 
                            onChange={(e) => setFormData({...formData, overtime: Number(e.target.value)})} 
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Extra hours worked beyond regular schedule</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Allowances
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                          <input 
                            type="number" 
                            min="0"
                            step="100"
                            className="w-full pl-8 border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500" 
                            placeholder="0.00" 
                            value={formData.allowances} 
                            onChange={(e) => setFormData({...formData, allowances: Number(e.target.value)})} 
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">House rent, travel, medical allowances</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bonuses
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                          <input 
                            type="number" 
                            min="0"
                            step="100"
                            className="w-full pl-8 border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500" 
                            placeholder="0.00" 
                            value={formData.bonuses} 
                            onChange={(e) => setFormData({...formData, bonuses: Number(e.target.value)})} 
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Performance bonus, festival bonus, etc.</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Salary Components - Deductions Section */}
                  <div className="border-2 border-red-200 rounded-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-red-50 to-rose-50 px-5 py-3 border-b border-red-200">
                      <h3 className="font-semibold text-red-800 text-lg flex items-center gap-2">
                        <span>📉</span> Deductions (Subtractions)
                      </h3>
                    </div>
                    <div className="p-5">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Other Deductions
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                        <input 
                          type="number" 
                          min="0"
                          step="100"
                          className="w-full pl-8 border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500" 
                          placeholder="0.00" 
                          value={formData.deductions} 
                          onChange={(e) => setFormData({...formData, deductions: Number(e.target.value)})} 
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Loan payments, advance deductions, etc.</p>
                    </div>
                  </div>
                  
                  {/* Info Box */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2">
                      <FaChartLine className="text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-blue-800 mb-1">Salary Calculation Formula:</p>
                        <p className="text-xs text-blue-700">
                          Basic Salary + Overtime + Allowances + Bonuses - (10% Tax) - Other Deductions = Net Salary
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Modal Footer - Actions */}
                <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }} 
                    className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <span>💰</span> Calculate & Save
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Payroll;