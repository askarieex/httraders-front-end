import React, { useState, useEffect } from "react";
import {
  FaSave,
  FaMoneyBill,
  FaBuilding,
  FaIdCard,
  FaFileInvoice,
  FaUserCog,
  FaPaintBrush,
  FaBell,
  FaShieldAlt,
  FaChevronRight,
} from "react-icons/fa";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import "./css/Settings.css";

// Import component files for each section
import PaymentSettings from "../components/settings/PaymentSettings";
import CompanyProfile from "../components/settings/CompanyProfile";
import GSTSettings from "../components/settings/GSTSettings";
import InvoiceSettings from "../components/settings/InvoiceSettings";
import UserManagement from "../components/settings/UserManagement";
import ThemeAppearance from "../components/settings/ThemeAppearance";
import NotificationSettings from "../components/settings/NotificationSettings";
import SecurityPrivacy from "../components/settings/SecurityPrivacy";

function Settings() {
  // State for active setting category
  const [activeCategory, setActiveCategory] = useState("payment");

  // State for form data
  const [settings, setSettings] = useState({
    // Payment settings
    upiId: "himalayan@ybl",
    qrCodeImage: null,
    accountName: "Himalayan Timber Traders",
    bankName: "State Bank of India",
    accountNumber: "3104 5678 9012 3456",
    ifscCode: "SBIN0001234",
    branch: "Kathmandu Main",

    // Company settings
    companyName: "Himalayan Timber Traders",
    companyLogo: null,
    companyAddress: "456 Timber Lane, Kathmandu, Nepal",
    companyPhone: "+977-1-2345678",
    companyEmail: "contact@himalyantimbertraders.com",

    // GST settings
    gstNumber: "GSTIN24AAAAA0000A1Z5",
    gstType: "Regular",
    panNumber: "AAAAA0000A",
    legalName: "Himalayan Timber Traders Pvt. Ltd.",

    // Invoice settings
    invoicePrefix: "INV",
    nextInvoiceNumber: 1,
    thankYouMessage: "Thank you for your business!",
    paymentTerms: "Payment due within 30 days.",
    invoiceNotes: "",
  });

  // State for form submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [qrCodePreview, setQrCodePreview] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  // Settings categories
  const settingsCategories = [
    { id: "payment", label: "Payment Settings", icon: <FaMoneyBill /> },
    { id: "company", label: "Company Profile", icon: <FaBuilding /> },
    { id: "gst", label: "GST & Tax Details", icon: <FaIdCard /> },
    { id: "invoice", label: "Invoice Settings", icon: <FaFileInvoice /> },
    { id: "users", label: "User Management", icon: <FaUserCog /> },
    { id: "appearance", label: "Theme & Appearance", icon: <FaPaintBrush /> },
    { id: "notifications", label: "Notifications", icon: <FaBell /> },
    { id: "security", label: "Security & Privacy", icon: <FaShieldAlt /> },
  ];

  // Authentication Header
  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch current settings from the backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/settings/${activeCategory}`,
          {
            headers: getAuthHeader(),
          }
        );

        if (response.data) {
          // Update state with fetched settings
          setSettings((prev) => ({
            ...prev,
            ...response.data,
          }));

          // If QR code exists, set the preview
          if (response.data.qrCodeUrl) {
            setQrCodePreview(response.data.qrCodeUrl);
          }

          // If logo exists, set the preview
          if (response.data.logoUrl) {
            setLogoPreview(response.data.logoUrl);
          }
        }
      } catch (error) {
        console.error(`Error fetching ${activeCategory} settings:`, error);
        addAlert("danger", `Failed to fetch ${activeCategory} settings.`);
      }
    };

    fetchSettings();
  }, [activeCategory]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle image upload
  const handleImageUpload = (e, imageType) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      addAlert("warning", "Please upload a valid image file (JPEG, PNG, GIF).");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      addAlert("warning", "Image size should be less than 2MB.");
      return;
    }

    // Set file for submission
    setSettings((prev) => ({
      ...prev,
      [imageType]: file,
    }));

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      if (imageType === "qrCodeImage") {
        setQrCodePreview(reader.result);
      } else if (imageType === "companyLogo") {
        setLogoPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Trigger file input click
  const triggerFileInput = (inputRef) => {
    inputRef.current.click();
  };

  // Copy text to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        addAlert("success", "Copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
        addAlert("danger", "Failed to copy text.");
      });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();

      // Append all settings
      Object.keys(settings).forEach((key) => {
        if (
          (key === "qrCodeImage" || key === "companyLogo") &&
          settings[key] instanceof File
        ) {
          formData.append(key, settings[key]);
          console.log(`Appending file ${key}:`, settings[key]);
        } else if (key !== "qrCodeImage" && key !== "companyLogo") {
          formData.append(key, settings[key]);
        }
      });

      console.log('Submitting settings with formData');

      // Check if there's a token in localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        addAlert('danger', 'Authentication error. Please login again.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }

      // Send to backend
      const response = await fetch(
        `http://localhost:3000/api/settings/${activeCategory}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            // Do NOT set Content-Type here, FormData will set it automatically with boundary
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server error');
      }

      addAlert(
        "success",
        `${getCategoryTitle(activeCategory)} saved successfully!`
      );
    } catch (error) {
      console.error(`Error saving ${activeCategory} settings:`, error);
      addAlert("danger", `Failed to save ${activeCategory} settings: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get the title for the current active category
  const getCategoryTitle = (categoryId) => {
    const category = settingsCategories.find((cat) => cat.id === categoryId);
    return category ? category.label : "Settings";
  };

  // Add alert message
  const addAlert = (type, message) => {
    const id = Date.now();
    setAlerts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setAlerts((prev) => prev.filter((alert) => alert.id !== id));
    }, 5000);
  };

  // Render different settings based on active category
  const renderSettingsContent = () => {
    switch (activeCategory) {
      case "payment":
        return (
          <PaymentSettings
            settings={settings}
            handleInputChange={handleInputChange}
            handleImageUpload={handleImageUpload}
            triggerFileInput={triggerFileInput}
            copyToClipboard={copyToClipboard}
            qrCodePreview={qrCodePreview}
          />
        );
      case "company":
        return (
          <CompanyProfile
            settings={settings}
            handleInputChange={handleInputChange}
            handleImageUpload={handleImageUpload}
            triggerFileInput={triggerFileInput}
            logoPreview={logoPreview}
          />
        );
      case "gst":
        return (
          <GSTSettings
            settings={settings}
            handleInputChange={handleInputChange}
            copyToClipboard={copyToClipboard}
          />
        );
      case "invoice":
        return (
          <InvoiceSettings
            settings={settings}
            handleInputChange={handleInputChange}
          />
        );
      case "users":
        return <UserManagement />;
      case "appearance":
        return (
          <ThemeAppearance
            settings={settings}
            handleInputChange={handleInputChange}
          />
        );
      case "notifications":
        return (
          <NotificationSettings
            settings={settings}
            handleInputChange={handleInputChange}
          />
        );
      case "security":
        return (
          <SecurityPrivacy
            settings={settings}
            handleInputChange={handleInputChange}
          />
        );
      default:
        return (
          <div className="coming-soon">
            <h3>{getCategoryTitle(activeCategory)}</h3>
            <p>This section is under development. Coming soon!</p>
          </div>
        );
    }
  };

  return (
    <div className="settings-page-wrapper">
      <Sidebar />
      <div className="settings-container">
        <div className="container">
          <h1 className="page-title">Settings</h1>

          {/* Alerts */}
          <div className="alert-container">
            {alerts.map((alert) => (
              <div key={alert.id} className={`alert alert-${alert.type}`}>
                <span>{alert.message}</span>
                <button
                  className="close-btn"
                  onClick={() =>
                    setAlerts((prev) => prev.filter((a) => a.id !== alert.id))
                  }
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          <div className="settings-layout">
            {/* Settings Sidebar */}
            <div className="settings-sidebar">
              <ul className="settings-nav">
                {settingsCategories.map((category) => (
                  <li
                    key={category.id}
                    className={activeCategory === category.id ? "active" : ""}
                  >
                    <button onClick={() => setActiveCategory(category.id)}>
                      <span className="icon">{category.icon}</span>
                      <span className="label">{category.label}</span>
                      <FaChevronRight className="arrow" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Settings Content */}
            <div className="settings-content">
              <form onSubmit={handleSubmit}>
                <div className="settings-header">
                  <h2 className="settings-title">
                    {getCategoryTitle(activeCategory)}
                  </h2>
                  <div className="form-actions">
                    <button
                      type="submit"
                      className="save-btn"
                      disabled={isSubmitting}
                    >
                      <FaSave />
                      {isSubmitting ? "Saving..." : "Save Settings"}
                    </button>
                  </div>
                </div>

                {renderSettingsContent()}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
