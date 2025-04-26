// src/pages/AllTransactions.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TransactionDetailsModal from "../components/TransactionDetailsModal";
import {
  FaSearch,
  FaDownload,
  FaFilter,
  FaEdit,
  FaTrash,
  FaArrowLeft,
  FaTimes,
  FaExchangeAlt,       // Imported FaExchangeAlt
  FaMoneyBillWave,    // Imported FaMoneyBillWave
  FaBalanceScale,     // Imported FaBalanceScale
} from "react-icons/fa"; // Ensure all icons are imported
import ReactPaginate from "react-paginate";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { CSVLink } from "react-csv";
import Select from "react-select";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import moment from "moment";
import "./css/AllTransactions.css";

function AllTransactions() {
  const navigate = useNavigate();

  // State declarations
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
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

  // Alerts
  const [alerts, setAlerts] = useState([]);

  // Environment Variable for API URL
  const API_URL = "http://localhost:3000/api"; // Update as per your environment

  // Helper to get Authorization header
  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  /**
   * Function to fetch all transactions
   */
  const fetchAllTransactions = async () => {
    try {
      const res = await axios.get(`${API_URL}/transactions`, {
        headers: getAuthHeader(),
      });
      console.log("All transactions fetched:", res.data);
      setTransactions(res.data);
      setFilteredTransactions(res.data);
      setTotalTransactions(res.data.length);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError(err.response?.data?.message || "Error fetching transactions");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Function to fetch all departments
   */
  const fetchAllDepartments = async () => {
    try {
      const res = await axios.get(`${API_URL}/departments`, {
        headers: getAuthHeader(),
      });
      console.log("Departments fetched:", res.data);
      setAllDepartments(res.data);
    } catch (err) {
      console.error("Error fetching departments:", err);
      addAlert("danger", "Failed to fetch departments.", "big");
    }
  };

  /**
   * Function to fetch all customers
   */
  const fetchAllCustomers = async () => {
    try {
      const res = await axios.get(`${API_URL}/customers`, {
        headers: getAuthHeader(),
      });
      console.log("Customers fetched:", res.data);
      setAllCustomers(res.data);
    } catch (err) {
      console.error("Error fetching customers:", err);
      addAlert("danger", "Failed to fetch customers.", "big");
    }
  };

  /**
   * Initial Data Fetching
   */
  useEffect(() => {
    const fetchData = async () => {
      await fetchAllTransactions();
      await fetchAllDepartments();
      await fetchAllCustomers();
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Implement Polling to Fetch Transactions Every 30 Seconds
   */
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log("Polling: Fetching latest transactions...");
      fetchAllTransactions();
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
    transactions,
  ]);

  /**
   * Function to Filter and Sort Transactions
   */
  const filterAndSortTransactions = () => {
    console.log("Filtering and sorting transactions...");
    let temp = [...transactions];

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

    // 5. Search by invoiceNumber, referenceId, or customer name
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      temp = temp.filter(
        (tx) =>
          (tx.invoiceNumber &&
            tx.invoiceNumber.toLowerCase().includes(lowerSearch)) ||
          (tx.referenceId &&
            tx.referenceId.toLowerCase().includes(lowerSearch)) ||
          (tx.customer &&
            tx.customer.name &&
            tx.customer.name.toLowerCase().includes(lowerSearch))
      );
    }

    // 6. Sort by createdAt descending (newest first)
    temp.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    console.log("Filtered and sorted transactions:", temp);
    setFilteredTransactions(temp);
    setTotalTransactions(temp.length);
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
    { label: "Customer Name", key: "customer.name" },
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
    filename: "All_Transactions_Report.csv",
    headers,
    data: filteredTransactions.map((tx) => ({
      ...tx,
      "Department.name": tx.Department ? tx.Department.name : "N/A",
      "customer.name": tx.customer ? tx.customer.name : "N/A",
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
        setTransactions((prev) =>
          prev.filter((tx) => tx.id !== transactionId)
        );
        setFilteredTransactions((prev) =>
          prev.filter((tx) => tx.id !== transactionId)
        );
        addAlert("success", "Transaction deleted successfully.", "big");
      } catch (err) {
        console.error("Failed to delete transaction:", err);
        addAlert("danger", "Failed to delete transaction.", "big");
      }
    }
  };

  /**
   * Early Returns for Loading, Error, or No Transactions
   */
  if (loading) {
    return (
      <div className="all-transactions-wrapper">
        <Sidebar />
        <div className="all-transactions-container">
          <div className="all-transactions-content">
            <div className="loading">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="all-transactions-wrapper">
        <Sidebar />
        <div className="all-transactions-container">
          <div className="all-transactions-content">
            <div className="error">{error}</div>
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
   * Prepare Department Options for React Select
   */
  const departmentOptions = allDepartments
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((dept) => ({
      value: dept.id,
      label: dept.name,
    }));

  /**
   * Prepare Customer Options for React Select (if needed in future)
   */
  const customerOptions = allCustomers
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((cust) => ({
      value: cust.id,
      label: cust.name,
    }));

  return (
    <div className="all-transactions-wrapper">
      <Sidebar />
      <div className="all-transactions-container">
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

        <div className="all-transactions-content">
          {/* Header */}
          <div className="header-section">
            <h1>All Transactions</h1>
            <button className="btn-back" onClick={() => navigate(-1)}>
              <FaArrowLeft /> Back
            </button>
          </div>

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
                <p className="summary-title">Total Pending</p>
                <p className="summary-value">₹{totalPending}</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="filters-section">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by Invoice, Reference ID, or Customer Name"
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

          {/* Export */}
          <div className="actions-section">
            <button className="btn-download">
              <CSVLink
                {...csvReport}
                style={{ color: "#fff", textDecoration: "none" }}
              >
                <FaDownload /> Download CSV
              </CSVLink>
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
                      <th>Customer Name</th>
                      <th>Reference ID</th>
                      <th>Type</th>
                      <th>Amount</th>
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
                        let typeClass = "";
                        if (tx.transactionType === "Credit") {
                          typeClass = "type-credit";
                        } else if (tx.transactionType === "Debit") {
                          typeClass = "type-debit";
                        }

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
                            className={`transaction-row ${typeClass}`}
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
                                ? moment(tx.transactionDate).format("DD/MM/YYYY")
                                : "N/A"}
                            </td>
                            {/* Customer Name */}
                            <td onClick={() => openDetailsModal(tx)}>
                              {tx.customer && tx.customer.name
                                ? tx.customer.name
                                : "N/A"}
                            </td>
                            {/* Reference ID */}
                            <td onClick={() => openDetailsModal(tx)}>
                              {tx.referenceId || "N/A"}
                            </td>
                            {/* Type */}
                            <td onClick={() => openDetailsModal(tx)}>
                              {tx.transactionType || "N/A"}
                            </td>
                            {/* Amount */}
                            <td onClick={() => openDetailsModal(tx)}>
                              <span className="currency">₹</span>
                              {parseFloat(tx.amount).toFixed(2)}
                            </td>
                            {/* Payment Mode */}
                            <td onClick={() => openDetailsModal(tx)}>
                              {tx.paymentMode}
                            </td>
                            {/* Status */}
                            <td
                              className={`status-badge ${statusClass}`}
                              onClick={() => openDetailsModal(tx)}
                            >
                              {tx.transactionStatus}
                            </td>
                            {/* Invoice */}
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
                                    navigate(`/fullinvoice/${tx.invoice_id}`);
                                  }}
                                >
                                  View Invoice
                                </button>
                              ) : (
                                "N/A"
                              )}
                            </td>
                            {/* Actions */}
                            <td>
                              <button
                                className="btn-edit"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log("Editing transaction:", tx.id);
                                  navigate(`/transaction/edit/${tx.id}`);
                                }}
                              >
                                <FaEdit /> Edit
                              </button>
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
                                disabled={tx.invoice_id} // Disable button if linked to an invoice
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
                  pageCount={Math.ceil(filteredTransactions.length / rowsPerPage)}
                  marginPagesDisplayed={1}
                  pageRangeDisplayed={2}
                  onPageChange={handlePageChange}
                  containerClassName={"pagination"}
                  activeClassName={"active"}
                  forcePage={currentPage}
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

          {/* Transaction Details Modal */}
          {isDetailsModalOpen && selectedTransaction && (
            <TransactionDetailsModal
              transaction={selectedTransaction}
              onClose={closeDetailsModal}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default AllTransactions;
