import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  FaTachometerAlt, FaUsers, FaBuilding, FaCalendarCheck, 
  FaLeaf, FaMoneyBillWave, FaChartLine, FaFileAlt, 
  FaSignOutAlt, FaUserCircle, FaBars, FaTimes,
  FaChevronLeft
} from 'react-icons/fa';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if screen is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const menuItems = [
    { path: '/dashboard', name: 'Dashboard', icon: FaTachometerAlt, roles: ['admin', 'hr_manager', 'employee'] },
    { path: '/employees', name: 'Employees', icon: FaUsers, roles: ['admin', 'hr_manager'] },
    { path: '/departments', name: 'Departments', icon: FaBuilding, roles: ['admin', 'hr_manager'] },
    { path: '/attendance', name: 'Attendance', icon: FaCalendarCheck, roles: ['admin', 'hr_manager', 'employee'] },
    { path: '/leaves', name: 'Leaves', icon: FaLeaf, roles: ['admin', 'hr_manager', 'employee'] },
    { path: '/payroll', name: 'Payroll', icon: FaMoneyBillWave, roles: ['admin', 'hr_manager', 'employee'] },
    { path: '/performance', name: 'Performance', icon: FaChartLine, roles: ['admin', 'hr_manager', 'employee'] },
    { path: '/reports', name: 'Reports', icon: FaFileAlt, roles: ['admin', 'hr_manager'] }
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role));
  const currentPage = filteredMenu.find(m => m.path === location.pathname)?.name || 'Dashboard';

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Overlay for mobile
  const MobileOverlay = () => (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity duration-300 md:hidden
        ${sidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
      onClick={closeSidebar}
    />
  );

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Mobile Overlay */}
      <MobileOverlay />
      
      {/* Sidebar */}
      <div 
        className={`
          fixed md:relative z-30 bg-gray-900 text-white flex flex-col transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'left-0' : '-left-64 md:left-0'}
          w-64 h-full shadow-xl
        `}
      >
        {/* Sidebar Header */}
        <div className="p-5 border-b border-gray-800 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">SmartTech HRMS</h1>
            <p className="text-xs text-gray-400 mt-1 capitalize">{user?.role} Portal</p>
          </div>
          {isMobile && (
            <button 
              onClick={toggleSidebar}
              className="p-1 rounded-lg hover:bg-gray-800 transition"
            >
              <FaTimes size={20} />
            </button>
          )}
        </div>
        
        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-4">
          {filteredMenu.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              onClick={closeSidebar}
              className={`
                flex items-center space-x-3 mx-2 px-4 py-3 rounded-lg transition duration-200
                ${location.pathname === item.path 
                  ? 'bg-gray-800 text-white' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }
              `}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
              {location.pathname === item.path && (
                <div className="ml-auto w-1 h-6 bg-blue-500 rounded-full"></div>
              )}
            </Link>
          ))}
        </nav>
        
        {/* User Profile Section */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center space-x-3 mb-4 p-2 rounded-lg bg-gray-800">
            <FaUserCircle size={40} className="text-gray-400" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{user?.fullname || 'User'}</p>
              <p className="text-xs text-gray-400 capitalize truncate">{user?.role || 'Employee'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gray-800 transition duration-200 w-full text-gray-300 hover:text-white"
          >
            <FaSignOutAlt size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Header Bar */}
        <div className="bg-white shadow-sm sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <button
                onClick={toggleSidebar}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
              >
                <FaBars size={20} className="text-gray-600" />
              </button>
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 truncate">
                {currentPage}
              </h2>
            </div>
            
            {/* User Info - Mobile */}
            <div className="md:hidden flex items-center gap-2">
              <FaUserCircle size={28} className="text-gray-500" />
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700 truncate max-w-[100px]">
                  {user?.fullname?.split(' ')[0]}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;