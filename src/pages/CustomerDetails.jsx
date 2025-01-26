// src/pages/CustomerDetails.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

import {
  FaSearch,
  FaPlus,
  FaDownload,
  FaFilter,
  FaEdit,
  FaTrash,
  FaArrowLeft,
  FaSave,
  FaTimes,
  FaExchangeAlt,
  FaMoneyBillWave,
  FaBalanceScale,
  FaClipboardList,
} from "react-icons/fa";
import ReactPaginate from "react-paginate";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { CSVLink } from "react-csv";
import TransactionDetailsModal from "../components/TransactionDetailsModal";
import "./css/CustomerDetails.css";
import Select from "react-select";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import moment from "moment";

function CustomerDetails() {
  const { id } = useParams(); // Customer ID from URL
  const navigate = useNavigate();

  // State declarations
  const [customer, setCustomer] = useState(null);
  const [allTransactions, setAllTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);

  const [totalInvoices, setTotalInvoices] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters/states for search and sort
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [transactionType, setTransactionType] = useState("All");
  const [paymentMode, setPaymentMode] = useState("All");
  const [transactionStatus, setTransactionStatus] = useState("All");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Modals
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Alerts
  const [alerts, setAlerts] = useState([]);

  // Tabs: "transactions" or "invoices"
  const [activeTab, setActiveTab] = useState("transactions");

  // Environment Variable for API URL
  const API_URL = "http://localhost:3000/api";

  // Helper to get Authorization header
  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  /**
   * Function to fetch customer data
   */
  const fetchCustomerData = async () => {
    try {
      const customerRes = await axios.get(`${API_URL}/customers/${id}`, {
        headers: getAuthHeader(),
      });
      console.log("Customer data fetched:", customerRes.data);
      setCustomer(customerRes.data);
    } catch (err) {
      console.error("Error fetching customer data:", err);
      addAlert("danger", "Failed to fetch customer data.", "big");
    }
  };

  /**
   * Function to fetch all necessary data
   */
  const fetchAllData = async () => {
    try {
      console.log("Fetching all data...");

      // 1. Fetch Customer Data (includes balance)
      await fetchCustomerData();

      // 2. Fetch Transactions
      const transactionsRes = await axios.get(
        `${API_URL}/transactions?customer_id=${id}`,
        { headers: getAuthHeader() }
      );
      console.log("Transactions data fetched:", transactionsRes.data);
      setAllTransactions(transactionsRes.data);
      setFilteredTransactions(transactionsRes.data);

      // 3. Fetch Invoices
      const invoicesRes = await axios.get(
        `${API_URL}/invoices?customer_id=${id}`,
        { headers: getAuthHeader() }
      );
      const filteredInvoices = invoicesRes.data.filter((inv) => {
        const received = parseFloat(inv.receivedAmount);
        const total = parseFloat(inv.total);
        return !isNaN(received) && !isNaN(total) && received < total;
      });
      console.log("Invoices data fetched and filtered:", filteredInvoices);
      setAllInvoices(filteredInvoices);

      // 4. Fetch Departments
      const departmentsRes = await axios.get(`${API_URL}/departments`, {
        headers: getAuthHeader(),
      });
      console.log("Departments data fetched:", departmentsRes.data);
      setAllDepartments(departmentsRes.data);

      // 5. Fetch Total Invoices
      console.log("Fetching total invoices...");
      const totalInvoicesRes = await axios.get(
        `${API_URL}/invoices/total/${id}`,
        { headers: getAuthHeader() }
      );
      console.log("Total invoices fetched:", totalInvoicesRes.data);
      setTotalInvoices(totalInvoicesRes.data.totalInvoices);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.response?.data?.message || "Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Function to fetch invoices separately
   */
  const fetchInvoices = async () => {
    try {
      console.log("Fetching invoices...");
      const invoicesRes = await axios.get(
        `${API_URL}/invoices?customer_id=${id}`,
        { headers: getAuthHeader() }
      );
      const filteredInvoices = invoicesRes.data.filter((inv) => {
        const received = parseFloat(inv.receivedAmount);
        const total = parseFloat(inv.total);
        return !isNaN(received) && !isNaN(total) && received < total;
      });
      console.log("Invoices data fetched and filtered:", filteredInvoices);
      setAllInvoices(filteredInvoices);
      // Update totalInvoices if necessary
      setTotalInvoices(filteredInvoices.length);
    } catch (err) {
      console.error("Error fetching invoices:", err);
      addAlert("danger", "Failed to fetch invoices.", "big");
    }
  };

  /**
   * Initial Data Fetching
   */
  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /**
   * Implement Polling to Fetch Customer Data Every 30 Seconds
   */
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log("Polling: Fetching latest customer data...");
      fetchCustomerData();
    }, 30000); // 30000 ms = 30 seconds

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Re-filter Transactions When Filter States Change
   */
  useEffect(() => {
    filterAndSortTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dateFrom,
    dateTo,
    searchTerm,
    transactionType,
    paymentMode,
    transactionStatus,
    allTransactions,
  ]);

  /**
   * Function to Filter and Sort Transactions
   */
  const filterAndSortTransactions = () => {
    console.log("Filtering and sorting transactions...");
    let temp = [...allTransactions];

    // 1. Date Range
    if (dateFrom) {
      temp = temp.filter((tx) => new Date(tx.transactionDate) >= dateFrom);
    }
    if (dateTo) {
      temp = temp.filter((tx) => new Date(tx.transactionDate) <= dateTo);
    }

    // 2. Type
    if (transactionType !== "All") {
      temp = temp.filter((tx) => tx.transactionType === transactionType);
    }

    // 3. Payment Mode
    if (paymentMode !== "All") {
      temp = temp.filter((tx) => tx.paymentMode === paymentMode);
    }

    // 4. Status
    if (transactionStatus !== "All") {
      temp = temp.filter((tx) => tx.transactionStatus === transactionStatus);
    }

    // 5. Search by invoiceNumber or referenceId
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      temp = temp.filter(
        (tx) =>
          (tx.invoiceNumber &&
            tx.invoiceNumber.toLowerCase().includes(lowerSearch)) ||
          (tx.referenceId &&
            tx.referenceId.toLowerCase().includes(lowerSearch))
      );
    }

    // 6. Sort by createdAt descending (newest first)
    temp.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    console.log("Filtered and sorted transactions:", temp);
    setFilteredTransactions(temp);
    setCurrentPage(0);
  };

  /**
   * Pagination Handlers
   */
  const handlePageChange = ({ selected }) => {
    console.log("Changing to page:", selected);
    setCurrentPage(selected);
  };
  const handleRowsPerPageChange = (e) => {
    const value = parseInt(e.target.value, 10);
    console.log("Rows per page changed to:", value);
    setRowsPerPage(value);
    setCurrentPage(0);
  };

  /**
   * CSV Export Configuration
   */
  const headers = [
    { label: "Transaction ID", key: "id" },
    { label: "Customer ID", key: "customer_id" },
    { label: "Invoice Number", key: "invoiceNumber" },
    { label: "Transaction Date", key: "transactionDate" },
    { label: "Transaction Type", key: "transactionType" },
    { label: "Amount", key: "amount" },
    { label: "Payment Mode", key: "paymentMode" },
    { label: "Pending Amount", key: "pendingAmount" },
    { label: "Transaction Status", key: "transactionStatus" },
    { label: "Created At", key: "createdAt" },
    { label: "Description", key: "description" },
    { label: "GST Details", key: "gstDetails" },
    { label: "Department", key: "Department.name" },
  ];

  const csvReport = {
    filename: "Transactions_Report.csv",
    headers,
    data: filteredTransactions.map((tx) => ({
      ...tx,
      "Department.name": tx.Department ? tx.Department.name : "N/A",
      createdAt: tx.createdAt
        ? moment(tx.createdAt).format("DD/MM/YYYY, HH:mm:ss")
        : "N/A",
    })),
  };

  /**
   * Modal Handlers
   */
  const openDetailsModal = (transaction) => {
    console.log("Opening Transaction Details Modal for:", transaction);
    setSelectedTransaction(transaction);
    setIsDetailsModalOpen(true);
  };
  const closeDetailsModal = () => {
    console.log("Closing Transaction Details Modal");
    setSelectedTransaction(null);
    setIsDetailsModalOpen(false);
  };

  const openCreateModal = () => {
    console.log("Opening Create Transaction Modal");
    setIsCreateModalOpen(true);
  };
  const closeCreateModal = () => {
    console.log("Closing Create Transaction Modal");
    setIsCreateModalOpen(false);
  };

  /**
   * Alert Management
   */
  const addAlert = (type, message, size = "little") => {
    const alertId = Date.now();
    console.log(`Adding alert [${type}]: ${message} with size ${size}`);
    setAlerts((prev) => [...prev, { id: alertId, type, message, size }]);
    // Duration between 5 to 7 seconds
    const duration = 5000 + Math.floor(Math.random() * 2000);
    setTimeout(() => {
      setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
      console.log(`Removing alert [${type}]: ${message}`);
    }, duration);
  };

  /**
   * Delete Transaction Handler
   */
  const deleteTransaction = async (transactionId) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      console.log("Deleting transaction with ID:", transactionId);
      try {
        await axios.delete(`${API_URL}/transactions/${transactionId}`, {
          headers: getAuthHeader(),
        });
        setAllTransactions((prev) =>
          prev.filter((tx) => tx.id !== transactionId)
        );
        setFilteredTransactions((prev) =>
          prev.filter((tx) => tx.id !== transactionId)
        );
        addAlert("success", "Transaction deleted successfully.", "big");

        // Re-fetch customer data and invoices to update pending amounts
        await fetchCustomerData();
        await fetchInvoices();
      } catch (err) {
        console.error("Failed to delete transaction:", err);
        addAlert("danger", "Failed to delete transaction.", "big");
      }
    }
  };

  /**
   * Yup Validation Schema
   */
  const TransactionSchema = Yup.object().shape({
    invoiceId: Yup.object().nullable(),

    referenceId: Yup.string()
      .max(50, "Reference ID must be at most 50 characters")
      .nullable(),

    transactionDate: Yup.date()
      .required("Transaction Date is required")
      .max(new Date(), "Transaction Date cannot be in the future"),

    transactionType: Yup.string().required("Transaction Type is required"),

    amount: Yup.number()
      .required("Amount is required")
      .positive("Amount must be positive")
      .test(
        "max",
        "Amount cannot exceed the invoice pending amount",
        function (value) {
          const { transactionType, invoiceId } = this.parent;
          if (transactionType === "Credit" && invoiceId) {
            const selectedInvoice = allInvoices.find(
              (inv) => inv.id === invoiceId.value
            );
            if (selectedInvoice) {
              return value <= selectedInvoice.invoicePendingAmount;
            }
          }
          return true; // If not Credit or no invoice selected, skip this test
        }
      ),

    paymentMode: Yup.string().required("Payment Mode is required"),

    pendingAmount: Yup.number()
      .min(0, "Pending Amount cannot be negative")
      .nullable(),

    transactionStatus: Yup.string().required("Transaction Status is required"),

    description: Yup.string().nullable(),
    gstDetails: Yup.string().nullable(),

    department_id: Yup.object()
      .shape({
        value: Yup.number().required("Department ID is required"),
        label: Yup.string().required("Department name is required"),
      })
      .nullable(),
  });

  /**
   * Early Returns for Loading, Error, or No Customer
   */
  if (loading) {
    return (
      <div className="customer-details-wrapper">
        <Sidebar />
        <div className="customer-details-container">
          <div className="customer-details-content">
            <div className="loading">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="customer-details-wrapper">
        <Sidebar />
        <div className="customer-details-container">
          <div className="customer-details-content">
            <div className="error">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="customer-details-wrapper">
        <Sidebar />
        <div className="customer-details-container">
          <div className="customer-details-content">
            <div className="error">Customer not found.</div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Summary Information
   */
  const totalAmount = filteredTransactions
    .reduce((acc, tx) => acc + (parseFloat(tx.amount) || 0), 0)
    .toFixed(2);
  const totalPending = filteredTransactions
    .reduce((acc, tx) => acc + (parseFloat(tx.pendingAmount) || 0), 0)
    .toFixed(2);

  /**
   * Prepare Invoice Options for React Select
   */
  const invoiceOptions = allInvoices
    .sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate))
    .map((inv) => {
      const pendingAmount = parseFloat(inv.invoicePendingAmount) || 0;

      return {
        value: inv.id,
        label: `Invoice No: ${inv.invoiceNumber || "N/A"} | Date: ${
          inv.invoiceDate
            ? new Date(inv.invoiceDate).toLocaleDateString("en-GB")
            : "N/A"
        } | Due: ${
          inv.dueDate
            ? new Date(inv.dueDate).toLocaleDateString("en-GB")
            : "N/A"
        } | Amount: ₹${parseFloat(inv.total).toFixed(2)} | Received: ₹${parseFloat(
          inv.receivedAmount
        ).toFixed(2)} | Pending: ₹${pendingAmount.toFixed(2)}`,
        invoicePendingAmount: pendingAmount,
      };
    });

  /**
   * Prepare Department Options for React Select
   */
  const departmentOptions = allDepartments
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((dept) => ({
      value: dept.id,
      label: dept.name,
    }));

  return (
    <div className="customer-details-wrapper">
      <Sidebar />
      <div className="customer-details-container">
        {/* Alerts Section */}
        <div className="alerts-section">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`alert alert-${alert.type} ${
                alert.size === "big" ? "alert-big" : "alert-little"
              }`}
            >
              {alert.message}
            </div>
          ))}
        </div>

        <div className="customer-details-content">
          {/* Back Button */}
          <button className="btn-back" onClick={() => navigate(-1)}>
            <FaArrowLeft /> Back
          </button>

          {/* Summary Cards */}
          <div className="summary-info">
            <div className="summary-card">
              <div className="icon-container">
                <FaExchangeAlt size={24} color="#3b82f6" />
              </div>
              <div className="summary-text">
                <p className="summary-title">Total Transactions</p>
                <p className="summary-value">{filteredTransactions.length}</p>
              </div>
            </div>
            <div className="summary-card">
              <div className="icon-container">
                <FaMoneyBillWave size={24} color="#10b981" />
              </div>
              <div className="summary-text">
                <p className="summary-title">Total Amount</p>
                <p className="summary-value">₹{totalAmount}</p>
              </div>
            </div>
            <div className="summary-card">
              <div className="icon-container">
                <FaBalanceScale size={24} color="#f59e0b" />
              </div>
              <div className="summary-text">
                <p className="summary-title">Balance</p>
                <p className="summary-value">
                  ₹{parseFloat(customer.balance).toFixed(2)}
                </p>
              </div>
            </div>
            <div className="summary-card">
              <div className="icon-container">
                <FaClipboardList size={24} color="#ef4444" />
              </div>
              <div className="summary-text">
                <p className="summary-title">Total Invoices</p>
                <p className="summary-value">{totalInvoices}</p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="details-card">
            <div className="profile-avatar">
              <img
                src="https://cdn-icons-png.flaticon.com/512/3607/3607444.png"
                alt="Profile Avatar"
              />
            </div>
            <div>
              <h2>Customer Details</h2>
              <p>
                <strong>Name:</strong> {customer.name}
              </p>
              <p>
                <strong>Email:</strong> {customer.email || "N/A"}
              </p>
              <p>
                <strong>Phone:</strong> {customer.phone}
              </p>
              <p>
                <strong>Address:</strong> {customer.address}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs-container">
            <div className="tabs">
              <button
                className={activeTab === "transactions" ? "active" : ""}
                onClick={() => setActiveTab("transactions")}
              >
                Transactions
              </button>
              <button
                className={activeTab === "invoices" ? "active" : ""}
                onClick={() => setActiveTab("invoices")}
              >
                Invoices
              </button>
            </div>
          </div>

          {/* TRANSACTIONS TAB */}
          {activeTab === "transactions" && (
            <div className="transactions-section">
              <h2>Transactions</h2>

              {/* Filters */}
              <div className="filters-section">
                <div className="search-box">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search by Invoice or Reference ID"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="filter-group">
                  <label>Type</label>
                  <select
                    value={transactionType}
                    onChange={(e) => setTransactionType(e.target.value)}
                  >
                    <option>All</option>
                    <option>Credit</option>
                    <option>Debit</option>
                    <option>Refund</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                  >
                    <option>All</option>
                    <option>UPI</option>
                    <option>Card</option>
                    <option>Net Banking</option>
                    <option>Cash</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Status</label>
                  <select
                    value={transactionStatus}
                    onChange={(e) => setTransactionStatus(e.target.value)}
                  >
                    <option>All</option>
                    <option>Paid</option>
                    <option>Partially Paid</option>
                    <option>Pending</option>
                    <option>Expired</option>
                  </select>
                </div>

                <div className="date-range-filter">
                  <label>From</label>
                  <DatePicker
                    selected={dateFrom}
                    onChange={(date) => setDateFrom(date)}
                    dateFormat="dd/MM/yyyy"
                    isClearable
                    placeholderText="Select start date"
                  />
                </div>
                <div className="date-range-filter">
                  <label>To</label>
                  <DatePicker
                    selected={dateTo}
                    onChange={(date) => setDateTo(date)}
                    dateFormat="dd/MM/yyyy"
                    isClearable
                    placeholderText="Select end date"
                  />
                </div>

                <div className="filter-actions">
                  <button
                    type="button"
                    className="btn-apply"
                    onClick={filterAndSortTransactions}
                  >
                    <FaFilter /> Apply
                  </button>
                  <button
                    type="button"
                    className="btn-reset"
                    onClick={() => {
                      console.log("Resetting filters");
                      setSearchTerm("");
                      setTransactionType("All");
                      setPaymentMode("All");
                      setTransactionStatus("All");
                      setDateFrom(null);
                      setDateTo(null);
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Create & Export */}
              <div className="actions-section">
                <button className="btn-download">
                  <CSVLink
                    {...csvReport}
                    style={{ color: "#fff", textDecoration: "none" }}
                  >
                    <FaDownload /> Download CSV
                  </CSVLink>
                </button>
                <button className="btn-create" onClick={openCreateModal}>
                  <FaPlus /> Create Transaction
                </button>
              </div>

              {/* Transactions Table */}
              {filteredTransactions.length > 0 ? (
                <>
                  <div className="table-section">
                    <table className="transactions-table">
                      <thead>
                        <tr>
                          <th>Created At</th>
                          <th>Date</th>
                          <th>Reference ID</th>
                          <th>Type</th>
                          <th>Amount</th>
                          <th>Pending</th>
                          <th>Payment Mode</th>
                          <th>Status</th>
                          <th>Invoice</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions
                          .slice(
                            currentPage * rowsPerPage,
                            (currentPage + 1) * rowsPerPage
                          )
                          .map((tx, index) => {
                            let statusClass = "";
                            switch (
                              (tx.transactionStatus || "").toLowerCase()
                            ) {
                              case "paid":
                                statusClass = "status-paid";
                                break;
                              case "partially paid":
                                statusClass = "status-partially-paid";
                                break;
                              case "pending":
                                statusClass = "status-pending";
                                break;
                              case "expired":
                                statusClass = "status-expired";
                                break;
                              default:
                                statusClass = "status-default";
                            }

                            return (
                              <tr
                                key={tx.id || `temp-id-${index}`}
                                className={`transaction-row ${statusClass}`}
                              >
                                {/* Created At Column */}
                                <td onClick={() => openDetailsModal(tx)}>
                                  {tx.createdAt
                                    ? moment(tx.createdAt).format(
                                        "DD/MM/YYYY, HH:mm:ss"
                                      )
                                    : "N/A"}
                                </td>
                                {/* Date Column */}
                                <td onClick={() => openDetailsModal(tx)}>
                                  {tx.transactionDate
                                    ? moment(tx.transactionDate).format(
                                        "DD/MM/YYYY"
                                      )
                                    : "N/A"}
                                </td>
                                <td onClick={() => openDetailsModal(tx)}>
                                  {tx.referenceId || "N/A"}
                                </td>
                                <td onClick={() => openDetailsModal(tx)}>
                                  {tx.transactionType || "N/A"}
                                </td>
                                <td onClick={() => openDetailsModal(tx)}>
                                  <span className="currency">₹</span>
                                  {parseFloat(tx.amount).toFixed(2)}
                                </td>
                                {/* Show "N/A" in pending if no invoice AND pending is 0 */}
                                <td onClick={() => openDetailsModal(tx)}>
                                  {!tx.invoice_id &&
                                  parseFloat(tx.pendingAmount) === 0
                                    ? "N/A"
                                    : parseFloat(tx.pendingAmount || 0).toFixed(
                                        2
                                      )}
                                </td>
                                <td onClick={() => openDetailsModal(tx)}>
                                  {tx.paymentMode}
                                </td>
                                <td
                                  className={`status-badge ${statusClass}`}
                                  onClick={() => openDetailsModal(tx)}
                                >
                                  {tx.transactionStatus}
                                </td>
                                <td>
                                  {tx.invoice_id ? (
                                    <button
                                      className="btn-view-invoice"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        console.log(
                                          "Navigating to full invoice:",
                                          tx.invoice_id
                                        );
                                        navigate(
                                          `/fullinvoice/${tx.invoice_id}`
                                        );
                                      }}
                                    >
                                      View Invoice
                                    </button>
                                  ) : (
                                    "N/A"
                                  )}
                                </td>
                                <td>
                                  <button
                                    className="btn-edit"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      console.log(
                                        "Editing transaction:",
                                        tx.id
                                      );
                                      navigate(`/transaction/edit/${tx.id}`);
                                    }}
                                  >
                                    <FaEdit /> Edit
                                  </button>
                                  {/* 
                                    **Modified Delete Button:**
                                    - Disabled for transactions linked to an invoice.
                                    - Shows an alert if user attempts to delete such transactions.
                                  */}
                                  <button
                                    className={`btn-delete ${
                                      tx.invoice_id ? "disabled" : ""
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (tx.invoice_id) {
                                        addAlert(
                                          "danger",
                                          "Cannot delete transaction linked to an invoice. Please remove the invoice first.",
                                          "big"
                                        );
                                        alert(
                                          "Cannot delete transaction linked to an invoice. Please remove the invoice first."
                                        );
                                      } else {
                                        deleteTransaction(tx.id);
                                      }
                                    }}
                                    disabled={false} // Keeping it enabled to handle click for alert
                                  >
                                    <FaTrash /> Delete
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="pagination-controls">
                    <ReactPaginate
                      previousLabel={"Previous"}
                      nextLabel={"Next"}
                      breakLabel={"..."}
                      pageCount={Math.ceil(
                        filteredTransactions.length / rowsPerPage
                      )}
                      marginPagesDisplayed={1}
                      pageRangeDisplayed={2}
                      onPageChange={handlePageChange}
                      containerClassName={"pagination"}
                      activeClassName={"active"}
                    />
                    <div className="rows-per-page">
                      <label>Rows per page:</label>
                      <select
                        value={rowsPerPage}
                        onChange={handleRowsPerPageChange}
                      >
                        <option>10</option>
                        <option>25</option>
                        <option>50</option>
                        <option>100</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <p>No transactions found matching your filters.</p>
              )}
            </div>
          )}

          {/* INVOICES TAB */}
          {activeTab === "invoices" && (
            <div className="invoices-section">
              <h2>Invoices</h2>
              {allInvoices.length > 0 ? (
                <div className="table-section">
                  <table className="invoices-table">
                    <thead>
                      <tr>
                        <th>Invoice ID</th>
                        <th>Invoice Number</th>
                        <th>Invoice Date</th>
                        <th>Due Date</th>
                        <th>Total</th>
                        <th>Received</th>
                        <th>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allInvoices.map((inv, index) => {
                        const total = parseFloat(inv.total) || 0;
                        const received = parseFloat(inv.receivedAmount) || 0;
                        const balance = (total - received).toFixed(2);

                        return (
                          <tr
                            key={inv.id || `invoice-temp-${index}`}
                            onClick={() => {
                              console.log(
                                "Navigating to full invoice:",
                                inv.id
                              );
                              navigate(`/fullinvoice/${inv.id}`);
                            }}
                            className="clickable-row"
                          >
                            <td>{inv.id || `Temp-${index + 1}`}</td>
                            <td>{inv.invoiceNumber || "N/A"}</td>
                            <td>
                              {inv.invoiceDate
                                ? moment(inv.invoiceDate).format("DD/MM/YYYY")
                                : "N/A"}
                            </td>
                            <td>
                              {inv.dueDate
                                ? moment(inv.dueDate).format("DD/MM/YYYY")
                                : "N/A"}
                            </td>
                            <td>
                              <span className="currency">₹</span>
                              {total.toFixed(2)}
                            </td>
                            <td>
                              <span className="currency">₹</span>
                              {received.toFixed(2)}
                            </td>
                            <td>
                              <span className="currency">₹</span>
                              {balance}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No outstanding invoices for this customer.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Transaction Details Modal */}
      {isDetailsModalOpen && selectedTransaction && (
        <TransactionDetailsModal
          transaction={selectedTransaction}
          onClose={closeDetailsModal}
        />
      )}

      {/* Create Transaction Modal */}
      {isCreateModalOpen && (
        <div
          className="modal-overlay"
          onClick={closeCreateModal}
          aria-modal="true"
          role="dialog"
        >
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={closeCreateModal}
              aria-label="Close Modal"
            >
              <FaTimes />
            </button>
            <h2 className="modal-title">Create New Transaction</h2>
            <Formik
              initialValues={{
                transactionType: "",
                invoiceId: null,
                referenceId: "",
                transactionDate: "",
                amount: "",
                paymentMode: "",
                pendingAmount: "",
                transactionStatus: "",
                description: "",
                gstDetails: "",
                department_id: null,
              }}
              validationSchema={TransactionSchema}
              onSubmit={async (values, { setSubmitting, resetForm }) => {
                console.log("Form submitted with values:", values); // Log submitted values

                const data = {
                  customer_id: id,
                  transactionType: values.transactionType,
                  invoice_id:
                    values.transactionType === "Credit" && values.invoiceId
                      ? values.invoiceId.value
                      : null,
                  referenceId: values.referenceId || null,
                  transactionDate: values.transactionDate,
                  amount: parseFloat(values.amount),
                  paymentMode: values.paymentMode,
                  pendingAmount:
                    values.transactionType === "Credit" && values.invoiceId
                      ? parseFloat(values.pendingAmount)
                      : parseFloat(values.pendingAmount) || 0,
                  transactionStatus: values.transactionStatus,
                  description: values.description || null,
                  gstDetails: values.gstDetails || null,
                  department_id: values.department_id
                    ? values.department_id.value
                    : null,
                };

                console.log("Sending data to backend:", data); // Log data being sent

                try {
                  const res = await axios.post(
                    `${API_URL}/transactions`,
                    data,
                    { headers: getAuthHeader() }
                  );
                  console.log("Transaction created successfully:", res.data); // Log success
                  setAllTransactions((prev) => [...prev, res.data]);
                  setFilteredTransactions((prev) => [...prev, res.data]);
                  addAlert(
                    "success",
                    "Transaction created successfully.",
                    "big"
                  );

                  // Re-fetch customer data and invoices to update pending amounts
                  await fetchCustomerData();
                  await fetchInvoices();

                  resetForm();
                  closeCreateModal();
                } catch (err) {
                  console.error("Error creating transaction:", err); // Log error
                  if (
                    err.response &&
                    err.response.data &&
                    err.response.data.errors
                  ) {
                    // Handle validation errors returned from the backend
                    const backendErrors = err.response.data.errors;
                    backendErrors.forEach((error) => {
                      addAlert("danger", error.message, "little");
                    });
                  } else {
                    addAlert(
                      "danger",
                      err.response?.data?.message ||
                        "Failed to create transaction.",
                      "little"
                    );
                  }
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({
                values,
                setFieldValue,
                isSubmitting,
                errors,
                touched,
                setFieldTouched,
              }) => {
                /**
                 * **Dynamic Pending Amount Calculation:**
                 * Updates the Pending Amount based on selected invoice's invoicePendingAmount
                 * and the entered amount.
                 */
                useEffect(() => {
                  if (
                    values.transactionType === "Credit" &&
                    values.invoiceId &&
                    values.amount
                  ) {
                    const selectedInvoice = allInvoices.find(
                      (inv) => inv.id === values.invoiceId.value
                    );
                    if (selectedInvoice) {
                      const newPendingAmount =
                        selectedInvoice.invoicePendingAmount - parseFloat(values.amount);
                      // Ensure Pending Amount does not go negative
                      setFieldValue(
                        "pendingAmount",
                        newPendingAmount >= 0
                          ? newPendingAmount.toFixed(2)
                          : "0.00"
                      );
                    }
                  } else if (
                    values.transactionType === "Credit" &&
                    values.invoiceId
                  ) {
                    const selectedInvoice = allInvoices.find(
                      (inv) => inv.id === values.invoiceId.value
                    );
                    if (selectedInvoice) {
                      setFieldValue(
                        "pendingAmount",
                        parseFloat(selectedInvoice.invoicePendingAmount).toFixed(2)
                      );
                    }
                  } else {
                    setFieldValue("pendingAmount", "");
                  }
                  // eslint-disable-next-line react-hooks/exhaustive-deps
                }, [values.transactionType, values.invoiceId, values.amount]);

                return (
                  <Form className="transaction-form">
                    {/* Customer Name Field */}
                    <div className="form-group">
                      <label>Customer</label>
                      <input
                        type="text"
                        value={customer.name || ""}
                        readOnly
                        style={{ backgroundColor: "#f0f0f0" }}
                      />
                    </div>

                    {/* Transaction Type */}
                    <div className="form-group">
                      <label htmlFor="transactionType">
                        Transaction Type<span className="required">*</span>
                      </label>
                      <Field
                        as="select"
                        id="transactionType"
                        name="transactionType"
                      >
                        <option value="">Select Type</option>
                        <option value="Credit">Credit</option>
                        <option value="Debit">Debit</option>
                        <option value="Refund">Refund</option>
                      </Field>
                      <ErrorMessage
                        name="transactionType"
                        component="div"
                        className="error-message"
                      />
                    </div>

                    {/* Invoice Selection (Conditional) */}
                    {values.transactionType === "Credit" && (
                      <div className="form-group">
                        <label htmlFor="invoiceId">Invoice (Optional)</label>
                        {allInvoices.length > 0 ? (
                          <Select
                            id="invoiceId"
                            name="invoiceId"
                            options={invoiceOptions}
                            isClearable
                            isMulti={false}
                            placeholder="Select an Invoice (Optional)"
                            onChange={(option) => {
                              console.log("Selected invoice option:", option);
                              setFieldValue("invoiceId", option);
                              setFieldTouched("invoiceId", true);
                            }}
                            value={values.invoiceId}
                            classNamePrefix="react-select"
                          />
                        ) : (
                          <p style={{ fontSize: "0.75rem", color: "#999" }}>
                            No outstanding invoices available.
                          </p>
                        )}
                        <ErrorMessage
                          name="invoiceId"
                          component="div"
                          className="error-message"
                        />
                      </div>
                    )}

                    {/* Reference ID */}
                    <div className="form-group">
                      <label htmlFor="referenceId">Reference ID</label>
                      <Field
                        type="text"
                        id="referenceId"
                        name="referenceId"
                        placeholder="Enter Reference ID"
                      />
                      <ErrorMessage
                        name="referenceId"
                        component="div"
                        className="error-message"
                      />
                    </div>

                    {/* Transaction Date */}
                    <div className="form-group">
                      <label htmlFor="transactionDate">
                        Transaction Date<span className="required">*</span>
                      </label>
                      <Field
                        type="date"
                        id="transactionDate"
                        name="transactionDate"
                        placeholder="Select Transaction Date"
                      />
                      <ErrorMessage
                        name="transactionDate"
                        component="div"
                        className="error-message"
                      />
                    </div>

                    {/* Amount */}
                    <div className="form-group">
                      <label htmlFor="amount">
                        Amount<span className="required">*</span>
                      </label>
                      <Field
                        type="number"
                        id="amount"
                        name="amount"
                        placeholder="Enter Amount"
                        min="0"
                        step="0.01"
                      />
                      <ErrorMessage
                        name="amount"
                        component="div"
                        className="error-message"
                      />
                    </div>

                    {/* Payment Mode */}
                    <div className="form-group">
                      <label htmlFor="paymentMode">
                        Payment Mode<span className="required">*</span>
                      </label>
                      <Field as="select" id="paymentMode" name="paymentMode">
                        <option value="">Select Mode</option>
                        <option value="UPI">UPI</option>
                        <option value="Card">Card</option>
                        <option value="Net Banking">Net Banking</option>
                        <option value="Cash">Cash</option>
                      </Field>
                      <ErrorMessage
                        name="paymentMode"
                        component="div"
                        className="error-message"
                      />
                    </div>

                    {/* Pending Amount (Read-Only if credit with invoice) */}
                    {values.transactionType === "Credit" &&
                      values.invoiceId && (
                        <div className="form-group">
                          <label htmlFor="pendingAmount">Pending Amount</label>
                          <Field
                            type="number"
                            id="pendingAmount"
                            name="pendingAmount"
                            placeholder="Pending Amount"
                            readOnly
                            disabled
                            value={
                              values.pendingAmount
                                ? parseFloat(values.pendingAmount).toFixed(2)
                                : ""
                            }
                          />
                          <ErrorMessage
                            name="pendingAmount"
                            component="div"
                            className="error-message"
                          />
                        </div>
                      )}

                    {/* Transaction Status */}
                    <div className="form-group">
                      <label htmlFor="transactionStatus">
                        Status<span className="required">*</span>
                      </label>
                      <Field
                        as="select"
                        id="transactionStatus"
                        name="transactionStatus"
                      >
                        <option value="">Select Status</option>
                        <option value="Paid">Paid</option>
                        <option value="Partially Paid">Partially Paid</option>
                        <option value="Pending">Pending</option>
                        <option value="Expired">Expired</option>
                      </Field>
                      <ErrorMessage
                        name="transactionStatus"
                        component="div"
                        className="error-message"
                      />
                    </div>

                    {/* Description */}
                    <div className="form-group">
                      <label htmlFor="description">Description</label>
                      <Field
                        as="textarea"
                        id="description"
                        name="description"
                        placeholder="Enter Description"
                        rows="3"
                      />
                      <ErrorMessage
                        name="description"
                        component="div"
                        className="error-message"
                      />
                    </div>

                    {/* GST Details */}
                    <div className="form-group">
                      <label htmlFor="gstDetails">GST Details</label>
                      <Field
                        type="text"
                        id="gstDetails"
                        name="gstDetails"
                        placeholder="Enter GST Details"
                      />
                      <ErrorMessage
                        name="gstDetails"
                        component="div"
                        className="error-message"
                      />
                    </div>

                    {/* Department Field (React-Select) */}
                    <div className="form-group">
                      <label htmlFor="department_id">Department</label>
                      {allDepartments.length > 0 ? (
                        <Select
                          id="department_id"
                          name="department_id"
                          options={departmentOptions}
                          isClearable
                          isMulti={false}
                          placeholder="Select Department"
                          onChange={(option) => {
                            console.log("Selected department option:", option);
                            setFieldValue("department_id", option);
                          }}
                          value={values.department_id}
                          classNamePrefix="react-select"
                        />
                      ) : (
                        <p style={{ fontSize: "0.75rem", color: "#999" }}>
                          No departments available.
                        </p>
                      )}
                      <ErrorMessage
                        name="department_id"
                        component="div"
                        className="error-message"
                      />
                    </div>

                    {/* Form Actions */}
                    <div className="form-actions">
                      <button
                        type="button"
                        className="btn-cancel"
                        onClick={closeCreateModal}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-submit"
                        disabled={isSubmitting}
                      >
                        <FaSave /> Save Transaction
                      </button>
                    </div>
                  </Form>
                );
              }}
            </Formik>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {isDetailsModalOpen && selectedTransaction && (
        <TransactionDetailsModal
          transaction={selectedTransaction}
          onClose={closeDetailsModal}
        />
      )}
    </div>
  );
}

export default CustomerDetails;
