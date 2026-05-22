import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  FaUser, FaLock, FaEye, FaEyeSlash, FaArrowRight, 
  FaBuilding, FaShieldAlt, FaChartLine, FaUsers,
  FaCheckCircle
} from 'react-icons/fa';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await login(email, password);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent"></div>
      
      <div className="relative z-10 w-full max-w-5xl">
        <div className="grid md:grid-cols-2 gap-0 bg-zinc-800 rounded-3xl shadow-2xl overflow-hidden border border-zinc-700">
          
          {/* Left Side - Branding & Features */}
          <div className="hidden md:flex flex-col justify-between p-8 bg-gradient-to-br from-zinc-800 to-zinc-900 text-white border-r border-zinc-700">
            <div>
              <div className="flex items-center gap-2 mb-8">
                <div className="bg-blue-500/20 p-2 rounded-xl border border-blue-500/30">
                  <FaBuilding className="text-2xl text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-white">SmartTech HRMS</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-3xl font-bold mb-2 text-white">Welcome Back! 👋</h3>
                  <p className="text-zinc-400">Sign in to access your HR Management Dashboard</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700">
                    <div className="bg-blue-500/20 p-2 rounded-lg">
                      <FaCheckCircle className="text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Easy Leave Management</p>
                      <p className="text-sm text-zinc-400">Apply and track leaves effortlessly</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700">
                    <div className="bg-blue-500/20 p-2 rounded-lg">
                      <FaChartLine className="text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Real-time Analytics</p>
                      <p className="text-sm text-zinc-400">Monitor attendance and performance</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700">
                    <div className="bg-blue-500/20 p-2 rounded-lg">
                      <FaShieldAlt className="text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Secure & Reliable</p>
                      <p className="text-sm text-zinc-400">Your data is always protected</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-zinc-700">
              <div className="flex -space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-zinc-800"></div>
                ))}
                <div className="w-8 h-8 rounded-full bg-zinc-700 border-2 border-zinc-800 flex items-center justify-center">
                  <span className="text-xs text-zinc-400">+</span>
                </div>
              </div>
              <p className="text-sm text-zinc-400 mt-3">Join 1000+ companies using SmartTech HRMS</p>
            </div>
          </div>
          
          {/* Right Side - Login Form */}
          <div className="p-6 md:p-8 bg-zinc-800">
            <div className="mb-6 text-center md:text-left">
              <div className="md:hidden flex justify-center mb-4">
                <div className="bg-blue-500/20 p-3 rounded-xl border border-blue-500/30 inline-flex">
                  <FaBuilding className="text-2xl text-blue-400" />
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Sign In
              </h1>
              <p className="text-zinc-400 text-sm mt-2">Enter your credentials to access your account</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <label className="block text-zinc-300 text-sm font-medium mb-2">Email Address</label>
                <div className="relative group">
                  <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type="email"
                    className="w-full pl-10 pr-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white placeholder-zinc-500"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              {/* Password Field */}
              <div>
                <label className="block text-zinc-300 text-sm font-medium mb-2">Password</label>
                <div className="relative group">
                  <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full pl-10 pr-12 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white placeholder-zinc-500"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                  </button>
                </div>
              </div>
              
              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                  />
                  <span className="text-sm text-zinc-400">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              
              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl transition-all duration-300 font-semibold flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
            
            {/* Demo Credentials (Optional - for testing) */}
            <div className="mt-6 p-3 bg-zinc-900 rounded-xl border border-zinc-700">
              <p className="text-xs text-zinc-500 text-center mb-2">Demo Credentials</p>
              <div className="flex flex-col gap-1 text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span>Employee:</span>
                  <span className="text-blue-400">employee@smarttech.com</span>
                </div>
                <div className="flex justify-between">
                  <span>HR Manager:</span>
                  <span className="text-blue-400">hr@smarttech.com</span>
                </div>
                <div className="flex justify-between">
                  <span>Admin:</span>
                  <span className="text-blue-400">admin@smarttech.com</span>
                </div>
                <div className="flex justify-between">
                  <span>Password:</span>
                  <span className="text-zinc-500">password123</span>
                </div>
              </div>
            </div>
            
            {/* Register Link */}
            <div className="mt-6 text-center">
              <p className="text-zinc-400 text-sm">
                Don't have an account?{' '}
                <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium hover:underline transition-colors">
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;