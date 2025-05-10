import React from "react";
import { FaPaintBrush, FaPalette, FaFont } from "react-icons/fa";

function ThemeAppearance({ settings, handleInputChange }) {
  return (
    <div className="settings-grid">
      {/* Theme Selection Section */}
      <div className="settings-section">
        <div className="section-header">
          <FaPalette />
          <h2>Theme Selection</h2>
        </div>

        <div className="setting-group">
          <label>Color Theme</label>
          <div className="theme-selector">
            <p className="coming-soon-message">
              Theme customization is coming soon! You'll be able to select from
              predefined themes or create a custom color scheme.
            </p>
          </div>
        </div>
      </div>

      {/* Font Settings Section */}
      <div className="settings-section">
        <div className="section-header">
          <FaFont />
          <h2>Typography Settings</h2>
        </div>

        <div className="setting-group">
          <p className="coming-soon-message">
            Typography customization is coming soon! You'll be able to set your
            preferred fonts and sizes for different text elements.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ThemeAppearance;
