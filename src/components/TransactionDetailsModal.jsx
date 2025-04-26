// src/components/TransactionDetailsModal.jsx

import React from 'react';
import { FaTimes, FaMoneyBillWave, FaCalendarAlt, FaTag, FaUser, FaFileInvoice, FaBuilding } from 'react-icons/fa';
import moment from 'moment';
import './css/TransactionDetailsModal.css';

const TransactionDetailsModal = ({ transaction, onClose }) => {
  if (!transaction) return null;

  // Convert date string to formatted date
  const formattedDate = transaction.transactionDate
    ? moment(transaction.transactionDate).format('MMMM D, YYYY')
    : 'N/A';

  // Transaction status styles
  const getStatusStyle = () => {
    switch ((transaction.transactionStatus || '').toLowerCase()) {
      case 'paid':
        return 'status-paid';
      case 'partially paid':
        return 'status-partially-paid';
      case 'pending':
        return 'status-pending';
      case 'expired':
        return 'status-expired';
      default:
        return 'status-default';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          <FaTimes />
        </button>
        
        <div className="modal-header">
          <h2>Transaction Details</h2>
          <span className={`status-badge ${getStatusStyle()}`}>
            {transaction.transactionStatus}
          </span>
        </div>

        <div className="transaction-amount">
          <FaMoneyBillWave className="amount-icon" />
          <span className="currency">₹</span>
          <span className="amount">{parseFloat(transaction.amount).toFixed(2)}</span>
        </div>

        <div className="transaction-info">
          <div className="info-group">
            <div className="info-item">
              <div className="info-label">
                <FaCalendarAlt />
                <span>Transaction Date</span>
              </div>
              <div className="info-value">{formattedDate}</div>
            </div>
            
            <div className="info-item">
              <div className="info-label">
                <FaTag />
                <span>Transaction Type</span>
              </div>
              <div className="info-value">{transaction.transactionType || 'N/A'}</div>
            </div>
            
            <div className="info-item">
              <div className="info-label">
                <FaUser />
                <span>Customer ID</span>
              </div>
              <div className="info-value">{transaction.customer_id || 'N/A'}</div>
            </div>
            
            <div className="info-item">
              <div className="info-label">
                <FaFileInvoice />
                <span>Reference ID</span>
              </div>
              <div className="info-value">{transaction.referenceId || 'N/A'}</div>
            </div>

            {transaction.invoice_id && (
              <div className="info-item">
                <div className="info-label">
                  <FaFileInvoice />
                  <span>Invoice ID</span>
                </div>
                <div className="info-value">{transaction.invoice_id}</div>
              </div>
            )}
            
            <div className="info-item">
              <div className="info-label">
                <FaBuilding />
                <span>Department</span>
              </div>
              <div className="info-value">
                {transaction.department ? transaction.department : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {transaction.description && (
          <div className="description-section">
            <h3>Description</h3>
            <p>{transaction.description}</p>
          </div>
        )}

        <div className="meta-info">
          <p>Transaction ID: {transaction.id}</p>
          <p>Created: {moment(transaction.createdAt).format('MMMM D, YYYY, h:mm a')}</p>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailsModal;
