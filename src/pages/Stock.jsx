// Stock.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import CutModal from "../components/CutModal";
import "./css/Stock.css";
import {
  FaBoxOpen,
  FaBox,
  FaEdit,
  FaTrash,
  FaChartBar,
  FaExclamationTriangle,
  FaWarehouse,
  FaTimes,
  FaSearch,
  FaPlus,
  FaInfoCircle,
  FaCut,
} from "react-icons/fa";
import { BiCategoryAlt, BiDollarCircle } from "react-icons/bi";
import { HiOutlineDocumentReport } from "react-icons/hi";
import Chart from "react-apexcharts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTree,
  faHardHat,
  faTools,
  faBox,
} from "@fortawesome/free-solid-svg-icons";
// Import the utility functions
import {
  computeQuantity,
  formatDimensions,
  isDimensionsSupported,
  getCategoryUnits,
} from "../utils/convert";

// Import unit configuration
import { DIMENSION_UNITS, isWeightRequired } from "../config/units";

function Stock() {
  // State Management
  const [selectedCategory, setSelectedCategory] = useState("");
  const [items, setItems] = useState([]);
  const [dataFetched, setDataFetched] = useState(false);
  const [categoryUnits, setCategoryUnits] = useState([]);

  // Memoize categories to prevent unnecessary rerenders
  const categories = useMemo(
    () => [
      { id: 1, name: "Timber/Wood" },
      { id: 2, name: "Construction Materials" },
      { id: 3, name: "Hardware" },
      { id: 4, name: "Packaging" },
    ],
    []
  );

  const [newItem, setNewItem] = useState({
    name: "",
    quantity: "",
    length: "",
    breadth: "",
    height: "",
    selling_price: "",
    purchasing_price: "",
    unit: "",
    reorder_level: "",
    dim_unit: "ft", // Default dimension unit
    pieces: "1", // Default pieces
    weight_per_piece: "", // Weight per piece for weighted items
  });

  const [alerts, setAlerts] = useState([]); // Array of alert objects

  // States for Editing Items
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState({
    id: "",
    name: "",
    quantity: "",
    length: "",
    breadth: "",
    height: "",
    selling_price: "",
    purchasing_price: "",
    unit: "",
    category_id: "",
    reorder_level: "",
    dimension: null,
    dim_unit: "ft", // Default dimension unit
    pieces: "1", // Default pieces
    weight_per_piece: "", // Weight per piece for weighted items
  });

  // Loading states
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);

  // New state for dimensions toggle
  const [showDimensions, setShowDimensions] = useState(false);
  const [editShowDimensions, setEditShowDimensions] = useState(false);

  // State for showing weight or pieces fields
  const [showWeightFields, setShowWeightFields] = useState(false);
  const [editShowWeightFields, setEditShowWeightFields] = useState(false);

  // New state for search
  const [searchQuery, setSearchQuery] = useState("");

  // Add new state for add item modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add new state for cut modal
  const [isCutModalOpen, setIsCutModalOpen] = useState(false);
  const [currentCutItem, setCurrentCutItem] = useState(null);

  // Authentication Header
  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  // MODIFIED: No longer enforces dimensions as required
  // Only checks if dimensions are supported for this unit type
  const isDimensionsRequired = useCallback((unit, useDimensions) => {
    return isDimensionsSupported(unit) && useDimensions;
  }, []);

  // Formatter for INR Currency
  const formatCurrency = useCallback((amount) => {
    if (typeof amount !== "number") return "₹0.00";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  }, []);

  // Function to Add Alert
  const addAlert = useCallback((type, message) => {
    const id = Date.now();
    setAlerts((prevAlerts) => [...prevAlerts, { id, type, message }]);

    // Remove alert after 5 seconds
    setTimeout(() => {
      setAlerts((prevAlerts) => prevAlerts.filter((alert) => alert.id !== id));
    }, 5000);
  }, []);

  // Load available units for the selected category
  useEffect(() => {
    const fetchUnits = async () => {
      if (!selectedCategory) {
        setCategoryUnits([]);
        return;
      }

      setIsLoadingUnits(true);
      try {
        const units = await getCategoryUnits(selectedCategory);
        setCategoryUnits(units);
      } catch (error) {
        console.error("Error fetching units:", error);
        addAlert("danger", "Failed to load units for this category");
      } finally {
        setIsLoadingUnits(false);
      }
    };

    fetchUnits();
  }, [selectedCategory, addAlert]);

  // Reset the form when category changes
  useEffect(() => {
    setNewItem({
      name: "",
      quantity: "",
      length: "",
      breadth: "",
      height: "",
      selling_price: "",
      purchasing_price: "",
      unit: "",
      reorder_level: "",
      dim_unit: "ft",
      pieces: "1",
      weight_per_piece: "",
    });
    setShowDimensions(false);
    setShowWeightFields(false);
  }, [selectedCategory]);

  // Reset dimensions toggle when unit changes
  useEffect(() => {
    if (!isDimensionsSupported(newItem.unit)) {
      setShowDimensions(false);
    }

    // Show weight fields for weight-based units
    setShowWeightFields(isWeightRequired(newItem.unit));
  }, [newItem.unit]);

  // Reset edit dimensions toggle when unit changes in edit mode
  useEffect(() => {
    if (!isDimensionsSupported(currentEditItem.unit)) {
      setEditShowDimensions(false);
    }

    // Show weight fields for weight-based units in edit mode
    setEditShowWeightFields(isWeightRequired(currentEditItem.unit));
  }, [currentEditItem.unit]);

  // Auto-calculate quantity when dimensions, pieces, or weight changes in add mode
  useEffect(() => {
    // Only auto-calculate if all required fields are filled
    const {
      unit,
      length,
      breadth,
      height,
      dim_unit,
      pieces,
      weight_per_piece,
    } = newItem;

    if (!unit) return;

    // Calculate the auto-quantity based on inputs
    let computedQuantity = null;

    try {
      computedQuantity = computeQuantity({
        unit,
        length: parseFloat(length) || null,
        breadth: parseFloat(breadth) || null,
        height: parseFloat(height) || null,
        dim_unit: dim_unit || "ft",
        pieces: parseInt(pieces) || 1,
        weightPerPiece: parseFloat(weight_per_piece) || null,
      });

      // Only update if we got a valid calculation
      if (!isNaN(computedQuantity)) {
        setNewItem((prev) => ({
          ...prev,
          quantity: computedQuantity.toString(),
        }));
      }
    } catch (error) {
      console.error("Error calculating quantity:", error);
    }
  }, [
    newItem.unit,
    newItem.length,
    newItem.breadth,
    newItem.height,
    newItem.dim_unit,
    newItem.pieces,
    newItem.weight_per_piece,
  ]);

  // Auto-calculate quantity when dimensions, pieces, or weight changes in edit mode
  useEffect(() => {
    // Only auto-calculate if all required fields are filled
    const {
      unit,
      length,
      breadth,
      height,
      dim_unit,
      pieces,
      weight_per_piece,
    } = currentEditItem;

    if (!unit) return;

    // Calculate the auto-quantity based on inputs
    let computedQuantity = null;

    try {
      computedQuantity = computeQuantity({
        unit,
        length: parseFloat(length) || null,
        breadth: parseFloat(breadth) || null,
        height: parseFloat(height) || null,
        dim_unit: dim_unit || "ft",
        pieces: parseInt(pieces) || 1,
        weightPerPiece: parseFloat(weight_per_piece) || null,
      });

      // Only update if we got a valid calculation
      if (!isNaN(computedQuantity)) {
        setCurrentEditItem((prev) => ({
          ...prev,
          quantity: computedQuantity.toString(),
        }));
      }
    } catch (error) {
      console.error("Error calculating quantity:", error);
    }
  }, [
    currentEditItem.unit,
    currentEditItem.length,
    currentEditItem.breadth,
    currentEditItem.height,
    currentEditItem.dim_unit,
    currentEditItem.pieces,
    currentEditItem.weight_per_piece,
  ]);

  // Create a memoized fetchItems function to prevent unnecessary rerenders
  const fetchItems = useCallback(async () => {
    setIsLoadingItems(true);
    try {
      // Fix the API endpoint path to match backend routes
      const response = await axios.get(
        selectedCategory
          ? `http://localhost:3000/api/categories/${selectedCategory}/items`
          : "http://localhost:3000/api/items",
        {
          headers: getAuthHeader(),
        }
      );

      // Set the items data
      setItems(response.data);
      setDataFetched(true);
    } catch (error) {
      console.error("Error fetching stock items:", error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        addAlert(
          "danger",
          `Error ${error.response.status}: ${
            error.response.data.message || "Failed to fetch items"
          }`
        );
      } else if (error.request) {
        // The request was made but no response was received
        addAlert(
          "danger",
          "No response from server. Please check your connection."
        );
      } else {
        // Something happened in setting up the request that triggered an Error
        addAlert("danger", `Error: ${error.message}`);
      }
    } finally {
      setIsLoadingItems(false);
    }
  }, [selectedCategory, getAuthHeader, addAlert]);

  // Fetch items on component mount and when category changes
  useEffect(() => {
    fetchItems();
  }, [fetchItems, selectedCategory]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (items.length === 0) {
      return {
        totalItems: 0,
        totalValue: 0,
        lowStockItems: 0,
      };
    }

    return {
      totalItems: items.length,
      totalValue: items.reduce(
        (sum, item) =>
          sum + parseFloat(item.quantity) * parseFloat(item.purchasing_price),
        0
      ),
      lowStockItems: items.filter(
        (item) => parseFloat(item.quantity) <= parseFloat(item.reorder_level)
      ).length,
    };
  }, [items]);

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;

    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.dimension &&
          item.dimension.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.unit.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  // Get category name by ID
  const getCategoryName = useCallback(
    (categoryId) => {
      const category = categories.find(
        (cat) => cat.id === parseInt(categoryId)
      );
      return category ? category.name : "Unknown";
    },
    [categories]
  );

  // Toggle dimensions in add item form
  const toggleDimensions = () => {
    setShowDimensions(!showDimensions);
  };

  // Toggle dimensions in edit item form
  const toggleEditDimensions = () => {
    setEditShowDimensions(!editShowDimensions);
  };

  // Handle Input Changes for New Item
  const handleNewItemChange = (e) => {
    const { name, value } = e.target;
    setNewItem((prevItem) => ({
      ...prevItem,
      [name]: value,
    }));
  };

  // Open Add Item Modal
  const handleOpenAddModal = (categoryId = "") => {
    // If a category is passed, use it, otherwise keep the currently selected one
    if (categoryId) {
      setSelectedCategory(categoryId);
    }
    setIsAddModalOpen(true);
  };

  // Close Add Item Modal
  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setNewItem({
      name: "",
      quantity: "",
      length: "",
      breadth: "",
      height: "",
      selling_price: "",
      purchasing_price: "",
      unit: "",
      reorder_level: "",
      dim_unit: "ft",
      pieces: "1",
      weight_per_piece: "",
    });
    setShowDimensions(false);
  };

  // Handle form submission for adding a new item
  const handleNewItemSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Extract form values
    const {
      name,
      quantity,
      length,
      breadth,
      height,
      selling_price,
      purchasing_price,
      unit,
      reorder_level,
      dim_unit,
      pieces,
      weight_per_piece,
    } = newItem;

    // Validate required fields
    if (
      !name ||
      !quantity ||
      !selling_price ||
      !purchasing_price ||
      !unit ||
      !reorder_level
    ) {
      addAlert("warning", "Please fill in all required fields.");
      setIsSubmitting(false);
      return;
    }

    // Validate dimensions if user has chosen to specify them
    if (isDimensionsRequired(unit, showDimensions) && (!length || !breadth)) {
      addAlert("warning", "Length and breadth are required for dimensions.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Construct payload conditionally
      const payload = {
        name,
        quantity,
        selling_price: Number(selling_price),
        purchasing_price: Number(purchasing_price),
        unit,
        category_id: selectedCategory,
        reorder_level: Number(reorder_level),
        dim_unit,
        pieces,
        weight_per_piece: weight_per_piece || null,
      };

      // Add dimensions only if user has chosen to specify them
      if (isDimensionsSupported(unit) && showDimensions) {
        payload.length = length;
        payload.breadth = breadth;

        // Include height only if it's provided and not empty
        if (height && height.trim() !== "") {
          payload.height = height;
        }

        // Calculate dimension string
        payload.dimension = formatDimensions(length, breadth, height, dim_unit);
      } else {
        // Clear dimension fields if not using dimensions
        payload.dimension = null;
      }

      const response = await axios.post(
        "http://localhost:3000/api/items",
        payload,
        { headers: getAuthHeader() }
      );
      setItems((prev) => [...prev, response.data]);
      setNewItem({
        name: "",
        quantity: "",
        length: "",
        breadth: "",
        height: "",
        selling_price: "",
        purchasing_price: "",
        unit: "",
        reorder_level: "",
        dim_unit: "ft",
        pieces: "1",
        weight_per_piece: "",
      });
      setShowDimensions(false);
      setShowWeightFields(false);
      addAlert("success", "Item added successfully.");
      // Close the modal after successful submission
      handleCloseAddModal();
    } catch (error) {
      console.error("Error creating item:", error);
      if (error.response) {
        addAlert(
          "danger",
          `Error ${error.response.status}: ${
            error.response.data.message || "Failed to create item"
          }`
        );
      } else if (error.request) {
        addAlert(
          "danger",
          "No response from server. Please check your connection."
        );
      } else {
        addAlert("danger", `Error: ${error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal with Selected Item
  const handleEditClick = async (item) => {
    const editItem = {
      id: item.id,
      name: item.name || "",
      quantity: item.quantity || "",
      length: item.length || "",
      breadth: item.breadth || "",
      height: item.height || "",
      selling_price: item.selling_price || "",
      purchasing_price: item.purchasing_price || "",
      unit: item.unit || "",
      category_id: item.category_id || "",
      reorder_level: item.reorder_level || "",
      dimension: item.dimension || null,
      dim_unit: item.dim_unit || "ft",
      pieces: item.pieces || "1",
      weight_per_piece: item.weight_per_piece || "",
    };

    // Set the category ID to fetch appropriate units
    if (item.category_id !== selectedCategory) {
      try {
        const units = await getCategoryUnits(item.category_id);
        setCategoryUnits(units);
      } catch (error) {
        console.error("Error fetching units for edit:", error);
        addAlert("warning", "Could not load units for this item's category");
      }
    }

    // Check if item has dimensions and set the toggle accordingly
    const hasDimensions = item.dimension && item.dimension !== "N/A";
    setEditShowDimensions(hasDimensions);

    // Parse dimensions if they exist
    if (hasDimensions && isDimensionsSupported(item.unit)) {
      // Use regex to split by 'x' with optional spaces
      const dimensions = item.dimension.split(/\s*x\s*/i);

      if (dimensions.length >= 2) {
        editItem.length = dimensions[0].trim();
        editItem.breadth = dimensions[1].trim();

        if (dimensions.length >= 3) {
          editItem.height = dimensions[2].trim();
        }
      }
    }

    setCurrentEditItem(editItem);
    setIsEditModalOpen(true);
  };

  // Close Edit Modal
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setCurrentEditItem({
      id: "",
      name: "",
      quantity: "",
      length: "",
      breadth: "",
      height: "",
      selling_price: "",
      purchasing_price: "",
      unit: "",
      category_id: "",
      reorder_level: "",
      dimension: null,
      dim_unit: "ft",
      pieces: "1",
      weight_per_piece: "",
    });
    setEditShowDimensions(false);
  };

  // Handle Edit Form Submission
  const handleEditFormSubmit = async (e) => {
    e.preventDefault();
    setIsEditing(true);

    const {
      id,
      name,
      quantity,
      length,
      breadth,
      height,
      selling_price,
      purchasing_price,
      unit,
      category_id,
      reorder_level,
      dim_unit,
      pieces,
      weight_per_piece,
    } = currentEditItem;

    // Validate required fields
    if (
      !name ||
      !quantity ||
      !selling_price ||
      !purchasing_price ||
      !unit ||
      !reorder_level
    ) {
      addAlert("warning", "Please fill in all required fields.");
      setIsEditing(false);
      return;
    }

    // Validate dimensions if user has chosen to specify them
    if (
      isDimensionsRequired(unit, editShowDimensions) &&
      (!length || !breadth)
    ) {
      addAlert("warning", "Length and breadth are required for dimensions.");
      setIsEditing(false);
      return;
    }

    try {
      // Construct payload conditionally
      const payload = {
        name,
        quantity: Number(quantity),
        selling_price: Number(selling_price),
        purchasing_price: Number(purchasing_price),
        unit,
        category_id: category_id,
        reorder_level: Number(reorder_level),
        dim_unit,
        pieces,
        weight_per_piece: weight_per_piece || null,
      };

      // Add dimensions only if user has chosen to specify them
      if (isDimensionsSupported(unit) && editShowDimensions) {
        payload.length = length;
        payload.breadth = breadth;

        // Include height only if it's provided and not empty
        if (height && height.trim() !== "") {
          payload.height = height;
        }

        // Calculate dimension string
        payload.dimension = `${length} x ${breadth}${
          height ? ` x ${height}` : ""
        }`;
      } else {
        // Clear dimension fields if not using dimensions
        payload.dimension = null;
      }

      const response = await axios.put(
        `http://localhost:3000/api/items/${id}`,
        payload,
        { headers: getAuthHeader() }
      );

      // Update the items list
      setItems((prevItems) =>
        prevItems.map((item) => (item.id === id ? response.data : item))
      );

      addAlert("success", "Item updated successfully.");
      handleCloseEditModal();
    } catch (error) {
      console.error("Error updating item:", error);
      if (error.response) {
        addAlert(
          "danger",
          `Error ${error.response.status}: ${
            error.response.data.message || "Failed to update item"
          }`
        );
      } else if (error.request) {
        addAlert(
          "danger",
          "No response from server. Please check your connection."
        );
      } else {
        addAlert("danger", `Error: ${error.message}`);
      }
    } finally {
      setIsEditing(false);
    }
  };

  // Handle Input Changes in Edit Modal
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentEditItem((prevItem) => ({
      ...prevItem,
      [name]: value,
    }));
  };

  // Handle Delete Item
  const handleDeleteClick = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this item?"
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:3000/api/items/${id}`, {
        headers: getAuthHeader(),
      });
      setItems((prevItems) => prevItems.filter((item) => item.id !== id));
      addAlert("success", "Item deleted successfully.");
    } catch (error) {
      console.error("Error deleting item:", error);
      if (error.response) {
        addAlert(
          "danger",
          `Error ${error.response.status}: ${
            error.response.data.message || "Failed to delete item"
          }`
        );
      } else if (error.request) {
        addAlert(
          "danger",
          "No response from server. Please check your connection."
        );
      } else {
        addAlert("danger", `Error: ${error.message}`);
      }
    }
  };

  return (
    <div className="stock-page-wrapper">
      <Sidebar />
      <div className="stock-container">
        <div className="stock-main-content">
          {/* Stats Cards */}
          <div className="stats-overview">
            <div className="stat-card">
              <div className="stat-icon total-items">
                <FaBoxOpen />
              </div>
              <div className="stat-content">
                <h3>TOTAL ITEMS</h3>
                <p>{stats.totalItems}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon inventory-value">
                <BiDollarCircle />
              </div>
              <div className="stat-content">
                <h3>INVENTORY VALUE</h3>
                <p>₹{stats.totalValue.toFixed(2)}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon low-stock">
                <FaExclamationTriangle />
              </div>
              <div className="stat-content">
                <h3>LOW STOCK ITEMS</h3>
                <p>{stats.lowStockItems}</p>
              </div>
            </div>
          </div>

          {/* Categories Section */}
          <div className="categories-section">
            <div className="section-header">
              <h2>
                <BiCategoryAlt /> Categories
              </h2>
            </div>
            <div className="category-cards-container">
              <div
                className={`category-card ${!selectedCategory ? "active" : ""}`}
                onClick={() => setSelectedCategory("")}
              >
                <div className="category-icon-container">
                  <FontAwesomeIcon icon={faBox} />
                </div>
                <div className="category-name">All Categories</div>
                <div className="category-item-count">{items.length} items</div>
              </div>
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className={`category-card ${
                    selectedCategory === cat.id.toString() ? "active" : ""
                  }`}
                  onClick={() => setSelectedCategory(cat.id.toString())}
                >
                  <div className="category-icon-container">
                    {cat.name === "Timber/Wood" && (
                      <FontAwesomeIcon icon={faTree} />
                    )}
                    {cat.name === "Construction Materials" && (
                      <FontAwesomeIcon icon={faHardHat} />
                    )}
                    {cat.name === "Hardware" && (
                      <FontAwesomeIcon icon={faTools} />
                    )}
                    {cat.name === "Packaging" && (
                      <FontAwesomeIcon icon={faBox} />
                    )}
                  </div>
                  <div className="category-name">{cat.name}</div>
                  <div className="category-item-count">
                    {
                      items.filter(
                        (item) =>
                          item.category_id === cat.id ||
                          (item.Category && item.Category.id === cat.id)
                      ).length
                    }{" "}
                    items
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inventory Items Section */}
          <div className="inventory-section">
            <div className="section-header">
              <h2>
                <FaWarehouse /> ALL INVENTORY ITEMS
              </h2>
              <div className="section-actions">
                <button
                  className="btn-primary-action"
                  onClick={() => handleOpenAddModal()}
                >
                  <span className="plus-icon">+</span> Add New Item
                </button>
                <div className="search-container">
                  <div className="search-input-wrapper">
                    <FaSearch className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        className="search-clear-btn"
                        onClick={() => setSearchQuery("")}
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {isLoadingItems ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <p>Loading inventory items...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon-container">
                  <FaBoxOpen />
                </div>
                <h3>No items found</h3>
                <p>
                  {searchQuery
                    ? "No items match your search. Try different keywords."
                    : selectedCategory
                    ? `No items found in ${getCategoryName(selectedCategory)}.`
                    : "No inventory items found."}
                </p>
                <button
                  className="btn-primary-action mt-4"
                  onClick={() => handleOpenAddModal(selectedCategory)}
                >
                  <span className="plus-icon">+</span> Add New Item
                </button>
              </div>
            ) : (
              <div className="inventory-table-container">
                <table className="inventory-table enhanced">
                  <thead>
                    <tr>
                      <th className="item-name-col">ITEM NAME</th>
                      <th>DIMENSIONS</th>
                      <th>UNIT</th>
                      <th>STOCK</th>
                      <th>CATEGORY</th>
                      <th>PURCHASE PRICE</th>
                      <th>SELLING PRICE</th>
                      <th className="profit-col">PROFIT MARGIN</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr
                        key={item.id}
                        className={
                          parseFloat(item.quantity) <=
                          parseFloat(item.reorder_level)
                            ? "low-stock"
                            : parseFloat(item.quantity) <
                              parseFloat(item.reorder_level) * 2
                            ? "medium-stock"
                            : "good-stock"
                        }
                      >
                        <td className="item-name-cell">
                          <div className="item-name-wrapper">
                            <span className="item-icon">
                              {item.Category &&
                                item.Category.name === "Timber/Wood" && (
                                  <FontAwesomeIcon icon={faTree} />
                                )}
                              {item.Category &&
                                item.Category.name ===
                                  "Construction Materials" && (
                                  <FontAwesomeIcon icon={faHardHat} />
                                )}
                              {item.Category &&
                                item.Category.name === "Hardware" && (
                                  <FontAwesomeIcon icon={faTools} />
                                )}
                              {item.Category &&
                                item.Category.name === "Packaging" && (
                                  <FontAwesomeIcon icon={faBox} />
                                )}
                              {!item.Category && <FaBox />}
                            </span>
                            <span className="item-name">{item.name}</span>
                          </div>
                        </td>
                        <td>
                          {item.dimension && item.dimension !== "N/A" ? (
                            <div className="dimension-badge">
                              {item.dimension}
                            </div>
                          ) : (
                            <div className="bulk-badge">Bulk</div>
                          )}
                        </td>
                        <td>
                          <div className="unit-badge">{item.unit}</div>
                        </td>
                        <td>
                          <div className="stock-indicator">
                            <div className="stock-text">
                              <span
                                className={`stock-value ${
                                  parseFloat(item.quantity) <=
                                  parseFloat(item.reorder_level)
                                    ? "low"
                                    : parseFloat(item.quantity) <
                                      parseFloat(item.reorder_level) * 2
                                    ? "medium"
                                    : "good"
                                }`}
                              >
                                {parseFloat(item.quantity).toLocaleString()}
                              </span>
                              <span className="stock-unit">{item.unit}</span>
                            </div>
                            <div className="progress-bar">
                              <div
                                className={`progress-fill ${
                                  parseFloat(item.quantity) <=
                                  parseFloat(item.reorder_level)
                                    ? "low"
                                    : parseFloat(item.quantity) <
                                      parseFloat(item.reorder_level) * 2
                                    ? "medium"
                                    : "good"
                                }`}
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (parseFloat(item.quantity) /
                                      (parseFloat(item.reorder_level) * 3)) *
                                      100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                            {parseFloat(item.quantity) <=
                              parseFloat(item.reorder_level) && (
                              <div className="reorder-indicator">
                                <FaExclamationTriangle /> Reorder
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="category-badge enhanced">
                            {item.Category
                              ? item.Category.name
                              : getCategoryName(item.category_id)}
                          </span>
                        </td>
                        <td className="price-cell">
                          <span className="price">
                            ₹{parseFloat(item.purchasing_price).toFixed(2)}
                          </span>
                        </td>
                        <td className="price-cell">
                          <span className="price">
                            ₹{parseFloat(item.selling_price).toFixed(2)}
                          </span>
                        </td>
                        <td className="profit-cell">
                          <span
                            className={`profit-badge ${
                              parseFloat(item.selling_price) >
                              parseFloat(item.purchasing_price) * 1.2
                                ? "high-margin"
                                : parseFloat(item.selling_price) >
                                  parseFloat(item.purchasing_price)
                                ? "normal-margin"
                                : "low-margin"
                            }`}
                          >
                            {(
                              ((parseFloat(item.selling_price) -
                                parseFloat(item.purchasing_price)) /
                                parseFloat(item.purchasing_price)) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons enhanced">
                            <button
                              onClick={() => handleEditClick(item)}
                              className="action-btn edit-btn"
                              title="Edit Item"
                            >
                              <FaEdit />
                            </button>
                            {isDimensionsSupported(item.unit) && (
                              <button
                                onClick={() => {
                                  setCurrentCutItem(item);
                                  setIsCutModalOpen(true);
                                }}
                                className="action-btn cut-btn"
                                title="Cut/Bill Item"
                              >
                                <FaCut />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteClick(item.id)}
                              className="action-btn delete-btn"
                              title="Delete Item"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="alert-container">
        {alerts.map((alert) => (
          <div key={alert.id} className={`alert alert-${alert.type}`}>
            <span>{alert.message}</span>
            <button
              className="close-btn"
              onClick={() =>
                setAlerts((alerts) => alerts.filter((a) => a.id !== alert.id))
              }
            >
              <FaTimes />
            </button>
          </div>
        ))}
      </div>

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-container">
            <div className="modal-header">
              <h3 className="modal-title">
                <FaPlus className="modal-icon" />
                {selectedCategory
                  ? `Add New ${getCategoryName(selectedCategory)} Item`
                  : "Add New Inventory Item"}
              </h3>
              <button className="modal-close" onClick={handleCloseAddModal}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleNewItemSubmit} className="add-item-form">
                <div className="form-section">
                  <h4 className="form-section-title">Basic Information</h4>
                  <div className="form-row">
                    {!selectedCategory && (
                      <div className="form-group">
                        <label htmlFor="category">Category</label>
                        <select
                          id="category"
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          required
                          className="form-control"
                        >
                          <option value="">-- Select Category --</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id.toString()}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="form-group">
                      <label htmlFor="item-name">Product Name</label>
                      <input
                        type="text"
                        id="item-name"
                        name="name"
                        value={newItem.name}
                        onChange={handleNewItemChange}
                        placeholder="Enter product name"
                        className="form-control"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="unit">Unit Type</label>
                      <select
                        id="unit"
                        name="unit"
                        value={newItem.unit}
                        onChange={handleNewItemChange}
                        className="form-control"
                        required
                        disabled={isLoadingUnits}
                      >
                        <option value="">-- Select Unit --</option>
                        {isLoadingUnits ? (
                          <option value="" disabled>
                            Loading units...
                          </option>
                        ) : categoryUnits.length > 0 ? (
                          categoryUnits.map((unit) => (
                            <option key={unit.value} value={unit.value}>
                              {unit.label}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>
                            No units available for this category
                          </option>
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4 className="form-section-title">Quantity & Measurement</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="pieces">Number of Pieces</label>
                      <input
                        type="number"
                        id="pieces"
                        name="pieces"
                        value={newItem.pieces}
                        onChange={handleNewItemChange}
                        min="1"
                        className="form-control"
                      />
                    </div>

                    {isDimensionsSupported(newItem.unit) && (
                      <div className="form-group">
                        <label className="dimensions-label">
                          Specify Dimensions?
                        </label>
                        <div className="dimensions-selector">
                          <div
                            className={`dimension-option ${
                              !showDimensions ? "selected" : ""
                            }`}
                            onClick={() => setShowDimensions(false)}
                          >
                            <input
                              type="radio"
                              id="dimensions-no"
                              name="dimensions"
                              checked={!showDimensions}
                              onChange={() => setShowDimensions(false)}
                            />
                            <span className="radio-indicator"></span>
                            <div className="dimension-option-content">
                              <span className="dimension-option-label">
                                No (Total Quantity Only)
                              </span>
                              <span className="dimension-option-desc">
                                Add bulk items without specifying dimensions
                              </span>
                            </div>
                          </div>

                          <div
                            className={`dimension-option ${
                              showDimensions ? "selected" : ""
                            }`}
                            onClick={() => setShowDimensions(true)}
                          >
                            <input
                              type="radio"
                              id="dimensions-yes"
                              name="dimensions"
                              checked={showDimensions}
                              onChange={() => setShowDimensions(true)}
                            />
                            <span className="radio-indicator"></span>
                            <div className="dimension-option-content">
                              <span className="dimension-option-label">
                                Yes (Using Dimensions)
                              </span>
                              <span className="dimension-option-desc">
                                Specify length, breadth and height
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {showWeightFields && (
                      <div className="form-group">
                        <label htmlFor="weight-per-piece">
                          Weight per Piece ({newItem.unit})
                        </label>
                        <input
                          type="number"
                          id="weight-per-piece"
                          name="weight_per_piece"
                          value={newItem.weight_per_piece}
                          onChange={handleNewItemChange}
                          step="0.01"
                          min="0"
                          className="form-control"
                        />
                      </div>
                    )}

                    <div className="form-group">
                      <label htmlFor="quantity">Total Stock</label>
                      <input
                        type="text"
                        id="quantity"
                        name="quantity"
                        value={
                          newItem.quantity && !isNaN(newItem.quantity)
                            ? Number(newItem.quantity) % 1 === 0
                              ? Number(newItem.quantity).toFixed(0)
                              : Number(newItem.quantity).toFixed(2)
                            : newItem.quantity
                        }
                        onChange={handleNewItemChange}
                        step="0.01"
                        min="0"
                        required
                        className="form-control"
                      />
                      <small className="form-text-muted">
                        Auto-calculated based on dimensions, pieces, or weight
                        when applicable
                      </small>
                    </div>
                  </div>

                  {showDimensions && isDimensionsSupported(newItem.unit) && (
                    <>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Dimension Unit</label>
                          <select
                            className="form-control"
                            name="dim_unit"
                            value={newItem.dim_unit}
                            onChange={handleNewItemChange}
                          >
                            {DIMENSION_UNITS.map((unit) => (
                              <option key={unit.value} value={unit.value}>
                                {unit.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="dimensions-inputs">
                        <div className="form-group">
                          <label>Length ({newItem.dim_unit})</label>
                          <input
                            type="number"
                            className="form-control"
                            name="length"
                            value={newItem.length}
                            onChange={handleNewItemChange}
                            step="0.01"
                            min="0"
                            required={isDimensionsRequired(
                              newItem.unit,
                              showDimensions
                            )}
                          />
                        </div>
                        <div className="form-group">
                          <label>Breadth ({newItem.dim_unit})</label>
                          <input
                            type="number"
                            className="form-control"
                            name="breadth"
                            value={newItem.breadth}
                            onChange={handleNewItemChange}
                            step="0.01"
                            min="0"
                            required={isDimensionsRequired(
                              newItem.unit,
                              showDimensions
                            )}
                          />
                        </div>
                        <div className="form-group">
                          <label>Height ({newItem.dim_unit})</label>
                          <input
                            type="number"
                            className="form-control"
                            name="height"
                            value={newItem.height}
                            onChange={handleNewItemChange}
                            step="0.01"
                            min="0"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="form-section">
                  <h4 className="form-section-title">
                    Pricing & Inventory Control
                  </h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="purchasing-price">
                        Purchasing Price (₹)
                      </label>
                      <input
                        type="number"
                        id="purchasing-price"
                        name="purchasing_price"
                        value={newItem.purchasing_price}
                        onChange={handleNewItemChange}
                        step="0.01"
                        min="0"
                        required
                        className="form-control"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="selling-price">Selling Price (₹)</label>
                      <input
                        type="number"
                        id="selling-price"
                        name="selling_price"
                        value={newItem.selling_price}
                        onChange={handleNewItemChange}
                        step="0.01"
                        min="0"
                        required
                        className="form-control"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="reorder-level">Reorder Level</label>
                      <input
                        type="number"
                        id="reorder-level"
                        name="reorder_level"
                        value={newItem.reorder_level}
                        onChange={handleNewItemChange}
                        step="0.01"
                        min="0"
                        required
                        className="form-control"
                      />
                      <small className="form-text-muted">
                        Minimum stock level before reordering
                      </small>
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={handleCloseAddModal}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="loading-text">
                        <span className="loading-dots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </span>
                        Adding...
                      </span>
                    ) : (
                      "Add Item"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-container">
            <div className="modal-header">
              <h3 className="modal-title">
                <FaEdit className="modal-icon" /> Edit Item
              </h3>
              <button className="modal-close" onClick={handleCloseEditModal}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleEditFormSubmit} className="edit-form">
                <div className="form-section">
                  <h4 className="form-section-title">Basic Information</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="edit-name">
                        Product Name <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="edit-name"
                        name="name"
                        value={currentEditItem.name}
                        onChange={handleEditInputChange}
                        placeholder="Enter product name"
                        className="form-control"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="edit-unit">
                        Unit Type <span className="required">*</span>
                      </label>
                      <select
                        id="edit-unit"
                        name="unit"
                        value={currentEditItem.unit}
                        onChange={handleEditInputChange}
                        className="form-control"
                        required
                        disabled={isLoadingUnits}
                      >
                        <option value="">-- Select Unit --</option>
                        {isLoadingUnits ? (
                          <option value="" disabled>
                            Loading units...
                          </option>
                        ) : categoryUnits.length > 0 ? (
                          categoryUnits.map((unit) => (
                            <option key={unit.value} value={unit.value}>
                              {unit.label}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>
                            No units available for this category
                          </option>
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4 className="form-section-title">Quantity & Measurement</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="edit-pieces">Number of Pieces</label>
                      <input
                        type="number"
                        id="edit-pieces"
                        name="pieces"
                        value={currentEditItem.pieces}
                        onChange={handleEditInputChange}
                        min="1"
                        className="form-control"
                      />
                    </div>

                    {isDimensionsSupported(currentEditItem.unit) && (
                      <div className="form-group">
                        <label className="dimensions-label">
                          Specify Dimensions?
                        </label>
                        <div className="dimensions-selector">
                          <div
                            className={`dimension-option ${
                              !editShowDimensions ? "selected" : ""
                            }`}
                            onClick={() => setEditShowDimensions(false)}
                          >
                            <input
                              type="radio"
                              id="dimensions-no"
                              name="dimensions"
                              checked={!editShowDimensions}
                              onChange={() => setEditShowDimensions(false)}
                            />
                            <span className="radio-indicator"></span>
                            <div className="dimension-option-content">
                              <span className="dimension-option-label">
                                No (Total Quantity Only)
                              </span>
                              <span className="dimension-option-desc">
                                Add bulk items without specifying dimensions
                              </span>
                            </div>
                          </div>

                          <div
                            className={`dimension-option ${
                              editShowDimensions ? "selected" : ""
                            }`}
                            onClick={() => setEditShowDimensions(true)}
                          >
                            <input
                              type="radio"
                              id="dimensions-yes"
                              name="dimensions"
                              checked={editShowDimensions}
                              onChange={() => setEditShowDimensions(true)}
                            />
                            <span className="radio-indicator"></span>
                            <div className="dimension-option-content">
                              <span className="dimension-option-label">
                                Yes (Using Dimensions)
                              </span>
                              <span className="dimension-option-desc">
                                Specify length, breadth and height
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {editShowWeightFields && (
                      <div className="form-group">
                        <label htmlFor="edit-weight-per-piece">
                          Weight per Piece ({currentEditItem.unit})
                        </label>
                        <input
                          type="number"
                          id="edit-weight-per-piece"
                          name="weight_per_piece"
                          value={currentEditItem.weight_per_piece}
                          onChange={handleEditInputChange}
                          step="0.01"
                          min="0"
                          className="form-control"
                        />
                      </div>
                    )}

                    <div className="form-group">
                      <label htmlFor="edit-quantity">
                        Total Stock <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="edit-quantity"
                        name="quantity"
                        value={
                          currentEditItem.quantity &&
                          !isNaN(currentEditItem.quantity)
                            ? Number(currentEditItem.quantity) % 1 === 0
                              ? Number(currentEditItem.quantity).toFixed(0)
                              : Number(currentEditItem.quantity).toFixed(2)
                            : currentEditItem.quantity
                        }
                        onChange={handleEditInputChange}
                        placeholder="Enter total stock"
                        min="0"
                        className="form-control"
                        required
                      />
                      <small className="form-text-muted">
                        Auto-calculated based on dimensions, pieces, or weight
                        when applicable
                      </small>
                    </div>
                  </div>

                  {isDimensionsSupported(currentEditItem.unit) &&
                    editShowDimensions && (
                      <>
                        <div className="form-row">
                          <div className="form-group">
                            <label htmlFor="edit-dim-unit">
                              Dimension Unit
                            </label>
                            <select
                              id="edit-dim-unit"
                              name="dim_unit"
                              value={currentEditItem.dim_unit}
                              onChange={handleEditInputChange}
                              className="form-control"
                            >
                              {DIMENSION_UNITS.map((unit) => (
                                <option key={unit.value} value={unit.value}>
                                  {unit.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="dimensions-inputs">
                          <div className="form-group">
                            <label htmlFor="edit-length">
                              Length ({currentEditItem.dim_unit})
                            </label>
                            <input
                              type="number"
                              id="edit-length"
                              name="length"
                              value={currentEditItem.length}
                              onChange={handleEditInputChange}
                              step="0.01"
                              min="0"
                              className="form-control"
                              required={editShowDimensions}
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="edit-breadth">
                              Breadth ({currentEditItem.dim_unit})
                            </label>
                            <input
                              type="number"
                              id="edit-breadth"
                              name="breadth"
                              value={currentEditItem.breadth}
                              onChange={handleEditInputChange}
                              step="0.01"
                              min="0"
                              className="form-control"
                              required={editShowDimensions}
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="edit-height">
                              Height ({currentEditItem.dim_unit})
                            </label>
                            <input
                              type="number"
                              id="edit-height"
                              name="height"
                              value={currentEditItem.height}
                              onChange={handleEditInputChange}
                              step="0.01"
                              min="0"
                              className="form-control"
                            />
                          </div>
                        </div>
                      </>
                    )}
                </div>

                <div className="form-section">
                  <h4 className="form-section-title">
                    Pricing & Inventory Control
                  </h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="edit-purchasing-price">
                        Purchasing Price (₹) <span className="required">*</span>
                      </label>
                      <input
                        type="number"
                        id="edit-purchasing-price"
                        name="purchasing_price"
                        value={currentEditItem.purchasing_price}
                        onChange={handleEditInputChange}
                        placeholder="Enter purchasing price"
                        step="0.01"
                        min="0"
                        className="form-control"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="edit-selling-price">
                        Selling Price (₹) <span className="required">*</span>
                      </label>
                      <input
                        type="number"
                        id="edit-selling-price"
                        name="selling_price"
                        value={currentEditItem.selling_price}
                        onChange={handleEditInputChange}
                        placeholder="Enter selling price"
                        step="0.01"
                        min="0"
                        className="form-control"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="edit-reorder-level">
                        Reorder Level <span className="required">*</span>
                      </label>
                      <input
                        type="number"
                        id="edit-reorder-level"
                        name="reorder_level"
                        value={currentEditItem.reorder_level}
                        onChange={handleEditInputChange}
                        placeholder="Enter reorder level"
                        min="0"
                        className="form-control"
                        required
                      />
                      <small className="form-text-muted">
                        Minimum stock level before reordering
                      </small>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={handleCloseEditModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={isEditing}
                  >
                    {isEditing ? (
                      <span className="loading-text">
                        <span className="loading-dots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </span>
                        Saving...
                      </span>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Stock;
