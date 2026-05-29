import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaEdit, FaTrash, FaPlus, FaBuilding, FaUsers, 
  FaTimes, FaSpinner, FaSearch, FaDownload, FaPrint,
  FaUser, FaEnvelope, FaBriefcase, FaPhone, FaEye
} from 'react-icons/fa';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEmployeesModal, setShowEmployeesModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [editingDept, setEditingDept] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/departments');
      setDepartments(res.data);
    } catch (err) {
      toast.error('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingDept) {
        await axios.put(`http://localhost:5000/api/departments/${editingDept._id}`, formData);
        toast.success('Department updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/departments', formData);
        toast.success('Department added successfully');
      }
      setShowModal(false);
      setFormData({ name: '', description: '' });
      setEditingDept(null);
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      setLoading(true);
      try {
        await axios.delete(`http://localhost:5000/api/departments/${id}`);
        toast.success('Department deleted successfully');
        fetchDepartments();
      } catch (err) {
        toast.error('Delete failed');
      } finally {
        setLoading(false);
      }
    }
  };

  const viewDepartmentEmployees = (dept) => {
    setSelectedDepartment(dept);
    setShowEmployeesModal(true);
  };

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalEmployees = departments.reduce((sum, dept) => sum + (dept.employeeCount || dept.employees?.length || 0), 0);

  const exportToCSV = () => {
    const headers = ['Department Name', 'Description', 'Employee Count', 'Employees List'];
    const rows = departments.map(dept => [
      dept.name,
      dept.description || 'No description',
      dept.employeeCount || dept.employees?.length || 0,
      dept.employees?.map(emp => emp.fullname).join(', ') || 'No employees'
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `departments_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Departments exported successfully!');
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Departments Report</title>
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
            <div class="title">Departments Report</div>
            <p>Generated: ${new Date().toLocaleString()}</p>
          </div>
          </table>
            <thead>
              <tr><th>Department</th><th>Description</th><th>Employees Count</th><th>Employees List</th></tr>
            </thead>
            <tbody>
              ${departments.map(dept => `
                <tr>
                  <td>${dept.name}</td>
                  <td>${dept.description || 'No description'}</td>
                  <td>${dept.employeeCount || dept.employees?.length || 0}</td>
                  <td>${dept.employees?.map(emp => emp.fullname).join(', ') || 'No employees'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer"><p>Total Departments: ${departments.length} | Total Employees: ${totalEmployees}</p></div>
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
              <h1 className="text-2xl md:text-3xl font-semibold text-gray-800">
                Department Management
              </h1>
              <p className="text-gray-500 text-sm mt-1">Manage your organization's departments</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={exportToCSV}
                disabled={departments.length === 0}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaDownload size={14} /> Export
              </button>
              <button 
                onClick={printReport}
                disabled={departments.length === 0}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaPrint size={14} /> Print
              </button>
              <button
                onClick={() => { 
                  setEditingDept(null); 
                  setFormData({ name: '', description: '' }); 
                  setShowModal(true); 
                }}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
              >
                <FaPlus size={14} /> Add Department
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Departments</p>
                <p className="text-3xl font-semibold text-gray-800">{departments.length}</p>
              </div>
              <div className="text-gray-400">
                <FaBuilding size={28} />
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Employees</p>
                <p className="text-3xl font-semibold text-gray-800">{totalEmployees}</p>
              </div>
              <div className="text-gray-400">
                <FaUsers size={28} />
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Avg Employees/Dept</p>
                <p className="text-3xl font-semibold text-gray-800">
                  {departments.length > 0 ? (totalEmployees / departments.length).toFixed(1) : 0}
                </p>
              </div>
              <div className="text-gray-400">
                <FaUsers size={28} />
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search departments by name or description..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition flex items-center justify-center gap-2 text-sm"
              >
                <FaTimes size={12} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Departments Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20 bg-white border border-gray-200 rounded-lg">
            <FaSpinner className="animate-spin text-gray-500 text-2xl" />
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-lg">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <FaBuilding className="text-3xl text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">No Departments Found</h3>
            <p className="text-gray-500 text-sm">Click "Add Department" to create your first department</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDepartments.map((dept) => (
              <div 
                key={dept._id} 
                className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200 overflow-hidden"
              >
                {/* Card Header */}
                <div className="border-b border-gray-100 px-4 py-3 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <FaBuilding className="text-blue-500 text-sm" />
                      <h3 className="font-semibold text-gray-800 truncate">{dept.name}</h3>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => { 
                          setEditingDept(dept); 
                          setFormData({ name: dept.name, description: dept.description || '' }); 
                          setShowModal(true); 
                        }} 
                        className="p-1.5 text-gray-500 hover:text-blue-600 transition"
                        title="Edit"
                      >
                        <FaEdit size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(dept._id)} 
                        className="p-1.5 text-gray-500 hover:text-red-600 transition"
                        title="Delete"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Card Body */}
                <div className="p-4">
                  <p className="text-gray-500 text-sm leading-relaxed mb-3">
                    {dept.description || 'No description provided'}
                  </p>
                  
                  {/* Employee Count and View Button */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <FaUsers className="text-gray-400 text-sm" />
                      <span className="text-sm font-medium text-gray-700">
                        {dept.employeeCount || dept.employees?.length || 0} Employees
                      </span>
                    </div>
                    <button
                      onClick={() => viewDepartmentEmployees(dept)}
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                    >
                      <FaEye size={12} /> View All
                    </button>
                  </div>
                  
                  {/* Show first 3 employees preview */}
                  {dept.employees && dept.employees.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs text-gray-400 font-medium">Recent Employees:</p>
                      {dept.employees.slice(0, 3).map((emp, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                          <FaUser size={10} />
                          <span>{emp.fullname}</span>
                          <span className="text-gray-400">•</span>
                          <span>{emp.position}</span>
                        </div>
                      ))}
                      {dept.employees.length > 3 && (
                        <p className="text-xs text-blue-500 cursor-pointer hover:underline" onClick={() => viewDepartmentEmployees(dept)}>
                          +{dept.employees.length - 3} more employees
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Employees List Modal */}
        {showEmployeesModal && selectedDepartment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowEmployeesModal(false)}>
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                      {selectedDepartment.name} - Employees
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Total {selectedDepartment.employees?.length || 0} employees in this department
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowEmployeesModal(false)} 
                    className="text-gray-400 hover:text-gray-600 transition text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="overflow-y-auto max-h-[60vh]">
                {selectedDepartment.employees && selectedDepartment.employees.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedDepartment.employees.map((emp) => (
                        <tr key={emp._id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                {emp.fullname?.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-gray-900">{emp.fullname}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">{emp.position}</span>
                           </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <FaEnvelope className="text-gray-400 text-xs" />
                              <span className="text-sm text-gray-600">{emp.email}</span>
                            </div>
                           </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <FaPhone className="text-gray-400 text-xs" />
                              <span className="text-sm text-gray-600">{emp.phone || 'N/A'}</span>
                            </div>
                           </td>
                         </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-12">
                    <FaUsers className="text-5xl text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No employees assigned to this department yet</p>
                  </div>
                )}
              </div>
              
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                <button
                  onClick={() => setShowEmployeesModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="border-b border-gray-200 px-5 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      {editingDept ? 'Edit Department' : 'Add New Department'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {editingDept ? 'Update department information' : 'Create a new department'}
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowModal(false)} 
                    className="text-gray-400 hover:text-gray-600 transition text-xl"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="p-5">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department Name *</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Information Technology"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    required 
                  />
                </div>
                
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea 
                    placeholder="Describe the department's purpose and responsibilities..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none" 
                    rows="3" 
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                  <p className="text-xs text-gray-400 mt-1">Optional</p>
                </div>
                
                <div className="flex justify-end gap-2">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)} 
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <FaSpinner className="animate-spin" size={14} /> : <FaPlus size={14} />}
                    {editingDept ? 'Update Department' : 'Create Department'}
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

export default Departments;