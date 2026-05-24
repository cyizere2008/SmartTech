import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout.jsx';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaSearch, FaUsers, FaCalendarAlt, FaChartLine, FaDownload, 
  FaFilter, FaEye, FaSpinner, FaUserCheck, FaClock, FaPrint,
  FaFileExcel, FaBuilding, FaHistory, FaTrophy, FaAward
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext.jsx';

const HRAttendance = () => {
  const { user } = useAuth();
  const [attendances, setAttendances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [summary, setSummary] = useState({
    totalEmployees: 0,
    totalPresent: 0,
    totalLate: 0,
    totalAbsent: 0,
    attendanceRate: 0
  });

  useEffect(() => {
    fetchAllAttendance();
    fetchEmployees();
    fetchDepartments();
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchAllAttendance();
    fetchSummary();
  }, [selectedEmployee, selectedDepartment, selectedDate]);

  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    return {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  const fetchAllAttendance = async () => {
    setLoading(true);
    try {
      let url = 'http://localhost:5000/api/attendance/hr/all';
      const params = [];
      if (selectedEmployee) params.push(`employeeId=${selectedEmployee}`);
      if (selectedDepartment) params.push(`department=${selectedDepartment}`);
      if (selectedDate) params.push(`date=${selectedDate}`);
      
      if (params.length > 0) url += `?${params.join('&')}`;
      
      const res = await axios.get(url, getAuthConfig());
      setAttendances(res.data);
    } catch (err) {
      console.error('Error fetching attendance:', err);
      toast.error('Failed to fetch attendance records');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/employees', getAuthConfig());
      setEmployees(res.data);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/departments', getAuthConfig());
      setDepartments(res.data);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const fetchSummary = async () => {
    try {
      let url = 'http://localhost:5000/api/attendance/hr/summary';
      const params = [];
      if (selectedDepartment) params.push(`department=${selectedDepartment}`);
      if (selectedDate) params.push(`date=${selectedDate}`);
      
      if (params.length > 0) url += `?${params.join('&')}`;
      
      const res = await axios.get(url, getAuthConfig());
      setSummary(res.data);
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  };

  const formatTime = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadge = (status) => {
    const badges = {
      present: 'bg-emerald-100 text-emerald-800',
      late: 'bg-amber-100 text-amber-800',
      absent: 'bg-rose-100 text-rose-800',
      'half-day': 'bg-orange-100 text-orange-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const exportToCSV = () => {
    const headers = ['Employee', 'Department', 'Date', 'Check In', 'Check Out', 'Status', 'Late Minutes'];
    const rows = attendances.map(a => [
      a.employee?.fullname || 'N/A',
      a.employee?.department?.name || 'N/A',
      formatDate(a.date),
      formatTime(a.checkIn),
      formatTime(a.checkOut),
      a.status,
      a.lateMinutes || 0
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported successfully!');
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Attendance Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .company { font-size: 24px; font-weight: bold; color: #2563eb; }
            .title { font-size: 18px; margin-top: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f3f4f6; }
            .summary { margin-top: 20px; display: flex; gap: 20px; justify-content: space-around; flex-wrap: wrap; }
            .summary-card { padding: 10px; background: #f3f4f6; border-radius: 8px; text-align: center; min-width: 120px; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company">SmartTech HRMS</div>
            <div class="title">Attendance Report</div>
            <p>Generated: ${new Date().toLocaleString()}</p>
          </div>
          <div class="summary">
            <div class="summary-card"><strong>Total Employees</strong><br/>${summary.totalEmployees}</div>
            <div class="summary-card"><strong>Present</strong><br/>${summary.totalPresent}</div>
            <div class="summary-card"><strong>Late</strong><br/>${summary.totalLate}</div>
            <div class="summary-card"><strong>Absent</strong><br/>${summary.totalAbsent}</div>
            <div class="summary-card"><strong>Rate</strong><br/>${summary.attendanceRate}%</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${attendances.map(a => `
                <tr>
                  <td>${a.employee?.fullname || 'N/A'}</td>
                  <td>${a.employee?.department?.name || 'N/A'}</td>
                  <td>${formatDate(a.date)}</td>
                  <td>${formatTime(a.checkIn)}</td>
                  <td>${formatTime(a.checkOut)}</td>
                  <td>${a.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer"><p>This is a computer-generated report</p></div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const getRateColor = (rate) => {
    if (rate >= 90) return 'text-emerald-600';
    if (rate >= 75) return 'text-blue-600';
    if (rate >= 60) return 'text-amber-600';
    return 'text-rose-600';
  };

  if (!user || user?.role === 'employee') {
    return <Layout>Access Denied</Layout>;
  }

  return (
    <Layout>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Attendance Overview
              </h1>
              <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                <FaHistory className="text-gray-400" size={12} />
                Monitor all employee attendance records
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={exportToCSV} className="bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition flex items-center gap-2">
                <FaFileExcel /> Export CSV
              </button>
              <button onClick={printReport} className="bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition flex items-center gap-2">
                <FaPrint /> Print
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 shadow-sm">
            <p className="text-blue-600 text-sm">Total Employees</p>
            <p className="text-2xl font-bold text-blue-700">{summary.totalEmployees}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-4 shadow-sm">
            <p className="text-emerald-600 text-sm">Present Today</p>
            <p className="text-2xl font-bold text-emerald-700">{summary.totalPresent}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-4 shadow-sm">
            <p className="text-amber-600 text-sm">Late Arrivals</p>
            <p className="text-2xl font-bold text-amber-700">{summary.totalLate}</p>
          </div>
          <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-2xl p-4 shadow-sm">
            <p className="text-rose-600 text-sm">Absent</p>
            <p className="text-2xl font-bold text-rose-700">{summary.totalAbsent}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 shadow-sm">
            <p className="text-purple-600 text-sm">Attendance Rate</p>
            <p className={`text-2xl font-bold ${getRateColor(summary.attendanceRate)}`}>{summary.attendanceRate}%</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-5 mb-8">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
              <select 
                className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
              >
                <option value="">All Employees</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>{emp.fullname}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select 
                className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept._id} value={dept._id}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div className="w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input 
                type="date" 
                className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <button 
              onClick={fetchAllAttendance}
              className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-2"
            >
              <FaFilter /> Apply Filters
            </button>
            <button 
              onClick={() => {
                setSelectedEmployee('');
                setSelectedDepartment('');
                setSelectedDate('');
              }}
              className="bg-gray-600 text-white px-6 py-2 rounded-xl hover:bg-gray-700 flex items-center gap-2"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800">Attendance Records</h2>
            <p className="text-sm text-gray-500">Showing {attendances.length} records</p>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <FaSpinner className="animate-spin text-4xl text-blue-500" />
            </div>
          ) : attendances.length === 0 ? (
            <div className="text-center py-16">
              <FaUsers className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No attendance records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendances.map((att) => {
                    const hoursWorked = att.checkIn && att.checkOut 
                      ? ((new Date(att.checkOut) - new Date(att.checkIn)) / (1000 * 60 * 60)).toFixed(1)
                      : 0;
                    return (
                      <tr key={att._id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{att.employee?.fullname || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{att.employee?.department?.name || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{formatDate(att.date)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {att.checkIn ? (
                            <span className="text-emerald-600 font-medium">{formatTime(att.checkIn)}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {att.checkOut ? (
                            <span className="text-blue-600 font-medium">{formatTime(att.checkOut)}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {hoursWorked > 0 ? (
                            <span className="text-purple-600 font-medium">{hoursWorked}h</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(att.status)}`}>
                            {att.status || 'present'}
                          </span>
                          {att.lateMinutes > 0 && (
                            <span className="ml-1 text-xs text-amber-600">(+{att.lateMinutes})</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default HRAttendance;