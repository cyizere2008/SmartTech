import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext.jsx';
import axios from 'axios';
import { 
  FaUsers, FaCalendarCheck, FaMoneyBillWave, FaChartLine, FaSpinner,
  FaEye, FaCheckCircle, FaClock, FaArrowRight, FaBuilding,
  FaUserPlus, FaPercentage, FaArrowUp, FaBell, FaAward, FaTable
} from 'react-icons/fa';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    pendingLeaves: 0,
    totalPayroll: 0
  });
  const [activities, setActivities] = useState([]);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [attendanceTrends, setAttendanceTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    fetchAllDashboardData();
    setGreeting(getGreeting());
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const fetchAllDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, activitiesRes, deptStatsRes, trendsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/dashboard/stats'),
        axios.get('http://localhost:5000/api/dashboard/recent-activities'),
        axios.get('http://localhost:5000/api/dashboard/department-stats'),
        axios.get('http://localhost:5000/api/dashboard/attendance-trends')
      ]);
      
      setStats(statsRes.data);
      setActivities(activitiesRes.data);
      setDepartmentStats(deptStatsRes.data);
      setAttendanceTrends(trendsRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      title: 'Total Employees', 
      value: stats.totalEmployees, 
      icon: FaUsers, 
      color: 'from-blue-500 to-blue-600',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-600',
      iconBg: 'bg-blue-500',
      description: 'Active team members'
    },
    { 
      title: 'Present Today', 
      value: stats.presentToday, 
      icon: FaCalendarCheck, 
      color: 'from-emerald-500 to-emerald-600',
      bgLight: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      iconBg: 'bg-emerald-500',
      description: 'Checked in today'
    },
    { 
      title: 'Pending Leaves', 
      value: stats.pendingLeaves, 
      icon: FaChartLine, 
      color: 'from-amber-500 to-amber-600',
      bgLight: 'bg-amber-50',
      textColor: 'text-amber-600',
      iconBg: 'bg-amber-500',
      description: 'Awaiting approval'
    },
    { 
      title: 'Monthly Payroll', 
      value: `$${stats.totalPayroll.toLocaleString()}`, 
      icon: FaMoneyBillWave, 
      color: 'from-purple-500 to-purple-600',
      bgLight: 'bg-purple-50',
      textColor: 'text-purple-600',
      iconBg: 'bg-purple-500',
      description: 'This month\'s total'
    }
  ];

  const quickActions = [
    { name: 'View Employee Directory', icon: FaUsers, path: '/employees', color: 'blue', bgLight: 'bg-blue-50' },
    { name: 'Approve Pending Leaves', icon: FaCheckCircle, path: '/leaves', color: 'emerald', bgLight: 'bg-emerald-50', badge: stats.pendingLeaves },
    { name: 'Generate Payroll Report', icon: FaMoneyBillWave, path: '/payroll', color: 'purple', bgLight: 'bg-purple-50' },
    { name: 'View Attendance Analytics', icon: FaCalendarCheck, path: '/attendance', color: 'amber', bgLight: 'bg-amber-50' }
  ];

  // Calculate attendance rate
  const attendanceRate = stats.totalEmployees > 0 
    ? ((stats.presentToday / stats.totalEmployees) * 100).toFixed(1) 
    : 0;

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-96">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <FaUsers className="text-blue-300 text-2xl" />
            </div>
          </div>
          <p className="text-gray-500 mt-4 font-medium">Loading dashboard data...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">
                    {greeting === 'Good Morning' ? '🌅' : greeting === 'Good Afternoon' ? '☀️' : '🌙'}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    {greeting}, {user?.fullname?.split(' ')[0]}!
                  </h1>
                  <p className="text-gray-500 text-sm">
                    Here's what's happening with your HR system today.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl px-4 py-2 border border-blue-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              </div>
              <button className="relative p-2 rounded-full hover:bg-gray-100 transition-all duration-300">
                <FaBell className="text-gray-500" />
                {stats.pendingLeaves > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                    {stats.pendingLeaves}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div 
              key={index} 
              className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden relative"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500`}></div>
              <div className="p-5 relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className={`${stat.bgLight} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className={`${stat.textColor} text-xl`} />
                  </div>
                  <span className="text-2xl md:text-3xl font-bold text-gray-800">{stat.value}</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{stat.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{stat.description}</p>
                </div>
              </div>
              <div className={`h-1 bg-gradient-to-r ${stat.color} transform origin-left transition-transform duration-300 scale-x-0 group-hover:scale-x-100`}></div>
            </div>
          ))}
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Attendance Rate Card */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Today's Attendance Rate</p>
                <p className="text-4xl font-bold mt-2">{attendanceRate}%</p>
                <div className="mt-3 flex items-center gap-2">
                  <FaUsers className="text-blue-200" />
                  <span className="text-sm text-blue-100">{stats.presentToday} / {stats.totalEmployees} employees present</span>
                </div>
              </div>
              <div className="bg-white/20 p-4 rounded-full">
                <FaPercentage className="text-3xl" />
              </div>
            </div>
            <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-1000"
                style={{ width: `${attendanceRate}%` }}
              ></div>
            </div>
          </div>
          
          {/* Payroll Overview Card */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm">Monthly Payroll Overview</p>
                <p className="text-3xl font-bold mt-2">${stats.totalPayroll.toLocaleString()}</p>
                <div className="mt-3 flex items-center gap-2">
                  <FaArrowUp className="text-emerald-200" />
                  <span className="text-sm text-emerald-100">+12% from last month</span>
                </div>
              </div>
              <div className="bg-white/20 p-4 rounded-full">
                <FaMoneyBillWave className="text-3xl" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions - Enhanced */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg">
                    <FaClock className="text-white text-sm" />
                  </div>
                  Quick Actions
                </h2>
                <span className="text-xs text-gray-400">Click to navigate</span>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quickActions.map((action, idx) => (
                  <button 
                    key={idx}
                    onClick={() => window.location.href = action.path}
                    className="group relative overflow-hidden p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`${action.bgLight} p-2 rounded-lg group-hover:scale-110 transition-transform duration-300`}>
                        <action.icon className={`text-${action.color}-600 text-lg`} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-800 text-sm">{action.name}</p>
                        {action.badge > 0 && (
                          <p className="text-xs text-amber-600 mt-1">{action.badge} pending</p>
                        )}
                      </div>
                      <FaArrowRight className="text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                    </div>
                    {action.badge > 0 && (
                      <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {action.badge}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activities - Enhanced */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-lg">
                    <FaBell className="text-white text-sm" />
                  </div>
                  Recent Activities
                </h2>
                <span className="text-xs text-gray-400">Latest updates</span>
              </div>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto custom-scrollbar">
              {activities.length > 0 ? (
                <div className="space-y-2">
                  {activities.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-300 group">
                      <div className="text-2xl group-hover:scale-110 transition-transform">
                        {activity.icon || '📌'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">{activity.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <FaClock className="text-gray-300 text-xs" />
                          <p className="text-xs text-gray-400">{activity.timeAgo}</p>
                        </div>
                      </div>
                      {activity.status === 'pending' && (
                        <div className="bg-amber-100 px-2 py-1 rounded-full">
                          <span className="text-xs text-amber-600">Pending</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-3">
                    <FaBell className="text-gray-400 text-2xl" />
                  </div>
                  <p className="text-gray-500 text-sm">No recent activities</p>
                </div>
              )}
            </div>
          </div>

          {/* Department Statistics - Enhanced */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-2 rounded-lg">
                    <FaBuilding className="text-white text-sm" />
                  </div>
                  Department Statistics
                </h2>
                <span className="text-xs text-gray-400">Employee distribution</span>
              </div>
            </div>
            <div className="p-6">
              {departmentStats.length > 0 ? (
                <div className="space-y-4">
                  {departmentStats.map((dept, index) => {
                    const percentage = stats.totalEmployees > 0 ? (dept.employeeCount / stats.totalEmployees) * 100 : 0;
                    const colors = ['blue', 'emerald', 'purple', 'amber', 'rose', 'cyan'];
                    const color = colors[index % colors.length];
                    return (
                      <div key={index} className="group">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <p className="font-semibold text-gray-800">{dept.department}</p>
                            <p className="text-xs text-gray-500">{dept.employeeCount} employees</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-800">
                              ${dept.averageSalary?.toLocaleString() || 0}
                            </p>
                            <p className="text-xs text-gray-400">Avg Salary</p>
                          </div>
                        </div>
                        <div className="relative">
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full bg-${color}-500 rounded-full transition-all duration-700 group-hover:opacity-80`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="absolute -top-5 right-0 text-xs text-gray-400">{percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-3">
                    <FaBuilding className="text-gray-400 text-2xl" />
                  </div>
                  <p className="text-gray-500 text-sm">No department data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Attendance Trends - Table View */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-2 rounded-lg">
                    <FaTable className="text-white text-sm" />
                  </div>
                  Attendance Trends
                </h2>
                <span className="text-xs text-gray-400">Last 7 days</span>
              </div>
            </div>
            <div className="p-4">
              {attendanceTrends.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Present</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Late</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {attendanceTrends.map((trend, idx) => {
                        const attendancePercent = trend.total > 0 ? ((trend.present / trend.total) * 100).toFixed(1) : 0;
                        return (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {trend.date}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                              {new Date(trend.fullDate).toLocaleDateString('en-US', { weekday: 'short' })}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                {trend.present}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                {trend.late}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                              {trend.total}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      attendancePercent >= 80 ? 'bg-emerald-500' : 
                                      attendancePercent >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                                    }`}
                                    style={{ width: `${attendancePercent}%` }}
                                  ></div>
                                </div>
                                <span className={`text-sm font-semibold ${
                                  attendancePercent >= 80 ? 'text-emerald-600' : 
                                  attendancePercent >= 60 ? 'text-amber-600' : 'text-rose-600'
                                }`}>
                                  {attendancePercent}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-3">
                    <FaTable className="text-gray-400 text-2xl" />
                  </div>
                  <p className="text-gray-500 text-sm">No attendance data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Tips Footer */}
        <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-2 rounded-full shadow-md">
                <FaAward className="text-white text-sm" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Pro Tip</p>
                <p className="text-xs text-gray-600">Use the quick actions to navigate to frequently used features</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div> Present
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div> Late
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div> New
              </span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </Layout>
  );
};

export default Dashboard;