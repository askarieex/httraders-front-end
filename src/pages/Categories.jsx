import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import TopNavbar from "../components/TopNavbar";
import "./css/Categories.css"; // Create this CSS file for styling if needed

function Categories() {
  const [categories, setCategories] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]); // State for department list
  const [showCatModal, setShowCatModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    fetchCategories();
    fetchDepartmentsList(); // Fetch list of departments on mount
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/categories", {
        headers: getAuthHeader(),
      });
      setCategories(res.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchDepartmentsList = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/departments", {
        headers: getAuthHeader(),
      });
      setDepartmentsList(res.data);
    } catch (error) {
      console.error("Error fetching departments list:", error);
    }
  };

  const handleOpenAddModal = () => {
    setSelectedCat(null);
    setIsEditMode(false);
    setShowCatModal(true);
  };

  const handleOpenEditModal = (cat) => {
    setSelectedCat(cat);
    setIsEditMode(true);
    setShowCatModal(true);
  };

  const handleCloseModal = () => {
    setShowCatModal(false);
    setIsEditMode(false);
    setSelectedCat(null);
  };

  const handleDelete = async (catId) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await axios.delete(`http://localhost:3000/api/categories/${catId}`, {
        headers: getAuthHeader(),
      });
      setCategories((prev) => prev.filter((c) => c.id !== catId));
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const newCatData = {
      name: formData.get("name"),
      department_id: formData.get("department_id"),
    };

    try {
      if (isEditMode && selectedCat) {
        const updatedRes = await axios.put(
          `http://localhost:3000/api/categories/${selectedCat.id}`,
          newCatData,
          { headers: getAuthHeader() }
        );
        setCategories((prev) =>
          prev.map((c) => (c.id === selectedCat.id ? updatedRes.data : c))
        );
      } else {
        const newRes = await axios.post(
          "http://localhost:3000/api/categories",
          newCatData,
          { headers: getAuthHeader() }
        );
        setCategories((prev) => [...prev, newRes.data]);
      }
    } catch (error) {
      console.error("Error saving category:", error);
    }

    handleCloseModal();
  };

  const filteredCategories = categories.filter((cat) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return cat.name?.toLowerCase().includes(term);
  });

  return (
    <div className="categories-page-wrapper">
      <Sidebar />
      <div className="categories-container">
        <TopNavbar />

        <div className="categories-content">
          <div className="top-actions">
            <h1 className="page-title">Manage Categories</h1>
            <button className="btn-add-new" onClick={handleOpenAddModal}>
              + Add Category
            </button>
          </div>

          <div className="single-search-section">
            <label htmlFor="searchTerm">Search Category:</label>
            <input
              type="text"
              id="searchTerm"
              placeholder="Type to search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="category-table-section">
            <h2 className="section-title">Existing Categories</h2>
            <div className="table-responsive">
              <table className="category-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Department ID</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((cat) => {
                    const term = searchTerm.toLowerCase();
                    const rowMatches = cat.name?.toLowerCase().includes(term);
                    return (
                      <tr
                        key={cat.id}
                        className={rowMatches && searchTerm ? "highlight-row" : ""}
                      >
                        <td>{cat.id}</td>
                        <td>{cat.name}</td>
                        <td>{cat.department_id}</td>
                        <td>
                          <button className="btn-edit" onClick={() => handleOpenEditModal(cat)}>
                            Edit
                          </button>
                          <button className="btn-delete" onClick={() => handleDelete(cat.id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredCategories.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center text-muted">
                        No categories found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {showCatModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title">
                {isEditMode ? "Edit Category" : "Add New Category"}
              </h2>
              <form onSubmit={handleModalSubmit}>
                <div className="modal-form-field">
                  <label htmlFor="name">Category Name</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter Category Name"
                    defaultValue={isEditMode && selectedCat ? selectedCat.name : ""}
                    required
                  />
                </div>

                {/* Department selection dropdown */}
                <div className="modal-form-field">
                  <label htmlFor="department_id">Select Department</label>
                  <select
                    name="department_id"
                    defaultValue={isEditMode && selectedCat ? selectedCat.department_id : ""}
                    required
                  >
                    <option value="">-- Select Department --</option>
                    {departmentsList.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-confirm">
                    {isEditMode ? "Update Category" : "Create Category"}
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

export default Categories;
