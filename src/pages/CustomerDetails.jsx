import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { Avatar } from "../components/ui";

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
  FaFilePdf,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaIdCard,
  FaFileInvoice,
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

// PDF
import jsPDF from "jspdf";
import "jspdf-autotable";

function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ---------- State ----------
  const [customer, setCustomer] = useState(null);
  const [allTransactions, setAllTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [totalInvoices, setTotalInvoices] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [transactionType, setTransactionType] = useState("All");
  const [paymentMode, setPaymentMode] = useState("All");
  const [transactionStatus, setTransactionStatus] = useState("All");

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Modals
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Statement
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [statementDateFrom, setStatementDateFrom] = useState(null);
  const [statementDateTo, setStatementDateTo] = useState(null);

  // Alerts
  const [alerts, setAlerts] = useState([]);

  // Tabs
  const [activeTab, setActiveTab] = useState("transactions");

  // Add state for refund modal
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [transactionToRefund, setTransactionToRefund] = useState(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundPaymentMode, setRefundPaymentMode] = useState("");
  const [isRefundProcessing, setIsRefundProcessing] = useState(false);

  // API
  const API_URL = "http://localhost:3000/api";
  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // ---------- Fetching Data ----------
  const fetchCustomerData = async () => {
    try {
      const res = await axios.get(`${API_URL}/customers/${id}`, {
        headers: getAuthHeader(),
      });
      setCustomer(res.data);
    } catch (err) {
      addAlert("danger", "Failed to fetch customer data.", "big");
    }
  };

  const fetchAllData = async () => {
    try {
      await fetchCustomerData();

      // Transactions
      const txRes = await axios.get(
        `${API_URL}/transactions?customer_id=${id}`,
        { headers: getAuthHeader() }
      );
      
      // Sort transactions by transaction date and then by createdAt time (newest first)
      const sortedTransactions = txRes.data.sort((a, b) => {
        // First compare transaction dates
        const dateA = new Date(a.transactionDate);
        const dateB = new Date(b.transactionDate);
        
        // Convert to date-only for comparison (removing time component)
        const dateAOnly = new Date(dateA.getFullYear(), dateA.getMonth(), dateA.getDate()).getTime();
        const dateBOnly = new Date(dateB.getFullYear(), dateB.getMonth(), dateB.getDate()).getTime();
        
        // Different transaction dates - sort by date (descending)
        if (dateAOnly !== dateBOnly) {
          return dateBOnly - dateAOnly; // Reversed order for descending
        }
        
        // Same transaction date - sort by createdAt timestamp (descending)
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return timeB - timeA; // Reversed order for descending
      });
      
      setAllTransactions(sortedTransactions);
      setFilteredTransactions(sortedTransactions);

      // Invoices
      const invRes = await axios.get(
        `${API_URL}/invoices?customer_id=${id}`,
        { headers: getAuthHeader() }
      );
      // Filter out fully paid invoices
      const filteredInv = invRes.data.filter((inv) => {
        const rec = parseFloat(inv.receivedAmount);
        const tot = parseFloat(inv.total);
        return !isNaN(rec) && !isNaN(tot) && rec < tot;
      });
      setAllInvoices(filteredInv);

      // Departments
      const deptRes = await axios.get(`${API_URL}/departments`, {
        headers: getAuthHeader(),
      });
      setAllDepartments(deptRes.data);

      // total Invoices
      const totalInvRes = await axios.get(
        `${API_URL}/invoices/total/${id}`,
        { headers: getAuthHeader() }
      );
      setTotalInvoices(totalInvRes.data.totalInvoices);
    } catch (err) {
      setError(err.response?.data?.message || "Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const invRes = await axios.get(`${API_URL}/invoices?customer_id=${id}`, {
        headers: getAuthHeader(),
      });
      const filteredInv = invRes.data.filter((inv) => {
        const rec = parseFloat(inv.receivedAmount);
        const tot = parseFloat(inv.total);
        return !isNaN(rec) && !isNaN(tot) && rec < tot;
      });
      setAllInvoices(filteredInv);
      setTotalInvoices(filteredInv.length);
    } catch (err) {
      addAlert("danger", "Failed to fetch invoices.", "big");
    }
  };

  // onMount
  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // poll
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchCustomerData();
    }, 30000);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Filter & Sorting ----------
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

  const filterAndSortTransactions = () => {
    let temp = [...allTransactions];

    // Date range
    if (dateFrom) {
      temp = temp.filter((t) => new Date(t.transactionDate) >= dateFrom);
    }
    if (dateTo) {
      temp = temp.filter((t) => new Date(t.transactionDate) <= dateTo);
    }

    // Type
    if (transactionType !== "All") {
      temp = temp.filter((t) => t.transactionType === transactionType);
    }

    // Payment Mode
    if (paymentMode !== "All") {
      temp = temp.filter((t) => t.paymentMode === paymentMode);
    }

    // Status
    if (transactionStatus !== "All") {
      temp = temp.filter((t) => t.transactionStatus === transactionStatus);
    }

    // searchTerm
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      temp = temp.filter(
        (t) =>
          (t.invoiceNumber &&
            t.invoiceNumber.toLowerCase().includes(lower)) ||
          (t.referenceId && t.referenceId.toLowerCase().includes(lower))
      );
    }

    // Keep original sort order from fetchAllData - we already sorted by date and creation time
    // No additional sorting needed here, as we want to maintain the chronological order

    setFilteredTransactions(temp);
    setCurrentPage(0);
  };

  // Pagination
  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };
  const handleRowsPerPageChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setRowsPerPage(val);
    setCurrentPage(0);
  };

  // ---------- CSV ----------
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

  // ---------- Modals ----------
  const openDetailsModal = (tx) => {
    setSelectedTransaction(tx);
    setIsDetailsModalOpen(true);
  };
  const closeDetailsModal = () => {
    setSelectedTransaction(null);
    setIsDetailsModalOpen(false);
  };

  const openCreateModal = () => setIsCreateModalOpen(true);
  const closeCreateModal = () => setIsCreateModalOpen(false);

  const openStatementModal = () => setIsStatementModalOpen(true);
  const closeStatementModal = () => {
    setIsStatementModalOpen(false);
    setStatementDateFrom(null);
    setStatementDateTo(null);
  };

  // ---------- Alerts ----------
  const addAlert = (type, message, size = "little") => {
    const alertId = Date.now();
    setAlerts((prev) => [...prev, { id: alertId, type, message, size }]);
    const duration = 5000 + Math.floor(Math.random() * 2000);
    setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    }, duration);
  };

  // ---------- Delete ----------
  const deleteTransaction = async (transactionId) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
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

        await fetchCustomerData();
        await fetchInvoices();
      } catch (err) {
        addAlert("danger", "Failed to delete transaction.", "big");
      }
    }
  };

  // --------------------------------------------------------------------------
  // Generate PDF Statement - Matches Exact UI Table Layout 
  // --------------------------------------------------------------------------
  const generatePDF = () => {
    try {
      // Filter transactions based on date range (using transaction date, not created at)
      const filteredTransactions = allTransactions.filter(tx => {
        // If no date range selected, include all transactions
        if (!statementDateFrom && !statementDateTo) return true;
        
        // Use transaction date for filtering
        const txDate = moment(tx.transactionDate);
        
        // Check if transaction date is within the selected range
        if (statementDateFrom && statementDateTo) {
          const startDate = moment(statementDateFrom).startOf('day');
          const endDate = moment(statementDateTo).endOf('day');
          return txDate.isBetween(startDate, endDate, undefined, '[]');
        }
        
        // If only start date is selected
        if (statementDateFrom && !statementDateTo) {
          const startDate = moment(statementDateFrom).startOf('day');
          return txDate.isSameOrAfter(startDate);
        }
        
        // If only end date is selected
        if (!statementDateFrom && statementDateTo) {
          const endDate = moment(statementDateTo).endOf('day');
          return txDate.isSameOrBefore(endDate);
        }
        
        return true;
      });
      
      // Sort transactions by date (newest first) then created time (newest first)
      filteredTransactions.sort((a, b) => {
        // First compare transaction dates
        const dateA = new Date(a.transactionDate);
        const dateB = new Date(b.transactionDate);
        
        // Convert to date-only for comparison (removing time component)
        const dateAOnly = new Date(dateA.getFullYear(), dateA.getMonth(), dateA.getDate()).getTime();
        const dateBOnly = new Date(dateB.getFullYear(), dateB.getMonth(), dateB.getDate()).getTime();
        
        // Different transaction dates - sort by date (descending)
        if (dateAOnly !== dateBOnly) {
          return dateBOnly - dateAOnly; // Newest dates first
        }
        
        // Same transaction date - sort by createdAt timestamp (descending)
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return timeB - timeA; // Newest created first
      });
      
      // Calculate starting balance from transactions before the date range
      let statementBalance = 0;
      
      if (statementDateFrom) {
        // For date-filtered statements, calculate opening balance from previous transactions
        const previousTransactions = allTransactions.filter(tx => {
          const txDate = moment(tx.transactionDate);
          const startDate = moment(statementDateFrom).startOf('day');
          return txDate.isBefore(startDate);
        });
        
        // Calculate opening balance from previous transactions
        const prevDebits = previousTransactions
          .filter(tx => tx.transactionType === "Debit")
          .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
          
        const prevCredits = previousTransactions
          .filter(tx => tx.transactionType === "Credit" || tx.transactionType === "Refund")
          .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
          
        const prevPending = previousTransactions
          .filter(tx => tx.pendingAmount)
          .reduce((sum, tx) => sum + parseFloat(tx.pendingAmount || 0), 0);
          
        let openingBalance = prevDebits - prevCredits + prevPending;
        
        // Calculate balance for the current period
        const totalCredits = filteredTransactions
          .filter(tx => tx.transactionType === "Credit" || tx.transactionType === "Refund")
          .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
          
        const totalDebits = filteredTransactions
          .filter(tx => tx.transactionType === "Debit")
          .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
          
        const pendingAmounts = filteredTransactions
          .filter(tx => tx.pendingAmount)
          .reduce((sum, tx) => sum + parseFloat(tx.pendingAmount || 0), 0);
        
        // Final balance = Opening balance + (Debits - Credits + Pending in the current period)
        statementBalance = openingBalance + (totalDebits - totalCredits + pendingAmounts);
      } else {
        // When no date filter is applied (All period), use the customer's actual balance directly
        statementBalance = parseFloat(customer.balance) || 0;
      }
      
      // Format helper functions
      const formatAmount = (amount) => {
        return parseFloat(amount || 0).toFixed(2);
      };
      
      const formatDateTime = (dateTime) => {
        return dateTime ? moment(dateTime).format("DD/MM/YYYY, HH:mm:ss") : "N/A";
      };
      
      const formatDate = (date) => {
        return date ? moment(date).format("DD/MM/YYYY") : "N/A";
      };
      
      // Create PDF document in A4 size
      const doc = new jsPDF({
        orientation: "landscape", // Use landscape for wider tables
        unit: "pt",
        format: "a4"
      });
      
      // Document dimensions
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Margins
      const margin = 40;
      const contentWidth = pageWidth - (2 * margin);
      
      // Colors
      const primaryColor = [52, 86, 180];    // Softer blue for headings
      const darkGray = [51, 51, 51];         // Text color
      const lightGray = [248, 249, 250];     // Lighter background
      const positiveGreen = [40, 167, 69];   // Green for "Paid" status
      const warningOrange = [255, 193, 7];   // Orange for "Partially Paid"
      
      // Add header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.text("Transaction Statement", pageWidth/2, 50, { align: "center" });
      
      // Company info
      doc.setFontSize(9);
      doc.text("HT Traders", margin, 30);
      
      // Date range
      let dateRangeText = "Period: ";
      if (statementDateFrom) {
        dateRangeText += moment(statementDateFrom).format("DD/MM/YYYY");
      } else {
        dateRangeText += "All";
      }
      
      if (statementDateTo) {
        dateRangeText += " to " + moment(statementDateTo).format("DD/MM/YYYY");
      }
      
      doc.setFontSize(8);
      doc.text(dateRangeText, pageWidth - margin, 30, { align: "right" });
      
      // Customer info
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Customer: ${customer.name} (ID: ${customer.id})`, margin, 70);
      
      // Balance with improved formatting
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      const formattedBalance = statementBalance.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      doc.text("Balance:", pageWidth - margin - 100, 70, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.text(`₹${formattedBalance}`, pageWidth - margin, 70, { align: "right" });
      
      // Calculate column widths to match UI layout
      const cols = {
        date: { title: "DATE", width: 90 },
        reference: { title: "REFERENCE ID", width: 110 },
        type: { title: "TYPE", width: 70 },
        amount: { title: "AMOUNT", width: 90 },
        pending: { title: "PENDING", width: 90 },
        paymentMode: { title: "PAYMENT MODE", width: 110 },
        status: { title: "STATUS", width: 90 },
        invoice: { title: "INVOICE", width: 80 }
      };
      
      // Calculate X positions for each column
      let currentX = margin;
      Object.keys(cols).forEach(key => {
        cols[key].x = currentX;
        currentX += cols[key].width;
      });
      
      // Table header
      const tableTop = 90;
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(margin, tableTop, contentWidth, 25, 'F');
      
      // Header text
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      
      // Add column headers
      Object.keys(cols).forEach(key => {
        doc.text(cols[key].title, cols[key].x + 5, tableTop + 16);
      });
      
      // Table rows
      let rowY = tableTop + 25;
      const rowHeight = 35;
      
      // Reset text color for data
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      
      // Add message if no transactions in date range
      if (filteredTransactions.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.text("No transactions found for the selected period.", pageWidth/2, rowY + 20, { align: "center" });
      }
      
      // Process transactions
      filteredTransactions.forEach((tx, index) => {
        // Check if we need a new page
        if (rowY > pageHeight - 50) {
          doc.addPage();
          
          // Repeat header on new page
          doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.rect(margin, 40, contentWidth, 25, 'F');
          
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(255, 255, 255);
          
          Object.keys(cols).forEach(key => {
            doc.text(cols[key].title, cols[key].x + 5, 40 + 16);
          });
          
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
          
          rowY = 40 + 25; // Reset Y position for new page
        }
        
        // Alternating row background
        if (index % 2 === 0) {
          doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
          doc.rect(margin, rowY, contentWidth, rowHeight, 'F');
        }
        
        // Format all transaction values
        const date = formatDate(tx.transactionDate);
        const reference = tx.referenceId || "N/A";
        const type = tx.transactionType;
        const amount = "₹" + formatAmount(tx.amount);
        const pending = tx.pendingAmount ? formatAmount(tx.pendingAmount) : "N/A";
        const paymentMode = tx.paymentMode || "N/A";
        const status = tx.transactionStatus || "N/A";
        const invoice = tx.invoice_id ? "View" : "N/A";
        
        // Set Y position for text centered vertically in the row
        const textY = rowY + (rowHeight / 2) + 3;
        
        // DATE
        doc.text(date, cols.date.x + 5, textY);
        
        // REFERENCE ID
        doc.text(reference, cols.reference.x + 5, textY);
        
        // TYPE (with color)
        if (type === "Credit") {
          doc.setTextColor(positiveGreen[0], positiveGreen[1], positiveGreen[2]);
          doc.text(type, cols.type.x + 5, textY);
          doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        } else if (type === "Debit") {
          doc.setTextColor(255, 80, 80); // Red for Debit
          doc.text(type, cols.type.x + 5, textY);
          doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        } else {
          doc.text(type, cols.type.x + 5, textY);
        }
        
        // AMOUNT
        doc.text(amount, cols.amount.x + 5, textY);
        
        // PENDING
        doc.text(pending, cols.pending.x + 5, textY);
        
        // PAYMENT MODE
        doc.text(paymentMode, cols.paymentMode.x + 5, textY);
        
        // STATUS (with color)
        if (status === "Paid") {
          doc.setTextColor(positiveGreen[0], positiveGreen[1], positiveGreen[2]);
          doc.text(status, cols.status.x + 5, textY);
        } else if (status === "Partially Paid") {
          doc.setTextColor(warningOrange[0], warningOrange[1], warningOrange[2]);
          doc.text(status, cols.status.x + 5, textY);
        } else {
          doc.text(status, cols.status.x + 5, textY);
        }
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        
        // INVOICE
        if (tx.invoice_id) {
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.text("View", cols.invoice.x + 5, textY);
          doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        } else {
          doc.text("N/A", cols.invoice.x + 5, textY);
        }
        
        rowY += rowHeight;
      });
      
      // Add summary section
      const summaryY = rowY + 20;
      
      if (summaryY < pageHeight - 80) {
        doc.setDrawColor(230, 230, 240);
        doc.setFillColor(240, 244, 255);
        doc.roundedRect(margin, summaryY, contentWidth, 60, 3, 3, 'FD');
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Transaction Summary", margin + 20, summaryY + 20);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        
        // Calculate summary values from filtered transactions
        const totalCredits = filteredTransactions
          .filter(tx => tx.transactionType === "Credit" || tx.transactionType === "Refund")
          .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
          
        const totalDebits = filteredTransactions
          .filter(tx => tx.transactionType === "Debit")
          .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
          
        const pendingAmounts = filteredTransactions
          .filter(tx => tx.pendingAmount)
          .reduce((sum, tx) => sum + parseFloat(tx.pendingAmount || 0), 0);
        
        // Display summary
        doc.text(`Total Credits: ₹${totalCredits.toFixed(2)}`, margin + 30, summaryY + 40);
        doc.text(`Total Debits: ₹${totalDebits.toFixed(2)}`, margin + 230, summaryY + 40);
        
        if (pendingAmounts > 0) {
          doc.text(`Pending Amounts: ₹${pendingAmounts.toFixed(2)}`, margin + 430, summaryY + 40);
        }
      }
      
      // Add footer
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      
      const footerText = `Statement generated on ${moment().format("DD/MM/YYYY, HH:mm:ss")}`;
      doc.text(footerText, pageWidth/2, pageHeight - 20, { align: "center" });
      
      // Save the PDF
      const pdfName = `Transactions_${customer.name.replace(/\s+/g, '_')}_${moment().format("YYYYMMDD")}.pdf`;
      doc.save(pdfName);
      
      // Success message
      addAlert("success", "Transaction statement generated successfully", "little");
      
    } catch (err) {
      console.error("PDF generation error:", err);
      addAlert("danger", "Failed to generate PDF statement. Please try again.", "big");
    }
  };

  // ---------- Validation for create transaction ----------
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
            const selectedInv = allInvoices.find(
              (inv) => inv.id === invoiceId.value
            );
            if (selectedInv) {
              return value <= selectedInv.invoicePendingAmount;
            }
          }
          return true;
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

  // Function to handle opening the refund modal
  const openRefundModal = (transaction, e) => {
    e.stopPropagation(); // Prevent row click event
    setTransactionToRefund(transaction);
    setRefundAmount(transaction.amount); // Default to full amount
    setRefundPaymentMode(transaction.paymentMode); // Default to same payment mode
    setIsRefundModalOpen(true);
  };

  // Function to close the refund modal
  const closeRefundModal = () => {
    setIsRefundModalOpen(false);
    setTransactionToRefund(null);
    setRefundAmount("");
    setRefundReason("");
    setRefundPaymentMode("");
  };

  // Function to process the refund
  const processRefund = async () => {
    if (!transactionToRefund) return;

    // Validate refund amount
    const amount = parseFloat(refundAmount);
    if (isNaN(amount) || amount <= 0 || amount > parseFloat(transactionToRefund.amount)) {
      addAlert("danger", "Invalid refund amount", "big");
      return;
    }

    if (!refundPaymentMode) {
      addAlert("danger", "Payment mode is required", "big");
      return;
    }

    setIsRefundProcessing(true);

    try {
      // Create the refund transaction - Refunds decrease customer balance (give money back to customer)
      const refundData = {
        customer_id: id,
        transactionType: "Refund",
        referenceId: `REF-${transactionToRefund.id}`,
        transactionDate: new Date().toISOString().split('T')[0],
        amount: amount,
        paymentMode: refundPaymentMode,
        pendingAmount: 0,
        transactionStatus: "Paid",
        description: refundReason || `Refund for transaction #${transactionToRefund.id}`,
        original_transaction_id: transactionToRefund.id
      };

      // Make API call to create refund transaction
      const res = await axios.post(`${API_URL}/transactions`, refundData, {
        headers: getAuthHeader(),
      });

      // Show success message
      addAlert("success", "Refund processed successfully", "big");
      
      // Refresh all data to ensure proper sorting
      await fetchAllData();
      
      // Close the modal
      closeRefundModal();
    } catch (err) {
      console.error("Refund error:", err);
      addAlert(
        "danger", 
        err.response?.data?.message || "Failed to process refund", 
        "big"
      );
    } finally {
      setIsRefundProcessing(false);
    }
  };

  // Early returns
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

  // Summaries for display in UI
  const totalAmount = filteredTransactions
    .reduce((acc, tx) => acc + (parseFloat(tx.amount) || 0), 0)
    .toFixed(2);

  const totalPending = filteredTransactions
    .reduce((acc, tx) => acc + (parseFloat(tx.pendingAmount) || 0), 0)
    .toFixed(2);

  // invoice options for the create transaction form
  const invoiceOptions = allInvoices
    .sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate))
    .map((inv) => {
      const pending = parseFloat(inv.invoicePendingAmount) || 0;
      return {
        value: inv.id,
        label: `Invoice #${inv.invoiceNumber || "N/A"} | Pending: ₹${pending.toFixed(
          2
        )}`,
        invoicePendingAmount: pending,
      };
    });

  // Department options
  const departmentOptions = allDepartments
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((dept) => ({ value: dept.id, label: dept.name }));

  return (
    <div className="customer-details-wrapper">
      <Sidebar />
      <div className="customer-details-container">
        {/* Alerts */}
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
          <button className="btn-back hover:bg-primary-50 transition-all rounded-md" onClick={() => navigate(-1)}>
            <FaArrowLeft className="text-primary-600" /> 
            <span className="ml-2">Back</span>
          </button>

          {/* Customer Card */}
          <div className="bg-white rounded-xl shadow-card p-6 mb-6 transition-all hover:shadow-lg">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar 
                name={customer?.name || "User"} 
                size="2xl" 
                className="border-4 border-primary-100"
              />
              <div className="flex-1">
                <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">{customer?.name}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-700">
                  <div className="flex items-center">
                    <FaEnvelope className="mr-2 text-primary-500" /> 
                    <span>{customer?.email || "N/A"}</span>
                  </div>
                  <div className="flex items-center">
                    <FaPhone className="mr-2 text-primary-500" /> 
                    <span>{customer?.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <FaMapMarkerAlt className="mr-2 text-primary-500" /> 
                    <span>{customer?.address || "N/A"}</span>
                  </div>
                  <div className="flex items-center">
                    <FaIdCard className="mr-2 text-primary-500" /> 
                    <span>ID: {customer?.id}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-sm text-gray-500 mb-1">Balance</div>
                <div className={`text-xl font-bold ${parseFloat(customer?.balance) >= 0 ? 'text-success' : 'text-danger'}`}>
                  ₹{parseFloat(customer?.balance).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-card transition-all hover:shadow-md hover:translate-y-[-2px]">
              <div className="flex items-center">
                <div className="bg-primary-50 p-3 rounded-lg mr-4">
                  <FaExchangeAlt className="text-primary-600 text-xl" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Total Transactions</div>
                  <div className="text-xl font-bold text-gray-900">{filteredTransactions.length}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-card transition-all hover:shadow-md hover:translate-y-[-2px]">
              <div className="flex items-center">
                <div className="bg-secondary-50 p-3 rounded-lg mr-4">
                  <FaMoneyBillWave className="text-secondary-600 text-xl" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Total Amount</div>
                  <div className="text-xl font-bold text-gray-900">₹{totalAmount}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-card transition-all hover:shadow-md hover:translate-y-[-2px]">
              <div className="flex items-center">
                <div className="bg-warning-50 p-3 rounded-lg mr-4">
                  <FaBalanceScale className="text-warning text-xl" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Current Balance</div>
                  <div className="text-xl font-bold text-gray-900">₹{parseFloat(customer?.balance).toFixed(2)}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-card transition-all hover:shadow-md hover:translate-y-[-2px]">
              <div className="flex items-center">
                <div className="bg-info-50 p-3 rounded-lg mr-4">
                  <FaClipboardList className="text-info text-xl" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Total Invoices</div>
                  <div className="text-xl font-bold text-gray-900">{totalInvoices}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs-container mb-6">
            <div className="tabs flex bg-white rounded-lg shadow-sm p-1 border border-gray-200">
              <button
                className={`flex-1 py-2 px-4 rounded-md transition-all ${
                  activeTab === "transactions" 
                    ? "bg-primary-500 text-white shadow-md" 
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => setActiveTab("transactions")}
              >
                Transactions
              </button>
              <button
                className={`flex-1 py-2 px-4 rounded-md transition-all ${
                  activeTab === "invoices" 
                    ? "bg-primary-500 text-white shadow-md" 
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => setActiveTab("invoices")}
              >
                Invoices
              </button>
            </div>
          </div>

          {/* TRANSACTIONS TAB */}
          {activeTab === "transactions" && (
            <div className="transactions-section">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-display font-bold text-gray-900">Transactions</h2>
                
                <div className="flex space-x-2">
                  <button className="btn-download bg-secondary-500 hover:bg-secondary-600 text-white py-2 px-4 rounded-md transition-all flex items-center">
                    <CSVLink
                      {...csvReport}
                      style={{ color: "#fff", textDecoration: "none", display: "flex", alignItems: "center" }}
                    >
                      <FaDownload className="mr-2" /> Download CSV
                    </CSVLink>
                  </button>
                  <button className="btn-statement bg-info hover:bg-info-600 text-white py-2 px-4 rounded-md transition-all flex items-center" onClick={openStatementModal}>
                    <FaFilePdf className="mr-2" /> Generate PDF
                  </button>
                  <button className="btn-create bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-md transition-all flex items-center" onClick={openCreateModal}>
                    <FaPlus className="mr-2" /> Create Transaction
                  </button>
                </div>
              </div>
              
              {/* Filters */}
              <div className="bg-white rounded-xl shadow-card p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div className="col-span-1 md:col-span-3">
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by Invoice or Reference ID"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="col-span-1">
                    <select
                      value={transactionType}
                      onChange={(e) => setTransactionType(e.target.value)}
                      className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    >
                      <option value="All">All Types</option>
                      <option value="Invoice">Invoice</option>
                      <option value="Credit">Credit</option>
                      <option value="Debit">Debit</option>
                      <option value="Refund">Refund</option>
                    </select>
                  </div>
                  
                  <div className="col-span-1">
                    <select
                      value={transactionStatus}
                      onChange={(e) => setTransactionStatus(e.target.value)}
                      className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    >
                      <option value="All">All Status</option>
                      <option value="Paid">Paid</option>
                      <option value="Partially Paid">Partially Paid</option>
                      <option value="Pending">Pending</option>
                      <option value="Expired">Expired</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                  <div className="col-span-1">
                    <label className="block text-sm text-gray-600 mb-1">From</label>
                    <DatePicker
                      selected={dateFrom}
                      onChange={(date) => setDateFrom(date)}
                      dateFormat="dd/MM/yyyy"
                      isClearable
                      placeholderText="Select start date"
                      className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                  </div>
                  
                  <div className="col-span-1">
                    <label className="block text-sm text-gray-600 mb-1">To</label>
                    <DatePicker
                      selected={dateTo}
                      onChange={(date) => setDateTo(date)}
                      dateFormat="dd/MM/yyyy"
                      isClearable
                      placeholderText="Select end date"
                      className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                  </div>
                  
                  <div className="col-span-1">
                    <label className="block text-sm text-gray-600 mb-1">Payment Mode</label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    >
                      <option value="All">All Modes</option>
                      <option value="UPI">UPI</option>
                      <option value="Card">Card</option>
                      <option value="Net Banking">Net Banking</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>
                  
                  <div className="col-span-1 flex items-end gap-2">
                    <button
                      type="button"
                      className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-md transition-all flex items-center justify-center"
                      onClick={filterAndSortTransactions}
                    >
                      <FaFilter className="mr-2" /> Apply
                    </button>
                    <button
                      type="button"
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-md transition-all"
                      onClick={() => {
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
              </div>

              {/* Transactions Table */}
              {filteredTransactions.length > 0 ? (
                <>
                  <div className="bg-white rounded-xl shadow-card overflow-hidden mb-4">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created At</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reference ID</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Pending</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Payment Mode</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Invoice</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredTransactions
                            .slice(
                              currentPage * rowsPerPage,
                              (currentPage + 1) * rowsPerPage
                            )
                            .map((tx, idx) => {
                              let statusClass = "";
                              let statusBgClass = "";
                              
                              switch ((tx.transactionStatus || "").toLowerCase()) {
                                case "paid":
                                  statusClass = "text-success";
                                  statusBgClass = "bg-success-50";
                                  break;
                                case "partially paid":
                                  statusClass = "text-warning";
                                  statusBgClass = "bg-warning-50";
                                  break;
                                case "pending":
                                  statusClass = "text-info";
                                  statusBgClass = "bg-info-50";
                                  break;
                                case "expired":
                                  statusClass = "text-danger";
                                  statusBgClass = "bg-danger-50";
                                  break;
                                default:
                                  statusClass = "text-gray-700";
                                  statusBgClass = "bg-gray-100";
                              }
                              
                              return (
                                <tr
                                  key={tx.id || `temp-id-${idx}`}
                                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                                  onClick={() => openDetailsModal(tx)}
                                >
                                  <td className="px-4 py-3 text-sm text-gray-700">
                                    {tx.createdAt
                                      ? moment(tx.createdAt).format(
                                          "DD/MM/YYYY, HH:mm:ss"
                                        )
                                      : "N/A"}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-700">
                                    {tx.transactionDate
                                      ? moment(tx.transactionDate).format(
                                          "DD/MM/YYYY"
                                        )
                                      : "N/A"}
                                  </td>
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                    {tx.referenceId || "N/A"}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-700">
                                    {tx.transactionType === "Credit" ? (
                                      <span className="text-success font-medium">Credit</span>
                                    ) : tx.transactionType === "Debit" ? (
                                      <span className="text-danger font-medium">Debit</span>
                                    ) : (
                                      tx.transactionType || "N/A"
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                    ₹{parseFloat(tx.amount).toFixed(2)}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-700">
                                    {!tx.invoice_id &&
                                    parseFloat(tx.pendingAmount) === 0
                                      ? "N/A"
                                      : parseFloat(
                                          tx.pendingAmount || 0
                                        ).toFixed(2)}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-700">
                                    {tx.paymentMode}
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass} ${statusBgClass}`}>
                                      {tx.transactionStatus}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm" onClick={(e) => e.stopPropagation()}>
                                    {tx.invoice_id ? (
                                      <button
                                        className="text-primary-600 hover:text-primary-800 font-medium transition-colors"
                                        onClick={() => navigate(`/fullinvoice/${tx.invoice_id}`)}
                                      >
                                        <FaFileInvoice className="inline mr-1" /> View
                                      </button>
                                    ) : (
                                      "N/A"
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-sm" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex space-x-2">
                                      <button
                                        className="text-primary-600 hover:text-primary-800 transition-colors"
                                        onClick={() => navigate(`/transaction/edit/${tx.id}`)}
                                      >
                                        <FaEdit />
                                      </button>
                                      {tx.transactionType === "Credit" && (
                                        <button
                                          className="text-warning hover:text-warning-600 transition-colors"
                                          onClick={(e) => openRefundModal(tx, e)}
                                          title="Process Refund"
                                        >
                                          <FaExchangeAlt />
                                        </button>
                                      )}
                                      <button
                                        className={`text-danger hover:text-danger-800 transition-colors ${
                                          tx.invoice_id ? "opacity-50 cursor-not-allowed" : ""
                                        }`}
                                        onClick={() => {
                                          if (tx.invoice_id) {
                                            addAlert(
                                              "danger",
                                              "Cannot delete transaction linked to an invoice.",
                                              "big"
                                            );
                                          } else {
                                            deleteTransaction(tx.id);
                                          }
                                        }}
                                      >
                                        <FaTrash />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Showing {Math.min(currentPage * rowsPerPage + 1, filteredTransactions.length)} to {Math.min((currentPage + 1) * rowsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-600">Rows:</label>
                        <select
                          value={rowsPerPage}
                          onChange={handleRowsPerPageChange}
                          className="border border-gray-300 rounded-md p-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        >
                          <option>10</option>
                          <option>25</option>
                          <option>50</option>
                          <option>100</option>
                        </select>
                      </div>
                      
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
                        containerClassName={"pagination flex space-x-1"}
                        pageClassName={"pagination-item"}
                        previousClassName={"pagination-nav"}
                        nextClassName={"pagination-nav"}
                        breakClassName={"pagination-break"}
                        activeClassName={"active"}
                        activeLinkClassName={"bg-primary-500 text-white"}
                        pageLinkClassName={"block px-3 py-1 rounded-md hover:bg-gray-100 transition-colors"}
                        previousLinkClassName={"block px-3 py-1 rounded-md hover:bg-gray-100 transition-colors text-gray-700"}
                        nextLinkClassName={"block px-3 py-1 rounded-md hover:bg-gray-100 transition-colors text-gray-700"}
                        disabledClassName={"opacity-50 cursor-not-allowed"}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-xl shadow-card p-8 text-center">
                  <p className="text-gray-500">No transactions found matching your filters.</p>
                </div>
              )}
            </div>
          )}

          {/* INVOICES TAB */}
          {activeTab === "invoices" && (
            <div className="invoices-section">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-display font-bold text-gray-900">Invoices</h2>
              </div>
              
              {allInvoices.length > 0 ? (
                <div className="bg-white rounded-xl shadow-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Invoice ID</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Invoice Number</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Invoice Date</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Due Date</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Received</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {allInvoices.map((inv, i) => {
                          const tot = parseFloat(inv.total) || 0;
                          const rec = parseFloat(inv.receivedAmount) || 0;
                          const bal = (tot - rec).toFixed(2);
                          return (
                            <tr
                              key={inv.id || `invoice-temp-${i}`}
                              onClick={() => navigate(`/fullinvoice/${inv.id}`)}
                              className="hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{inv.id || `Temp-${i + 1}`}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">{inv.invoiceNumber || "N/A"}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {inv.invoiceDate
                                  ? moment(inv.invoiceDate).format("DD/MM/YYYY")
                                  : "N/A"}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {inv.dueDate
                                  ? moment(inv.dueDate).format("DD/MM/YYYY")
                                  : "N/A"}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">₹{tot.toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm text-success font-medium">₹{rec.toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm text-danger font-medium">₹{bal}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-card p-8 text-center">
                  <p className="text-gray-500">No outstanding invoices for this customer.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Statement Modal */}
      {isStatementModalOpen && (
        <div
          className="modal-overlay"
          onClick={closeStatementModal}
          aria-modal="true"
          role="dialog"
        >
          <div className="modal-container bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-auto p-8 min-h-[500px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Generate PDF Statement</h2>
              <button
                onClick={closeStatementModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Start Date (optional)</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaCalendarAlt className="text-gray-400" />
                  </div>
                  <DatePicker
                    selected={statementDateFrom}
                    onChange={(d) => setStatementDateFrom(d)}
                    dateFormat="dd/MM/yyyy"
                    isClearable
                    placeholderText="Select start date"
                    className="form-control pl-10 w-full h-12 border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400"
                    popperClassName="date-picker-popper z-[9999]"
                    popperPlacement="bottom-start"
                    popperProps={{
                      strategy: "fixed"
                    }}
                    popperModifiers={[
                      {
                        name: "offset",
                        options: {
                          offset: [0, 12],
                        },
                      },
                      {
                        name: "preventOverflow",
                        options: {
                          boundary: document.body,
                        },
                      },
                    ]}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select End Date (optional)</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaCalendarAlt className="text-gray-400" />
                  </div>
                  <DatePicker
                    selected={statementDateTo}
                    onChange={(d) => setStatementDateTo(d)}
                    dateFormat="dd/MM/yyyy"
                    isClearable
                    placeholderText="Select end date"
                    className="form-control pl-10 w-full h-12 border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400"
                    popperClassName="date-picker-popper z-[9999]"
                    popperPlacement="bottom-start"
                    minDate={statementDateFrom}
                    popperProps={{
                      strategy: "fixed"
                    }}
                    popperModifiers={[
                      {
                        name: "offset",
                        options: {
                          offset: [0, 12],
                        },
                      },
                      {
                        name: "preventOverflow",
                        options: {
                          boundary: document.body,
                        },
                      },
                    ]}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button 
                className="h-12 px-6 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium text-sm shadow-sm" 
                onClick={closeStatementModal}
              >
                Cancel
              </button>
              <button
                className="h-12 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center font-medium text-sm shadow-sm"
                onClick={() => {
                  generatePDF();
                  closeStatementModal();
                }}
              >
                <FaFilePdf className="mr-2" /> Generate Statement
              </button>
            </div>
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

      {/* Create Transaction Modal */}
      {isCreateModalOpen && (
        <div
          className="modal-overlay"
          onClick={closeCreateModal}
          aria-modal="true"
          role="dialog"
        >
          <div className="transaction-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header bg-gradient-to-r from-indigo-600 to-violet-500 text-white p-6 rounded-t-xl">
              <div className="flex items-center">
                <div className="bg-white bg-opacity-20 p-3 rounded-lg mr-4">
                  <FaPlus className="text-xl" />
                </div>
                <h2 className="text-2xl font-display font-bold">Create New Transaction</h2>
              </div>
              <button 
                className="modal-close-button text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
                onClick={closeCreateModal}
                aria-label="Close Modal"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
            
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
              onSubmit={async (vals, { setSubmitting, resetForm }) => {
                const data = {
                  customer_id: id,
                  transactionType: vals.transactionType,
                  invoice_id:
                    vals.transactionType === "Credit" && vals.invoiceId
                      ? vals.invoiceId.value
                      : null,
                  referenceId: vals.referenceId || null,
                  transactionDate: vals.transactionDate,
                  amount: parseFloat(vals.amount),
                  paymentMode: vals.paymentMode,
                  pendingAmount:
                    vals.transactionType === "Credit" && vals.invoiceId
                      ? parseFloat(vals.pendingAmount)
                      : 0,
                  transactionStatus: vals.transactionStatus,
                  description: vals.description || null,
                  gstDetails: vals.gstDetails || null,
                  department_id: vals.department_id
                    ? vals.department_id.value
                    : null,
                };
                try {
                  const res = await axios.post(`${API_URL}/transactions`, data, {
                    headers: getAuthHeader(),
                  });
                  // Instead of just appending the new transaction, fetch all transactions again
                  // to ensure proper sorting
                  addAlert("success", "Transaction created successfully.", "big");
                  
                  // Refresh all data to ensure proper sorting
                  await fetchAllData();
                  
                  resetForm();
                  closeCreateModal();
                } catch (err) {
                  if (
                    err.response &&
                    err.response.data &&
                    err.response.data.errors
                  ) {
                    err.response.data.errors.forEach((e2) => {
                      addAlert("danger", e2.message, "little");
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
                setFieldTouched,
                errors,
                touched
              }) => {
                useEffect(() => {
                  if (
                    values.transactionType === "Credit" &&
                    values.invoiceId &&
                    values.amount
                  ) {
                    const selInv = allInvoices.find(
                      (i) => i.id === values.invoiceId.value
                    );
                    if (selInv) {
                      const newPending =
                        selInv.invoicePendingAmount - parseFloat(values.amount);
                      setFieldValue(
                        "pendingAmount",
                        newPending >= 0 ? newPending.toFixed(2) : "0.00"
                      );
                    }
                  } else if (
                    values.transactionType === "Credit" &&
                    values.invoiceId
                  ) {
                    const selInv = allInvoices.find(
                      (i) => i.id === values.invoiceId.value
                    );
                    if (selInv) {
                      setFieldValue(
                        "pendingAmount",
                        parseFloat(selInv.invoicePendingAmount).toFixed(2)
                      );
                    }
                  } else {
                    setFieldValue("pendingAmount", "");
                  }
                }, [
                  values.transactionType,
                  values.invoiceId,
                  values.amount,
                  setFieldValue,
                ]);
                
                return (
                  <Form className="transaction-form p-6">
                    <div className="p-5 bg-indigo-50 rounded-lg border border-indigo-100 mb-8">
                      <div className="flex items-center mb-2">
                        <FaUser className="text-indigo-600 mr-3 text-lg" />
                        <span className="font-semibold text-indigo-800 text-lg">Customer Details</span>
                      </div>
                      <div className="p-4 bg-white rounded-md border border-indigo-100 shadow-sm">
                        <span className="font-semibold text-gray-800">{customer.name || ""}</span> 
                        <span className="text-gray-500 text-sm ml-2">(ID: {customer.id})</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                      <div className="form-group">
                        <label className="form-label" htmlFor="transactionType">
                          Transaction Type <span className="text-rose-500">*</span>
                        </label>
                        <Field
                          as="select"
                          id="transactionType"
                          name="transactionType"
                          className={`form-control ${errors.transactionType && touched.transactionType ? 'border-rose-500' : ''}`}
                        >
                          <option value="">Select Type</option>
                          <option value="Invoice">Invoice</option>
                          <option value="Credit">Credit</option>
                          <option value="Debit">Debit</option>
                          <option value="Refund">Refund</option>
                        </Field>
                        {errors.transactionType && touched.transactionType && (
                          <div className="text-rose-500 text-sm mt-1">{errors.transactionType}</div>
                        )}
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label" htmlFor="transactionDate">
                          Transaction Date <span className="text-rose-500">*</span>
                        </label>
                        <Field
                          type="date"
                          id="transactionDate"
                          name="transactionDate"
                          className={`form-control ${errors.transactionDate && touched.transactionDate ? 'border-rose-500' : ''}`}
                        />
                        {errors.transactionDate && touched.transactionDate && (
                          <div className="text-rose-500 text-sm mt-1">{errors.transactionDate}</div>
                        )}
                      </div>
                    
                      {values.transactionType === "Credit" && (
                        <div className="form-group col-span-1 md:col-span-2">
                          <label className="form-label" htmlFor="invoiceId">Invoice (Optional)</label>
                          {allInvoices.length > 0 ? (
                            <Select
                              id="invoiceId"
                              name="invoiceId"
                              options={invoiceOptions}
                              isClearable
                              placeholder="Select an Invoice (Optional)"
                              onChange={(option) => {
                                setFieldValue("invoiceId", option);
                                setFieldTouched("invoiceId", true);
                              }}
                              value={values.invoiceId}
                              classNamePrefix="react-select"
                              className="z-50"
                              menuPortalTarget={document.body}
                              styles={{ 
                                menuPortal: base => ({ ...base, zIndex: 9999 }),
                                control: (base) => ({
                                  ...base,
                                  minHeight: '48px',
                                  borderColor: '#e5e7eb',
                                  borderWidth: '1.5px',
                                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                                  borderRadius: '0.6rem',
                                  '&:hover': {
                                    borderColor: '#cbd5e1'
                                  }
                                }),
                                placeholder: (base) => ({
                                  ...base,
                                  fontSize: '1rem',
                                  color: '#9ca3af'
                                }),
                                valueContainer: (base) => ({
                                  ...base,
                                  padding: '2px 14px'
                                }),
                                input: (base) => ({
                                  ...base,
                                  fontSize: '1rem'
                                }),
                                singleValue: (base) => ({
                                  ...base,
                                  fontSize: '1rem',
                                  color: '#1f2937'
                                }),
                                option: (base) => ({
                                  ...base,
                                  padding: '12px 16px',
                                  fontSize: '0.95rem'
                                })
                              }}
                            />
                          ) : (
                            <p className="text-gray-500 italic p-3 bg-gray-50 rounded-md border border-gray-200">No outstanding invoices available.</p>
                          )}
                          {errors.invoiceId && touched.invoiceId && (
                            <div className="text-rose-500 text-sm mt-1">{errors.invoiceId}</div>
                          )}
                        </div>
                      )}
                      
                      <div className="form-group">
                        <label className="form-label" htmlFor="amount">
                          Amount <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative amount-field">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700 font-medium text-lg">₹</span>
                          <Field
                            type="number"
                            id="amount"
                            name="amount"
                            placeholder="Enter Amount"
                            min="0"
                            step="0.01"
                            className={`form-control with-symbol pl-8 ${errors.amount && touched.amount ? 'border-rose-500' : ''}`}
                          />
                        </div>
                        {errors.amount && touched.amount && (
                          <div className="text-rose-500 text-sm mt-1">{errors.amount}</div>
                        )}
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label" htmlFor="paymentMode">
                          Payment Mode <span className="text-rose-500">*</span>
                        </label>
                        <Field
                          as="select"
                          id="paymentMode"
                          name="paymentMode"
                          className={`form-control ${errors.paymentMode && touched.paymentMode ? 'border-rose-500' : ''}`}
                        >
                          <option value="">Select Mode</option>
                          <option value="UPI">UPI</option>
                          <option value="Card">Card</option>
                          <option value="Net Banking">Net Banking</option>
                          <option value="Cash">Cash</option>
                        </Field>
                        {errors.paymentMode && touched.paymentMode && (
                          <div className="text-rose-500 text-sm mt-1">{errors.paymentMode}</div>
                        )}
                      </div>
                      
                      {values.transactionType === "Credit" && values.invoiceId && (
                        <div className="form-group">
                          <label className="form-label" htmlFor="pendingAmount">Pending Amount</label>
                          <div className="relative amount-field">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700 font-medium text-lg">₹</span>
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
                              className="form-control with-symbol pl-8 bg-gray-50 cursor-not-allowed"
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="form-group">
                        <label className="form-label" htmlFor="transactionStatus">
                          Status <span className="text-rose-500">*</span>
                        </label>
                        <Field
                          as="select"
                          id="transactionStatus"
                          name="transactionStatus"
                          className={`form-control ${errors.transactionStatus && touched.transactionStatus ? 'border-rose-500' : ''}`}
                        >
                          <option value="">Select Status</option>
                          <option value="Paid">Paid</option>
                          <option value="Partially Paid">Partially Paid</option>
                          <option value="Pending">Pending</option>
                          <option value="Expired">Expired</option>
                        </Field>
                        {errors.transactionStatus && touched.transactionStatus && (
                          <div className="text-rose-500 text-sm mt-1">{errors.transactionStatus}</div>
                        )}
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label" htmlFor="referenceId">Reference ID</label>
                        <Field
                          type="text"
                          id="referenceId"
                          name="referenceId"
                          placeholder="Enter Reference ID"
                          className={`form-control ${errors.referenceId && touched.referenceId ? 'border-rose-500' : ''}`}
                        />
                        {errors.referenceId && touched.referenceId && (
                          <div className="text-rose-500 text-sm mt-1">{errors.referenceId}</div>
                        )}
                      </div>
                      
                      <div className="form-group col-span-1 md:col-span-2">
                        <label className="form-label" htmlFor="department_id">Department</label>
                        {allDepartments.length > 0 ? (
                          <Select
                            id="department_id"
                            name="department_id"
                            options={departmentOptions}
                            isClearable
                            placeholder="Select Department"
                            onChange={(option) => {
                              setFieldValue("department_id", option);
                            }}
                            value={values.department_id}
                            classNamePrefix="react-select"
                            menuPortalTarget={document.body}
                            styles={{ 
                              menuPortal: base => ({ ...base, zIndex: 9999 }),
                              control: (base) => ({
                                ...base,
                                minHeight: '48px',
                                borderColor: '#e5e7eb',
                                borderWidth: '1.5px',
                                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                                borderRadius: '0.6rem',
                                '&:hover': {
                                  borderColor: '#cbd5e1'
                                }
                              }),
                              placeholder: (base) => ({
                                ...base,
                                fontSize: '1rem',
                                color: '#9ca3af'
                              }),
                              valueContainer: (base) => ({
                                ...base,
                                padding: '2px 14px'
                              }),
                              input: (base) => ({
                                ...base,
                                fontSize: '1rem'
                              }),
                              singleValue: (base) => ({
                                ...base,
                                fontSize: '1rem',
                                color: '#1f2937'
                              }),
                              option: (base) => ({
                                ...base,
                                padding: '12px 16px',
                                fontSize: '0.95rem'
                              })
                            }}
                          />
                        ) : (
                          <p className="text-gray-500 italic p-3 bg-gray-50 rounded-md border border-gray-200">No departments available.</p>
                        )}
                        {errors.department_id && touched.department_id && (
                          <div className="text-rose-500 text-sm mt-1">{errors.department_id}</div>
                        )}
                      </div>
                      
                      <div className="form-group col-span-1 md:col-span-2">
                        <label className="form-label" htmlFor="description">Description</label>
                        <Field
                          as="textarea"
                          id="description"
                          name="description"
                          rows="3"
                          placeholder="Enter transaction description"
                          className={`form-control ${errors.description && touched.description ? 'border-rose-500' : ''}`}
                        />
                        {errors.description && touched.description && (
                          <div className="text-rose-500 text-sm mt-1">{errors.description}</div>
                        )}
                      </div>
                      
                      <div className="form-group col-span-1 md:col-span-2">
                        <label className="form-label" htmlFor="gstDetails">GST Details</label>
                        <Field
                          type="text"
                          id="gstDetails"
                          name="gstDetails"
                          placeholder="Enter GST Details"
                          className={`form-control ${errors.gstDetails && touched.gstDetails ? 'border-rose-500' : ''}`}
                        />
                        {errors.gstDetails && touched.gstDetails && (
                          <div className="text-rose-500 text-sm mt-1">{errors.gstDetails}</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="form-actions mt-8 flex justify-end space-x-4 border-t pt-6">
                      <button
                        type="button"
                        className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={closeCreateModal}
                        disabled={isSubmitting}
                      >
                        <FaTimes className="inline mr-2" /> Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center shadow-md"
                        disabled={isSubmitting}
                      >
                        <FaSave className="mr-2" />
                        {isSubmitting ? "Processing..." : "Save Transaction"}
                      </button>
                    </div>
                  </Form>
                );
              }}
            </Formik>
          </div>
        </div>
      )}

      {/* Add Refund Modal */}
      {isRefundModalOpen && transactionToRefund && (
        <div
          className="modal-overlay"
          onClick={closeRefundModal}
          aria-modal="true"
          role="dialog"
        >
          <div className="modal-container bg-white rounded-xl shadow-xl max-w-md w-full mx-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-display font-bold text-gray-900">Process Refund</h2>
              <button
                className="text-gray-500 hover:text-gray-700 transition-colors"
                onClick={closeRefundModal}
                aria-label="Close Modal"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-4">
                <div className="flex items-center text-warning mb-2">
                  <FaExchangeAlt className="mr-2" />
                  <span className="font-medium">Refund Transaction</span>
                </div>
                <p className="text-sm text-gray-700">
                  You are processing a refund for Transaction #{transactionToRefund.id} of amount ₹{parseFloat(transactionToRefund.amount).toFixed(2)}
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Refund Amount<span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="0.00"
                    className="pl-8 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    min="0.01"
                    max={transactionToRefund.amount}
                    step="0.01"
                  />
                </div>
                {parseFloat(refundAmount) > parseFloat(transactionToRefund.amount) && (
                  <p className="text-danger text-xs mt-1">
                    Refund amount cannot exceed original transaction amount
                  </p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Mode<span className="text-danger">*</span>
                </label>
                <select
                  value={refundPaymentMode}
                  onChange={(e) => setRefundPaymentMode(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="">Select Payment Mode</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Refund
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Optional: Enter reason for refund"
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  rows="3"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button 
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors" 
                onClick={closeRefundModal}
                disabled={isRefundProcessing}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-warning hover:bg-warning-600 text-white rounded-md transition-colors flex items-center"
                onClick={processRefund}
                disabled={isRefundProcessing || !refundAmount || !refundPaymentMode || parseFloat(refundAmount) <= 0 || parseFloat(refundAmount) > parseFloat(transactionToRefund.amount)}
              >
                {isRefundProcessing ? (
                  <>Processing...</>
                ) : (
                  <>
                    <FaExchangeAlt className="mr-2" /> Process Refund
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerDetails;
