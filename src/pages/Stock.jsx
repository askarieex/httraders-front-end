// Stock.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import './css/Stock.css'; // Enhanced styles

function Stock() {
  // State Management
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [items, setItems] = useState([]);
  
  const [newItem, setNewItem] = useState({
    name: '',
    type: '',
    quantity: '',
    length: '',
    breadth: '',
    height: '',
    selling_price: '',
    purchasing_price: '',
    unit: ''
  });
  
  const [alerts, setAlerts] = useState([]); // Array of alert objects
  
  // States for Editing Items
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState({
    id: '',
    name: '',
    type: '',
    quantity: '',
    length: '',
    breadth: '',
    height: '',
    selling_price: '',
    purchasing_price: '',
    unit: '',
    category_id: ''
  });
  
  // Loading states
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Authentication Header
  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Formatter for INR Currency
  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '₹0.00';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  // Function to Add Alert
  const addAlert = (type, message) => {
    const id = Date.now();
    setAlerts(prevAlerts => [...prevAlerts, { id, type, message }]);

    // Remove alert after 5 seconds
    setTimeout(() => {
      setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== id));
    }, 5000);
  };

  // Fetch Departments
  useEffect(() => {
    const fetchDepartments = async () => {
      setIsLoadingDepartments(true);
      try {
        const response = await axios.get('http://localhost:3000/api/departments', {
          headers: getAuthHeader(),
        });
        setDepartments(response.data);
      } catch (error) {
        console.error('Error fetching departments:', error);
        addAlert('danger', 'Failed to fetch departments.');
      } finally {
        setIsLoadingDepartments(false);
      }
    };
    fetchDepartments();
  }, []);

  // Fetch Categories based on Selected Department
  useEffect(() => {
    const fetchCategories = async (deptId) => {
      setIsLoadingCategories(true);
      try {
        const response = await axios.get(`http://localhost:3000/api/categories?department_id=${deptId}`, {
          headers: getAuthHeader(),
        });
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        addAlert('danger', 'Failed to fetch categories.');
      } finally {
        setIsLoadingCategories(false);
      }
    };

    if (selectedDepartment) {
      fetchCategories(selectedDepartment);
      setSelectedCategory('');
      setItems([]);
    } else {
      setCategories([]);
      setSelectedCategory('');
      setItems([]);
    }
  }, [selectedDepartment]);

  // Fetch Items based on Selected Category
  useEffect(() => {
    const fetchItems = async (categoryId) => {
      setIsLoadingItems(true);
      try {
        const response = await axios.get(`http://localhost:3000/api/items?category_id=${categoryId}`, {
          headers: getAuthHeader(),
        });
        setItems(response.data);
      } catch (error) {
        console.error('Error fetching items:', error);
        addAlert('danger', 'Failed to fetch items.');
      } finally {
        setIsLoadingItems(false);
      }
    };

    if (selectedCategory) {
      fetchItems(selectedCategory);
    } else {
      setItems([]);
    }
  }, [selectedCategory]);

  // Handle Input Changes for New Item
  const handleNewItemChange = (e) => {
    const { name, value } = e.target;
    console.log(`Updating newItem - ${name}: ${value}`); // Debugging line
    setNewItem(prevItem => ({
      ...prevItem,
      [name]: value
    }));
  };

  // Handle Submission of New Item
  const handleNewItemSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!selectedCategory) {
      addAlert('warning', 'Please select a category.');
      setIsSubmitting(false);
      return;
    }

    // Destructure fields from newItem
    const { name, type, quantity, length, breadth, height, selling_price, purchasing_price, unit } = newItem;

    // Validate required fields (except height which can be optional)
    if (!name || !type || !quantity || !length || !breadth || selling_price === '' || purchasing_price === '' || !unit) {
      addAlert('warning', 'Please fill in all required fields (Height is optional).');
      setIsSubmitting(false);
      return;
    }

    console.log('Submitting New Item:', {
      name,
      type,
      quantity,
      length,
      breadth,
      height,
      selling_price,
      purchasing_price,
      unit,
      category_id: selectedCategory
    }); // Debugging line

    try {
      // Construct payload conditionally
      const payload = { 
        name, 
        type, 
        quantity: Number(quantity), 
        length, 
        breadth, 
        selling_price: Number(selling_price), 
        purchasing_price: Number(purchasing_price), 
        unit, 
        category_id: selectedCategory 
      };

      // Include height only if it's provided and not empty
      if (height && height.trim() !== '') {
        payload.height = Number(height);
      }

      const response = await axios.post(
        "http://localhost:3000/api/items",
        payload,
        { headers: getAuthHeader() }
      );
      setItems(prev => [...prev, response.data]);
      setNewItem({
        name: '',
        type: '',
        quantity: '',
        length: '',
        breadth: '',
        height: '',
        selling_price: '',
        purchasing_price: '',
        unit: ''
      });
      addAlert('success', 'Item added successfully.');
    } catch (error) {
      console.error("Error creating item:", error);
      if (error.response && error.response.data && error.response.data.message) {
        addAlert('danger', error.response.data.message);
      } else {
        addAlert('danger', "Error creating item.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal with Selected Item
  const handleEditClick = (item) => {
    console.log("Selected Item:", item); // Debugging line
    console.log("Selected Item Dimension:", item.dimension); // Debugging line

    if (item.dimension) {
      // Use regex to split by 'x' with optional spaces
      const dimensions = item.dimension.split(/\s*x\s*/i);
      console.log("Parsed Dimensions:", dimensions); // Debugging line

      if (dimensions.length === 3) {
        const [length, breadth, height] = dimensions.map(str => str.trim());
        console.log("Length:", length, "Breadth:", breadth, "Height:", height); // Debugging line

        setCurrentEditItem({ 
          id: item.id,
          name: item.name || '',
          type: item.type || '',
          quantity: item.quantity || '',
          length: length || '',
          breadth: breadth || '',
          height: height || '',
          selling_price: item.selling_price || '',
          purchasing_price: item.purchasing_price || '',
          unit: item.unit || '',
          category_id: item.category_id || ''
        });
      } else if (dimensions.length === 2) {
        const [length, breadth] = dimensions.map(str => str.trim());
        console.log("Length:", length, "Breadth:", breadth); // Debugging line

        setCurrentEditItem({ 
          id: item.id,
          name: item.name || '',
          type: item.type || '',
          quantity: item.quantity || '',
          length: length || '',
          breadth: breadth || '',
          height: '', // Height is missing
          selling_price: item.selling_price || '',
          purchasing_price: item.purchasing_price || '',
          unit: item.unit || '',
          category_id: item.category_id || ''
        });
      } else {
        // Handle incorrect dimension format
        console.warn("Dimension format incorrect:", item.dimension);
        setCurrentEditItem({ 
          id: item.id,
          name: item.name || '',
          type: item.type || '',
          quantity: item.quantity || '',
          length: '',
          breadth: '',
          height: '',
          selling_price: item.selling_price || '',
          purchasing_price: item.purchasing_price || '',
          unit: item.unit || '',
          category_id: item.category_id || ''
        });
      }
    } else {
      // Handle missing dimension
      console.warn("No dimension provided for item:", item);
      setCurrentEditItem({ 
        id: item.id,
        name: item.name || '',
        type: item.type || '',
        quantity: item.quantity || '',
        length: '',
        breadth: '',
        height: '',
        selling_price: item.selling_price || '',
        purchasing_price: item.purchasing_price || '',
        unit: item.unit || '',
        category_id: item.category_id || ''
      });
    }
    setIsEditModalOpen(true);
  };

  // Close Edit Modal
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setCurrentEditItem({
      id: '',
      name: '',
      type: '',
      quantity: '',
      length: '',
      breadth: '',
      height: '',
      selling_price: '',
      purchasing_price: '',
      unit: '',
      category_id: ''
    });
  };

  // Handle Edit Form Submission
  const handleEditFormSubmit = async (e) => {
    e.preventDefault();
    setIsEditing(true);

    const { id, name, type, quantity, length, breadth, height, selling_price, purchasing_price, unit } = currentEditItem;

    // Validate required fields (height is optional)
    if (!name || !type || !quantity || !length || !breadth || selling_price === '' || purchasing_price === '' || !unit) {
      addAlert('warning', 'Please fill in all required fields (Height is optional).');
      setIsEditing(false);
      return;
    }

    console.log('Submitting Edited Item:', {
      name,
      type,
      quantity,
      length,
      breadth,
      height,
      selling_price,
      purchasing_price,
      unit,
      category_id: selectedCategory || currentEditItem.category_id
    }); // Debugging line

    try {
      // Construct payload conditionally
      const payload = { 
        name, 
        type, 
        quantity: Number(quantity), 
        length, 
        breadth, 
        selling_price: Number(selling_price), 
        purchasing_price: Number(purchasing_price), 
        unit, 
        category_id: selectedCategory || currentEditItem.category_id 
      };

      // Include height only if it's provided and not empty
      if (height && height.trim() !== '') {
        payload.height = Number(height);
      }

      const response = await axios.put(
        `http://localhost:3000/api/items/${id}`,
        payload,
        { headers: getAuthHeader() }
      );

      // Update the items list
      setItems(prevItems => prevItems.map(item => item.id === id ? response.data : item));

      addAlert('success', 'Item updated successfully.');
      handleCloseEditModal();
    } catch (error) {
      console.error("Error updating item:", error);
      if (error.response && error.response.data && error.response.data.message) {
        addAlert('danger', error.response.data.message);
      } else {
        addAlert('danger', "Error updating item.");
      }
    } finally {
      setIsEditing(false);
    }
  };

  // Handle Input Changes in Edit Modal
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Updating currentEditItem - ${name}: ${value}`); // Debugging line
    setCurrentEditItem(prevItem => ({
      ...prevItem,
      [name]: value
    }));
  };

  // Handle Delete Item
  const handleDeleteClick = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this item?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:3000/api/items/${id}`, {
        headers: getAuthHeader(),
      });
      setItems(prevItems => prevItems.filter(item => item.id !== id));
      addAlert('success', 'Item deleted successfully.');
    } catch (error) {
      console.error("Error deleting item:", error);
      if (error.response && error.response.data && error.response.data.message) {
        addAlert('danger', error.response.data.message);
      } else {
        addAlert('danger', "Error deleting item.");
      }
    }
  };

  // Debugging: Log newItem state before submission
  useEffect(() => {
    console.log('New Item State:', newItem);
  }, [newItem]);

  return (
    <div className="stock-page-wrapper">
      <Sidebar />
      <div className="stock-container">

        <div className="container">
          <h1 className="page-title">Stock Management</h1>

          {/* Alert Container */}
          <div className="alert-container">
            {alerts.map(alert => (
              <div key={alert.id} className={`alert alert-${alert.type}`}>
                <span>{alert.message}</span>
                <button className="close-btn" onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}>&times;</button>
              </div>
            ))}
          </div>

          {/* Department and Category Selection */}
          <form onSubmit={handleNewItemSubmit} className="selection-form">
            <div className="form-row">
              {/* Department Selection */}
              <div className="form-group">
                <label htmlFor="department">Department</label>
                <select
                  id="department"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  required
                >
                  <option value="">-- Select Department --</option>
                  {isLoadingDepartments ? (
                    <option disabled>Loading departments...</option>
                  ) : (
                    departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Category Selection */}
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  disabled={!selectedDepartment || categories.length === 0 || isLoadingCategories}
                  required
                >
                  <option value="">-- Select Category --</option>
                  {isLoadingCategories ? (
                    <option disabled>Loading categories...</option>
                  ) : (
                    categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* New Item Form */}
            {selectedCategory && (
              <div className="new-item-form">
                <h2>Add New Item</h2>
                <div className="form-grid">
                  {/* Item Name */}
                  <div className="form-group">
                    <label htmlFor="item-name">Item Name</label>
                    <input
                      type="text"
                      id="item-name"
                      name="name"
                      value={newItem.name}
                      onChange={handleNewItemChange}
                      placeholder="Enter item name"
                      required
                    />
                  </div>

                  {/* Type */}
                  <div className="form-group">
                    <label htmlFor="type">Type</label>
                    <select
                      id="type"
                      name="type"
                      value={newItem.type}
                      onChange={handleNewItemChange}
                      required
                    >
                      <option value="">-- Select Type --</option>
                      <option value="Type1">Type 1</option>
                      <option value="Type2">Type 2</option>
                      {/* Add more types as needed */}
                    </select>
                  </div>

                  {/* Dimensions */}
                  <div className="form-group">
                    <label>Dimensions (L x B x H)</label>
                    <div className="dimensions-inputs">
                      <input
                        type="number"
                        id="length"
                        name="length"
                        value={newItem.length}
                        onChange={handleNewItemChange}
                        placeholder="Length (L)"
                        min="0"
                        step="0.01"
                        required
                      />
                      <input
                        type="number"
                        id="breadth"
                        name="breadth"
                        value={newItem.breadth}
                        onChange={handleNewItemChange}
                        placeholder="Breadth (B)"
                        min="0"
                        step="0.01"
                        required
                      />
                      <input
                        type="number"
                        id="height"
                        name="height"
                        value={newItem.height}
                        onChange={handleNewItemChange}
                        placeholder="Height (H)"
                        min="0"
                        step="0.01"
                        // Height is now optional
                      />
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="form-group">
                    <label htmlFor="quantity">Quantity</label>
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      value={newItem.quantity}
                      onChange={handleNewItemChange}
                      placeholder="Enter quantity"
                      min="0"
                      required
                    />
                  </div>

                  {/* Selling Price */}
                  <div className="form-group">
                    <label htmlFor="selling-price">Selling Price (₹)</label>
                    <input
                      type="number"
                      id="selling-price"
                      name="selling_price"
                      value={newItem.selling_price}
                      onChange={handleNewItemChange}
                      placeholder="Enter selling price"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>

                  {/* Purchasing Price */}
                  <div className="form-group">
                    <label htmlFor="purchasing-price">Purchasing Price (₹)</label>
                    <input
                      type="number"
                      id="purchasing-price"
                      name="purchasing_price"
                      value={newItem.purchasing_price}
                      onChange={handleNewItemChange}
                      placeholder="Enter purchasing price"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>

                  {/* Unit */}
                  <div className="form-group">
                    <label htmlFor="unit">Unit</label>
                    <select
                      id="unit"
                      name="unit"
                      value={newItem.unit}
                      onChange={handleNewItemChange}
                      required
                    >
                      <option value="">-- Select Unit --</option>
                      <option value="CFT">CFT</option>
                      <option value="RFT">RFT</option>
                      {/* Add more units as needed */}
                    </select>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="form-group button-group">
                  <button type="submit" className="btn-confirm" disabled={isSubmitting}>
                    {isSubmitting ? 'Adding...' : 'Add Item'}
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* Items Table */}
          <div className="items-table">
            <h2>Items List</h2>
            {isLoadingItems ? (
              <p className="no-items">Loading items...</p>
            ) : items.length > 0 ? (
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Dimensions (L x B x H)</th>
                      <th>Selling Price (₹)</th>
                      <th>Purchasing Price (₹)</th>
                      <th>Quantity</th>
                      <th>Unit</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.type}</td>
                        <td>{item.dimension}</td>
                        <td>
                          {formatCurrency(item.selling_price)}
                        </td>
                        <td>
                          {formatCurrency(item.purchasing_price)}
                        </td>
                        <td>{item.quantity}</td>
                        <td>{item.unit}</td>
                        <td>
                          <button
                            className="btn-edit"
                            onClick={() => handleEditClick(item)}
                            title="Edit Item"
                          >
                            Edit
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteClick(item.id)}
                            title="Delete Item"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="no-items">No items found for this category.</p>
            )}
          </div>
        </div>
      </div>

      {/* Alert Container Outside of stock-container for better positioning */}
      <div className="alert-container">
        {alerts.map(alert => (
          <div key={alert.id} className={`alert alert-${alert.type}`} data-icon="">
            <span>{alert.message}</span>
            <button className="close-btn" onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}>&times;</button>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit Item</h2>
            <form onSubmit={handleEditFormSubmit} className="edit-form">
              <div className="form-grid">
                {/* Item Name */}
                <div className="form-group">
                  <label htmlFor="edit-name">Item Name</label>
                  <input
                    type="text"
                    id="edit-name"
                    name="name"
                    value={currentEditItem.name}
                    onChange={handleEditInputChange}
                    placeholder="Enter item name"
                    required
                  />
                </div>

                {/* Type */}
                <div className="form-group">
                  <label htmlFor="edit-type">Type</label>
                  <select
                    id="edit-type"
                    name="type"
                    value={currentEditItem.type}
                    onChange={handleEditInputChange}
                    required
                  >
                    <option value="">-- Select Type --</option>
                    <option value="Type1">Type 1</option>
                    <option value="Type2">Type 2</option>
                    {/* Add more types as needed */}
                  </select>
                </div>

                {/* Dimensions */}
                <div className="form-group">
                  <label>Dimensions (L x B x H)</label>
                  <div className="dimensions-inputs">
                    <input
                      type="number"
                      id="edit-length"
                      name="length"
                      value={currentEditItem.length}
                      onChange={handleEditInputChange}
                      placeholder="Length (L)"
                      min="0"
                      step="0.01"
                      required
                    />
                    <input
                      type="number"
                      id="edit-breadth"
                      name="breadth"
                      value={currentEditItem.breadth}
                      onChange={handleEditInputChange}
                      placeholder="Breadth (B)"
                      min="0"
                      step="0.01"
                      required
                    />
                    <input
                      type="number"
                      id="edit-height"
                      name="height"
                      value={currentEditItem.height}
                      onChange={handleEditInputChange}
                      placeholder="Height (H)"
                      min="0"
                      step="0.01"
                      // Height is now optional
                    />
                  </div>
                </div>

                {/* Quantity */}
                <div className="form-group">
                  <label htmlFor="edit-quantity">Quantity</label>
                  <input
                    type="number"
                    id="edit-quantity"
                    name="quantity"
                    value={currentEditItem.quantity}
                    onChange={handleEditInputChange}
                    placeholder="Enter quantity"
                    min="0"
                    required
                  />
                </div>

                {/* Selling Price */}
                <div className="form-group">
                  <label htmlFor="edit-selling-price">Selling Price (₹)</label>
                  <input
                    type="number"
                    id="edit-selling-price"
                    name="selling_price"
                    value={currentEditItem.selling_price}
                    onChange={handleEditInputChange}
                    placeholder="Enter selling price"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                {/* Purchasing Price */}
                <div className="form-group">
                  <label htmlFor="edit-purchasing-price">Purchasing Price (₹)</label>
                  <input
                    type="number"
                    id="edit-purchasing-price"
                    name="purchasing_price"
                    value={currentEditItem.purchasing_price}
                    onChange={handleEditInputChange}
                    placeholder="Enter purchasing price"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                {/* Unit */}
                <div className="form-group">
                  <label htmlFor="edit-unit">Unit</label>
                  <select
                    id="edit-unit"
                    name="unit"
                    value={currentEditItem.unit}
                    onChange={handleEditInputChange}
                    required
                  >
                    <option value="">-- Select Unit --</option>
                    <option value="CFT">CFT</option>
                    <option value="RFT">RFT</option>
                    {/* Add more units as needed */}
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div className="form-group button-group">
                <button type="submit" className="btn-confirm" disabled={isEditing}>
                  {isEditing ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="btn-cancel" onClick={handleCloseEditModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Stock;
