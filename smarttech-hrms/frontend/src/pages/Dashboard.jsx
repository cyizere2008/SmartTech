import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext.jsx';
import axios from 'axios';
import { FaUsers, FaCalendarCheck, FaMoneyBillWave, FaChartLine, FaSpinner } from 'react-icons/fa';

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

  useEffect(() => {
    fetchAllDashboardData();
  }, []);

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
    { title: 'Total Employees', value: stats.totalEmployees, icon: FaUsers, color: 'bg-blue-500' },
    { title: 'Present Today', value: stats.presentToday, icon: FaCalendarCheck, color: 'bg-green-500' },
    { title: 'Pending Leaves', value: stats.pendingLeaves, icon: FaChartLine, color: 'bg-yellow-500' },
    { title: 'Monthly Payroll', value: `$${stats.totalPayroll.toLocaleString()}`, icon: FaMoneyBillWave, color: 'bg-purple-500' }
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <FaSpinner className="animate-spin text-4xl text-blue-500" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome back, {user?.fullname}!</h1>
        <p className="text-gray-600 mb-8">Here's what's happening with your HR system today.</p>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md p-6 card-hover transform transition duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-full text-white`}>
                  <stat.icon size={24} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button 
                onClick={() => window.location.href = '/employees'}
                className="w-full text-left px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                📋 View Employee Directory
              </button>
              <button 
                onClick={() => window.location.href = '/leaves'}
                className="w-full text-left px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                ✅ Approve Pending Leaves ({stats.pendingLeaves})
              </button>
              <button 
                onClick={() => window.location.href = '/payroll'}
                className="w-full text-left px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                💰 Generate Payroll Report
              </button>
              <button 
                onClick={() => window.location.href = '/attendance'}
                className="w-full text-left px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                📊 View Attendance Analytics
              </button>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Activities</h2>
            <div className="space-y-3">
              {activities.length > 0 ? (
                activities.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-lg transition">
                    <span className="text-xl">{activity.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">{activity.message}</p>
                      <p className="text-xs text-gray-400">{activity.timeAgo}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No recent activities</p>
              )}
            </div>
          </div>

          {/* Department Statistics */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Department Statistics</h2>
            <div className="space-y-3">
              {departmentStats.map((dept, index) => (
                <div key={index} className="flex justify-between items-center p-2 border-b">
                  <div>
                    <p className="font-medium text-gray-800">{dept.department}</p>
                    <p className="text-sm text-gray-500">{dept.employeeCount} employees</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800">
                      ${dept.averageSalary?.toLocaleString() || 0}
                    </p>
                    <p className="text-xs text-gray-400">Avg Salary</p>
                  </div>
                </div>
              ))}
              {departmentStats.length === 0 && (
                <p className="text-gray-500 text-sm">No department data available</p>
              )}
            </div>
          </div>

          {/* Attendance Trends */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Attendance Trends (Last 7 Days)</h2>
            <div className="space-y-3">
              {attendanceTrends.map((trend, index) => (
                <div key={index} className="flex justify-between items-center p-2 border-b">
                  <div>
                    <p className="font-medium text-gray-800">{trend.date}</p>
                    <p className="text-sm text-gray-500">Total: {trend.total} employees</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="text-center">
                      <p className="text-sm font-semibold text-green-600">{trend.present}</p>
                      <p className="text-xs text-gray-400">Present</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-yellow-600">{trend.late}</p>
                      <p className="text-xs text-gray-400">Late</p>
                    </div>
                  </div>
                </div>
              ))}
              {attendanceTrends.length === 0 && (
                <p className="text-gray-500 text-sm">No attendance data available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;