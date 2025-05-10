import React from "react";
import { FaBell, FaEnvelope, FaSms } from "react-icons/fa";

function NotificationSettings({ settings, handleInputChange }) {
  return (
    <div className="settings-grid">
      {/* Email Notifications Section */}
      <div className="settings-section">
        <div className="section-header">
          <FaEnvelope />
          <h2>Email Notifications</h2>
        </div>

        <div className="setting-group">
          <p className="coming-soon-message">
            Email notification settings and templates are coming soon! You'll be
            able to customize email templates for invoices, payment reminders,
            and more.
          </p>
        </div>
      </div>

      {/* SMS Notifications Section */}
      <div className="settings-section">
        <div className="section-header">
          <FaSms />
          <h2>SMS Notifications</h2>
        </div>

        <div className="setting-group">
          <p className="coming-soon-message">
            SMS notification settings are coming soon! You'll be able to set up
            SMS alerts for payment reminders and invoice notifications.
          </p>
        </div>
      </div>
    </div>
  );
}

export default NotificationSettings;
