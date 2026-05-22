import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext.jsx';

const Performance = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
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
    try {
      const endpoint = user?.role === 'employee' ? 'http://localhost:5000/api/performance/my-performance' : 'http://localhost:5000/api/performance';
      const res = await axios.get(endpoint);
      setReviews(res.data);
    } catch (err) {
      toast.error('Failed to fetch reviews');
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
    try {
      await axios.post('http://localhost:5000/api/performance', formData);
      toast.success('Performance review added');
      setShowModal(false);
      setFormData({ employee: '', rating: 3, comments: '', goals: '', reviewDate: new Date().toISOString().split('T')[0] });
      fetchReviews();
    } catch (err) {
      toast.error('Failed to add review');
    }
  };

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Performance Management</h1>
          {user?.role !== 'employee' && (
            <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Add Review</button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map(review => (
            <div key={review._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{review.employee?.fullname}</h3>
                  <p className="text-sm text-gray-500">{new Date(review.reviewDate).toLocaleDateString()}</p>
                </div>
                <div className="text-yellow-500 text-xl">{renderStars(review.rating)}</div>
              </div>
              <p className="text-gray-700 mb-2"><strong>Comments:</strong> {review.comments}</p>
              {review.goals && <p className="text-gray-700"><strong>Goals:</strong> {review.goals}</p>}
              <p className="text-xs text-gray-400 mt-4">Reviewed by: {review.reviewer?.fullname || 'HR'}</p>
            </div>
          ))}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-96">
              <h2 className="text-xl font-bold mb-4">Add Performance Review</h2>
              <form onSubmit={handleSubmit}>
                <select className="w-full border rounded-lg px-3 py-2 mb-3" value={formData.employee} onChange={(e) => setFormData({...formData, employee: e.target.value})} required>
                  <option value="">Select Employee</option>
                  {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.fullname}</option>)}
                </select>
                <input type="date" className="w-full border rounded-lg px-3 py-2 mb-3" value={formData.reviewDate} onChange={(e) => setFormData({...formData, reviewDate: e.target.value})} required />
                <select className="w-full border rounded-lg px-3 py-2 mb-3" value={formData.rating} onChange={(e) => setFormData({...formData, rating: Number(e.target.value)})}>
                  {[1,2,3,4,5].map(r => <option key={r} value={r}>{r} Star{r !== 1 ? 's' : ''}</option>)}
                </select>
                <textarea placeholder="Comments" className="w-full border rounded-lg px-3 py-2 mb-3" rows="3" value={formData.comments} onChange={(e) => setFormData({...formData, comments: e.target.value})} required></textarea>
                <textarea placeholder="Goals for next period" className="w-full border rounded-lg px-3 py-2 mb-3" rows="2" value={formData.goals} onChange={(e) => setFormData({...formData, goals: e.target.value})}></textarea>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save</button>
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