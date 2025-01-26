// src/pages/TransactionEdit.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { FaArrowLeft, FaSave, FaTimes } from "react-icons/fa";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Select from "react-select";
import moment from "moment";
import "./css/TransactionEdit.css"; // Ensure you create corresponding CSS

function TransactionEdit() {
  const { id } = useParams(); // Transaction ID from URL
  const navigate = useNavigate();

  // State declarations
  const [transaction, setTransaction] = useState(null);
  const [allInvoices, setAllInvoices] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alerts, setAlerts] = useState([]);

  // Environment Variable for API URL
  const API_URL = "http://localhost:3000/api";

  // Helper to get Authorization header
  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  /**
   * Function to fetch transaction data
   */
  const fetchTransactionData = async () => {
    try {
      const res = await axios.get(`${API_URL}/transactions/${id}`, {
        headers: getAuthHeader(),
      });
      setTransaction(res.data);
    } catch (err) {
      console.error("Error fetching transaction data:", err);
      setError(
        err.response?.data?.message || "Failed to fetch transaction data."
      );
    }
  };

  /**
   * Function to fetch invoices
   */
  const fetchInvoices = async () => {
    try {
      const invoicesRes = await axios.get(`${API_URL}/invoices`, {
        headers: getAuthHeader(),
      });
      const filteredInvoices = invoicesRes.data.filter((inv) => {
        const received = parseFloat(inv.receivedAmount);
        const total = parseFloat(inv.total);
        return !isNaN(received) && !isNaN(total) && received < total;
      });
      setAllInvoices(filteredInvoices);
    } catch (err) {
      console.error("Error fetching invoices:", err);
      addAlert("danger", "Failed to fetch invoices.", "big");
    }
  };

  /**
   * Function to fetch departments
   */
  const fetchDepartments = async () => {
    try {
      const departmentsRes = await axios.get(`${API_URL}/departments`, {
        headers: getAuthHeader(),
      });
      setAllDepartments(departmentsRes.data);
    } catch (err) {
      console.error("Error fetching departments:", err);
      addAlert("danger", "Failed to fetch departments.", "big");
    }
  };

  /**
   * Initial Data Fetching
   */
  useEffect(() => {
    const fetchData = async () => {
      await fetchTransactionData();
      await fetchInvoices();
      await fetchDepartments();
      setLoading(false);
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /**
   * Alert Management
   */
  const addAlert = (type, message, size = "little") => {
    const alertId = Date.now();
    setAlerts((prev) => [...prev, { id: alertId, type, message, size }]);
    // Duration between 5 to 7 seconds
    const duration = 5000 + Math.floor(Math.random() * 2000);
    setTimeout(() => {
      setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
    }, duration);
  };

  /**
   * Yup Validation Schema
   * Moved inside the component to access original transaction amount
   */
  const TransactionSchema = Yup.object().shape({
    transactionType: Yup.string().required("Transaction Type is required"),
    invoiceId: Yup.object().nullable(),
    referenceId: Yup.string()
      .max(50, "Reference ID must be at most 50 characters")
      .nullable(),
    transactionDate: Yup.date()
      .required("Transaction Date is required")
      .max(new Date(), "Transaction Date cannot be in the future"),
    amount: Yup.number()
      .required("Amount is required")
      .min(0, "Amount must be zero or greater")
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
              const originalAmount = transaction.amount || 0;
              return value <= (selectedInvoice.invoicePendingAmount || 0) + originalAmount;
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
   * Early Returns for Loading, Error, or No Transaction
   */
  if (loading) {
    return (
      <div className="te-transaction-edit-wrapper">
        <Sidebar />
        <div className="te-transaction-edit-container">
          <div className="te-transaction-edit-content">
            <div className="te-loading">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="te-transaction-edit-wrapper">
        <Sidebar />
        <div className="te-transaction-edit-container">
          <div className="te-transaction-edit-content">
            <div className="te-error">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="te-transaction-edit-wrapper">
        <Sidebar />
        <div className="te-transaction-edit-container">
          <div className="te-transaction-edit-content">
            <div className="te-error">Transaction not found.</div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Prepare Invoice Options for React Select
   * - If transaction has an associated invoice, show only that invoice and disable the dropdown
   * - Else, show all available invoices
   */
  const invoiceOptions = transaction.invoice_id
    ? [
        {
          value: transaction.invoice_id,
          label: `Invoice No: ${
            transaction.Invoice?.invoiceNumber || "N/A"
          } | Date: ${
            transaction.Invoice?.invoiceDate
              ? new Date(transaction.Invoice.invoiceDate).toLocaleDateString("en-GB")
              : "N/A"
          } | Due: ${
            transaction.Invoice?.dueDate
              ? new Date(transaction.Invoice.dueDate).toLocaleDateString("en-GB")
              : "N/A"
          } | Amount: ₹${parseFloat(transaction.Invoice?.total || 0).toFixed(2)} | Received: ₹${parseFloat(
            transaction.Invoice?.receivedAmount || 0
          ).toFixed(2)} | Pending: ₹${parseFloat(transaction.Invoice?.invoicePendingAmount || 0).toFixed(2)}`,
          invoicePendingAmount: parseFloat(transaction.Invoice?.invoicePendingAmount || 0),
        },
      ]
    : allInvoices
        .sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate))
        .map((inv) => ({
          value: inv.id,
          label: `Invoice No: ${inv.invoiceNumber || "N/A"} | Date: ${
            inv.invoiceDate
              ? new Date(inv.invoiceDate).toLocaleDateString("en-GB")
              : "N/A"
          } | Due: ${
            inv.dueDate
              ? new Date(inv.dueDate).toLocaleDateString("en-GB")
              : "N/A"
          } | Amount: ₹${parseFloat(inv.total || 0).toFixed(2)} | Received: ₹${parseFloat(
            inv.receivedAmount || 0
          ).toFixed(2)} | Pending: ₹${parseFloat(inv.invoicePendingAmount || 0).toFixed(2)}`,
          invoicePendingAmount: parseFloat(inv.invoicePendingAmount || 0),
        }));

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
    <div className="te-transaction-edit-wrapper">
      <Sidebar />
      <div className="te-transaction-edit-container">
        {/* Alerts Section */}
        <div className="te-alerts-section">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`te-alert te-alert--${alert.type} ${
                alert.size === "big" ? "te-alert--big" : "te-alert--little"
              }`}
            >
              {alert.message}
              <button
                className="te-close-btn"
                onClick={() =>
                  setAlerts((prev) => prev.filter((a) => a.id !== alert.id))
                }
              >
                <FaTimes />
              </button>
            </div>
          ))}
        </div>

        <div className="te-transaction-edit-content">
          {/* Back Button */}
          <button
            className="btn-back"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft /> Back
          </button>

          {/* 🔺 Added: Associated Invoice Details Section */}
          {transaction.invoice_id && transaction.Invoice && (
            <div className="te-invoice-details-card">
              <h3 className="te-invoice-details-title">Associated Invoice Details</h3>
              <div className="te-invoice-details">
                <p>
                  <strong>Invoice Number:</strong> {transaction.Invoice.invoiceNumber || "N/A"}
                </p>
                <p>
                  <strong>Invoice Date:</strong>{" "}
                  {transaction.Invoice.invoiceDate
                    ? new Date(transaction.Invoice.invoiceDate).toLocaleDateString("en-GB")
                    : "N/A"}
                </p>
                <p>
                  <strong>Due Date:</strong>{" "}
                  {transaction.Invoice.dueDate
                    ? new Date(transaction.Invoice.dueDate).toLocaleDateString("en-GB")
                    : "N/A"}
                </p>
                <p>
                  <strong>Total Amount:</strong> ₹{parseFloat(transaction.Invoice?.total || 0).toFixed(2)}
                </p>
                <p>
                  <strong>Received Amount:</strong> ₹{parseFloat(transaction.Invoice?.receivedAmount || 0).toFixed(2)}
                </p>
                <p>
                  <strong>Pending Amount:</strong> ₹{parseFloat(transaction.Invoice?.invoicePendingAmount || 0).toFixed(2)}
                </p>
              </div>
            </div>
          )}
          {/* 🔺 End: Associated Invoice Details Section */}

          {/* Edit Transaction Form */}
          <div className="te-edit-transaction-card">
            <h2 className="te-edit-transaction-card__title">Edit Transaction</h2>
            <Formik
              enableReinitialize
              initialValues={{
                transactionType: transaction.transactionType || "",
                invoiceId: transaction.invoice_id
                  ? {
                      value: transaction.invoice_id,
                      label: `Invoice No: ${
                        transaction.Invoice?.invoiceNumber || "N/A"
                      }`,
                      invoicePendingAmount:
                        transaction.Invoice?.invoicePendingAmount || 0,
                    }
                  : null,
                referenceId: transaction.referenceId || "",
                transactionDate: transaction.transactionDate
                  ? moment(transaction.transactionDate).format("YYYY-MM-DD")
                  : "",
                amount: transaction.amount || "",
                paymentMode: transaction.paymentMode || "",
                pendingAmount: transaction.pendingAmount || "",
                transactionStatus: transaction.transactionStatus || "",
                description: transaction.description || "",
                gstDetails: transaction.gstDetails || "",
                department_id: transaction.department_id
                  ? {
                      value: transaction.department_id,
                      label: transaction.Department?.name || "N/A",
                    }
                  : null,
              }}
              validationSchema={TransactionSchema}
              onSubmit={async (values, { setSubmitting }) => {
                const data = {
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

                try {
                  const res = await axios.put(
                    `${API_URL}/transactions/${id}`,
                    data,
                    { headers: getAuthHeader() }
                  );
                  addAlert(
                    "success",
                    "Transaction updated successfully.",
                    "big"
                  );
                  navigate(-1); // Navigate back after successful update
                } catch (err) {
                  console.error("Error updating transaction:", err);
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
                        "Failed to update transaction.",
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
                    values.amount !== ""
                  ) {
                    const selectedInvoice = allInvoices.find(
                      (inv) => inv.id === values.invoiceId.value
                    );
                    if (selectedInvoice) {
                      const originalAmount = transaction.amount || 0;
                      const newPendingAmount =
                        (selectedInvoice.invoicePendingAmount || 0) +
                        originalAmount -
                        parseFloat(values.amount);
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
                      const originalAmount = transaction.amount || 0;
                      setFieldValue(
                        "pendingAmount",
                        (
                          (parseFloat(selectedInvoice.invoicePendingAmount) || 0) +
                          originalAmount
                        ).toFixed(2)
                      );
                    }
                  } else {
                    setFieldValue("pendingAmount", "");
                  }
                  // eslint-disable-next-line react-hooks/exhaustive-deps
                }, [values.transactionType, values.invoiceId, values.amount]);

                /**
                 * **Handle Transaction Type Change:**
                 * Automatically update transaction type when invoice is removed or added.
                 */
                useEffect(() => {
                  if (values.transactionType !== "Credit" && !values.invoiceId) {
                    setFieldValue("transactionType", "Debit");
                  }
                  // eslint-disable-next-line react-hooks/exhaustive-deps
                }, [values.invoiceId]);

                return (
                  <Form className="te-transaction-form">
                    {/* Transaction Type */}
                    <div className="te-form-group">
                      <label htmlFor="transactionType">
                        Transaction Type<span className="te-required">*</span>
                      </label>
                      <Field
                        as="select"
                        id="transactionType"
                        name="transactionType"
                        className="te-select"
                        onChange={(e) => {
                          const selectedType = e.target.value;
                          setFieldValue("transactionType", selectedType);
                          if (selectedType !== "Credit") {
                            setFieldValue("invoiceId", null);
                          }
                        }}
                        disabled={!!transaction.invoice_id} // **NEW: Disable if transaction has an invoice**
                      >
                        <option value="">Select Type</option>
                        <option value="Credit">Credit</option>
                        <option value="Debit">Debit</option>
                        <option value="Refund">Refund</option>
                      </Field>
                      <ErrorMessage
                        name="transactionType"
                        component="div"
                        className="te-error-message"
                      />
                    </div>

                    {/* Invoice Selection (Conditional) */}
                    {values.transactionType === "Credit" && (
                      <div className="te-form-group">
                        <label htmlFor="invoiceId">Invoice (Optional)</label>
                        {invoiceOptions.length > 0 ? (
                          <Select
                            id="invoiceId"
                            name="invoiceId"
                            options={invoiceOptions}
                            isClearable={!transaction.invoice_id} // Allow clearing only if no associated invoice
                            isMulti={false}
                            placeholder="Select an Invoice (Optional)"
                            onChange={(option) => {
                              setFieldValue("invoiceId", option);
                              setFieldTouched("invoiceId", true);
                            }}
                            value={values.invoiceId}
                            classNamePrefix="te-react-select"
                            isDisabled={!!transaction.invoice_id} // **NEW: Disable if transaction has an invoice**
                          />
                        ) : (
                          <p className="te-no-invoices">No outstanding invoices available.</p>
                        )}
                        <ErrorMessage
                          name="invoiceId"
                          component="div"
                          className="te-error-message"
                        />
                      </div>
                    )}

                    {/* Reference ID */}
                    <div className="te-form-group">
                      <label htmlFor="referenceId">Reference ID</label>
                      <Field
                        type="text"
                        id="referenceId"
                        name="referenceId"
                        placeholder="Enter Reference ID"
                        className="te-input"
                      />
                      <ErrorMessage
                        name="referenceId"
                        component="div"
                        className="te-error-message"
                      />
                    </div>

                    {/* Transaction Date */}
                    <div className="te-form-group">
                      <label htmlFor="transactionDate">
                        Transaction Date<span className="te-required">*</span>
                      </label>
                      <Field
                        type="date"
                        id="transactionDate"
                        name="transactionDate"
                        placeholder="Select Transaction Date"
                        className="te-input"
                      />
                      <ErrorMessage
                        name="transactionDate"
                        component="div"
                        className="te-error-message"
                      />
                    </div>

                    {/* Amount */}
                    <div className="te-form-group">
                      <label htmlFor="amount">
                        Amount<span className="te-required">*</span>
                      </label>
                      <div className="te-input-with-icon">
                        <span className="te-currency">₹</span>
                        <Field
                          type="number"
                          id="amount"
                          name="amount"
                          placeholder="Enter Amount"
                          min="0"
                          step="0.01"
                          className="te-input"
                        />
                      </div>
                      <ErrorMessage
                        name="amount"
                        component="div"
                        className="te-error-message"
                      />
                    </div>

                    {/* Payment Mode */}
                    <div className="te-form-group">
                      <label htmlFor="paymentMode">
                        Payment Mode<span className="te-required">*</span>
                      </label>
                      <Field
                        as="select"
                        id="paymentMode"
                        name="paymentMode"
                        className="te-select"
                      >
                        <option value="">Select Mode</option>
                        <option value="UPI">UPI</option>
                        <option value="Card">Card</option>
                        <option value="Net Banking">Net Banking</option>
                        <option value="Cash">Cash</option>
                      </Field>
                      <ErrorMessage
                        name="paymentMode"
                        component="div"
                        className="te-error-message"
                      />
                    </div>

                    {/* Pending Amount (Read-Only if credit with invoice) */}
                    {values.transactionType === "Credit" &&
                      values.invoiceId && (
                        <div className="te-form-group">
                          <label htmlFor="pendingAmount">Pending Amount</label>
                          <div className="te-input-with-icon">
                            <span className="te-currency">₹</span>
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
                              className="te-input"
                            />
                          </div>
                          <ErrorMessage
                            name="pendingAmount"
                            component="div"
                            className="te-error-message"
                          />
                        </div>
                      )}

                    {/* Transaction Status */}
                    <div className="te-form-group">
                      <label htmlFor="transactionStatus">
                        Status<span className="te-required">*</span>
                      </label>
                      <Field
                        as="select"
                        id="transactionStatus"
                        name="transactionStatus"
                        className="te-select"
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
                        className="te-error-message"
                      />
                    </div>

                    {/* Description */}
                    <div className="te-form-group">
                      <label htmlFor="description">Description</label>
                      <Field
                        as="textarea"
                        id="description"
                        name="description"
                        placeholder="Enter Description"
                        rows="3"
                        className="te-textarea"
                      />
                      <ErrorMessage
                        name="description"
                        component="div"
                        className="te-error-message"
                      />
                    </div>

                    {/* GST Details */}
                    <div className="te-form-group">
                      <label htmlFor="gstDetails">GST Details</label>
                      <Field
                        type="text"
                        id="gstDetails"
                        name="gstDetails"
                        placeholder="Enter GST Details"
                        className="te-input"
                      />
                      <ErrorMessage
                        name="gstDetails"
                        component="div"
                        className="te-error-message"
                      />
                    </div>

                    {/* Department Field (React-Select) */}
                    <div className="te-form-group">
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
                            setFieldValue("department_id", option);
                          }}
                          value={values.department_id}
                          classNamePrefix="te-react-select"
                        />
                      ) : (
                        <p className="te-no-departments">No departments available.</p>
                      )}
                      <ErrorMessage
                        name="department_id"
                        component="div"
                        className="te-error-message"
                      />
                    </div>

                    {/* Form Actions */}
                    <div className="te-form-actions">
                      <button
                        type="button"
                        className="te-btn-cancel"
                        onClick={() => navigate(-1)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="te-btn-submit"
                        disabled={isSubmitting}
                      >
                        <FaSave /> Save Changes
                      </button>
                    </div>
                  </Form>
                );
              }}
            </Formik>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TransactionEdit;
