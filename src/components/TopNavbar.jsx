// src/components/TopNavbar.jsx
import React from 'react';
import './css/TopNavbar.css';

function TopNavbar() {
  return (
    <div className="topnav-container">
      <div className="welcome-section">
        <span>Welcome,</span>
      </div>

      <div className="searchbar-section">
        <input type="text" placeholder="Find something" />
      </div>

      <div className="topnav-right">
        <button className="notif-btn">🔔</button>
        <div className="profile-avatar">
          <img
            src="https://via.placeholder.com/32"
            alt="User Avatar"
          />
        </div>
      </div>
    </div>
  );
}

export default TopNavbar;
