import React from "react";
import { FaUserCog, FaUserPlus, FaUsers, FaUserShield } from "react-icons/fa";

function UserManagement() {
  return (
    <div className="settings-grid">
      {/* User List Section */}
      <div className="settings-section">
        <div className="section-header">
          <FaUsers />
          <h2>Team Members</h2>
        </div>

        <div className="setting-group">
          <button className="btn-primary">
            <FaUserPlus /> Invite New User
          </button>

          <div className="users-list">
            <p className="coming-soon-message">
              User management functionality is coming soon! This section will
              allow you to add team members and manage their permissions.
            </p>
          </div>
        </div>
      </div>

      {/* Role Management Section */}
      <div className="settings-section">
        <div className="section-header">
          <FaUserShield />
          <h2>Roles & Permissions</h2>
        </div>

        <div className="setting-group">
          <div className="roles-list">
            <p className="coming-soon-message">
              Role-based access control is under development. You'll be able to
              define custom roles and assign specific permissions to each role.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserManagement;
