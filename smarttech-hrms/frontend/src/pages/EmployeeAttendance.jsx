import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaCheckCircle, FaClock, FaUserCheck, FaUserClock, 
  FaCalendarAlt, FaChartLine, FaHistory, FaSpinner, 
  FaAward, FaTrophy, FaFire
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext.jsx';

const EmployeeAttendance = () => {
  const { user } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalPresent: 0,
    totalLate: 0,
    totalAbsent: 0,
    attendanceRate: 0
  });

  useEffect(() => {
    if (user) {
      fetchTodayAttendance();
      fetchHistory();
      fetchStats();
    }
  }, [user]);

  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    return {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  const fetchTodayAttendance = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/attendance/today', getAuthConfig());
      setTodayAttendance(res.data);
    } catch (err) {
      console.error('Error fetching today attendance:', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/attendance/employee/history', getAuthConfig());
      setAttendanceHistory(res.data);
    } catch (err) {
      console.error('Error fetching history:', err);
      toast.error('Failed to fetch attendance history');
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/attendance/employee/stats', getAuthConfig());
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/attendance/checkin', {}, getAuthConfig());
      if (res.data.success) {
        toast.success('✅ Checked in successfully!');
        fetchTodayAttendance();
        fetchHistory();
        fetchStats();
      } else {
        toast.error(res.data.message || 'Check-in failed');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Check-in failed';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/attendance/checkout', {}, getAuthConfig());
      if (res.data.success) {
        toast.success('✅ Checked out successfully!');
        fetchTodayAttendance();
        fetchHistory();
        fetchStats();
      } else {
        toast.error(res.data.message || 'Check-out failed');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Check-out failed';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
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

  const getRateColor = (rate) => {
    if (rate >= 90) return 'text-emerald-600';
    if (rate >= 75) return 'text-blue-600';
    if (rate >= 60) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getMotivationMessage = () => {
    const rate = stats.attendanceRate;
    if (rate >= 90) return 'Excellent! Keep up the great work! 🎉';
    if (rate >= 75) return 'Good job! You\'re doing well! 💪';
    if (rate >= 60) return 'Keep pushing! You can do better! 🌟';
    return 'Let\'s improve attendance! Start today! 🚀';
  };

  if (!user) {
    return <Layout>Loading...</Layout>;
  }

  return (
    <Layout>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                My Attendance
              </h1>
              <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                <FaHistory className="text-gray-400" size={12} />
                Track your daily check-in and check-out records
              </p>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-2 rounded-xl">
              <FaAward className="text-purple-600" />
              <span className="text-sm font-medium text-purple-700">
                {getMotivationMessage()}
              </span>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-600 text-sm font-medium mb-1">Present Days</p>
                <p className="text-3xl md:text-4xl font-bold text-emerald-700">{stats.totalPresent || 0}</p>
              </div>
              <div className="bg-emerald-500 p-3 rounded-full">
                <FaCheckCircle className="text-white text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-600 text-sm font-medium mb-1">Late Arrivals</p>
                <p className="text-3xl md:text-4xl font-bold text-amber-700">{stats.totalLate || 0}</p>
              </div>
              <div className="bg-amber-500 p-3 rounded-full">
                <FaClock className="text-white text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-rose-600 text-sm font-medium mb-1">Absent Days</p>
                <p className="text-3xl md:text-4xl font-bold text-rose-700">{stats.totalAbsent || 0}</p>
              </div>
              <div className="bg-rose-500 p-3 rounded-full">
                <FaCalendarAlt className="text-white text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium mb-1">Attendance Rate</p>
                <p className={`text-3xl md:text-4xl font-bold ${getRateColor(stats.attendanceRate)}`}>
                  {stats.attendanceRate || 0}%
                </p>
              </div>
              <div className="bg-blue-500 p-3 rounded-full">
                <FaChartLine className="text-white text-xl" />
              </div>
            </div>
            {stats.attendanceRate >= 90 && (
              <div className="absolute -top-2 -right-2">
                <FaTrophy className="text-yellow-500 text-2xl" />
              </div>
            )}
          </div>
        </div>

        {/* Today's Status Card */}
        <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <FaUserCheck /> Today's Attendance
            </h2>
          </div>
          <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-8 items-center justify-between">
              <div className="text-center">
                <div className="text-6xl md:text-7xl mb-4">
                  {todayAttendance?.checkIn ? (
                    <FaCheckCircle className="text-emerald-500 inline animate-bounce" />
                  ) : (
                    <FaUserClock className="text-amber-500 inline animate-pulse" />
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 justify-center">
                    <span className="text-gray-600 font-medium">Check In:</span>
                    <span className="text-xl md:text-2xl font-bold text-emerald-600">
                      {todayAttendance?.checkIn ? formatTime(todayAttendance.checkIn) : 'Not checked in'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 justify-center">
                    <span className="text-gray-600 font-medium">Check Out:</span>
                    <span className="text-xl md:text-2xl font-bold text-blue-600">
                      {todayAttendance?.checkOut ? formatTime(todayAttendance.checkOut) : 'Not checked out'}
                    </span>
                  </div>
                  {todayAttendance?.lateMinutes > 0 && (
                    <div className="bg-amber-50 rounded-lg px-4 py-2 inline-block">
                      <p className="text-amber-600 text-sm flex items-center gap-1">
                        <FaClock className="text-sm" /> Late by {todayAttendance.lateMinutes} minutes
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <button
                  onClick={handleCheckIn}
                  disabled={loading || todayAttendance?.checkIn}
                  className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-8 py-3 rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-md hover:shadow-lg"
                >
                  {loading ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                  Check In
                </button>
                <button
                  onClick={handleCheckOut}
                  disabled={loading || !todayAttendance?.checkIn || todayAttendance?.checkOut}
                  className="bg-gradient-to-r from-rose-500 to-red-600 text-white px-8 py-3 rounded-xl hover:from-rose-600 hover:to-red-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-md hover:shadow-lg"
                >
                  <FaClock />
                  Check Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b bg-gray-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <FaHistory className="text-blue-500" />
                  My Attendance History
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {attendanceHistory.length === 0 
                    ? 'No records found. Check in to start tracking!' 
                    : `Last 30 days records • Total: ${attendanceHistory.length} entries`}
                </p>
              </div>
              {attendanceHistory.length > 0 && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <FaFire className="text-orange-500" />
                  <span>Current streak: {Math.min(attendanceHistory.length, 5)} days</span>
                </div>
              )}
            </div>
          </div>
          
          {attendanceHistory.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-4">
                <FaUserClock className="text-5xl text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Attendance Records Yet</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Start tracking your attendance by checking in. Your history will appear here.
              </p>
              <button
                onClick={handleCheckIn}
                disabled={loading || todayAttendance?.checkIn}
                className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-2 rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-md hover:shadow-lg mx-auto"
              >
                {loading ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                Check In Now
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Day</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Check Out</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendanceHistory.map((record) => (
                    <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{formatDate(record.date)}</div>
                        <div className="text-xs text-gray-500 sm:hidden">
                          {record.date ? new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' }) : ''}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600 hidden sm:table-cell">
                        {record.date ? new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' }) : ''}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {record.checkIn ? (
                          <span className="text-emerald-600 font-medium">{formatTime(record.checkIn)}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                        {record.checkOut ? (
                          <span className="text-blue-600 font-medium">{formatTime(record.checkOut)}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(record.status)}`}>
                          {record.status || 'present'}
                        </span>
                        {record.lateMinutes > 0 && (
                          <span className="ml-1 text-xs text-amber-600 hidden sm:inline">(+{record.lateMinutes})</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Tips Footer */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="bg-blue-500 p-2 rounded-full">
                <FaUserCheck className="text-white text-sm" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Quick Tips</p>
                <p className="text-xs text-gray-600">Check in before 9:30 AM to avoid being marked late</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div> Present</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 bg-amber-500 rounded-full"></div> Late</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 bg-rose-500 rounded-full"></div> Absent</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EmployeeAttendance;