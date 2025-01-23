// src/pages/Customers.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopNavbar from "../components/TopNavbar";
import { FaUserFriends, FaEdit, FaTrash } from 'react-icons/fa'; // Importing necessary icons
import "./css/Customers.css";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();

  // Helper to get Authorization header
  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/customers", {
        headers: getAuthHeader(),
      });
      setCustomers(res.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const handleOpenAddModal = () => {
    setSelectedCustomer(null);
    setIsEditMode(false);
    setShowCustomerModal(true);
  };

  const handleOpenEditModal = (customer) => {
    setSelectedCustomer(customer);
    setIsEditMode(true);
    setShowCustomerModal(true);
  };

  const handleCloseModal = () => {
    setShowCustomerModal(false);
    setIsEditMode(false);
    setSelectedCustomer(null);
  };

  const handleDelete = async (customerId) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) return;
    try {
      await axios.delete(`http://localhost:3000/api/customers/${customerId}`, {
        headers: getAuthHeader(),
      });
      setCustomers((prev) => prev.filter((c) => c.id !== customerId));
    } catch (error) {
      console.error("Error deleting customer:", error);
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const customerData = {
      name: formData.get("name"),
      address: formData.get("address"),
      phone: formData.get("phoneNumber"),
      balance: parseFloat(formData.get("balance")) || 0,
      totalInvoices: parseInt(formData.get("totalInvoices"), 10) || 0,
    };

    try {
      if (isEditMode && selectedCustomer) {
        const updatedRes = await axios.put(
          `http://localhost:3000/api/customers/${selectedCustomer.id}`,
          customerData,
          { headers: getAuthHeader() }
        );
        setCustomers((prev) =>
          prev.map((c) => (c.id === selectedCustomer.id ? updatedRes.data : c))
        );
      } else {
        const newRes = await axios.post(
          "http://localhost:3000/api/customers",
          customerData,
          { headers: getAuthHeader() }
        );
        setCustomers((prev) => [...prev, newRes.data]);
      }
    } catch (error) {
      console.error("Error saving customer:", error);
    }

    handleCloseModal();
  };

  const handleView = (customerId) => {
    navigate(`/customer/${customerId}`);
  };

  const filteredCustomers = customers.filter((customer) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(term) ||
      customer.address?.toLowerCase().includes(term) ||
      customer.phone?.includes(term)
    );
  });

  // Summary calculations
  const totalBalance = customers.reduce((acc, curr) => acc + (curr.balance || 0), 0);
  const totalInvoices = customers.reduce((acc, curr) => acc + (curr.totalInvoices || 0), 0);

  return (
    <div className="ledgers-page-wrapper">
      <Sidebar />
      <div className="ledgers-container">
        <TopNavbar />
        <div className="ledgers-content">
          {/* Summary Cards */}
          <div className="summary-cards">
            <div className="summary-card">
              <h3>Total Customers</h3>
              <p>{customers.length}</p>
            </div>
            <div className="summary-card">
              <h3>Total Balance</h3>
              <p>₹{totalBalance.toFixed(2)}</p>
            </div>
            <div className="summary-card">
              <h3>Total Invoices</h3>
              <p>{totalInvoices}</p>
            </div>
          </div>

          {/* Title + Add Button */}
          <div className="top-actions">
            <h1 className="page-title">Manage Customers</h1>
            <button className="btn-add-new" onClick={handleOpenAddModal}>
              <FaUserFriends /> Add Customer
            </button>
          </div>

          {/* Single Live Search */}
          <div className="single-search-section">
            <label htmlFor="searchTerm">Search:</label>
            <input
              type="text"
              id="searchTerm"
              placeholder="Search by name, address, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Table Section */}
          <div className="ledger-table-section">
            <h2 className="section-title">Existing Customers</h2>
            <div className="table-responsive">
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>S. No.</th>
                    <th>Name</th>
                    <th>Address</th>
                    <th>Phone Number</th>
                    <th>Balance (₹)</th>
                    <th>Total Invoices</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer, index) => (
                    <tr key={customer.id}>
                      <td>{index + 1}</td>
                      <td>{customer.name}</td>
                      <td>{customer.address}</td>
                      <td>{customer.phone}</td>
                      <td>₹{customer.balance?.toFixed(2)}</td>
                      <td>{customer.totalInvoices}</td>
                      <td className="actions-cell">
                        <button className="btn-view" onClick={() => handleView(customer.id)}>
                          View
                        </button>
                        <button className="btn-edit" onClick={() => handleOpenEditModal(customer)}>
                          <FaEdit /> Edit
                        </button>
                        <button className="btn-delete" onClick={() => handleDelete(customer.id)}>
                          <FaTrash /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center text-muted">
                        No customers found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Add / Edit Customer Modal */}
        {showCustomerModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title">
                {isEditMode ? "Edit Customer" : "Add New Customer"}
              </h2>
              <form onSubmit={handleModalSubmit}>
                <div className="modal-form-field">
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter Name"
                    defaultValue={isEditMode && selectedCustomer ? selectedCustomer.name : ""}
                    required
                  />
                </div>
                <div className="modal-form-field">
                  <label htmlFor="address">Address</label>
                  <textarea
                    name="address"
                    rows="3"
                    placeholder="Enter Address"
                    defaultValue={isEditMode && selectedCustomer ? selectedCustomer.address : ""}
                  ></textarea>
                </div>
                <div className="modal-form-field">
                  <label htmlFor="phoneNumber">Phone Number</label>
                  <input
                    type="text"
                    name="phoneNumber"
                    placeholder="Enter Phone Number"
                    defaultValue={isEditMode && selectedCustomer ? selectedCustomer.phone : ""}
                  />
                </div>
                <div className="modal-form-field">
                  <label htmlFor="balance">Balance (₹)</label>
                  <input
                    type="number"
                    name="balance"
                    step="0.01"
                    placeholder="Enter Balance"
                    defaultValue={isEditMode && selectedCustomer ? selectedCustomer.balance : "0"}
                  />
                </div>
                <div className="modal-form-field">
                  <label htmlFor="totalInvoices">Total Invoices</label>
                  <input
                    type="number"
                    name="totalInvoices"
                    placeholder="Enter Total Invoices"
                    defaultValue={isEditMode && selectedCustomer ? selectedCustomer.totalInvoices : "0"}
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-confirm">
                    {isEditMode ? "Update Customer" : "Create Customer"}
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

export default Customers;
