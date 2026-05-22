import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/departments');
      setDepartments(res.data);
    } catch (err) {
      toast.error('Failed to fetch departments');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDept) {
        await axios.put(`http://localhost:5000/api/departments/${editingDept._id}`, formData);
        toast.success('Department updated');
      } else {
        await axios.post('http://localhost:5000/api/departments', formData);
        toast.success('Department added');
      }
      setShowModal(false);
      setFormData({ name: '', description: '' });
      setEditingDept(null);
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this department?')) {
      try {
        await axios.delete(`http://localhost:5000/api/departments/${id}`);
        toast.success('Department deleted');
        fetchDepartments();
      } catch (err) {
        toast.error('Delete failed');
      }
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Department Management</h1>
          <button onClick={() => { setEditingDept(null); setFormData({ name: '', description: '' }); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <FaPlus /> Add Department
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map(dept => (
            <div key={dept._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold">{dept.name}</h3>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingDept(dept); setFormData({ name: dept.name, description: dept.description || '' }); setShowModal(true); }} className="text-blue-600"><FaEdit /></button>
                  <button onClick={() => handleDelete(dept._id)} className="text-red-600"><FaTrash /></button>
                </div>
              </div>
              <p className="text-gray-600">{dept.description || 'No description'}</p>
              <p className="text-sm text-gray-500 mt-4">Employees: {dept.employees?.length || 0}</p>
            </div>
          ))}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-96">
              <h2 className="text-xl font-bold mb-4">{editingDept ? 'Edit Department' : 'Add Department'}</h2>
              <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Department Name" className="w-full border rounded-lg px-3 py-2 mb-3" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                <textarea placeholder="Description" className="w-full border rounded-lg px-3 py-2 mb-3" rows="3" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea>
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

export default Departments;