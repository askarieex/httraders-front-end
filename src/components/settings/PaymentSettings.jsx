import React, { useRef } from "react";
import {
  FaQrcode,
  FaUniversity,
  FaFileUpload,
  FaRegCopy,
} from "react-icons/fa";

function PaymentSettings({
  settings,
  handleInputChange,
  handleImageUpload,
  triggerFileInput,
  copyToClipboard,
  qrCodePreview,
}) {
  const qrCodeInputRef = useRef(null);

  return (
    <div className="settings-grid">
      {/* UPI Settings Section */}
      <div className="settings-section">
        <div className="section-header">
          <FaQrcode />
          <h2>UPI Payment Settings</h2>
        </div>

        <div className="setting-group">
          <label>UPI ID</label>
          <div className="input-with-copy">
            <input
              type="text"
              name="upiId"
              value={settings.upiId}
              onChange={handleInputChange}
              placeholder="yourname@upi"
              required
            />
            <button
              type="button"
              className="copy-btn"
              onClick={() => copyToClipboard(settings.upiId)}
            >
              <FaRegCopy />
            </button>
          </div>
          <p className="field-help">
            This UPI ID will be displayed on invoices for customers to make
            payments.
          </p>
        </div>

        <div className="setting-group">
          <label>QR Code Image</label>
          <div className="qr-code-uploader">
            <div
              className={`qr-code-preview ${!qrCodePreview ? "empty" : ""}`}
              onClick={() => triggerFileInput(qrCodeInputRef)}
            >
              {qrCodePreview ? (
                <img src={qrCodePreview} alt="QR Code Preview" />
              ) : (
                <div className="upload-placeholder">
                  <FaFileUpload />
                  <span>Click to upload QR code</span>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={qrCodeInputRef}
              onChange={(e) => handleImageUpload(e, "qrCodeImage")}
              accept="image/jpeg,image/png,image/gif"
              style={{ display: "none" }}
            />
            <button
              type="button"
              className="upload-btn"
              onClick={() => triggerFileInput(qrCodeInputRef)}
            >
              {qrCodePreview ? "Change QR Code" : "Upload QR Code"}
            </button>
          </div>
          <p className="field-help">
            Upload a QR code image that customers can scan to make UPI payments.
            Recommended size: 500x500 pixels.
          </p>
        </div>
      </div>

      {/* Bank Details Section */}
      <div className="settings-section">
        <div className="section-header">
          <FaUniversity />
          <h2>Bank Account Settings</h2>
        </div>

        <div className="setting-group">
          <label>Account Name</label>
          <div className="input-with-copy">
            <input
              type="text"
              name="accountName"
              value={settings.accountName}
              onChange={handleInputChange}
              placeholder="Account Holder Name"
              required
            />
            <button
              type="button"
              className="copy-btn"
              onClick={() => copyToClipboard(settings.accountName)}
            >
              <FaRegCopy />
            </button>
          </div>
        </div>

        <div className="setting-group">
          <label>Bank Name</label>
          <div className="input-with-copy">
            <input
              type="text"
              name="bankName"
              value={settings.bankName}
              onChange={handleInputChange}
              placeholder="Bank Name"
              required
            />
            <button
              type="button"
              className="copy-btn"
              onClick={() => copyToClipboard(settings.bankName)}
            >
              <FaRegCopy />
            </button>
          </div>
        </div>

        <div className="setting-group">
          <label>Account Number</label>
          <div className="input-with-copy">
            <input
              type="text"
              name="accountNumber"
              value={settings.accountNumber}
              onChange={handleInputChange}
              placeholder="Account Number"
              required
            />
            <button
              type="button"
              className="copy-btn"
              onClick={() => copyToClipboard(settings.accountNumber)}
            >
              <FaRegCopy />
            </button>
          </div>
        </div>

        <div className="setting-group">
          <label>IFSC Code</label>
          <div className="input-with-copy">
            <input
              type="text"
              name="ifscCode"
              value={settings.ifscCode}
              onChange={handleInputChange}
              placeholder="IFSC Code"
              required
            />
            <button
              type="button"
              className="copy-btn"
              onClick={() => copyToClipboard(settings.ifscCode)}
            >
              <FaRegCopy />
            </button>
          </div>
        </div>

        <div className="setting-group">
          <label>Branch</label>
          <div className="input-with-copy">
            <input
              type="text"
              name="branch"
              value={settings.branch}
              onChange={handleInputChange}
              placeholder="Branch Name"
              required
            />
            <button
              type="button"
              className="copy-btn"
              onClick={() => copyToClipboard(settings.branch)}
            >
              <FaRegCopy />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentSettings;
