import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaLeaf, FaCalendarAlt, FaClock, FaUser, 
  FaTimes, FaSpinner, FaDownload, FaPrint,
  FaCheckCircle, FaBan, FaHourglassHalf
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext.jsx';

const Leaves = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    leaveType: 'Annual leave',
    startDate: '',
    endDate: '',
    reason: ''
  });

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const endpoint = user?.role === 'employee' 
        ? 'http://localhost:5000/api/leaves/my-leaves' 
        : 'http://localhost:5000/api/leaves';
      const res = await axios.get(endpoint);
      setLeaves(res.data);
    } catch (err) {
      toast.error('Failed to fetch leaves');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/leaves', formData);
      console.log('Response:', response.data);
      
      if (response.data.success) {
        toast.success('Leave request submitted successfully!');
        setShowModal(false);
        setFormData({ leaveType: 'Annual leave', startDate: '', endDate: '', reason: '' });
        fetchLeaves();
      } else {
        toast.error(response.data.message || 'Failed to submit request');
      }
    } catch (err) {
      console.error('Error details:', err.response?.data);
      const errorMsg = err.response?.data?.message || 'Failed to submit request';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id, status) => {
    setLoading(true);
    try {
      await axios.put(`http://localhost:5000/api/leaves/${id}`, { status });
      toast.success(`Leave ${status}`);
      fetchLeaves();
    } catch (err) {
      toast.error('Failed to update');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-amber-50 text-amber-700 border border-amber-200', icon: FaHourglassHalf },
      approved: { color: 'bg-emerald-50 text-emerald-700 border border-emerald-200', icon: FaCheckCircle },
      rejected: { color: 'bg-rose-50 text-rose-700 border border-rose-200', icon: FaBan }
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${badge.color}`}>
        <Icon size={10} />
        {status}
      </span>
    );
  };

  const getLeaveTypeIcon = (type) => {
    const icons = {
      'Annual leave': '🏖️',
      'Sick leave': '🤒',
      'Maternity leave': '👶',
      'Emergency leave': '🚨'
    };
    return icons[type] || '📋';
  };

  const filteredLeaves = filterStatus === 'all' 
    ? leaves 
    : leaves.filter(leave => leave.status === filterStatus);

  const stats = {
    total: leaves.length,
    pending: leaves.filter(l => l.status === 'pending').length,
    approved: leaves.filter(l => l.status === 'approved').length,
    rejected: leaves.filter(l => l.status === 'rejected').length
  };

  const exportToCSV = () => {
    const headers = ['Employee', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Reason', 'Status'];
    const rows = leaves.map(leave => [
      leave.employee?.fullname || 'N/A',
      leave.leaveType,
      new Date(leave.startDate).toLocaleDateString(),
      new Date(leave.endDate).toLocaleDateString(),
      leave.totalDays || 0,
      leave.reason,
      leave.status
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leaves_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Leaves exported successfully!');
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Leave Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .company { font-size: 24px; font-weight: bold; color: #2563eb; }
            .title { font-size: 18px; margin-top: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f3f4f6; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company">SmartTech HRMS</div>
            <div class="title">Leave Report</div>
            <p>Generated: ${new Date().toLocaleString()}</p>
          </div>
          <div style="margin-bottom: 20px;">
            <p><strong>Total Requests:</strong> ${stats.total}</p>
            <p><strong>Pending:</strong> ${stats.pending}</p>
            <p><strong>Approved:</strong> ${stats.approved}</p>
            <p><strong>Rejected:</strong> ${stats.rejected}</p>
          </div>
          <table>
            <thead>
              <tr><th>Employee</th><th>Leave Type</th><th>Start Date</th><th>End Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${leaves.map(leave => `
                <tr>
                  <td>${leave.employee?.fullname || 'N/A'}</td>
                  <td>${leave.leaveType}</td>
                  <td>${new Date(leave.startDate).toLocaleDateString()}</td>
                  <td>${new Date(leave.endDate).toLocaleDateString()}</td>
                  <td>${leave.status}</td>
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

  return (
    <Layout>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                Leave Management
              </h1>
              <p className="text-gray-500 text-sm mt-1">Manage and track employee leave requests</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={exportToCSV}
                disabled={leaves.length === 0}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <FaDownload /> Export
              </button>
              <button 
                onClick={printReport}
                disabled={leaves.length === 0}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <FaPrint /> Print
              </button>
              {user?.role === 'employee' && (
                <button 
                  onClick={() => setShowModal(true)} 
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
                >
                  <FaLeaf /> Apply for Leave
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Requests</p>
                <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <FaLeaf className="text-gray-600 text-xl" />
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Pending</p>
                <p className="text-3xl font-bold text-gray-800">{stats.pending}</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <FaHourglassHalf className="text-gray-600 text-xl" />
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Approved</p>
                <p className="text-3xl font-bold text-gray-800">{stats.approved}</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <FaCheckCircle className="text-gray-600 text-xl" />
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Rejected</p>
                <p className="text-3xl font-bold text-gray-800">{stats.rejected}</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <FaBan className="text-gray-600 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-8">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm ${
                  filterStatus === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FaLeaf size={14} /> All
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm ${
                  filterStatus === 'pending' 
                    ? 'bg-amber-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FaHourglassHalf size={14} /> Pending
              </button>
              <button
                onClick={() => setFilterStatus('approved')}
                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm ${
                  filterStatus === 'approved' 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FaCheckCircle size={14} /> Approved
              </button>
              <button
                onClick={() => setFilterStatus('rejected')}
                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm ${
                  filterStatus === 'rejected' 
                    ? 'bg-rose-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FaBan size={14} /> Rejected
              </button>
            </div>
            <div className="text-sm text-gray-500">
              Showing {filteredLeaves.length} of {leaves.length} requests
            </div>
          </div>
        </div>

        {/* Leave Table */}
        {loading ? (
          <div className="flex justify-center items-center py-20 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
              <FaLeaf className="text-3xl text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Leave Requests Found</h3>
            <p className="text-gray-500">
              {user?.role === 'employee' 
                ? 'Click "Apply for Leave" to submit your first request' 
                : 'No leave requests have been submitted yet'}
            </p>
            {user?.role === 'employee' && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 mx-auto"
              >
                <FaLeaf /> Apply for Leave
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    {user?.role !== 'employee' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLeaves.map((leave) => {
                    const startDate = new Date(leave.startDate);
                    const endDate = new Date(leave.endDate);
                    const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
                    
                    return (
                      <tr key={leave._id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm">
                              {leave.employee?.fullname?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{leave.employee?.fullname || 'N/A'}</div>
                              <div className="text-xs text-gray-500">{leave.employee?.position || 'Employee'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getLeaveTypeIcon(leave.leaveType)}</span>
                            <span className="text-sm text-gray-900">{leave.leaveType}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">{diffDays} day{diffDays !== 1 ? 's' : ''}</div>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <div className="text-sm text-gray-600 max-w-xs truncate" title={leave.reason}>
                            {leave.reason || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(leave.status)}
                        </td>
                        {user?.role !== 'employee' && leave.status === 'pending' && (
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleReview(leave._id, 'approved')}
                                className="bg-emerald-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-emerald-700 transition flex items-center gap-1"
                              >
                                <FaCheckCircle size={12} /> Approve
                              </button>
                              <button
                                onClick={() => handleReview(leave._id, 'rejected')}
                                className="bg-rose-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-rose-700 transition flex items-center gap-1"
                              >
                                <FaBan size={12} /> Reject
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Apply for Leave Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Apply for Leave</h2>
                    <p className="text-sm text-gray-500 mt-1">Submit a new leave request</p>
                  </div>
                  <button 
                    onClick={() => setShowModal(false)} 
                    className="text-gray-400 hover:text-gray-600 transition text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Leave Type *</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.leaveType} 
                    onChange={(e) => setFormData({...formData, leaveType: e.target.value})}
                  >
                    <option value="Annual leave">🏖️ Annual leave</option>
                    <option value="Sick leave">🤒 Sick leave</option>
                    <option value="Maternity leave">👶 Maternity leave</option>
                    <option value="Emergency leave">🚨 Emergency leave</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                    <input 
                      type="date" 
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                      value={formData.startDate} 
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
                    <input 
                      type="date" 
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                      value={formData.endDate} 
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})} 
                      required 
                    />
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason *</label>
                  <textarea 
                    placeholder="Please provide a reason for your leave request..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 resize-none" 
                    rows="4" 
                    value={formData.reason} 
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    required
                  />
                </div>
                
                <div className="flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)} 
                    className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <FaSpinner className="animate-spin" /> : <FaLeaf />}
                    Submit Request
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

export default Leaves;