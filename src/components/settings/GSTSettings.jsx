import React from "react";
import { FaIdCard, FaFileInvoice, FaRegCopy } from "react-icons/fa";

function GSTSettings({ settings, handleInputChange, copyToClipboard }) {
  return (
    <div className="settings-grid">
      {/* GST Details Section */}
      <div className="settings-section">
        <div className="section-header">
          <FaIdCard />
          <h2>GST Information</h2>
        </div>

        <div className="setting-group">
          <label>GST Number</label>
          <div className="input-with-copy">
            <input
              type="text"
              name="gstNumber"
              value={settings.gstNumber}
              onChange={handleInputChange}
              placeholder="GSTIN Number"
              required
            />
            <button
              type="button"
              className="copy-btn"
              onClick={() => copyToClipboard(settings.gstNumber)}
            >
              <FaRegCopy />
            </button>
          </div>
        </div>

        <div className="setting-group">
          <label>GST Type</label>
          <select
            name="gstType"
            value={settings.gstType}
            onChange={handleInputChange}
          >
            <option value="Regular">Regular</option>
            <option value="Composition">Composition</option>
            <option value="Exempt">Exempt</option>
          </select>
        </div>
      </div>

      {/* Legal Information Section */}
      <div className="settings-section">
        <div className="section-header">
          <FaFileInvoice />
          <h2>Legal Information</h2>
        </div>

        <div className="setting-group">
          <label>Legal Business Name</label>
          <input
            type="text"
            name="legalName"
            value={settings.legalName}
            onChange={handleInputChange}
            placeholder="Legal Business Name"
            required
          />
        </div>

        <div className="setting-group">
          <label>PAN Number</label>
          <div className="input-with-copy">
            <input
              type="text"
              name="panNumber"
              value={settings.panNumber}
              onChange={handleInputChange}
              placeholder="PAN Number"
            />
            <button
              type="button"
              className="copy-btn"
              onClick={() => copyToClipboard(settings.panNumber)}
            >
              <FaRegCopy />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GSTSettings;
