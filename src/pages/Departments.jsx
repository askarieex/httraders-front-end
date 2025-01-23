// src/pages/Departments.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // For navigation
import Sidebar from "../components/Sidebar";
import TopNavbar from "../components/TopNavbar";
import "./css/Departments.css"; // We'll create this CSS file next

function Departments() {
  const [departments, setDepartments] = useState([]);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);

  // Single search field
  const [searchTerm, setSearchTerm] = useState("");

  // React Router's navigation hook
  const navigate = useNavigate();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/departments", {
        headers: getAuthHeader(),
      });
      setDepartments(res.data);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  // Open "Add" modal
  const handleOpenAddModal = () => {
    setSelectedDept(null);
    setIsEditMode(false);
    setShowDeptModal(true);
  };

  // Open "Edit" modal
  const handleOpenEditModal = (dept) => {
    setSelectedDept(dept);
    setIsEditMode(true);
    setShowDeptModal(true);
  };

  // Close Add/Edit modal
  const handleCloseModal = () => {
    setShowDeptModal(false);
    setIsEditMode(false);
    setSelectedDept(null);
  };

  // Delete department
  const handleDelete = async (deptId) => {
    if (!window.confirm("Are you sure you want to delete this department?")) return;
    try {
      await axios.delete(`http://localhost:3000/api/departments/${deptId}`, {
        headers: getAuthHeader(),
      });
      setDepartments((prev) => prev.filter((d) => d.id !== deptId));
    } catch (error) {
      console.error("Error deleting department:", error);
    }
  };

  // Submit add/edit form
  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const newDeptData = {
      name: formData.get("name"),
    };

    try {
      if (isEditMode && selectedDept) {
        // Update
        const updatedRes = await axios.put(
          `http://localhost:3000/api/departments/${selectedDept.id}`,
          newDeptData,
          { headers: getAuthHeader() }
        );
        setDepartments((prev) =>
          prev.map((d) => (d.id === selectedDept.id ? updatedRes.data : d))
        );
      } else {
        // Create
        const newRes = await axios.post(
          "http://localhost:3000/api/departments",
          newDeptData,
          { headers: getAuthHeader() }
        );
        setDepartments((prev) => [...prev, newRes.data]);
      }
    } catch (error) {
      console.error("Error saving department:", error);
    }

    handleCloseModal();
  };

  // Navigate to the new page for viewing full department details (if needed)
  const handleView = (deptId) => {
    navigate(`/department/${deptId}`);
  };

  // Filter for single search field
  const filteredDepartments = departments.filter((dept) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const nameMatch = dept.name?.toLowerCase().includes(term);
    return nameMatch;
  });

  return (
    <div className="departments-page-wrapper">
      <Sidebar />
      <div className="departments-container">
        <TopNavbar />

        <div className="departments-content">
          {/* Title + Add Button */}
          <div className="top-actions">
            <h1 className="page-title">Manage Departments</h1>
            <button className="btn-add-new" onClick={handleOpenAddModal}>
              + Add Department
            </button>
          </div>

          {/* Single Live Search */}
          <div className="single-search-section">
            <label htmlFor="searchTerm">Search Department:</label>
            <input
              type="text"
              id="searchTerm"
              placeholder="Type to search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Table Section */}
          <div className="department-table-section">
            <h2 className="section-title">Existing Departments</h2>
            <div className="table-responsive">
              <table className="department-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDepartments.map((dept) => {
                    const term = searchTerm.toLowerCase();
                    const rowMatches = dept.name?.toLowerCase().includes(term);
                    return (
                      <tr
                        key={dept.id}
                        className={rowMatches && searchTerm ? "highlight-row" : ""}
                      >
                        <td>{dept.id}</td>
                        <td>{dept.name}</td>
                        <td>
                          <button className="btn-view" onClick={() => handleView(dept.id)}>
                            View
                          </button>
                          <button className="btn-edit" onClick={() => handleOpenEditModal(dept)}>
                            Edit
                          </button>
                          <button className="btn-delete" onClick={() => handleDelete(dept.id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredDepartments.length === 0 && (
                    <tr>
                      <td colSpan="3" className="text-center text-muted">
                        No departments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Add / Edit Department Modal */}
        {showDeptModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title">
                {isEditMode ? "Edit Department" : "Add New Department"}
              </h2>
              <form onSubmit={handleModalSubmit}>
                <div className="modal-form-field">
                  <label htmlFor="name">Department Name</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter Department Name"
                    defaultValue={isEditMode && selectedDept ? selectedDept.name : ""}
                    required
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-confirm">
                    {isEditMode ? "Update Department" : "Create Department"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Departments;
