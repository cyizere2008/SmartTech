import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext.jsx';

const Leaves = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [showModal, setShowModal] = useState(false);
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
    try {
      const endpoint = user?.role === 'employee' ? 'http://localhost:5000/api/leaves/my-leaves' : 'http://localhost:5000/api/leaves';
      const res = await axios.get(endpoint);
      setLeaves(res.data);
    } catch (err) {
      toast.error('Failed to fetch leaves');
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
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
  }
};

  const handleReview = async (id, status) => {
    try {
      await axios.put(`http://localhost:5000/api/leaves/${id}`, { status });
      toast.success(`Leave ${status}`);
      fetchLeaves();
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const getStatusBadge = (status) => {
    const colors = { pending: 'bg-yellow-100 text-yellow-800', approved: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800' };
    return <span className={`px-2 py-1 rounded-full text-xs ${colors[status]}`}>{status}</span>;
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Leave Management</h1>
          {user?.role === 'employee' && (
            <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Apply for Leave</button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  {user?.role !== 'employee' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaves.map(leave => (
                  <tr key={leave._id}>
                    <td className="px-6 py-4">{leave.employee?.fullname || 'N/A'}</td>
                    <td className="px-6 py-4">{leave.leaveType}</td>
                    <td className="px-6 py-4">{new Date(leave.startDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">{new Date(leave.endDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">{leave.reason}</td>
                    <td className="px-6 py-4">{getStatusBadge(leave.status)}</td>
                    {user?.role !== 'employee' && leave.status === 'pending' && (
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => handleReview(leave._id, 'approved')} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Approve</button>
                          <button onClick={() => handleReview(leave._id, 'rejected')} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Reject</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-96">
              <h2 className="text-xl font-bold mb-4">Apply for Leave</h2>
              <form onSubmit={handleSubmit}>
                <select className="w-full border rounded-lg px-3 py-2 mb-3" value={formData.leaveType} onChange={(e) => setFormData({...formData, leaveType: e.target.value})}>
                  <option>Annual leave</option>
                  <option>Sick leave</option>
                  <option>Maternity leave</option>
                  <option>Emergency leave</option>
                </select>
                <input type="date" className="w-full border rounded-lg px-3 py-2 mb-3" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} required />
                <input type="date" className="w-full border rounded-lg px-3 py-2 mb-3" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} required />
                <textarea placeholder="Reason" className="w-full border rounded-lg px-3 py-2 mb-3" rows="3" value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})}></textarea>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Submit</button>
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