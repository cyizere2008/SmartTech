import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  FaUser, FaEnvelope, FaLock, FaUserTag, 
  FaEye, FaEyeSlash, FaCheckCircle, FaArrowRight,
  FaShieldAlt, FaBuilding, FaChartLine, FaUsers
} from 'react-icons/fa';

const Register = () => {
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee'
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (name === 'password') {
      calculatePasswordStrength(value);
    }
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    setPasswordStrength(strength);
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return 'No password';
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 3) return 'Fair';
    if (passwordStrength <= 4) return 'Good';
    return 'Strong';
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return 'bg-red-500';
    if (passwordStrength <= 3) return 'bg-yellow-500';
    if (passwordStrength <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (passwordStrength < 2) {
      setError('Please use a stronger password');
      return;
    }
    setError('');
    setIsLoading(true);
    const { confirmPassword, ...registerData } = formData;
    await register(registerData);
    setIsLoading(false);
  };

  const roleOptions = [
    { value: 'employee', label: 'Employee', icon: FaUsers, description: 'Access personal dashboard, leave, attendance' },
    { value: 'hr_manager', label: 'HR Manager', icon: FaBuilding, description: 'Manage employees, payroll, reports' },
    { value: 'admin', label: 'Administrator', icon: FaShieldAlt, description: 'Full system access and control' }
  ];

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent"></div>
      
      <div className="relative z-10 w-full max-w-5xl">
        <div className="grid md:grid-cols-2 gap-0 bg-zinc-800 rounded-3xl shadow-2xl overflow-hidden border border-zinc-700">
          
          {/* Left Side - Branding */}
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
                  <h3 className="text-3xl font-bold mb-2 text-white">Welcome aboard! 🎉</h3>
                  <p className="text-zinc-400">Create your account to get started with our HR Management System</p>
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
                      <FaLock className="text-blue-400" />
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
              <p className="text-sm text-zinc-400">Join 1000+ companies using SmartTech HRMS</p>
              <div className="flex gap-2 mt-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-8 h-1 bg-zinc-700 rounded-full"></div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right Side - Registration Form */}
          <div className="p-6 md:p-8 bg-zinc-800">
            <div className="mb-6 text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Create Account
              </h1>
              <p className="text-zinc-400 text-sm mt-2">Fill in your details to get started</p>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-start gap-2">
                <div className="w-1 h-full bg-red-500 rounded-full"></div>
                <span>{error}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-zinc-300 text-sm font-medium mb-2">Full Name</label>
                <div className="relative group">
                  <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type="text"
                    name="fullname"
                    className="w-full pl-10 pr-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white placeholder-zinc-500"
                    placeholder="Enter your full name"
                    value={formData.fullname}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              
              {/* Email */}
              <div>
                <label className="block text-zinc-300 text-sm font-medium mb-2">Email Address</label>
                <div className="relative group">
                  <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type="email"
                    name="email"
                    className="w-full pl-10 pr-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white placeholder-zinc-500"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              
              {/* Password */}
              <div>
                <label className="block text-zinc-300 text-sm font-medium mb-2">Password</label>
                <div className="relative group">
                  <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    className="w-full pl-10 pr-12 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white placeholder-zinc-500"
                    placeholder="Create password"
                    value={formData.password}
                    onChange={handleChange}
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
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getPasswordStrengthColor()} transition-all duration-300`}
                          style={{ width: `${(passwordStrength / 5) * 100}%` }}
                        ></div>
                      </div>
                      <span className={`text-xs font-medium ${
                        passwordStrength <= 2 ? 'text-red-400' :
                        passwordStrength <= 3 ? 'text-yellow-400' :
                        passwordStrength <= 4 ? 'text-blue-400' : 'text-green-400'
                      }`}>
                        {getPasswordStrengthText()}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">Use 6+ chars with letters, numbers & symbols</p>
                  </div>
                )}
              </div>
              
              {/* Confirm Password */}
              <div>
                <label className="block text-zinc-300 text-sm font-medium mb-2">Confirm Password</label>
                <div className="relative group">
                  <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    className="w-full pl-10 pr-12 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white placeholder-zinc-500"
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                )}
                {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password && (
                  <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                    <FaCheckCircle size={10} /> Passwords match
                  </p>
                )}
              </div>
              
              {/* Role Selection */}
              <div>
                <label className="block text-zinc-300 text-sm font-medium mb-2">Select Role</label>
                <div className="grid grid-cols-1 gap-2">
                  {roleOptions.map((role) => (
                    <label
                      key={role.value}
                      className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                        formData.role === role.value
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={formData.role === role.value}
                        onChange={handleChange}
                        className="mt-0.5 text-blue-500 focus:ring-blue-500 bg-zinc-900 border-zinc-700"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <role.icon className={`text-sm ${formData.role === role.value ? 'text-blue-400' : 'text-zinc-500'}`} />
                          <p className={`font-medium ${formData.role === role.value ? 'text-blue-400' : 'text-zinc-300'}`}>
                            {role.label}
                          </p>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">{role.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
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
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-zinc-400 text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium hover:underline transition-colors">
                  Sign in here
                </Link>
              </p>
            </div>
            
            {/* Terms */}
            <div className="mt-6 text-center">
              <p className="text-xs text-zinc-500">
                By registering, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;