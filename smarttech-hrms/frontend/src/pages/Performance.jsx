import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaChartLine, FaStar, FaUser, FaCalendarAlt, 
  FaPlus, FaSpinner, FaComments, FaBullseye, 
  FaUserCheck, FaDownload, FaPrint
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext.jsx';

const Performance = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    employee: '',
    rating: 3,
    comments: '',
    goals: '',
    reviewDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchReviews();
    if (user?.role !== 'employee') fetchEmployees();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const endpoint = user?.role === 'employee' 
        ? 'http://localhost:5000/api/performance/my-performance' 
        : 'http://localhost:5000/api/performance';
      const res = await axios.get(endpoint);
      setReviews(res.data);
    } catch (err) {
      toast.error('Failed to fetch reviews');
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
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/performance', formData);
      toast.success('Performance review added successfully!');
      setShowModal(false);
      setFormData({ employee: '', rating: 3, comments: '', goals: '', reviewDate: new Date().toISOString().split('T')[0] });
      fetchReviews();
    } catch (err) {
      toast.error('Failed to add review');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <FaStar 
            key={i} 
            className={`${i < rating ? 'text-amber-500' : 'text-gray-300'} text-sm`} 
          />
        ))}
      </div>
    );
  };

  const getRatingLabel = (rating) => {
    const labels = {
      1: 'Needs Improvement',
      2: 'Below Expectations',
      3: 'Meets Expectations',
      4: 'Exceeds Expectations',
      5: 'Outstanding'
    };
    return labels[rating] || 'Average';
  };

  const stats = {
    total: reviews.length,
    averageRating: reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) 
      : 0,
    topRating: reviews.length > 0 ? Math.max(...reviews.map(r => r.rating)) : 0
  };

  const exportToCSV = () => {
    const headers = ['Employee', 'Review Date', 'Rating', 'Comments', 'Goals', 'Reviewer'];
    const rows = reviews.map(review => [
      review.employee?.fullname || 'N/A',
      new Date(review.reviewDate).toLocaleDateString(),
      `${review.rating} stars - ${getRatingLabel(review.rating)}`,
      review.comments,
      review.goals || 'N/A',
      review.reviewer?.fullname || 'HR'
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Performance data exported successfully!');
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Performance Report</title>
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
            <div class="title">Performance Report</div>
            <p>Generated: ${new Date().toLocaleString()}</p>
          </div>
          <div style="margin-bottom: 20px;">
            <p><strong>Total Reviews:</strong> ${stats.total}</p>
            <p><strong>Average Rating:</strong> ${stats.averageRating} / 5</p>
          </div>
          <table>
            <thead>
              <tr><th>Employee</th><th>Review Date</th><th>Rating</th><th>Comments</th></tr>
            </thead>
            <tbody>
              ${reviews.map(review => `
                <tr>
                  <td>${review.employee?.fullname || 'N/A'}</td>
                  <td>${new Date(review.reviewDate).toLocaleDateString()}</td>
                  <td>${review.rating} Stars</td>
                  <td>${review.comments}</td>
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
                Performance Management
              </h1>
              <p className="text-gray-500 text-sm mt-1">Track and manage employee performance reviews</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={exportToCSV}
                disabled={reviews.length === 0}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <FaDownload /> Export
              </button>
              <button 
                onClick={printReport}
                disabled={reviews.length === 0}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <FaPrint /> Print
              </button>
              {user?.role !== 'employee' && (
                <button 
                  onClick={() => setShowModal(true)} 
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
                >
                  <FaPlus /> Add Review
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards - Subtle design */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Reviews</p>
                <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <FaChartLine className="text-gray-600 text-xl" />
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Average Rating</p>
                <p className="text-3xl font-bold text-gray-800">{stats.averageRating}</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <FaStar className="text-amber-500 text-xl" />
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Highest Rating</p>
                <p className="text-3xl font-bold text-gray-800">{stats.topRating}</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <FaStar className="text-amber-500 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
              <FaChartLine className="text-3xl text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Performance Reviews</h3>
            <p className="text-gray-500">
              {user?.role !== 'employee' 
                ? 'Click "Add Review" to create the first performance review' 
                : 'No performance reviews available yet'}
            </p>
            {user?.role !== 'employee' && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 mx-auto"
              >
                <FaPlus /> Add Review
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((review) => (
              <div 
                key={review._id} 
                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
              >
                {/* Card Header */}
                <div className="border-b border-gray-200 px-5 py-4 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-200 p-2 rounded-lg">
                          <FaUser className="text-gray-600 text-sm" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{review.employee?.fullname}</h3>
                          <p className="text-xs text-gray-500">{review.employee?.position || 'Employee'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-800">{review.rating}</div>
                      <div className="text-xs text-gray-500">/5 Stars</div>
                    </div>
                  </div>
                </div>
                
                {/* Card Body */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt className="text-gray-400 text-xs" />
                      <span className="text-xs text-gray-500">
                        {new Date(review.reviewDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaUserCheck className="text-gray-400 text-xs" />
                      <span className="text-xs text-gray-500">
                        By: {review.reviewer?.fullname || 'HR'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FaStar className="text-amber-500 text-xs" />
                      <span className="text-xs font-medium text-gray-700">Rating</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderStars(review.rating)}
                      <span className="text-xs text-gray-500">({getRatingLabel(review.rating)})</span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FaComments className="text-blue-500 text-xs" />
                      <span className="text-xs font-medium text-gray-700">Comments</span>
                    </div>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {review.comments}
                    </p>
                  </div>
                  
                  {review.goals && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <FaBullseye className="text-emerald-600 text-xs" />
                        <span className="text-xs font-medium text-gray-700">Goals for Next Period</span>
                      </div>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {review.goals}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Review Modal - Subtle design */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Add Performance Review</h2>
                    <p className="text-sm text-gray-500 mt-1">Evaluate employee performance</p>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee *</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.employee} 
                    onChange={(e) => setFormData({...formData, employee: e.target.value})} 
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>{emp.fullname} - {emp.position}</option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Review Date *</label>
                  <input 
                    type="date" 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                    value={formData.reviewDate} 
                    onChange={(e) => setFormData({...formData, reviewDate: e.target.value})} 
                    required 
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rating *</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                    value={formData.rating} 
                    onChange={(e) => setFormData({...formData, rating: Number(e.target.value)})}
                  >
                    <option value="1">1 Star - Needs Improvement</option>
                    <option value="2">2 Stars - Below Expectations</option>
                    <option value="3">3 Stars - Meets Expectations</option>
                    <option value="4">4 Stars - Exceeds Expectations</option>
                    <option value="5">5 Stars - Outstanding</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Comments *</label>
                  <textarea 
                    placeholder="Provide detailed feedback about the employee's performance..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 resize-none" 
                    rows="3" 
                    value={formData.comments} 
                    onChange={(e) => setFormData({...formData, comments: e.target.value})} 
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Goals for Next Period</label>
                  <textarea 
                    placeholder="Set goals and expectations for the next review period..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 resize-none" 
                    rows="2" 
                    value={formData.goals} 
                    onChange={(e) => setFormData({...formData, goals: e.target.value})}
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
                    {loading ? <FaSpinner className="animate-spin" /> : <FaPlus />}
                    Save Review
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

export default Performance;