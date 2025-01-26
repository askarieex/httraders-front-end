// src/pages/Customers.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
// import TopNavbar from "../components/TopNavbar";
import { FaUserFriends, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import "./css/Customers.css";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

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

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
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
   * Function to fetch customers, invoices, and transactions
   */
  const fetchAllData = async () => {
    try {
      setLoading(true);
      // Fetch Customers, Invoices, and Transactions in parallel
      const [customersRes, invoicesRes, transactionsRes] = await Promise.all([
        axios.get(`${API_URL}/customers`, { headers: getAuthHeader() }),
        axios.get(`${API_URL}/invoices`, { headers: getAuthHeader() }),
        axios.get(`${API_URL}/transactions`, { headers: getAuthHeader() }),
      ]);

      const customersData = customersRes.data;
      const invoicesData = invoicesRes.data;
      const transactionsData = transactionsRes.data;

      // Create lookup maps for invoices and transactions
      const invoicesMap = {};
      invoicesData.forEach((invoice) => {
        if (invoicesMap[invoice.customer_id]) {
          invoicesMap[invoice.customer_id].push(invoice);
        } else {
          invoicesMap[invoice.customer_id] = [invoice];
        }
      });

      const transactionsMap = {};
      transactionsData.forEach((transaction) => {
        if (transactionsMap[transaction.customer_id]) {
          transactionsMap[transaction.customer_id].push(transaction);
        } else {
          transactionsMap[transaction.customer_id] = [transaction];
        }
      });

      // Aggregate totalInvoices and totalTransactions for each customer
      const aggregatedCustomers = customersData.map((customer) => {
        const customerInvoices = invoicesMap[customer.id] || [];
        const customerTransactions = transactionsMap[customer.id] || [];

        return {
          ...customer,
          totalInvoices: customerInvoices.length,
          totalTransactions: customerTransactions.length,
          balance: parseFloat(customer.balance) || 0, // Ensure balance is a number
        };
      });

      setCustomers(aggregatedCustomers);
      addAlert("success", "Customers fetched successfully.");
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.response?.data?.message || "Error fetching data");
      addAlert("danger", "Failed to fetch customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Function to open the Add Customer Modal
   */
  const handleOpenAddModal = () => {
    setSelectedCustomer(null);
    setIsEditMode(false);
    setShowCustomerModal(true);
  };

  /**
   * Function to open the Edit Customer Modal
   */
  const handleOpenEditModal = (customer) => {
    setSelectedCustomer(customer);
    setIsEditMode(true);
    setShowCustomerModal(true);
  };

  /**
   * Function to close the Customer Modal
   */
  const handleCloseModal = () => {
    setShowCustomerModal(false);
    setIsEditMode(false);
    setSelectedCustomer(null);
  };

  /**
   * Function to delete a customer
   */
  const handleDelete = async (customerId) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) {
      addAlert("danger", "Customer not found.");
      return;
    }

    if (customer.totalTransactions > 0) {
      addAlert(
        "danger",
        "Cannot delete customer because they have existing transactions."
      );
      alert("Cannot delete customer because they have existing transactions.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this customer?"))
      return;
    try {
      await axios.delete(`${API_URL}/customers/${customerId}`, {
        headers: getAuthHeader(),
      });
      setCustomers((prev) => prev.filter((c) => c.id !== customerId));
      addAlert("success", "Customer deleted successfully.");
    } catch (error) {
      console.error("Error deleting customer:", error);
      addAlert("danger", "Failed to delete customer.");
    }
  };

  /**
   * Formik Validation Schema using Yup
   */
  const CustomerSchema = Yup.object().shape({
    name: Yup.string()
      .max(100, "Name must be at most 100 characters")
      .required("Name is required"),
    address: Yup.string().max(200, "Address must be at most 200 characters"),
    phoneNumber: Yup.string()
      .matches(
        /^[0-9]{10}$/,
        "Phone Number must be exactly 10 digits"
      )
      .required("Phone Number is required"),
    email: Yup.string().email("Invalid email format").nullable(),
  });

  /**
   * Function to handle form submission for adding/editing customers
   */
  const handleFormSubmit = async (values, { setSubmitting, resetForm }) => {
    const customerData = {
      name: values.name,
      address: values.address || null,
      phone: values.phoneNumber,
      email: values.email || null,
    };

    try {
      if (isEditMode && selectedCustomer) {
        const updatedRes = await axios.put(
          `${API_URL}/customers/${selectedCustomer.id}`,
          customerData,
          { headers: getAuthHeader() }
        );
        setCustomers((prev) =>
          prev.map((c) => (c.id === selectedCustomer.id ? updatedRes.data : c))
        );
        addAlert("success", "Customer updated successfully.");
      } else {
        const newRes = await axios.post(`${API_URL}/customers`, customerData, {
          headers: getAuthHeader(),
        });
        // Initialize totalInvoices and totalTransactions to 0 for the new customer
        setCustomers((prev) => [
          ...prev,
          {
            ...newRes.data,
            totalInvoices: 0,
            totalTransactions: 0,
            balance: parseFloat(newRes.data.balance) || 0,
          },
        ]);
        addAlert("success", "Customer added successfully.");
      }
      resetForm();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving customer:", error);
      if (error.response && error.response.data && error.response.data.message) {
        addAlert("danger", error.response.data.message);
      } else {
        addAlert("danger", "Failed to save customer.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Function to navigate to customer details page
   */
  const handleView = (customerId) => {
    navigate(`/customer/${customerId}`);
  };

  /**
   * Function to filter customers based on search term
   */
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
  const totalBalance = customers.reduce(
    (acc, curr) => acc + (parseFloat(curr.balance) || 0),
    0
  );
  const totalInvoices = customers.reduce(
    (acc, curr) => acc + (parseInt(curr.totalInvoices) || 0),
    0
  );
  const totalTransactions = customers.reduce(
    (acc, curr) => acc + (parseInt(curr.totalTransactions) || 0),
    0
  );

  /**
   * Early Returns for Loading and Error States
   */
  if (loading) {
    return (
      <div className="ledgers-page-wrapper">
        <Sidebar />
        <div className="ledgers-container">
          {/* <TopNavbar /> */}
          <div className="ledgers-content">
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
            <div className="loading">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ledgers-page-wrapper">
        <Sidebar />
        <div className="ledgers-container">
          {/* <TopNavbar /> */}
          <div className="ledgers-content">
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
            <div className="error">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ledgers-page-wrapper">
      <Sidebar />
      <div className="ledgers-container">
        {/* <TopNavbar /> */}
        <div className="ledgers-content">
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
            <div className="summary-card">
              <h3>Total Transactions</h3>
              <p>{totalTransactions}</p>
            </div>
          </div>

          {/* Title + Add Button */}
          <div className="top-actions">
            <h1 className="page-title">Manage Customers</h1>
            <button className="btn-add-new" onClick={handleOpenAddModal}>
              <FaUserFriends /> Add
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
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Balance (₹)</th>
                    <th>Total Invoices</th>
                    <th>Total Transactions</th>
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
                      <td>{customer.email || "-"}</td>
                      <td>₹{(parseFloat(customer.balance) || 0).toFixed(2)}</td>
                      <td>{parseInt(customer.totalInvoices) || 0}</td>
                      <td>{parseInt(customer.totalTransactions) || 0}</td>
                      <td className="actions-cell">
                        <button
                          className="btn-view"
                          onClick={() => handleView(customer.id)}
                        >
                          View
                        </button>
                        <button
                          className="btn-edit"
                          onClick={() => handleOpenEditModal(customer)}
                        >
                          <FaEdit /> Edit
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(customer.id)}
                        >
                          <FaTrash /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <tr>
                      <td colSpan="9" className="text-center text-muted">
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
          <div
            className="modal-overlay"
            onClick={handleCloseModal}
            aria-modal="true"
            role="dialog"
          >
            <div
              className="modal-container"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="modal-close"
                onClick={handleCloseModal}
                aria-label="Close Modal"
              >
                <FaTimes />
              </button>
              <h2 className="modal-title">
                {isEditMode ? "Edit Customer" : "Add New Customer"}
              </h2>
              <Formik
                initialValues={{
                  name: isEditMode && selectedCustomer ? selectedCustomer.name : "",
                  address:
                    isEditMode && selectedCustomer ? selectedCustomer.address : "",
                  phoneNumber:
                    isEditMode && selectedCustomer ? selectedCustomer.phone : "",
                  email:
                    isEditMode && selectedCustomer ? selectedCustomer.email : "",
                }}
                validationSchema={CustomerSchema}
                onSubmit={handleFormSubmit}
              >
                {({ isSubmitting }) => (
                  <Form className="customer-form">
                    {/* Name Field */}
                    <div className="form-group">
                      <label htmlFor="name">
                        Name<span className="required">*</span>
                      </label>
                      <Field
                        type="text"
                        id="name"
                        name="name"
                        placeholder="Enter Name"
                        className="form-input"
                      />
                      <ErrorMessage
                        name="name"
                        component="div"
                        className="error-message"
                      />
                    </div>

                    {/* Address Field */}
                    <div className="form-group">
                      <label htmlFor="address">Address</label>
                      <Field
                        as="textarea"
                        id="address"
                        name="address"
                        placeholder="Enter Address"
                        rows="2"
                        className="form-input"
                      />
                      <ErrorMessage
                        name="address"
                        component="div"
                        className="error-message"
                      />
                    </div>

                    {/* Phone Number Field */}
                    <div className="form-group">
                      <label htmlFor="phoneNumber">
                        Phone Number<span className="required">*</span>
                      </label>
                      <Field
                        type="text"
                        id="phoneNumber"
                        name="phoneNumber"
                        placeholder="Enter Phone Number"
                        className="form-input"
                      />
                      <ErrorMessage
                        name="phoneNumber"
                        component="div"
                        className="error-message"
                      />
                    </div>

                    {/* Email Field */}
                    <div className="form-group">
                      <label htmlFor="email">Email</label>
                      <Field
                        type="email"
                        id="email"
                        name="email"
                        placeholder="Enter Email"
                        className="form-input"
                      />
                      <ErrorMessage
                        name="email"
                        component="div"
                        className="error-message"
                      />
                    </div>

                    {/* Form Actions */}
                    <div className="modal-actions">
                      <button
                        type="button"
                        className="btn-cancel"
                        onClick={handleCloseModal}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-confirm"
                        disabled={isSubmitting}
                      >
                        {isEditMode ? "Update" : "Create"}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Customers;
