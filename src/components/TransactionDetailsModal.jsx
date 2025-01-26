// src/components/TransactionDetailsModal.jsx

import React from "react";
import { FaTimes } from "react-icons/fa";
import "./css/TransactionDetailsModal.css";

function TransactionDetailsModal({ transaction, onClose }) {
  // Correctly access the associated Customer data using lowercase 'customer'
  const customerName = transaction.customer ? transaction.customer.name : "N/A";

  // Similarly, access Invoice Number correctly
  const invoiceNumber = transaction.invoice
    ? transaction.invoice.invoiceNumber
    : "N/A";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h2>Transaction Details</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          <p>
            <strong>Transaction ID:</strong> {transaction.id}
          </p>
          <p>
            <strong>Customer:</strong> {customerName}
          </p>
          <p>
            <strong>Invoice Number:</strong> {invoiceNumber}
          </p>
          <p>
            <strong>Transaction Date:</strong>{" "}
            {transaction.transactionDate
              ? new Date(transaction.transactionDate).toLocaleString()
              : "N/A"}
          </p>
          <p>
            <strong>Transaction Type:</strong> {transaction.transactionType}
          </p>
          <p>
            <strong>Amount:</strong> ₹
            {transaction.amount !== undefined
              ? parseFloat(transaction.amount).toFixed(2)
              : "N/A"}
          </p>
          <p>
            <strong>Payment Mode:</strong> {transaction.paymentMode || "N/A"}
          </p>
          <p>
            <strong>Pending Amount:</strong> ₹
            {transaction.pendingAmount !== undefined
              ? parseFloat(transaction.pendingAmount).toFixed(2)
              : "0.00"}
          </p>
          <p>
            <strong>Transaction Status:</strong>{" "}
            {transaction.transactionStatus || "N/A"}
          </p>
          <p>
            <strong>Description:</strong> {transaction.description || "N/A"}
          </p>
          <p>
            <strong>GST Details:</strong> {transaction.gstDetails || "N/A"}
          </p>
          <p>
            <strong>Department:</strong> {transaction.department || "N/A"}
          </p>
          <p>
            <strong>Created At:</strong>{" "}
            {transaction.createdAt
              ? new Date(transaction.createdAt).toLocaleString()
              : "N/A"}
          </p>
          <p>
            <strong>Updated At:</strong>{" "}
            {transaction.updatedAt
              ? new Date(transaction.updatedAt).toLocaleString()
              : "N/A"}
          </p>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default TransactionDetailsModal;
