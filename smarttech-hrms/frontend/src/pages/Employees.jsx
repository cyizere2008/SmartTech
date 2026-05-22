import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaEdit, FaTrash, FaSearch, FaPlus, FaUserPlus } from 'react-icons/fa';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    fullname: '',
    gender: 'Male',
    dateOfBirth: '',
    email: '',
    phone: '',
    address: '',
    position: '',
    department: '',
    salary: '',
    joiningDate: ''
  });
  const [departments, setDepartments] = useState([]);
  const [profilePhoto, setProfilePhoto] = useState(null);

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/employees');
      setEmployees(res.data);
    } catch (err) {
      toast.error('Failed to fetch employees');
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/departments');
      setDepartments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm) {
      fetchEmployees();
      return;
    }
    try {
      const res = await axios.get(`http://localhost:5000/api/employees/search?q=${searchTerm}`);
      setEmployees(res.data);
    } catch (err) {
      toast.error('Search failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key]) data.append(key, formData[key]);
    });
    if (profilePhoto) data.append('profilePhoto', profilePhoto);

    try {
      if (editingEmployee) {
        await axios.put(`http://localhost:5000/api/employees/${editingEmployee._id}`, data);
        toast.success('Employee updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/employees', data);
        toast.success('Employee added successfully');
      }
      setShowModal(false);
      resetForm();
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await axios.delete(`http://localhost:5000/api/employees/${id}`);
        toast.success('Employee deleted successfully');
        fetchEmployees();
      } catch (err) {
        toast.error('Delete failed');
      }
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      fullname: employee.fullname || '',
      gender: employee.gender || 'Male',
      dateOfBirth: employee.dateOfBirth?.split('T')[0] || '',
      email: employee.email || '',
      phone: employee.phone || '',
      address: employee.address || '',
      position: employee.position || '',
      department: employee.department?._id || '',
      salary: employee.salary || '',
      joiningDate: employee.joiningDate?.split('T')[0] || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingEmployee(null);
    setFormData({
      fullname: '',
      gender: 'Male',
      dateOfBirth: '',
      email: '',
      phone: '',
      address: '',
      position: '',
      department: '',
      salary: '',
      joiningDate: ''
    });
    setProfilePhoto(null);
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Employee Management</h1>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <FaPlus /> Add Employee
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or position..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button
              onClick={handleSearch}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
            >
              Search
            </button>
          </div>
        </div>

        {/* Employees Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {emp.profilePhoto ? (
                        <img src={`http://localhost:5000${emp.profilePhoto}`} alt={emp.fullname} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <FaUserPlus className="text-gray-500" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium">{emp.fullname}</td>
                    <td className="px-6 py-4">{emp.email}</td>
                    <td className="px-6 py-4">{emp.position}</td>
                    <td className="px-6 py-4">{emp.department?.name || 'N/A'}</td>
                    <td className="px-6 py-4">${emp.salary?.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(emp)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(emp._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h2>
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Full Name *</label>
                      <input type="text" className="w-full border rounded-lg px-3 py-2" value={formData.fullname} onChange={(e) => setFormData({...formData, fullname: e.target.value})} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Gender</label>
                      <select className="w-full border rounded-lg px-3 py-2" value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})}>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Date of Birth</label>
                      <input type="date" className="w-full border rounded-lg px-3 py-2" value={formData.dateOfBirth} onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email *</label>
                      <input type="email" className="w-full border rounded-lg px-3 py-2" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone</label>
                      <input type="tel" className="w-full border rounded-lg px-3 py-2" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Position *</label>
                      <input type="text" className="w-full border rounded-lg px-3 py-2" value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Department</label>
                      <select className="w-full border rounded-lg px-3 py-2" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})}>
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                          <option key={dept._id} value={dept._id}>{dept.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Salary</label>
                      <input type="number" className="w-full border rounded-lg px-3 py-2" value={formData.salary} onChange={(e) => setFormData({...formData, salary: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Joining Date</label>
                      <input type="date" className="w-full border rounded-lg px-3 py-2" value={formData.joiningDate} onChange={(e) => setFormData({...formData, joiningDate: e.target.value})} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Address</label>
                      <textarea className="w-full border rounded-lg px-3 py-2" rows="2" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})}></textarea>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Profile Photo</label>
                      <input type="file" accept="image/*" onChange={(e) => setProfilePhoto(e.target.files[0])} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingEmployee ? 'Update' : 'Save'}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Employees;