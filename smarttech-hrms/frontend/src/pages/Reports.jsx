import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout.jsx';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaFilePdf, FaPrint, FaDownload, FaChartBar, 
  FaUsers, FaCalendarCheck, FaMoneyBillWave, FaLeaf,
  FaFilter, FaSpinner, FaFileExcel, FaEye
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext.jsx';

const Reports = () => {
  const { user } = useAuth();
  const [reportType, setReportType] = useState('employees');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ 
    month: new Date().getMonth() + 1, 
    year: new Date().getFullYear(),
    startDate: '',
    endDate: '',
    status: 'all'
  });
  const [summary, setSummary] = useState(null);

  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    return {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      let url = '';
      
      switch(reportType) {
        case 'employees':
          endpoint = 'http://localhost:5000/api/reports/employees';
          url = endpoint;
          break;
        case 'attendance':
          endpoint = 'http://localhost:5000/api/reports/attendance';
          url = `${endpoint}?month=${filters.month}&year=${filters.year}`;
          if (filters.status !== 'all') url += `&status=${filters.status}`;
          break;
        case 'payroll':
          endpoint = 'http://localhost:5000/api/reports/payroll';
          url = `${endpoint}?month=${filters.month}&year=${filters.year}`;
          break;
        case 'leaves':
          endpoint = 'http://localhost:5000/api/reports/leaves';
          url = endpoint;
          if (filters.status !== 'all') url += `?status=${filters.status}`;
          if (filters.startDate) url += `${filters.status !== 'all' ? '&' : '?'}startDate=${filters.startDate}`;
          if (filters.endDate) url += `&endDate=${filters.endDate}`;
          break;
        default: return;
      }
      
      const res = await axios.get(url, getAuthConfig());
      setReportData(res.data);
      calculateSummary(res.data);
      toast.success(`Report generated successfully! Found ${res.data.length} records`);
    } catch (err) {
      console.error('Error generating report:', err);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (data) => {
    if (!data || data.length === 0) {
      setSummary(null);
      return;
    }

    let summaryData = {};
    
    switch(reportType) {
      case 'employees':
        const departments = {};
        data.forEach(emp => {
          const dept = emp.department?.name || 'Unassigned';
          departments[dept] = (departments[dept] || 0) + 1;
        });
        summaryData = {
          total: data.length,
          departments: departments,
          totalSalary: data.reduce((sum, emp) => sum + (emp.salary || 0), 0)
        };
        break;
      case 'attendance':
        summaryData = {
          total: data.length,
          present: data.filter(a => a.status === 'present').length,
          late: data.filter(a => a.status === 'late').length,
          absent: data.filter(a => a.status === 'absent').length,
          attendanceRate: data.length > 0 ? ((data.filter(a => a.status === 'present').length / data.length) * 100).toFixed(1) : 0
        };
        break;
      case 'payroll':
        summaryData = {
          total: data.length,
          totalPayroll: data.reduce((sum, p) => sum + (p.netSalary || 0), 0),
          paid: data.filter(p => p.isPaid).length,
          pending: data.filter(p => !p.isPaid).length,
          averageSalary: data.length > 0 ? data.reduce((sum, p) => sum + (p.netSalary || 0), 0) / data.length : 0
        };
        break;
      case 'leaves':
        summaryData = {
          total: data.length,
          pending: data.filter(l => l.status === 'pending').length,
          approved: data.filter(l => l.status === 'approved').length,
          rejected: data.filter(l => l.status === 'rejected').length,
          byType: {
            'Annual leave': data.filter(l => l.leaveType === 'Annual leave').length,
            'Sick leave': data.filter(l => l.leaveType === 'Sick leave').length,
            'Maternity leave': data.filter(l => l.leaveType === 'Maternity leave').length,
            'Emergency leave': data.filter(l => l.leaveType === 'Emergency leave').length
          }
        };
        break;
      default:
        summaryData = { total: data.length };
    }
    
    setSummary(summaryData);
  };

  const exportToCSV = () => {
    if (reportData.length === 0) {
      toast.warning('No data to export');
      return;
    }
    
    const columns = getColumns();
    const rows = reportData.map(item => getRowData(item));
    
    const csvContent = [columns, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported to CSV!');
  };

  const printReport = () => {
    if (reportData.length === 0) {
      toast.warning('No data to print');
      return;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${reportType.toUpperCase()} Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .company { font-size: 24px; font-weight: bold; color: #2563eb; }
            .title { font-size: 20px; margin-top: 10px; }
            .summary { display: flex; gap: 15px; justify-content: center; margin: 20px 0; flex-wrap: wrap; }
            .summary-card { padding: 10px 20px; background: #f3f4f6; border-radius: 8px; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f3f4f6; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company">SmartTech HRMS</div>
            <div class="title">${reportType.toUpperCase()} Report</div>
            <p>Generated: ${new Date().toLocaleString()}</p>
          </div>
          ${summary ? `
          <div class="summary">
            <div class="summary-card"><strong>Total Records</strong><br/>${summary.total}</div>
            ${summary.totalPayroll ? `<div class="summary-card"><strong>Total Payroll</strong><br/>$${summary.totalPayroll.toLocaleString()}</div>` : ''}
            ${summary.present ? `<div class="summary-card"><strong>Present</strong><br/>${summary.present}</div>` : ''}
            ${summary.late ? `<div class="summary-card"><strong>Late</strong><br/>${summary.late}</div>` : ''}
            ${summary.approved ? `<div class="summary-card"><strong>Approved</strong><br/>${summary.approved}</div>` : ''}
            ${summary.pending ? `<div class="summary-card"><strong>Pending</strong><br/>${summary.pending}</div>` : ''}
          </div>
          ` : ''}
          <table>
            <thead>
              <tr>${getColumns().map(col => `<th>${col}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${reportData.map(item => `
                <tr>${getRowData(item).map(cell => `<td>${cell}</td>`).join('')}</tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>This is a computer-generated report</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const exportPDF = () => {
    // For PDF, we'll use print with PDF printer
    toast.info('Click "Print" and select "Save as PDF" from printer options');
    printReport();
  };

  const getColumns = () => {
    switch(reportType) {
      case 'employees': 
        return ['Full Name', 'Email', 'Position', 'Department', 'Salary', 'Joining Date'];
      case 'attendance': 
        return ['Employee', 'Department', 'Date', 'Check In', 'Check Out', 'Hours', 'Status'];
      case 'payroll': 
        return ['Employee', 'Position', 'Month/Year', 'Basic Salary', 'Allowances', 'Deductions', 'Net Salary', 'Status'];
      case 'leaves': 
        return ['Employee', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Reason', 'Status'];
      default: 
        return [];
    }
  };

  const getRowData = (item) => {
    switch(reportType) {
      case 'employees': 
        return [
          item.fullname || 'N/A', 
          item.email || 'N/A', 
          item.position || 'N/A', 
          item.department?.name || 'N/A',
          item.salary ? `$${item.salary.toLocaleString()}` : '$0',
          item.joiningDate ? new Date(item.joiningDate).toLocaleDateString() : 'N/A'
        ];
      case 'attendance': 
        const hoursWorked = item.checkIn && item.checkOut 
          ? ((new Date(item.checkOut) - new Date(item.checkIn)) / (1000 * 60 * 60)).toFixed(1)
          : 0;
        return [
          item.employee?.fullname || 'N/A',
          item.employee?.department?.name || 'N/A',
          item.date ? new Date(item.date).toLocaleDateString() : 'N/A',
          item.checkIn ? new Date(item.checkIn).toLocaleTimeString() : '-',
          item.checkOut ? new Date(item.checkOut).toLocaleTimeString() : '-',
          hoursWorked > 0 ? `${hoursWorked}h` : '-',
          item.status || 'present'
        ];
      case 'payroll': 
        return [
          item.employee?.fullname || 'N/A',
          item.employee?.position || 'N/A',
          `${item.month}/${item.year}`,
          `$${item.basicSalary?.toLocaleString() || 0}`,
          `$${(item.overtime + item.allowances + item.bonuses)?.toLocaleString() || 0}`,
          `$${(item.taxDeductions + item.deductions)?.toLocaleString() || 0}`,
          `$${item.netSalary?.toLocaleString() || 0}`,
          item.isPaid ? 'Paid' : 'Pending'
        ];
      case 'leaves': 
        return [
          item.employee?.fullname || 'N/A',
          item.employee?.department?.name || 'N/A',
          item.leaveType || 'N/A',
          item.startDate ? new Date(item.startDate).toLocaleDateString() : 'N/A',
          item.endDate ? new Date(item.endDate).toLocaleDateString() : 'N/A',
          item.totalDays || 0,
          item.reason || 'N/A',
          item.status || 'pending'
        ];
      default: 
        return [];
    }
  };

  const getReportIcon = () => {
    switch(reportType) {
      case 'employees': return <FaUsers className="text-blue-500 text-2xl" />;
      case 'attendance': return <FaCalendarCheck className="text-green-500 text-2xl" />;
      case 'payroll': return <FaMoneyBillWave className="text-purple-500 text-2xl" />;
      case 'leaves': return <FaLeaf className="text-orange-500 text-2xl" />;
      default: return <FaChartBar className="text-gray-500 text-2xl" />;
    }
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
                Report Generator
              </h1>
              <p className="text-gray-500 text-sm mt-1">Generate and export various HR reports</p>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-xl">
              {getReportIcon()}
              <span className="text-sm font-medium text-blue-700">
                {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report
              </span>
            </div>
          </div>
        </div>

        {/* Report Controls */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
              <select 
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
                value={reportType}
                onChange={(e) => {
                  setReportType(e.target.value);
                  setReportData([]);
                  setSummary(null);
                }}
              >
                <option value="employees">📋 Employee Report</option>
                <option value="attendance">⏰ Attendance Report</option>
                <option value="payroll">💰 Payroll Report</option>
                <option value="leaves">🌿 Leave Report</option>
              </select>
            </div>
            
            {(reportType === 'attendance' || reportType === 'payroll') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                  <select 
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
                    value={filters.month}
                    onChange={(e) => setFilters({...filters, month: parseInt(e.target.value)})}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                  <select 
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
                    value={filters.year}
                    onChange={(e) => setFilters({...filters, year: parseInt(e.target.value)})}
                  >
                    <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
                    <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                    <option value={new Date().getFullYear() + 1}>{new Date().getFullYear() + 1}</option>
                  </select>
                </div>
              </>
            )}
            
            {reportType === 'leaves' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select 
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input 
                    type="date"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
                    value={filters.startDate}
                    onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input 
                    type="date"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
                    value={filters.endDate}
                    onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                  />
                </div>
              </>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3 mt-6">
            <button 
              onClick={generateReport}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <FaSpinner className="animate-spin" /> : <FaEye />}
              Generate Report
            </button>
            <button 
              onClick={exportToCSV}
              disabled={reportData.length === 0}
              className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl hover:bg-emerald-700 transition flex items-center gap-2 disabled:opacity-50"
            >
              <FaFileExcel /> Export CSV
            </button>
            <button 
              onClick={exportPDF}
              disabled={reportData.length === 0}
              className="bg-red-600 text-white px-6 py-2.5 rounded-xl hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50"
            >
              <FaFilePdf /> Export PDF
            </button>
            <button 
              onClick={printReport}
              disabled={reportData.length === 0}
              className="bg-purple-600 text-white px-6 py-2.5 rounded-xl hover:bg-purple-700 transition flex items-center gap-2 disabled:opacity-50"
            >
              <FaPrint /> Print
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && reportData.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4">
              <p className="text-blue-600 text-sm">Total Records</p>
              <p className="text-2xl font-bold text-blue-700">{summary.total}</p>
            </div>
            {summary.totalPayroll !== undefined && (
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-4">
                <p className="text-emerald-600 text-sm">Total Payroll</p>
                <p className="text-2xl font-bold text-emerald-700">${summary.totalPayroll.toLocaleString()}</p>
              </div>
            )}
            {summary.present !== undefined && (
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-4">
                <p className="text-emerald-600 text-sm">Present</p>
                <p className="text-2xl font-bold text-emerald-700">{summary.present}</p>
              </div>
            )}
            {summary.late !== undefined && (
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-4">
                <p className="text-amber-600 text-sm">Late</p>
                <p className="text-2xl font-bold text-amber-700">{summary.late}</p>
              </div>
            )}
            {summary.approved !== undefined && (
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4">
                <p className="text-green-600 text-sm">Approved</p>
                <p className="text-2xl font-bold text-green-700">{summary.approved}</p>
              </div>
            )}
            {summary.pending !== undefined && (
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-4">
                <p className="text-yellow-600 text-sm">Pending</p>
                <p className="text-2xl font-bold text-yellow-700">{summary.pending}</p>
              </div>
            )}
            {summary.attendanceRate !== undefined && (
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4">
                <p className="text-purple-600 text-sm">Attendance Rate</p>
                <p className="text-2xl font-bold text-purple-700">{summary.attendanceRate}%</p>
              </div>
            )}
          </div>
        )}

        {/* Report Table */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <FaSpinner className="animate-spin text-5xl text-blue-500 mx-auto mb-4" />
            <p className="text-gray-500">Generating report...</p>
          </div>
        ) : reportData.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report
                  </h2>
                  <p className="text-sm text-gray-500">Showing {reportData.length} records</p>
                </div>
                <div className="text-sm text-gray-400">
                  Generated: {new Date().toLocaleString()}
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {getColumns().map((col, idx) => (
                      <th key={idx} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition">
                      {getRowData(item).map((cell, cellIdx) => (
                        <td key={cellIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <FaChartBar className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Report Generated</h3>
            <p className="text-gray-500">Select report type and click "Generate Report" to view data</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Reports;