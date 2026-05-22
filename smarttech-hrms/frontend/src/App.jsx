import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Employees from './pages/Employees.jsx';
import Departments from './pages/Departments.jsx';
import Attendance from './pages/Attendance.jsx';
import Leaves from './pages/Leaves.jsx';
import Payroll from './pages/Payroll.jsx';
import Performance from './pages/Performance.jsx';
import Reports from './pages/Reports.jsx';

// Context
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

// Wrapper component to provide navigate to AuthProvider
const AppWithAuth = () => {
  const navigate = useNavigate();
  
  return React.createElement(
    AuthProvider,
    { navigate: navigate },
    React.createElement(AppRoutes, null)
  );
};

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return React.createElement('div', { className: "flex justify-center items-center h-screen" }, "Loading...");
  if (!user) return React.createElement(Navigate, { to: "/login" });
  if (allowedRoles && !allowedRoles.includes(user.role)) return React.createElement(Navigate, { to: "/dashboard" });
  return children;
};

const AppRoutes = () => {
  return React.createElement(Routes, null,
    React.createElement(Route, { path: "/login", element: React.createElement(Login, null) }),
    React.createElement(Route, { path: "/register", element: React.createElement(Register, null) }),
    React.createElement(Route, { path: "/dashboard", element: React.createElement(PrivateRoute, null, React.createElement(Dashboard, null)) }),
    React.createElement(Route, { path: "/employees", element: React.createElement(PrivateRoute, { allowedRoles: ['admin', 'hr_manager'] }, React.createElement(Employees, null)) }),
    React.createElement(Route, { path: "/departments", element: React.createElement(PrivateRoute, { allowedRoles: ['admin', 'hr_manager'] }, React.createElement(Departments, null)) }),
    React.createElement(Route, { path: "/attendance", element: React.createElement(PrivateRoute, null, React.createElement(Attendance, null)) }),
    React.createElement(Route, { path: "/leaves", element: React.createElement(PrivateRoute, null, React.createElement(Leaves, null)) }),
    React.createElement(Route, { path: "/payroll", element: React.createElement(PrivateRoute, null, React.createElement(Payroll, null)) }),
    React.createElement(Route, { path: "/performance", element: React.createElement(PrivateRoute, null, React.createElement(Performance, null)) }),
    React.createElement(Route, { path: "/reports", element: React.createElement(PrivateRoute, { allowedRoles: ['admin', 'hr_manager'] }, React.createElement(Reports, null)) }),
    React.createElement(Route, { path: "/", element: React.createElement(Navigate, { to: "/dashboard" }) })
  );
};

function App() {
  return React.createElement(Router, null,
    React.createElement(ToastContainer, { position: "top-right", autoClose: 3000 }),
    React.createElement(AppWithAuth, null)
  );
}

export default App;