import React, { useRef } from "react";
import { FaBuilding, FaIdCard, FaFileUpload } from "react-icons/fa";

function CompanyProfile({
  settings,
  handleInputChange,
  handleImageUpload,
  triggerFileInput,
  logoPreview,
}) {
  const logoInputRef = useRef(null);

  return (
    <div className="settings-grid">
      {/* Company Profile Section */}
      <div className="settings-section">
        <div className="section-header">
          <FaBuilding />
          <h2>Company Profile</h2>
        </div>

        <div className="setting-group">
          <label>Company Name</label>
          <input
            type="text"
            name="companyName"
            value={settings.companyName}
            onChange={handleInputChange}
            placeholder="Your Company Name"
            required
          />
        </div>

        <div className="setting-group">
          <label>Company Logo</label>
          <div className="logo-uploader">
            <div
              className={`logo-preview ${!logoPreview ? "empty" : ""}`}
              onClick={() => triggerFileInput(logoInputRef)}
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Company Logo Preview" />
              ) : (
                <div className="upload-placeholder">
                  <FaFileUpload />
                  <span>Click to upload logo</span>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={logoInputRef}
              onChange={(e) => handleImageUpload(e, "companyLogo")}
              accept="image/jpeg,image/png,image/gif"
              style={{ display: "none" }}
            />
            <button
              type="button"
              className="upload-btn"
              onClick={() => triggerFileInput(logoInputRef)}
            >
              {logoPreview ? "Change Logo" : "Upload Logo"}
            </button>
          </div>
          <p className="field-help">
            Upload your company logo. Recommended size: 300x150 pixels.
          </p>
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="settings-section">
        <div className="section-header">
          <FaIdCard />
          <h2>Contact Information</h2>
        </div>

        <div className="setting-group">
          <label>Address</label>
          <input
            type="text"
            name="companyAddress"
            value={settings.companyAddress}
            onChange={handleInputChange}
            placeholder="Company Address"
          />
        </div>

        <div className="setting-group">
          <label>Phone Number</label>
          <input
            type="text"
            name="companyPhone"
            value={settings.companyPhone}
            onChange={handleInputChange}
            placeholder="Company Phone"
          />
        </div>

        <div className="setting-group">
          <label>Email Address</label>
          <input
            type="email"
            name="companyEmail"
            value={settings.companyEmail}
            onChange={handleInputChange}
            placeholder="Company Email"
          />
        </div>
      </div>
    </div>
  );
}

export default CompanyProfile;
