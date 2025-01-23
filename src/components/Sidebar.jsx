// src/components/Sidebar.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // useNavigate for logout
import "./css/Sidebar.css";

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  // For logout
  const navigate = useNavigate();

  // Toggle function to collapse/expand the sidebar
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  // Handle Logout
  const handleLogout = () => {
    // Clear the token from localStorage
    localStorage.removeItem('token');
    // Navigate to login
    navigate('/login');
  };

  return (
    <div className={`sidebar-container ${collapsed ? "collapsed" : ""}`}>
      {/* Brand / Company Section */}
      <div className="sidebar-logo">
        <h2 className="company-name">{collapsed ? "HT" : "HT TRADERS"}</h2>
      </div>

      {/* Collapse button */}
      <button
        className="collapse-btn"
        onClick={toggleCollapse}
        aria-label="Toggle Sidebar"
      >
        {collapsed ? "»" : "«"}
      </button>

      {/* Main Navigation Section */}
      <nav className="sidebar-nav">
        <ul>
          <li className="active">
            <Link to="/home" className="sidebar-link">
              <span className="sidebar-icon">🏠</span>
              {!collapsed && <span className="link-text">Home</span>}
              {!collapsed && <span className="badge">16</span>}
            </Link>
          </li>
          <li>
            <Link to="/customers" className="sidebar-link">
              <span className="sidebar-icon">📒</span>
              {!collapsed && <span className="link-text">Customers</span>}
            </Link>
          </li>
          <li>
            <Link to="/stock" className="sidebar-link">
              <span className="sidebar-icon">📦</span>
              {!collapsed && <span className="link-text">Add Stock</span>}
            </Link>
          </li>
          <li>
            <Link to="/departments" className="sidebar-link">
              <span className="sidebar-icon">🏢</span>
              {!collapsed && <span className="link-text">Departments</span>}
            </Link>
          </li>
          <li>
            <Link to="/categories" className="sidebar-link">
              <span className="sidebar-icon">📂</span>
              {!collapsed && <span className="link-text">Categories</span>}
            </Link>
          </li>
          <li>
            <Link to="/billing" className="sidebar-link">
              <span className="sidebar-icon">🧾</span>
              {!collapsed && <span className="link-text">Billing</span>}
            </Link>
          </li>
          <li>
            <Link to="/schedule" className="sidebar-link">
              <span className="sidebar-icon">🗓️</span>
              {!collapsed && <span className="link-text">Rough Book</span>}
            </Link>
          </li>
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="sidebar-bottom">
        <ul>
          <li>
            <Link to="/settings" className="sidebar-link">
              <span className="sidebar-icon">⚙️</span>
              {!collapsed && <span className="link-text">Settings</span>}
            </Link>
          </li>
          <li>
            <Link to="/support" className="sidebar-link">
              <span className="sidebar-icon">❓</span>
              {!collapsed && <span className="link-text">Support</span>}
            </Link>
          </li>
          {/* LOGOUT option */}
          <li>
            <button className="sidebar-link logout-btn" onClick={handleLogout}>
              <span className="sidebar-icon">⛔</span>
              {!collapsed && <span className="link-text">Logout</span>}
            </button>
          </li>
        </ul>
      </div>

      {/* Profile Section (Optional) */}
      <div className="sidebar-profile">
        <img src="/path/to/profile.jpg" alt="Profile" className="profile-img" />
        {!collapsed && (
          <div className="profile-info">
            <strong>John Doe</strong>
            <small>Admin</small>
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;
