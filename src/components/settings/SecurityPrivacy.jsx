import React from "react";
import { FaShieldAlt, FaLock, FaKey } from "react-icons/fa";

function SecurityPrivacy({ settings, handleInputChange }) {
  return (
    <div className="settings-grid">
      {/* Account Security Section */}
      <div className="settings-section">
        <div className="section-header">
          <FaLock />
          <h2>Account Security</h2>
        </div>

        <div className="setting-group">
          <p className="coming-soon-message">
            Enhanced security settings are coming soon! You'll be able to change your password, enable two-factor authentication, and view login history.
          </p>
        </div>
      </div>

      {/* Data Privacy Section */}
      <div className="settings-section">
        <div className="section-header">
          <FaKey />
          <h2>Data Privacy</h2>
        </div>

        <div className="setting-group">
          <p className="coming-soon-message">
            Data privacy controls are coming soon! You'll be able to manage data retention policies, configure backup settings, and export your data.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SecurityPrivacy; 