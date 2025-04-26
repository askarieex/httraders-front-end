// src/components/Sidebar.jsx
import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { AnimatePresence, motion } from "framer-motion";
import { 
  FaHome, 
  FaUsers, 
  FaBoxOpen, 
  FaBuilding, 
  FaFolderOpen, 
  FaFileInvoiceDollar, 
  FaExchangeAlt, 
  FaCog, 
  FaQuestionCircle, 
  FaSignOutAlt,
  FaChevronLeft,
  FaChevronRight,
  FaSun,
  FaMoon
} from "react-icons/fa";

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Check if a link is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Navigation links config with icons
  const navLinks = [
    { path: "/home", label: "Dashboard", icon: <FaHome className="text-lg" /> },
    { path: "/customers", label: "Customers", icon: <FaUsers className="text-lg" /> },
    { path: "/stock", label: "Add Stock", icon: <FaBoxOpen className="text-lg" /> },
    { path: "/departments", label: "Departments", icon: <FaBuilding className="text-lg" /> },
    { path: "/categories", label: "Categories", icon: <FaFolderOpen className="text-lg" /> },
    { path: "/billing", label: "Billing", icon: <FaFileInvoiceDollar className="text-lg" /> },
    { path: "/all-trasactions", label: "All Transactions", icon: <FaExchangeAlt className="text-lg" /> },
  ];

  // Bottom links
  const bottomLinks = [
    { path: "/settings", label: "Settings", icon: <FaCog className="text-lg" /> },
    { path: "/support", label: "Support", icon: <FaQuestionCircle className="text-lg" /> },
  ];

  // Animation variants
  const sidebarVariants = {
    expanded: { width: "250px" },
    collapsed: { width: "80px" }
  };

  return (
    <motion.div 
      className={`h-screen fixed left-0 top-0 z-40 ${theme === 'dark' ? 'bg-neutral-800 text-white' : 'bg-white text-neutral-800'} shadow-lg flex flex-col transition-all duration-300 overflow-hidden`}
      initial={collapsed ? "collapsed" : "expanded"}
      animate={collapsed ? "collapsed" : "expanded"}
      variants={sidebarVariants}
    >
      {/* Brand / Company Section */}
      <div className={`px-4 py-6 flex items-center ${collapsed ? 'justify-center' : 'justify-between'} border-b ${theme === 'dark' ? 'border-neutral-700' : 'border-neutral-200'}`}>
        <h2 className={`font-display font-bold ${collapsed ? 'text-center text-lg' : 'text-xl'}`}>
          {collapsed ? "HT" : "HT TRADERS"}
        </h2>
      </div>

      {/* Toggle Button */}
      <button
        className={`absolute top-6 -right-3 p-1 rounded-full ${theme === 'dark' ? 'bg-neutral-700 text-white hover:bg-neutral-600' : 'bg-white text-neutral-800 hover:bg-neutral-100'} shadow-md z-50`}
        onClick={toggleCollapse}
        aria-label="Toggle Sidebar"
      >
        {collapsed ? <FaChevronRight size={14} /> : <FaChevronLeft size={14} />}
      </button>

      {/* Main Navigation */}
      <nav className="flex-grow py-4 overflow-y-auto scrollbar-thin">
        <ul className="px-2 space-y-1">
          {navLinks.map((link) => (
            <li key={link.path}>
              <Link
                to={link.path}
                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 hover:bg-opacity-90 ${
                  isActive(link.path)
                    ? `${theme === 'dark' ? 'bg-primary-700' : 'bg-primary-100 text-primary-800'}`
                    : `${theme === 'dark' ? 'hover:bg-neutral-700' : 'hover:bg-neutral-100'}`
                } ${collapsed ? 'justify-center' : 'justify-start'}`}
              >
                <span className="flex-shrink-0">{link.icon}</span>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      className="ml-3 whitespace-nowrap"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {link.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Links */}
      <div className={`border-t ${theme === 'dark' ? 'border-neutral-700' : 'border-neutral-200'} py-3 px-2`}>
        <ul className="space-y-1">
          {bottomLinks.map((link) => (
            <li key={link.path}>
              <Link
                to={link.path}
                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive(link.path)
                    ? `${theme === 'dark' ? 'bg-primary-700' : 'bg-primary-100 text-primary-800'}`
                    : `${theme === 'dark' ? 'hover:bg-neutral-700' : 'hover:bg-neutral-100'}`
                } ${collapsed ? 'justify-center' : 'justify-start'}`}
              >
                <span className="flex-shrink-0">{link.icon}</span>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      className="ml-3"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {link.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </li>
          ))}
          
          {/* Theme toggle */}
          <li>
            <button
              onClick={toggleTheme}
              className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                theme === 'dark' ? 'hover:bg-neutral-700' : 'hover:bg-neutral-100'
              } ${collapsed ? 'justify-center' : 'justify-start'}`}
            >
              <span className="flex-shrink-0">
                {theme === 'dark' ? <FaSun className="text-yellow-400 text-lg" /> : <FaMoon className="text-primary-500 text-lg" />}
              </span>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    className="ml-3"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </li>
          
          {/* Logout button */}
          <li>
            <button
              onClick={handleLogout}
              className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 text-red-500 ${
                theme === 'dark' ? 'hover:bg-neutral-700' : 'hover:bg-neutral-100'
              } ${collapsed ? 'justify-center' : 'justify-start'}`}
            >
              <span className="flex-shrink-0">
                <FaSignOutAlt className="text-lg" />
              </span>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    className="ml-3"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    Logout
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </li>
        </ul>
      </div>

      {/* Profile Section */}
      <div className={`px-4 py-3 flex items-center ${theme === 'dark' ? 'bg-neutral-700' : 'bg-neutral-100'} ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium">
          A
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              className="flex flex-col"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <span className="font-medium text-sm">Admin User</span>
              <span className="text-xs opacity-75">admin@httraders.com</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default Sidebar;
