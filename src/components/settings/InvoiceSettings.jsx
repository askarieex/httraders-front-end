import React from "react";
import { FaFileInvoice } from "react-icons/fa";

function InvoiceSettings({ settings, handleInputChange }) {
  return (
    <div className="settings-grid">
      {/* Invoice Format Section */}
      <div className="settings-section">
        <div className="section-header">
          <FaFileInvoice />
          <h2>Invoice Format</h2>
        </div>

        <div className="setting-group">
          <label>Invoice Number Prefix</label>
          <input
            type="text"
            name="invoicePrefix"
            value={settings.invoicePrefix || "INV"}
            onChange={handleInputChange}
            placeholder="Invoice Prefix (e.g. INV)"
          />
          <p className="field-help">
            This prefix will appear before the invoice number (e.g. INV-0001)
          </p>
        </div>

        <div className="setting-group">
          <label>Next Invoice Number</label>
          <input
            type="number"
            name="nextInvoiceNumber"
            value={settings.nextInvoiceNumber || 1}
            onChange={handleInputChange}
            placeholder="Next Invoice Number"
            min="1"
          />
        </div>
      </div>

      {/* Invoice Defaults Section */}
      <div className="settings-section">
        <div className="section-header">
          <FaFileInvoice />
          <h2>Default Text</h2>
        </div>

        <div className="setting-group">
          <label>Thank You Message</label>
          <textarea
            name="thankYouMessage"
            value={settings.thankYouMessage || "Thank you for your business!"}
            onChange={handleInputChange}
            placeholder="Thank You Message"
            rows="2"
          ></textarea>
        </div>

        <div className="setting-group">
          <label>Default Payment Terms</label>
          <textarea
            name="paymentTerms"
            value={settings.paymentTerms || "Payment due within 30 days."}
            onChange={handleInputChange}
            placeholder="Payment Terms"
            rows="2"
          ></textarea>
        </div>

        <div className="setting-group">
          <label>Default Notes</label>
          <textarea
            name="invoiceNotes"
            value={settings.invoiceNotes || ""}
            onChange={handleInputChange}
            placeholder="Notes to appear on invoices"
            rows="3"
          ></textarea>
        </div>
      </div>
    </div>
  );
}

export default InvoiceSettings;
