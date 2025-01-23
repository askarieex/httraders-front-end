// src/pages/CustomerDetails.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import { FaSearch, FaPlus, FaDownload, FaFilter } from 'react-icons/fa';
import ReactPaginate from 'react-paginate';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CSVLink } from 'react-csv';
import TransactionDetailsModal from '../components/TransactionDetailsModal';
import './css/CustomerDetails.css';

function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [allTransactions, setAllTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters/states for search and sort
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [transactionType, setTransactionType] = useState('All');
  const [paymentMode, setPaymentMode] = useState('All');
  const [transactionStatus, setTransactionStatus] = useState('All');
  const [sortOption, setSortOption] = useState('DATE_DESC');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal state
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Alerts state
  const [alerts, setAlerts] = useState([]);

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch customer details
        const customerRes = await axios.get(
          `http://localhost:3000/api/customers/${id}`,
          { headers: getAuthHeader() }
        );
        setCustomer(customerRes.data);

        // Fetch transactions for the customer
        const transactionsRes = await axios.get(
          `http://localhost:3000/api/transactions?customer_id=${id}`,
          { headers: getAuthHeader() }
        );
        setAllTransactions(transactionsRes.data);
        setFilteredTransactions(transactionsRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.response?.data?.message || 'Error fetching data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  useEffect(() => {
    filterAndSortTransactions();
  }, [dateFrom, dateTo, searchTerm, transactionType, paymentMode, transactionStatus, sortOption, allTransactions]);

  const filterAndSortTransactions = () => {
    let temp = [...allTransactions];

    // Filter by date range
    if (dateFrom) {
      temp = temp.filter(tx => new Date(tx.transactionDate) >= dateFrom);
    }
    if (dateTo) {
      temp = temp.filter(tx => new Date(tx.transactionDate) <= dateTo);
    }

    // Filter by transaction type
    if (transactionType !== 'All') {
      temp = temp.filter(tx => tx.transactionType === transactionType);
    }

    // Filter by payment mode
    if (paymentMode !== 'All') {
      temp = temp.filter(tx => tx.paymentMode === paymentMode);
    }

    // Filter by transaction status
    if (transactionStatus !== 'All') {
      temp = temp.filter(tx => tx.transactionStatus === transactionStatus);
    }

    // Filter by search term (invoiceNumber, referenceId)
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      temp = temp.filter(tx =>
        (tx.invoiceNumber && tx.invoiceNumber.toLowerCase().includes(lowerSearch)) ||
        (tx.referenceId && tx.referenceId.toLowerCase().includes(lowerSearch))
      );
    }

    // Sort transactions based on selected sort option
    switch (sortOption) {
      case 'DATE_ASC':
        temp.sort((a, b) => new Date(a.transactionDate) - new Date(b.transactionDate));
        break;
      case 'DATE_DESC':
        temp.sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));
        break;
      case 'AMOUNT_ASC':
        temp.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
        break;
      case 'AMOUNT_DESC':
        temp.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
        break;
      default:
        temp.sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));
        break;
    }

    setFilteredTransactions(temp);
    setCurrentPage(0); // Reset to first page on filter change
  };

  // Pagination handlers
  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setCurrentPage(0);
  };

  // CSV Export
  const headers = [
    { label: "Transaction ID", key: "id" },
    { label: "Customer ID", key: "customerId" },
    { label: "Invoice Number", key: "invoiceNumber" },
    { label: "Transaction Date", key: "transactionDate" },
    { label: "Transaction Type", key: "transactionType" },
    { label: "Amount", key: "amount" },
    { label: "Payment Mode", key: "paymentMode" },
    { label: "Pending Amount", key: "pendingAmount" },
    { label: "Transaction Status", key: "transactionStatus" },
    // Removed "Description", "GST Details", "Department", "Created At", and "Updated At"
  ];

  const csvReport = {
    filename: 'Transactions_Report.csv',
    headers: headers,
    data: filteredTransactions
  };

  // Modal handlers
  const openModal = (transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedTransaction(null);
    setIsModalOpen(false);
  };

  // Alert handlers
  const addAlert = (type, message) => {
    const alertId = Date.now();
    setAlerts(prev => [...prev, { id: alertId, type, message }]);
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    }, 5000);
  };

  // Delete handler
  const deleteTransaction = async (transactionId) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await axios.delete(`http://localhost:3000/api/transactions/${transactionId}`, {
          headers: getAuthHeader()
        });
        setAllTransactions(prev => prev.filter(tx => tx.id !== transactionId));
        addAlert('success', 'Transaction deleted successfully.');
      } catch (err) {
        console.error('Error deleting transaction:', err);
        addAlert('danger', 'Failed to delete transaction.');
      }
    }
  };

  if (loading) return (<div className="loading">Loading...</div>);
  if (error) return (<div className="error">{error}</div>);
  if (!customer) return (<div className="error">Customer not found.</div>);

  // Calculate summary information
  const totalAmount = filteredTransactions.reduce((acc, tx) => acc + (parseFloat(tx.amount) || 0), 0).toFixed(2);
  const totalPending = filteredTransactions.reduce((acc, tx) => acc + (parseFloat(tx.pendingAmount) || 0), 0).toFixed(2);

  return (
    <div className="customer-details-wrapper">
      <Sidebar />
      <div className="customer-details-container">
        <TopNavbar />
        <div className="customer-details-content">
          {/* Alerts Section */}
          <div className="alerts-section">
            {alerts.map(alert => (
              <div key={alert.id} className={`alert alert-${alert.type}`}>
                {alert.message}
              </div>
            ))}
          </div>

          {/* Customer Information */}
          <div className="details-card">
            <h2>Customer Details</h2>
            <p><strong>Name:</strong> {customer.name}</p>
            <p><strong>Email:</strong> {customer.email}</p>
            <p><strong>Phone:</strong> {customer.phone}</p>
            {/* Add more customer details as needed */}
          </div>

          {/* Transactions Section */}
          <div className="transactions-section">
            <h2>Transactions</h2>

            {/* Filters and Search */}
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
                <label>Transaction Type</label>
                <select value={transactionType} onChange={(e) => setTransactionType(e.target.value)}>
                  <option>All</option>
                  <option>Credit</option>
                  <option>Debit</option>
                  <option>Refund</option>
                  {/* Add more types as needed */}
                </select>
              </div>

              <div className="filter-group">
                <label>Payment Mode</label>
                <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                  <option>All</option>
                  <option>UPI</option>
                  <option>Card</option>
                  <option>Net Banking</option>
                  <option>Cash</option>
                  {/* Add more payment modes as needed */}
                </select>
              </div>

              <div className="filter-group">
                <label>Transaction Status</label>
                <select value={transactionStatus} onChange={(e) => setTransactionStatus(e.target.value)}>
                  <option>All</option>
                  <option>Paid</option>
                  <option>Partially Paid</option>
                  <option>Pending</option>
                  <option>Expired</option>
                  {/* Add more statuses as needed */}
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
                <button className="btn-apply" onClick={filterAndSortTransactions}>
                  <FaFilter /> Apply
                </button>
                <button className="btn-reset" onClick={() => {
                  setSearchTerm('');
                  setTransactionType('All');
                  setPaymentMode('All');
                  setTransactionStatus('All');
                  setDateFrom(null);
                  setDateTo(null);
                }}>
                  Reset
                </button>
              </div>
            </div>

            {/* Export and Create Buttons */}
            <div className="actions-section">
              <button className="btn-download">
                <CSVLink {...csvReport} style={{ color: '#fff', textDecoration: 'none' }}>
                  <FaDownload /> Download CSV
                </CSVLink>
              </button>
              <button className="btn-create" onClick={() => navigate('/transactions/create')}>
                <FaPlus /> Create Transaction
              </button>
            </div>

            {/* Transactions Table */}
            <div className="table-section">
              {filteredTransactions.length > 0 ? (
                <>
                  <table className="invoices-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Invoice</th>
                        <th>Reference ID</th>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Amount (₹)</th>
                        <th>Payment Mode</th>
                        <th>Pending Amount</th>
                        <th>Status</th>
                        {/* Removed "Description" */}
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions
                        .slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage)
                        .map((tx) => (
                          <tr key={tx.id} onClick={() => openModal(tx)} className="clickable-row">
                            <td>{tx.id}</td>
                            <td>
                              {tx.invoice_id ? (
                                <button
                                  className="btn-view-invoice"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent triggering row click
                                    navigate(`/fullinvoice/${tx.invoice_id}`); // Navigate in the same tab
                                  }}
                                  aria-label={`View invoice ${tx.invoice_id}`}
                                >
                                  View Invoice
                                </button>
                              ) : (
                                'N/A'
                              )}
                            </td>
                            <td>{tx.referenceId || 'N/A'}</td>
                            <td>{new Date(tx.transactionDate).toLocaleDateString()}</td>
                            <td>{tx.transactionType}</td>
                            <td>₹{parseFloat(tx.amount).toFixed(2)}</td>
                            <td>{tx.paymentMode}</td>
                            <td>₹{parseFloat(tx.pendingAmount || 0).toFixed(2)}</td>
                            <td>
                              <span className={`status-badge ${tx.transactionStatus.toLowerCase().replace(' ', '-')}`}>
                                {tx.transactionStatus}
                              </span>
                            </td>
                            {/* Removed "Description" */}
                            <td>
                              <button
                                className="btn-edit"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent triggering row click
                                  navigate(`/transaction/edit/${tx.id}`);
                                }}
                                aria-label={`Edit transaction ${tx.id}`}
                              >
                                Edit
                              </button>
                              <button
                                className="btn-delete"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent triggering row click
                                  deleteTransaction(tx.id);
                                }}
                                aria-label={`Delete transaction ${tx.id}`}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>

                  {/* Pagination Controls */}
                  <div className="pagination-controls">
                    <ReactPaginate
                      previousLabel={"Previous"}
                      nextLabel={"Next"}
                      breakLabel={"..."}
                      pageCount={Math.ceil(filteredTransactions.length / rowsPerPage)}
                      marginPagesDisplayed={2}
                      pageRangeDisplayed={5}
                      onPageChange={handlePageChange}
                      containerClassName={"pagination"}
                      activeClassName={"active"}
                    />
                    <div className="rows-per-page">
                      <label>Rows per page:</label>
                      <select value={rowsPerPage} onChange={handleRowsPerPageChange}>
                        <option>10</option>
                        <option>25</option>
                        <option>50</option>
                      </select>
                    </div>
                  </div>

                  {/* Summary Information */}
                  <div className="summary-info">
                    <p>Total Transactions: {filteredTransactions.length}</p>
                    <p>Total Amount: ₹{totalAmount}</p>
                    <p>Total Pending: ₹{totalPending}</p>
                  </div>
                </>
              ) : (
                <p>No transactions found matching your filters.</p>
              )}
            </div>
          </div>

          {/* Back Button */}
          <button className="btn-back" onClick={() => navigate(-1)}>Back</button>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {isModalOpen && selectedTransaction && (
        <TransactionDetailsModal transaction={selectedTransaction} onClose={closeModal} />
      )}
    </div>
  );
}

export default CustomerDetails;
