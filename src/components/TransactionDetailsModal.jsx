// src/components/TransactionDetailsModal.js

import React from 'react';
import { FaTimes } from 'react-icons/fa';
import './css/TransactionDetailsModal.css';

function TransactionDetailsModal({ transaction, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Transaction Details</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="modal-body">
          <p><strong>Transaction ID:</strong> {transaction.id}</p>
          <p><strong>Customer ID:</strong> {transaction.customerId}</p>
          <p><strong>Invoice Number:</strong> {transaction.invoiceNumber}</p>
          <p><strong>Transaction Date:</strong> {new Date(transaction.transactionDate).toLocaleString()}</p>
          <p><strong>Transaction Type:</strong> {transaction.transactionType}</p>
          <p><strong>Amount:</strong> ₹{parseFloat(transaction.amount).toFixed(2)}</p>
          <p><strong>Payment Mode:</strong> {transaction.paymentMode}</p>
          <p><strong>Pending Amount:</strong> ₹{parseFloat(transaction.pendingAmount || 0).toFixed(2)}</p>
          <p><strong>Transaction Status:</strong> {transaction.transactionStatus}</p>
          <p><strong>Description:</strong> {transaction.description}</p>
          <p><strong>GST Details:</strong> {transaction.gstDetails || 'N/A'}</p>
          <p><strong>Department:</strong> {transaction.department || 'N/A'}</p>
          <p><strong>Created At:</strong> {new Date(transaction.createdAt).toLocaleString()}</p>
          <p><strong>Updated At:</strong> {new Date(transaction.updatedAt).toLocaleString()}</p>
        </div>
        <div className="modal-footer">
          <button className="btn-close" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default TransactionDetailsModal;
