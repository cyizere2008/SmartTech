import React, { useState } from 'react';
import Layout from '../components/Layout.jsx';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaFilePdf, FaPrint } from 'react-icons/fa';

const Reports = () => {
  const [reportType, setReportType] = useState('employees');
  const [reportData, setReportData] = useState([]);
  const [filters, setFilters] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });

  const generateReport = async () => {
    try {
      let endpoint = '';
      switch(reportType) {
        case 'employees': endpoint = 'http://localhost:5000/api/reports/employees'; break;
        case 'attendance': endpoint = `http://localhost:5000/api/reports/attendance?month=${filters.month}&year=${filters.year}`; break;
        case 'payroll': endpoint = `http://localhost:5000/api/reports/payroll?month=${filters.month}&year=${filters.year}`; break;
        case 'leaves': endpoint = 'http://localhost:5000/api/reports/leaves'; break;
        default: return;
      }
      const res = await axios.get(endpoint);
      setReportData(res.data);
      toast.success('Report generated');
    } catch (err) {
      toast.error('Failed to generate report');
    }
  };

  const printReport = () => {
    window.print();
  };

  const exportPDF = () => {
    toast.info('PDF export - implement with jspdf');
  };

  const getColumns = () => {
    switch(reportType) {
      case 'employees': return ['Full Name', 'Email', 'Position', 'Department', 'Joining Date'];
      case 'attendance': return ['Employee', 'Date', 'Check In', 'Check Out', 'Status'];
      case 'payroll': return ['Employee', 'Month/Year', 'Basic Salary', 'Net Salary', 'Status'];
      case 'leaves': return ['Employee', 'Leave Type', 'Start Date', 'End Date', 'Status'];
      default: return [];
    }
  };

  const getRowData = (item) => {
    switch(reportType) {
      case 'employees': return [item.fullname, item.email, item.position, item.department?.name, item.joiningDate ? new Date(item.joiningDate).toLocaleDateString() : 'N/A'];
      case 'attendance': return [item.employee?.fullname, item.date ? new Date(item.date).toLocaleDateString() : 'N/A', item.checkIn ? new Date(item.checkIn).toLocaleTimeString() : '-', item.checkOut ? new Date(item.checkOut).toLocaleTimeString() : '-', item.status];
      case 'payroll': return [item.employee?.fullname, `${item.month}/${item.year}`, `$${item.basicSalary}`, `$${item.netSalary}`, item.isPaid ? 'Paid' : 'Pending'];
      case 'leaves': return [item.employee?.fullname, item.leaveType, item.startDate ? new Date(item.startDate).toLocaleDateString() : 'N/A', item.endDate ? new Date(item.endDate).toLocaleDateString() : 'N/A', item.status];
      default: return [];
    }
  };

  return React.createElement(Layout, null,
    React.createElement('div', { className: "p-6 print:p-0" },
      React.createElement('div', { className: "bg-white rounded-lg shadow-md p-6 mb-6 print:hidden" },
        React.createElement('h1', { className: "text-2xl font-bold mb-4" }, "Report Generator"),
        React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-3 gap-4" },
          React.createElement('select', { className: "border rounded-lg px-3 py-2", value: reportType, onChange: (e) => setReportType(e.target.value) },
            React.createElement('option', { value: "employees" }, "Employee Report"),
            React.createElement('option', { value: "attendance" }, "Attendance Report"),
            React.createElement('option', { value: "payroll" }, "Payroll Report"),
            React.createElement('option', { value: "leaves" }, "Leave Report")
          ),
          (reportType === 'attendance' || reportType === 'payroll') && React.createElement('input', { type: "number", placeholder: "Month", className: "border rounded-lg px-3 py-2", value: filters.month, onChange: (e) => setFilters({...filters, month: e.target.value}) }),
          (reportType === 'attendance' || reportType === 'payroll') && React.createElement('input', { type: "number", placeholder: "Year", className: "border rounded-lg px-3 py-2", value: filters.year, onChange: (e) => setFilters({...filters, year: e.target.value}) })
        ),
        React.createElement('div', { className: "flex gap-3 mt-4" },
          React.createElement('button', { onClick: generateReport, className: "bg-blue-600 text-white px-6 py-2 rounded-lg" }, "Generate Report"),
          React.createElement('button', { onClick: exportPDF, className: "bg-red-600 text-white px-6 py-2 rounded-lg flex items-center gap-2" }, React.createElement(FaFilePdf, null), " Export PDF"),
          React.createElement('button', { onClick: printReport, className: "bg-gray-600 text-white px-6 py-2 rounded-lg flex items-center gap-2" }, React.createElement(FaPrint, null), " Print")
        )
      ),
      reportData.length > 0 && React.createElement('div', { className: "bg-white rounded-lg shadow-md overflow-hidden" },
        React.createElement('div', { className: "p-4 bg-gray-50 border-b print:block hidden" },
          React.createElement('h2', { className: "text-xl font-bold" }, "SmartTech HRMS - ", reportType.toUpperCase(), " Report"),
          React.createElement('p', null, "Generated: ", new Date().toLocaleString())
        ),
        React.createElement('div', { className: "overflow-x-auto" },
          React.createElement('table', { className: "min-w-full divide-y divide-gray-200" },
            React.createElement('thead', { className: "bg-gray-50" },
              React.createElement('tr', null,
                getColumns().map((col, idx) => React.createElement('th', { key: idx, className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" }, col))
              )
            ),
            React.createElement('tbody', { className: "bg-white divide-y divide-gray-200" },
              reportData.map((item, idx) => React.createElement('tr', { key: idx },
                getRowData(item).map((cell, cellIdx) => React.createElement('td', { key: cellIdx, className: "px-6 py-4" }, cell))
              ))
            )
          )
        )
      )
    )
  );
};

export default Reports;