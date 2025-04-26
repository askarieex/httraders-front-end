// src/pages/Departments.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // For navigation
import Sidebar from "../components/Sidebar";
import TopNavbar from "../components/TopNavbar";
import { FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaTimes } from "react-icons/fa";
import "./css/Departments.css"; // Updated CSS file

/**
 * Alert Component
 * Displays alert messages based on type and message.
 */
const Alert = ({ type, message, onClose }) => {
  return (
    <div className={`alert alert-${type}`}>
      <span>{message}</span>
      <button className="alert-close" onClick={onClose} aria-label="Close Alert">
        <FaTimes />
      </button>
    </div>
  );
};

function Departments() {
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // Environment Variable for API URL
  const API_URL = "http://localhost:3000/api";

  // Helper to get Authorization header
  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  /**
   * Function to add an alert
   */
  const addAlert = (type, message) => {
    const alertId = Date.now();
    setAlerts((prev) => [...prev, { id: alertId, type, message }]);
    // Automatically remove alert after 5 seconds
    setTimeout(() => {
      setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
    }, 5000);
  };

  /**
   * Function to fetch departments and categories
   */
  const fetchData = async () => {
    try {
      const [deptRes, catRes] = await Promise.all([
        axios.get(`${API_URL}/departments`, { headers: getAuthHeader() }),
        axios.get(`${API_URL}/categories`, { headers: getAuthHeader() }),
      ]);

      setDepartments(deptRes.data);
      setCategories(catRes.data);

      // Compute category counts per department
      const counts = {};
      deptRes.data.forEach((dept) => {
        counts[dept.id] = 0;
      });
      catRes.data.forEach((cat) => {
        if (counts[cat.department_id] !== undefined) {
          counts[cat.department_id] += 1;
        }
      });
      setCategoryCounts(counts);

      addAlert("success", "Departments and Categories fetched successfully.");
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.response?.data?.message || "Error fetching data.");
      addAlert("danger", "Failed to fetch departments and categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Function to open the Add Department Modal
   */
  const handleOpenAddModal = () => {
    setSelectedDept(null);
    setIsEditMode(false);
    setShowDeptModal(true);
  };

  /**
   * Function to open the Edit Department Modal
   */
  const handleOpenEditModal = (dept) => {
    setSelectedDept(dept);
    setIsEditMode(true);
    setShowDeptModal(true);
  };

  /**
   * Function to close the Department Modal
   */
  const handleCloseModal = () => {
    setShowDeptModal(false);
    setIsEditMode(false);
    setSelectedDept(null);
  };

  /**
   * Function to delete a department
   * Enables deletion only if department has 0 categories
   */
  const handleDelete = async (deptId) => {
    try {
      const currentCount = categoryCounts[deptId] || 0;
      if (currentCount > 0) {
        addAlert("danger", "Cannot delete department because it contains categories.");
        return;
      }

      if (!window.confirm("Are you sure you want to delete this department?")) return;

      await axios.delete(`${API_URL}/departments/${deptId}`, {
        headers: getAuthHeader(),
      });

      setDepartments((prev) => prev.filter((d) => d.id !== deptId));
      setCategoryCounts((prev) => {
        const updated = { ...prev };
        delete updated[deptId];
        return updated;
      });
      addAlert("success", "Department deleted successfully.");

      // If the deleted department was selected, reset selection
      if (selectedDeptId === deptId) {
        setSelectedDeptId("");
        setFilteredCategories([]);
      }
    } catch (error) {
      console.error("Error deleting department:", error);
      addAlert("danger", "Failed to delete department.");
    }
  };

  /**
   * Submit add/edit form
   */
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
          `${API_URL}/departments/${selectedDept.id}`,
          newDeptData,
          { headers: getAuthHeader() }
        );
        setDepartments((prev) =>
          prev.map((d) => (d.id === selectedDept.id ? updatedRes.data : d))
        );
        addAlert("success", "Department updated successfully.");
      } else {
        // Create
        const newRes = await axios.post(
          `${API_URL}/departments`,
          newDeptData,
          { headers: getAuthHeader() }
        );
        setDepartments((prev) => [...prev, newRes.data]);
        setCategoryCounts((prev) => ({ ...prev, [newRes.data.id]: 0 }));
        addAlert("success", "Department added successfully.");
      }
    } catch (error) {
      console.error("Error saving department:", error);
      addAlert("danger", "Failed to save department.");
    }

    handleCloseModal();
  };

  /**
   * Navigate to the department details page
   */
  const handleView = (deptId) => {
    navigate(`/department/${deptId}`);
  };

  /**
   * Handle department selection from dropdown
   */
  const handleSelectDepartment = (e) => {
    const deptId = e.target.value;
    setSelectedDeptId(deptId);
    if (deptId) {
      const cats = categories.filter((cat) => cat.department_id === deptId);
      setFilteredCategories(cats);
    } else {
      setFilteredCategories([]);
    }
  };

  /**
   * Filter departments based on search term
   */
  const filteredDepartments = departments.filter((dept) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return dept.name?.toLowerCase().includes(term);
  });

  return (
    <div className="departments-page-wrapper">
      <Sidebar />
      <div className="departments-container">
        <TopNavbar />

        <div className="departments-content">
          {/* Alerts Section */}
          <div className="alerts-section">
            {alerts.map((alert) => (
              <Alert
                key={alert.id}
                type={alert.type}
                message={alert.message}
                onClose={() =>
                  setAlerts((prev) => prev.filter((a) => a.id !== alert.id))
                }
              />
            ))}
          </div>

          {/* Title + Add Button */}
          <div className="top-actions">
            <h1 className="page-title">Manage Departments</h1>
            <button className="btn-add-new" onClick={handleOpenAddModal}>
              <FaPlus /> Add Department
            </button>
          </div>

          {/* Search Departments */}
          <div className="single-search-section">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                id="searchTerm"
                placeholder="Search by department name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Department Selection Dropdown */}
          <div className="department-selection-section">
            <label htmlFor="departmentSelect">Select Department:</label>
            <select
              id="departmentSelect"
              value={selectedDeptId}
              onChange={handleSelectDepartment}
            >
              <option value="">-- All Departments --</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Department Table Section */}
          <div className="department-table-section">
            <h2 className="section-title">Existing Departments</h2>
            <div className="table-responsive">
              <table className="department-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Total Categories</th>
                    <th className="actions-header">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDepartments.map((dept) => {
                    const term = searchTerm.toLowerCase();
                    const rowMatches = dept.name?.toLowerCase().includes(term);
                    const hasCategories = (categoryCounts[dept.id] || 0) > 0;
                    return (
                      <tr
                        key={dept.id}
                        className={rowMatches && searchTerm ? "highlight-row" : ""}
                      >
                        <td>{dept.id}</td>
                        <td>{dept.name}</td>
                        <td>{categoryCounts[dept.id] || 0}</td>
                        <td className="actions-cell">
                          <button
                            className="btn-view"
                            onClick={() => handleView(dept.id)}
                            title="View Department"
                          >
                            <FaEye /> View
                          </button>
                          <button
                            className="btn-edit"
                            onClick={() => handleOpenEditModal(dept)}
                            title="Edit Department"
                          >
                            <FaEdit /> Edit
                          </button>
                          <button
                            className={`btn-delete ${hasCategories ? "disabled" : ""}`}
                            onClick={() => handleDelete(dept.id)}
                            title={
                              hasCategories
                                ? "Cannot delete department with existing categories"
                                : "Delete Department"
                            }
                            disabled={hasCategories}
                          >
                            <FaTrash /> Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredDepartments.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center text-muted">
                        No departments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Categories List Section */}
          {selectedDeptId && (
            <div className="categories-list-section">
              <h2 className="section-title">Categories in Selected Department</h2>
              <div className="table-responsive">
                <table className="category-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map((cat) => (
                      <tr key={cat.id}>
                        <td>{cat.id}</td>
                        <td>{cat.name}</td>
                      </tr>
                    ))}

                    {filteredCategories.length === 0 && (
                      <tr>
                        <td colSpan="2" className="text-center text-muted">
                          No categories found in this department.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Add / Edit Department Modal */}
        {showDeptModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div
              className="modal-container"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
            >
              <button
                className="modal-close"
                onClick={handleCloseModal}
                aria-label="Close Modal"
              >
                <FaTimes />
              </button>
              <h2 className="modal-title" id="modal-title">
                {isEditMode ? "Edit Department" : "Add New Department"}
              </h2>
              <form onSubmit={handleModalSubmit}>
                <div className="modal-form-field">
                  <label htmlFor="name">
                    Department Name<span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
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
