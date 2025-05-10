import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import "./css/Billing.css"; // Ensure this is the updated CSS file below
import Select from "react-select";
import CustomOption from "../components/CustomOption";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  FaTrash,
  FaPlus,
  FaMinus,
  FaSave,
  FaMoneyCheckAlt,
  FaRupeeSign,
  FaRuler,
  FaCut,
  FaList,
  FaRegCopy,
} from "react-icons/fa";
import logo from "../assets/logo.png";
import { DIMENSION_UNITS } from "../config/units";

function Billing() {
  // State Management
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [itemsStock, setItemsStock] = useState([]);
  const [latestInvoiceNumber, setLatestInvoiceNumber] = useState(null);

  // Settings state
  const [companySettings, setCompanySettings] = useState({
    companyName: "",
    companyAddress: "",
    companyPhone: "",
    companyEmail: "",
    logoUrl: null,
  });

  const [paymentSettings, setPaymentSettings] = useState({
    upiId: "",
    accountName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branch: "",
    qrCodeUrl: null,
  });

  // State to track visibility of cuts for each item
  const [showCutsForItem, setShowCutsForItem] = useState({});

  // Ref for the scrollable container
  const scrollContainerRef = useRef(null);

  // Enhanced invoice data to handle dimensions and item types
  const [invoiceData, setInvoiceData] = useState({
    invoiceDate: "",
    dueDate: "",
    poNumber: "",
    to: { name: "", address: "", email: "", phone: "" },
    items: [
      {
        item_id: "",
        name: "",
        dimension: "",
        original_dimension: "", // Store the original dimensions from item
        category: "",
        selling_price: 0,
        unit: "",
        quantity: 1,
        subtotal: 0,
        isBulk: false, // Flag to indicate if this is a bulk item
        custom_dimensions: [], // For bulk items: array of {length, width, height, pieces}
        total_cft: 0, // Calculated total CFT based on dimensions × quantity
        dim_unit: "in", // Default dimension unit (inches)
      },
    ],
    discount: 0,
    tax: 0,
    taxType: "GST",
    currency: "₹",
    notes: "",
    paymentTerms: "",
    paymentMethod: "",
    receivedAmount: "",
    invoicePendingAmount: 0,
  });

  const [alerts, setAlerts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const invoiceRef = useRef();

  // Authentication Header
  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch company settings
  useEffect(() => {
    const fetchCompanySettings = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/settings/company",
          {
            headers: getAuthHeader(),
          }
        );

        if (response.data) {
          setCompanySettings(response.data);
        }
      } catch (error) {
        console.error("Error fetching company settings:", error);
        addAlert("danger", "Failed to fetch company settings.");
      }
    };

    fetchCompanySettings();
  }, []);

  // Fetch payment settings
  useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/settings/payment",
          {
            headers: getAuthHeader(),
          }
        );

        if (response.data) {
          setPaymentSettings(response.data);
        }
      } catch (error) {
        console.error("Error fetching payment settings:", error);
        addAlert("danger", "Failed to fetch payment settings.");
      }
    };

    fetchPaymentSettings();
  }, []);

  // Alerts
  const addAlert = (type, message) => {
    const id = Date.now();
    setAlerts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setAlerts((prev) => prev.filter((alert) => alert.id !== id));
    }, 5000);
  };

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/customers",
          {
            headers: getAuthHeader(),
          }
        );
        setCustomers(response.data);
      } catch (error) {
        console.error("Error fetching customers:", error);
        addAlert("danger", "Failed to fetch customers.");
      }
    };
    fetchCustomers();
  }, []);

  // Fetch stock items with complete details
  useEffect(() => {
    const fetchStockItems = async () => {
      try {
        // Get stock information without the includeDetails parameter that's causing the error
        const response = await axios.get("http://localhost:3000/api/items", {
          headers: getAuthHeader(),
        });

        // Process the stock items to identify different item types
        const processedItems = response.data.map((item) => {
          let itemType = "dimensioned"; // Default type

          // Determine item type based on unit and dimensions
          const isVolumeUnit =
            item.unit === "CFT" || item.unit === "CUM" || item.unit === "m³";

          if (isVolumeUnit) {
            // For volume-based units (CFT, CUM, etc.)
            const hasDims = hasDimensions(item.dimension);
            // If it has no dimensions but has quantity, it's likely bulk
            const isBulk = !hasDims && item.quantity > 0;
            itemType = isBulk ? "bulk" : "dimensioned";
          } else {
            // For non-volume units - determine by analyzing properties

            // If it has L×W×H dimensions, it might still be a dimensioned item
            const hasMeaningfulDimensions =
              hasDimensions(item.dimension) &&
              // Make sure dimensions actually calculate to something meaningful
              calculateVolumeFromDimension(item.dimension) > 0;

            // If it has meaningful dimensions and the price would make sense as a volume price,
            // treat it as dimensioned, otherwise as discrete
            itemType = hasMeaningfulDimensions ? "dimensioned" : "discrete";
          }

          // Set flags for backwards compatibility
          const isBulk = itemType === "bulk";
          const isDiscreteUnit = itemType === "discrete";

          return {
            ...item,
            isBulk,
            isDiscreteUnit,
            itemType,
            // Extract any dimension data if available
            dimensions: parseDimensions(item.dimension),
          };
        });

        setItemsStock(processedItems);
      } catch (error) {
        console.error("Error fetching stock items:", error);
        addAlert("danger", "Failed to fetch stock items.");
      }
    };
    fetchStockItems();
  }, []);

  // Helper function to parse dimensions from string like "2x4x5" or "5x4x3 - 100pcs"
  const parseDimensions = (dimensionStr) => {
    if (!dimensionStr)
      return { length: 0, width: 0, height: 0, pieces: 0, dim_unit: "in" };

    // Extract dimension unit if present - look for units like 'ft', 'in', 'cm', 'm'
    let dim_unit = "in"; // Default to inches if not specified
    if (dimensionStr.includes("ft")) {
      dim_unit = "ft";
    } else if (dimensionStr.includes("in")) {
      dim_unit = "in";
    } else if (dimensionStr.includes("cm")) {
      dim_unit = "cm";
    } else if (dimensionStr.includes("m ")) {
      dim_unit = "m";
    }

    // Try to extract pieces info
    let pieces = 0;
    let dimPart = dimensionStr;

    if (dimensionStr.includes("pcs")) {
      const parts = dimensionStr.split(/\s*-\s*/);
      if (parts.length === 2) {
        dimPart = parts[0].trim();
        // Extract number from "100pcs" format
        const piecesMatch = parts[1].match(/(\d+)\s*pcs/i);
        if (piecesMatch) {
          pieces = parseInt(piecesMatch[1], 10);
        }
      }
    }

    // Handle dimension string variations
    // First split by 'x' and remove any spaces
    const dims = dimPart.split(/\s*[xX×]\s*/).map((d) => {
      // Remove any non-numeric characters except decimal point
      const cleaned = d.replace(/[^\d.]/g, "");
      return parseFloat(cleaned) || 0;
    });

    return {
      length: dims[0] || 0,
      width: dims[1] || 0,
      height: dims[2] || 0,
      pieces: pieces,
      dim_unit: dim_unit,
    };
  };

  // Get conversion factor for dimension unit to cubic feet
  const getDimensionFactor = (dim_unit) => {
    switch (dim_unit) {
      case "ft": // cubic feet (length * width * height)
        return 1;
      case "in": // cubic inches to cubic feet (divide by 1728)
        return 1 / 1728;
      case "cm": // cubic centimeters to cubic feet
        return 1 / 28316.8;
      case "m": // cubic meters to cubic feet
        return 35.3147;
      default:
        return 1 / 1728; // Default to inches
    }
  };

  // Calculate volume in cubic feet based on dimensions and unit
  const calculateVolume = (
    length,
    width,
    height,
    pieces = 1,
    dim_unit = "in"
  ) => {
    // Parse inputs to ensure they're numbers
    const l = parseFloat(length) || 0;
    const w = parseFloat(width) || 0;
    const h = parseFloat(height) || 0;
    const p = parseInt(pieces, 10) || 1;

    // Handle zero or negative dimensions
    if (l <= 0 || w <= 0 || h <= 0 || p <= 0) {
      return 0;
    }

    // Get conversion factor based on dimension unit
    const factor = getDimensionFactor(dim_unit);

    // Calculate volume in cubic feet using the appropriate conversion factor
    const volume = l * w * h * p * factor;
    return parseFloat(volume.toFixed(4));
  };

  // Helper function to calculate volume directly from dimension string
  const calculateVolumeFromDimension = (dimensionStr) => {
    if (!dimensionStr || dimensionStr.trim() === "") return 0;

    const dims = parseDimensions(dimensionStr);
    if (dims.length <= 0 || dims.width <= 0 || dims.height <= 0) {
      return 0; // Invalid dimensions
    }

    return calculateVolume(
      dims.length,
      dims.width,
      dims.height,
      1,
      dims.dim_unit
    );
  };

  // Fetch latest invoice number
  useEffect(() => {
    const fetchLatestInvoiceNumber = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/invoices/latest",
          {
            headers: getAuthHeader(),
          }
        );
        setLatestInvoiceNumber(response.data.invoiceNumber);
      } catch (error) {
        console.error("Error fetching latest invoice number:", error);
        addAlert("danger", "Failed to fetch latest invoice number.");
      }
    };
    fetchLatestInvoiceNumber();
  }, []);

  // Default invoice date = today
  useEffect(() => {
    if (!invoiceData.invoiceDate) {
      const today = new Date().toISOString().split("T")[0];
      setInvoiceData((prev) => ({ ...prev, invoiceDate: today }));
    }
  }, [invoiceData.invoiceDate]);

  // Automatically set due date 10 days ahead
  useEffect(() => {
    if (invoiceData.invoiceDate) {
      const date = new Date(invoiceData.invoiceDate);
      date.setDate(date.getDate() + 10);
      const due = date.toISOString().split("T")[0];
      setInvoiceData((prev) => ({ ...prev, dueDate: due }));
    }
  }, [invoiceData.invoiceDate]);

  // Handle scroll indicators for the scrollable container
  useEffect(() => {
    const updateScrollIndicators = () => {
      if (scrollContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } =
          scrollContainerRef.current;

        // Check if we can scroll up
        if (scrollTop > 0) {
          scrollContainerRef.current.classList.add("can-scroll-up");
        } else {
          scrollContainerRef.current.classList.remove("can-scroll-up");
        }

        // Check if we can scroll down
        if (scrollTop + clientHeight < scrollHeight) {
          scrollContainerRef.current.classList.add("can-scroll-down");
        } else {
          scrollContainerRef.current.classList.remove("can-scroll-down");
        }
      }
    };

    // Initial check
    updateScrollIndicators();

    // Add scroll event listener
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", updateScrollIndicators);
    }

    // Update indicators when items change
    updateScrollIndicators();

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", updateScrollIndicators);
      }
    };
  }, [invoiceData.items]);

  // Fetch last 20 invoices
  useEffect(() => {
    const fetchRecentInvoices = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/invoices?limit=20",
          {
            headers: getAuthHeader(),
          }
        );
        setRecentInvoices(response.data);
      } catch (error) {
        console.error("Error fetching recent invoices:", error);
        addAlert("danger", "Failed to fetch recent invoices.");
      }
    };
    fetchRecentInvoices();
  }, []);

  // Select a customer
  const handleSelectCustomer = (selectedOption) => {
    const customerId = selectedOption ? selectedOption.value : "";
    const customer = customers.find((c) => String(c.id) === String(customerId));
    setSelectedCustomer(customer || null);
    if (customer) {
      setInvoiceData((prev) => ({
        ...prev,
        to: {
          name: customer.name,
          address: customer.address,
          email: customer.email,
          phone: customer.phone,
        },
      }));
    } else {
      setInvoiceData((prev) => ({
        ...prev,
        to: { name: "", address: "", email: "", phone: "" },
      }));
    }
  };

  // Stock helper - enhanced to handle both piece and bulk inventory
  const getAvailableStock = (item_id) => {
    const stockItem = itemsStock.find((item) => item.id === item_id);

    if (!stockItem) return { quantity: 0, unit: "", isBulk: false };

    // Get the actual quantity from the item
    const quantity = parseFloat(stockItem.quantity) || 0;

    return {
      quantity: quantity,
      unit: stockItem.unit || "",
      isBulk: stockItem.isBulk || false,
      // Include pieces information if available
      pieces: stockItem.pieces || 0,
      // Include dimension information
      length: stockItem.length || 0,
      breadth: stockItem.breadth || 0,
      height: stockItem.height || 0,
      dimension: stockItem.dimension || "",
    };
  };

  // Handle changes - enhanced for dimensions
  const handleInputChange = (e, index = null, field = null) => {
    const { name, value } = e.target;

    if (index !== null && field) {
      const updatedItems = [...invoiceData.items];
      const item = updatedItems[index];

      if (name === "subtotal") {
        const parsedValue = parseFloat(value);
        updatedItems[index][name] = !isNaN(parsedValue) ? parsedValue : 0;
      } else {
        updatedItems[index][name] = value;
      }

      // If this is a price or quantity change, recalculate the subtotal
      if (name === "selling_price" || name === "quantity") {
        const sellingPrice = parseFloat(item.selling_price);
        const quantity = parseInt(item.quantity, 10);

        if (!isNaN(sellingPrice) && !isNaN(quantity)) {
          // Calculate based on item type
          if (item.itemType === "discrete") {
            // For discrete items (rolls, boxes, etc.) - simple multiplication
            item.subtotal = parseFloat((sellingPrice * quantity).toFixed(2));
          } else if (!item.isBulk) {
            // For dimensioned items, calculate based on dimensions and quantity
            const dims = parseDimensions(item.dimension);
            const totalCFT = calculateVolume(
              dims.length,
              dims.width,
              dims.height,
              quantity,
              item.dim_unit
            );

            item.total_cft = parseFloat(totalCFT.toFixed(2));
            item.subtotal = parseFloat((sellingPrice * totalCFT).toFixed(2));
          }
          // For bulk items, subtotal is calculated based on custom dimensions in handleCustomDimensionChange
        }
      }

      setInvoiceData({ ...invoiceData, items: updatedItems });
    } else {
      // For top-level fields
      let newValue = value;
      if (name === "discount" || name === "tax") {
        newValue = parseFloat(value) || 0;
      }
      setInvoiceData({ ...invoiceData, [name]: newValue });
    }
  };

  // Add/edit a custom dimension cut for bulk items
  const handleCustomDimensionChange = (index, cutIndex, field, value) => {
    const updatedItems = [...invoiceData.items];
    const item = updatedItems[index];

    if (!item.custom_dimensions[cutIndex]) {
      item.custom_dimensions[cutIndex] = {
        length: 0,
        width: 0,
        height: 0,
        pieces: 1,
      };
    }

    // Update the specific dimension field
    item.custom_dimensions[cutIndex][field] = parseFloat(value) || 0;

    // Recalculate total CFT and subtotal
    let totalCFT = 0;
    item.custom_dimensions.forEach((cut) => {
      if (cut.length && cut.width && cut.height && cut.pieces) {
        // Calculate CFT for this cut using proper dimension unit
        const cutCFT = calculateVolume(
          cut.length,
          cut.width,
          cut.height,
          cut.pieces,
          item.dim_unit
        );
        totalCFT += cutCFT;
      }
    });

    // Update the item
    item.total_cft = parseFloat(totalCFT.toFixed(2));
    item.subtotal = parseFloat((item.selling_price * totalCFT).toFixed(2));

    // Validate against available stock for bulk items
    const availableStock = getAvailableStock(item.item_id);
    if (totalCFT > availableStock.quantity) {
      addAlert(
        "warning",
        `Total volume (${totalCFT.toFixed(2)} CFT) exceeds available stock (${
          availableStock.quantity
        } CFT) for "${item.name}".`
      );
    }

    setInvoiceData({ ...invoiceData, items: updatedItems });
  };

  // Change dimension unit for an item
  const handleDimensionUnitChange = (index, value) => {
    const updatedItems = [...invoiceData.items];
    const item = updatedItems[index];

    // Store previous unit for conversion calculation
    const prevUnit = item.dim_unit;

    // Update the dimension unit
    item.dim_unit = value;

    // If we have custom dimensions, recalculate the volumes with new unit
    if (item.custom_dimensions && item.custom_dimensions.length > 0) {
      let totalCFT = 0;
      item.custom_dimensions.forEach((cut) => {
        if (cut.length && cut.width && cut.height && cut.pieces) {
          // Calculate CFT with new dimension unit
          const cutCFT = calculateVolume(
            cut.length,
            cut.width,
            cut.height,
            cut.pieces,
            item.dim_unit
          );
          totalCFT += cutCFT;
        }
      });

      // Update the item
      item.total_cft = parseFloat(totalCFT.toFixed(2));
      item.subtotal = parseFloat((item.selling_price * totalCFT).toFixed(2));
    }

    setInvoiceData({ ...invoiceData, items: updatedItems });
  };

  // Toggle visibility of cuts for a specific item
  const toggleCutsVisibility = (index) => {
    setShowCutsForItem((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Add a new custom dimension cut
  const addCustomDimension = (index) => {
    const updatedItems = [...invoiceData.items];

    if (!updatedItems[index].custom_dimensions) {
      updatedItems[index].custom_dimensions = [];
    }

    updatedItems[index].custom_dimensions.push({
      length: 0,
      width: 0,
      height: 0,
      pieces: 1,
    });

    // Show cuts when adding first cut
    setShowCutsForItem((prev) => ({
      ...prev,
      [index]: true,
    }));

    setInvoiceData({ ...invoiceData, items: updatedItems });
  };

  // Remove a custom dimension cut
  const removeCustomDimension = (index, cutIndex) => {
    const updatedItems = [...invoiceData.items];
    updatedItems[index].custom_dimensions.splice(cutIndex, 1);

    // Recalculate total CFT and subtotal
    let totalCFT = 0;
    updatedItems[index].custom_dimensions.forEach((cut) => {
      const cutCFT = calculateVolume(
        cut.length,
        cut.width,
        cut.height,
        cut.pieces,
        updatedItems[index].dim_unit
      );
      totalCFT += cutCFT;
    });

    updatedItems[index].total_cft = parseFloat(totalCFT.toFixed(2));
    updatedItems[index].subtotal = parseFloat(
      (updatedItems[index].selling_price * totalCFT).toFixed(2)
    );

    setInvoiceData({ ...invoiceData, items: updatedItems });
  };

  // Toggle dimension editor for bulk items
  const toggleDimensionEditor = (index) => {
    // This function is now deprecated as we use inline cut rows
    // Instead we'll simply add a custom dimension if none exists
    if (
      invoiceData.items[index].isBulk &&
      (!invoiceData.items[index].custom_dimensions ||
        invoiceData.items[index].custom_dimensions.length === 0)
    ) {
      addCustomDimension(index);
    }
  };

  // Increment/Decrement quantity - enhanced for dimension calculations
  const handleQuantityIncrement = (index) => {
    const items = [...invoiceData.items];
    const item = items[index];
    let currentQty = parseInt(item.quantity, 10) || 0;
    const available = getAvailableStock(item.item_id);

    if (item.isBulk) {
      // For bulk items, we don't increment quantity directly
      // Instead we need to manage custom dimensions
      return;
    }

    // Check if quantity is within available stock
    if (currentQty < available.quantity) {
      currentQty++;
      item.quantity = currentQty;

      // Calculate subtotal based on item type
      if (item.itemType === "discrete") {
        // For discrete items (rolls, boxes, etc.) - simple multiplication
        const sp = parseFloat(item.selling_price) || 0;
        item.subtotal = parseFloat((sp * currentQty).toFixed(2));
      } else {
        // For dimensioned items with volume
        const dims = parseDimensions(item.dimension);
        const totalCFT = calculateVolume(
          dims.length,
          dims.width,
          dims.height,
          currentQty,
          item.dim_unit
        );

        item.total_cft = parseFloat(totalCFT.toFixed(2));
        const sp = parseFloat(item.selling_price) || 0;
        item.subtotal = parseFloat((sp * totalCFT).toFixed(2));
      }

      setInvoiceData({ ...invoiceData, items });
    } else {
      addAlert(
        "warning",
        `Cannot exceed available stock (${available.quantity} ${available.unit}) for "${item.name}".`
      );
    }
  };

  const handleQuantityDecrement = (index) => {
    const items = [...invoiceData.items];
    const item = items[index];
    let currentQty = parseInt(item.quantity, 10) || 0;

    if (item.isBulk) {
      // For bulk items, we don't decrement quantity directly
      // Instead we need to manage custom dimensions
      return;
    }

    // For fixed-dimension items and discrete units
    if (currentQty > 1) {
      currentQty--;
      item.quantity = currentQty;

      // Calculate subtotal based on item type
      if (item.itemType === "discrete") {
        // For discrete items (rolls, boxes, etc.) - simple multiplication
        const sp = parseFloat(item.selling_price) || 0;
        item.subtotal = parseFloat((sp * currentQty).toFixed(2));
      } else {
        // For dimensioned items with volume
        const dims = parseDimensions(item.dimension);
        const totalCFT = calculateVolume(
          dims.length,
          dims.width,
          dims.height,
          currentQty,
          item.dim_unit
        );

        item.total_cft = parseFloat(totalCFT.toFixed(2));
        const sp = parseFloat(item.selling_price) || 0;
        item.subtotal = parseFloat((sp * totalCFT).toFixed(2));
      }

      setInvoiceData({ ...invoiceData, items });
    } else {
      addAlert("warning", `Quantity for "${item.name}" cannot be less than 1.`);
    }
  };

  // Increment/Decrement pieces for a custom dimension cut
  const handlePiecesIncrement = (index, cutIndex) => {
    const updatedItems = [...invoiceData.items];
    const cut = updatedItems[index].custom_dimensions[cutIndex];
    cut.pieces++;

    // Recalculate total CFT and subtotal
    let totalCFT = 0;
    updatedItems[index].custom_dimensions.forEach((cut) => {
      const cutCFT = calculateVolume(
        cut.length,
        cut.width,
        cut.height,
        cut.pieces,
        updatedItems[index].dim_unit
      );
      totalCFT += cutCFT;
    });

    // Check if we exceed available stock
    const available = getAvailableStock(updatedItems[index].item_id);
    if (totalCFT > available.quantity) {
      addAlert(
        "warning",
        `Total volume (${totalCFT.toFixed(2)} CFT) exceeds available stock (${
          available.quantity
        } CFT) for "${updatedItems[index].name}".`
      );
      cut.pieces--; // Revert the increment
      return;
    }

    updatedItems[index].total_cft = parseFloat(totalCFT.toFixed(2));
    updatedItems[index].subtotal = parseFloat(
      (updatedItems[index].selling_price * totalCFT).toFixed(2)
    );

    setInvoiceData({ ...invoiceData, items: updatedItems });
  };

  const handlePiecesDecrement = (index, cutIndex) => {
    const updatedItems = [...invoiceData.items];
    const cut = updatedItems[index].custom_dimensions[cutIndex];

    if (cut.pieces > 1) {
      cut.pieces--;

      // Recalculate total CFT and subtotal
      let totalCFT = 0;
      updatedItems[index].custom_dimensions.forEach((cut) => {
        const cutCFT = calculateVolume(
          cut.length,
          cut.width,
          cut.height,
          cut.pieces,
          updatedItems[index].dim_unit
        );
        totalCFT += cutCFT;
      });

      updatedItems[index].total_cft = parseFloat(totalCFT.toFixed(2));
      updatedItems[index].subtotal = parseFloat(
        (updatedItems[index].selling_price * totalCFT).toFixed(2)
      );

      setInvoiceData({ ...invoiceData, items: updatedItems });
    } else {
      addAlert("warning", `Pieces for a cut cannot be less than 1.`);
    }
  };

  // Increment discount/tax
  const handleDiscountIncrement = () => {
    let discount = parseFloat(invoiceData.discount) || 0;
    discount++;
    setInvoiceData({ ...invoiceData, discount });
  };

  const handleTaxIncrement = () => {
    let tax = parseFloat(invoiceData.tax) || 0;
    tax++;
    setInvoiceData({ ...invoiceData, tax });
  };

  // Add/Remove items
  const addItem = () => {
    setInvoiceData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          item_id: "",
          name: "",
          dimension: "",
          original_dimension: "",
          category: "",
          selling_price: 0,
          unit: "",
          quantity: 1,
          subtotal: 0,
          isBulk: false,
          custom_dimensions: [],
          total_cft: 0,
          dim_unit: "in", // Default to inches
        },
      ],
    }));
  };

  const removeItem = (index) => {
    const updatedItems = invoiceData.items.filter((_, i) => i !== index);
    setInvoiceData((prev) => ({ ...prev, items: updatedItems }));
  };

  // Helper function to check if a dimension string contains actual dimensions
  const hasDimensions = (dimensionStr) => {
    if (!dimensionStr || dimensionStr.trim() === "") return false;

    // Check if the string contains numeric values separated by 'x' or '×'
    const pattern = /\d+\s*[xX×]\s*\d+/;
    return pattern.test(dimensionStr);
  };

  // Handle item select - enhanced for different item types
  const handleItemSelection = (selectedOption, index) => {
    const itemId = selectedOption ? selectedOption.value : "";

    // Check if this item already exists in the invoice
    const itemAlreadyExists = invoiceData.items.findIndex(
      (item, idx) => idx !== index && String(item.item_id) === String(itemId)
    );

    if (itemId && itemAlreadyExists !== -1) {
      // Item already exists in the invoice - focus on the existing item
      addAlert(
        "warning",
        `"${selectedOption.label}" is already in your invoice. Please modify the existing item instead.`
      );

      // Automatically show the cuts if it's a bulk item
      if (invoiceData.items[itemAlreadyExists].isBulk) {
        setShowCutsForItem((prev) => ({
          ...prev,
          [itemAlreadyExists]: true,
        }));
      }

      return;
    }

    const selectedItem = itemsStock.find(
      (item) => String(item.id) === String(itemId)
    );

    const updatedItems = [...invoiceData.items];

    if (selectedItem) {
      // Get item properties
      const itemUnit = selectedItem.unit || "";
      const itemDimension = selectedItem.dimension || "";

      // Determine if this is a volume-based unit (CFT, cubic meters, etc.)
      const isVolumeUnit =
        itemUnit === "CFT" || itemUnit === "CUM" || itemUnit === "m³";

      // Determine if the item has meaningful dimensions
      const hasMeaningfulDimensions =
        hasDimensions(itemDimension) &&
        calculateVolumeFromDimension(itemDimension) > 0;

      // Determine item type based on unit and dimensions
      let itemType;
      let isBulk = false;

      if (isVolumeUnit) {
        // For volume units, determine if bulk or dimensioned
        if (!hasMeaningfulDimensions && selectedItem.quantity > 0) {
          itemType = "bulk";
          isBulk = true;
        } else {
          itemType = "dimensioned";
        }
      } else {
        // For non-volume units, check if it still has meaningful dimensions
        itemType = hasMeaningfulDimensions ? "dimensioned" : "discrete";
      }

      // For discrete units, don't show volume-based info
      const isDiscreteUnit = itemType === "discrete";

      // Extract dimensions from the item's data (for dimensioned items)
      let length = selectedItem.length || 0;
      let width = selectedItem.breadth || 0; // Note: database uses 'breadth' instead of 'width'
      let height = selectedItem.height || 0;
      let pieces = selectedItem.pieces || 1;

      // Extract dimension unit if available, default to inches
      let dim_unit = selectedItem.dim_unit || "in";

      // If dimensions aren't stored separately, try to extract from dimension string
      if ((!length || !width) && itemDimension && !isDiscreteUnit) {
        const dims = parseDimensions(itemDimension);
        length = length || dims.length;
        width = width || dims.width;
        height = height || dims.height;
        pieces = pieces || dims.pieces;
        dim_unit = dims.dim_unit || dim_unit;
      }

      // Calculate volume based on item type
      let totalCFT = 0;
      if (itemType === "dimensioned") {
        totalCFT = calculateVolume(length, width, height, 1, dim_unit);
        // If dimension data is incomplete, set a default value for display
        if (isNaN(totalCFT) || totalCFT === 0) {
          totalCFT = 1; // Default to 1 CFT if we can't calculate
        }
      }

      // Update the item in the invoice
      updatedItems[index] = {
        ...updatedItems[index],
        item_id: selectedItem.id,
        name: selectedItem.name,
        dimension: itemDimension,
        original_dimension: itemDimension,
        category: selectedItem.Category ? selectedItem.Category.name : "N/A",
        selling_price: selectedItem.selling_price,
        unit: itemUnit,
        quantity: isBulk
          ? 0
          : Math.min(updatedItems[index].quantity || 1, selectedItem.quantity),
        subtotal: calculateSubtotal(selectedItem, totalCFT, 1, itemType),
        isBulk,
        isDiscreteUnit,
        itemType,
        custom_dimensions: isBulk ? [] : updatedItems[index].custom_dimensions,
        total_cft: isDiscreteUnit ? 0 : parseFloat(totalCFT.toFixed(2)), // Ensure discrete units have 0 CFT
        dim_unit: dim_unit,
      };

      // If it's a bulk item, automatically add a custom cut row
      if (
        isBulk &&
        (!updatedItems[index].custom_dimensions ||
          updatedItems[index].custom_dimensions.length === 0)
      ) {
        updatedItems[index].custom_dimensions = [
          { length: 0, width: 0, height: 0, pieces: 1 },
        ];
        // Auto-show the cuts when adding a bulk item
        setShowCutsForItem((prev) => ({
          ...prev,
          [index]: true,
        }));
      }
    } else {
      // Reset item if nothing selected
      updatedItems[index] = {
        ...updatedItems[index],
        item_id: "",
        name: "",
        dimension: "",
        original_dimension: "",
        category: "",
        selling_price: 0,
        unit: "",
        subtotal: 0,
        quantity: 1,
        isBulk: false,
        isDiscreteUnit: false,
        itemType: "dimensioned",
        custom_dimensions: [],
        total_cft: 0,
        dim_unit: "in",
      };
    }

    setInvoiceData({ ...invoiceData, items: updatedItems });
  };

  // Helper function to calculate subtotal based on item type
  const calculateSubtotal = (item, totalCFT, quantity, itemType) => {
    const price = parseFloat(item.selling_price) || 0;

    switch (itemType) {
      case "bulk":
        // For bulk items, calculated later based on custom dimensions
        return 0;
      case "discrete":
        // For discrete units, simple quantity × price
        return parseFloat((price * quantity).toFixed(2));
      case "dimensioned":
      default:
        // For dimensioned items, price × volume
        return parseFloat((price * totalCFT).toFixed(2));
    }
  };

  // Calculate summary
  const calculateSummary = () => {
    const subtotal = invoiceData.items.reduce(
      (acc, item) => acc + (parseFloat(item.subtotal) || 0),
      0
    );

    const discount = parseFloat(invoiceData.discount) || 0;
    const taxableAmount = subtotal - discount;
    const tax = ((parseFloat(invoiceData.tax) || 0) / 100) * taxableAmount;
    const total = taxableAmount + tax;

    return { subtotal, discount, tax, total };
  };

  // Submit form - enhanced for dimension validation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // BASIC VALIDATIONS
    if (!selectedCustomer) {
      addAlert("warning", "Please select a customer.");
      setIsSubmitting(false);
      return;
    }

    if (!invoiceData.paymentMethod) {
      addAlert("warning", "Payment Method is required.");
      setIsSubmitting(false);
      return;
    }

    if (
      invoiceData.receivedAmount === "" ||
      parseFloat(invoiceData.receivedAmount) < 0
    ) {
      addAlert("warning", "Received Amount is required (cannot be negative).");
      setIsSubmitting(false);
      return;
    }

    // Validate each item
    for (let i = 0; i < invoiceData.items.length; i++) {
      const item = invoiceData.items[i];
      if (!item.item_id) {
        addAlert("warning", `Please select an item for row ${i + 1}.`);
        setIsSubmitting(false);
        return;
      }

      const available = getAvailableStock(item.item_id);

      if (item.isBulk) {
        // For bulk items, validate custom dimensions
        if (!item.custom_dimensions || item.custom_dimensions.length === 0) {
          addAlert(
            "warning",
            `Please add at least one cut dimension for bulk item "${item.name}".`
          );
          setIsSubmitting(false);
          return;
        }

        // Check each cut dimension
        for (let j = 0; j < item.custom_dimensions.length; j++) {
          const cut = item.custom_dimensions[j];
          if (cut.length <= 0 || cut.width <= 0 || cut.height <= 0) {
            addAlert(
              "warning",
              `Invalid dimensions for cut #${j + 1} of "${
                item.name
              }". All dimensions must be greater than 0.`
            );
            setIsSubmitting(false);
            return;
          }

          if (cut.pieces < 1) {
            addAlert(
              "warning",
              `Number of pieces for cut #${j + 1} of "${
                item.name
              }" must be at least 1.`
            );
            setIsSubmitting(false);
            return;
          }
        }

        // Validate total CFT against available stock
        if (item.total_cft > available.quantity) {
          addAlert(
            "warning",
            `Total volume (${item.total_cft.toFixed(2)} CFT) for "${
              item.name
            }" exceeds available stock (${available.quantity} CFT).`
          );
          setIsSubmitting(false);
          return;
        }
      } else {
        // For fixed-dimension items
        if (item.quantity < 1) {
          addAlert(
            "warning",
            `Quantity for item "${item.name}" must be at least 1.`
          );
          setIsSubmitting(false);
          return;
        }

        if (item.quantity > available.quantity) {
          addAlert(
            "warning",
            `Quantity for item "${item.name}" exceeds available stock (${available.quantity}).`
          );
          setIsSubmitting(false);
          return;
        }
      }

      if (item.selling_price < 0) {
        addAlert(
          "warning",
          `Selling Price for item "${item.name}" cannot be negative.`
        );
        setIsSubmitting(false);
        return;
      }

      if (item.subtotal < 0) {
        addAlert(
          "warning",
          `Subtotal for item "${item.name}" cannot be negative.`
        );
        setIsSubmitting(false);
        return;
      }
    }

    // Calculate summary
    const summary = calculateSummary();
    const parsedReceivedAmount = parseFloat(invoiceData.receivedAmount) || 0;
    const invoicePendingAmount = summary.total - parsedReceivedAmount;

    // Build request object with dimension data
    const invoiceToSubmit = {
      invoiceDate: invoiceData.invoiceDate,
      dueDate: invoiceData.dueDate,
      poNumber: invoiceData.poNumber,
      customer_id: selectedCustomer.id,
      discount: invoiceData.discount,
      tax: invoiceData.tax,
      taxType: invoiceData.taxType,
      currency: invoiceData.currency,
      notes: invoiceData.notes,
      paymentTerms: invoiceData.paymentTerms,
      items: invoiceData.items.map((item) => ({
        item_id: item.item_id,
        name: item.name,
        dimension: item.dimension,
        original_dimension: item.original_dimension,
        category: item.category,
        unit: item.unit,
        quantity: item.quantity,
        selling_price: item.selling_price,
        subtotal: parseFloat(item.subtotal),
        isBulk: item.isBulk,
        custom_dimensions: item.custom_dimensions,
        total_cft: item.total_cft,
      })),
      paymentMethod: invoiceData.paymentMethod,
      receivedAmount: parsedReceivedAmount,
      invoicePendingAmount: invoicePendingAmount,
    };

    console.log("Invoice Data to Submit:", invoiceToSubmit);

    try {
      const response = await axios.post(
        "http://localhost:3000/api/invoices",
        invoiceToSubmit,
        {
          headers: getAuthHeader(),
        }
      );

      setLatestInvoiceNumber(response.data.invoiceNumber);
      // Prepend new invoice in "recent invoices"
      setRecentInvoices((prev) => [response.data, ...prev.slice(0, 19)]);
      addAlert(
        "success",
        `Invoice ${response.data.invoiceNumber} created successfully.`
      );

      // Reset form
      setInvoiceData({
        invoiceDate: "",
        dueDate: "",
        poNumber: "",
        to: { name: "", address: "", email: "", phone: "" },
        items: [
          {
            item_id: "",
            name: "",
            dimension: "",
            original_dimension: "",
            category: "",
            selling_price: 0,
            unit: "",
            quantity: 1,
            subtotal: 0,
            isBulk: false,
            custom_dimensions: [],
            total_cft: 0,
            dim_unit: "in",
          },
        ],
        discount: 0,
        tax: 0,
        taxType: "GST",
        currency: "₹",
        notes: "",
        paymentTerms: "",
        paymentMethod: "",
        receivedAmount: "",
        invoicePendingAmount: 0,
      });

      // Refresh stock
      const refreshedStock = await axios.get(
        "http://localhost:3000/api/items",
        {
          headers: getAuthHeader(),
        }
      );
      setItemsStock(refreshedStock.data);

      // Update latest invoice number
      const latestResponse = await axios.get(
        "http://localhost:3000/api/invoices/latest",
        {
          headers: getAuthHeader(),
        }
      );
      setLatestInvoiceNumber(latestResponse.data.invoiceNumber);
    } catch (error) {
      console.error("Error creating invoice:", error);
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        addAlert("danger", error.response.data.message);
      } else {
        addAlert("danger", "Failed to create invoice.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate PDF (unchanged logic, placeholder if needed)
  const generatePDF = () => {
    // ...
  };

  // Print (unchanged logic, placeholder if needed)
  const handlePrint = () => {
    // ...
  };

  // Summaries
  const summary = calculateSummary();

  // For react-select
  const customerOptions = customers.map((customer) => ({
    value: customer.id,
    label: customer.name,
  }));

  const itemOptions = itemsStock.map((item) => ({
    value: item.id,
    label: `${item.name} (${item.dimension})`,
    category: item.Category ? item.Category.name : "N/A",
    availableStock: item.quantity,
    unit: item.unit,
    isBulk: item.isBulk,
    isDisabled: item.quantity <= 0,
  }));

  const customSelectStyles = {
    menu: (provided) => ({
      ...provided,
      maxHeight: "200px",
      overflowY: "auto",
      width: "400px",
      zIndex: 9999,
      position: "absolute",
    }),
    menuPortal: (provided) => ({
      ...provided,
      zIndex: 9999,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "var(--color-secondary)"
        : state.isFocused
        ? "#e3f2fd"
        : "transparent",
      color: state.isSelected ? "#fff" : "#333",
      cursor: "pointer",
    }),
    control: (provided) => ({
      ...provided,
      minHeight: "38px",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#333",
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: "#333",
    }),
    indicatorSeparator: (provided) => ({
      ...provided,
      backgroundColor: "#ccc",
    }),
  };

  // Helper function to format dimensions nicely
  const formatDimensions = (dimensionStr, unit = "in") => {
    if (!dimensionStr || dimensionStr.trim() === "") return "No dimensions";

    // Clean up the dimension string and ensure proper format
    const dims = parseDimensions(dimensionStr);
    if (dims.length <= 0 || dims.width <= 0 || dims.height <= 0) {
      return dimensionStr; // Return original if we can't parse it properly
    }

    // Format as L × W × H with the appropriate unit
    return `${dims.length} × ${dims.width} × ${dims.height} ${unit}`;
  };

  // Generate a color for different unit types
  const getUnitColor = (unit, opacity = 1) => {
    // If no unit, return default gray
    if (!unit) return `rgba(107, 114, 128, ${opacity})`;

    // Simple hash function to generate consistent colors for the same unit
    let hash = 0;
    for (let i = 0; i < unit.length; i++) {
      hash = unit.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Generate hue based on hash (keeping in blue-green-purple range for aesthetic appeal)
    const hue = (Math.abs(hash) % 270) + 180; // 180-450 range (wraps around to 90)

    // Different saturations for different unit types
    let saturation = 70;
    let lightness = 45;

    if (unit.toUpperCase().includes("BAG")) {
      saturation = 80;
      lightness = 40;
    } else if (unit.toUpperCase().includes("BOX")) {
      saturation = 65;
      lightness = 50;
    } else if (unit.toUpperCase().includes("ROLL")) {
      saturation = 75;
      lightness = 35;
    }

    // Return as gradient
    return `linear-gradient(90deg, hsl(${hue}, ${saturation}%, ${lightness}%), hsl(${
      hue + 15
    }, ${saturation}%, ${lightness + 5}%))`;
  };

  // Calculate total pieces across all items (both regular and bulk items)
  const calculateTotalPieces = (custom_dimensions) => {
    if (!custom_dimensions || custom_dimensions.length === 0) return 0;

    return custom_dimensions.reduce((total, cut) => {
      return total + (parseInt(cut.pieces) || 0);
    }, 0);
  };

  // Calculate total quantity for all items (for the footer)
  const calculateTotalQuantity = (items) => {
    return items.reduce((total, item) => {
      // For bulk items with custom dimensions
      if (
        item.isBulk &&
        item.custom_dimensions &&
        item.custom_dimensions.length > 0
      ) {
        const bulkPieces = item.custom_dimensions.reduce((sum, cut) => {
          return sum + (parseInt(cut.pieces, 10) || 0);
        }, 0);
        return total + bulkPieces;
      }
      // For regular dimensioned or discrete items
      else {
        return total + (parseInt(item.quantity, 10) || 0);
      }
    }, 0);
  };

  // Calculate total volume for all items (for the footer)
  const calculateTotalVolume = (items) => {
    return items.reduce((total, item) => {
      // For bulk items or dimensioned items that track volume
      if (item.total_cft && !isNaN(item.total_cft)) {
        return total + parseFloat(item.total_cft);
      }
      // For items without explicit total_cft
      else if (!item.isBulk && item.dimension && item.quantity) {
        const dims = parseDimensions(item.dimension);
        const itemVolume = calculateVolume(
          dims.length,
          dims.width,
          dims.height,
          item.quantity,
          item.dim_unit || "in"
        );
        return total + itemVolume;
      }
      return total;
    }, 0);
  };

  // Calculate remaining CFT for a bulk item (for validation and disabling Add Cut button)
  const getRemainingCFT = (item) => {
    if (!item || !item.isBulk || !item.item_id) return 0;

    const availableStock = getAvailableStock(item.item_id);
    const totalUsed = item.total_cft || 0;

    // Return the difference, ensuring it's not negative
    return Math.max(availableStock.quantity - totalUsed, 0);
  };

  // Format unit name for better display
  const formatUnitDisplay = (unit) => {
    if (!unit) return "UNIT";

    // Convert to uppercase for consistency
    const upperUnit = unit.toUpperCase();

    // If it's already short (<=5 chars), use as is
    if (upperUnit.length <= 5) return upperUnit;

    // For longer units, check for common patterns
    if (upperUnit.includes("BAG")) return "BAG";
    if (upperUnit.includes("BOX")) return "BOX";
    if (upperUnit.includes("ROLL")) return "ROLL";
    if (upperUnit.includes("PIECE")) return "PCS";
    if (upperUnit.includes("PACK")) return "PACK";

    // If no pattern found, return the original but truncated if long
    return upperUnit.length > 8 ? upperUnit.substring(0, 7) + "..." : upperUnit;
  };

  let nextNumber;
  let newInvoiceNumber;

  if (!latestInvoiceNumber) {
    // If there are no invoices yet, create the first invoice number
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    newInvoiceNumber = `INV-${year}${month}-0001`;
  } else {
    nextNumber = parseInt(latestInvoiceNumber.split("-")[2], 10) + 1;
    nextNumber = nextNumber.toString().padStart(4, "0");
    newInvoiceNumber = `INV-${latestInvoiceNumber.split("-")[1]}-${nextNumber}`;
  }

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

  return (
    <div className="billing-page-wrapper">
      <Sidebar />
      <div className="billing-container">
        <div className="container">
          <h1 className="page-title">Billing Management</h1>

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

          {/* Invoice Form */}
          <form onSubmit={handleSubmit} className="invoice-form">
            {/* Invoice Header */}
            <div className="invoice-header">
              <div className="business-info">
                {companySettings.logoUrl ? (
                  <img
                    src={companySettings.logoUrl}
                    alt="Business Logo"
                    className="business-logo"
                  />
                ) : (
                  <img
                    src={logo}
                    alt="Business Logo"
                    className="business-logo"
                  />
                )}
                <div className="business-details">
                  <h2>{companySettings.companyName || "Your Company"}</h2>
                  <p>Quality Timber Suppliers</p>
                </div>
              </div>
              <div className="invoice-details">
                <h3>Invoice</h3>
                <p>
                  <strong>Number:</strong> {newInvoiceNumber}
                </p>
                <p>
                  <strong>Date:</strong>
                  <input
                    type="date"
                    name="invoiceDate"
                    value={invoiceData.invoiceDate}
                    onChange={handleInputChange}
                    required
                  />
                </p>
                <p>
                  <strong>Due Date:</strong>
                  <input
                    type="date"
                    name="dueDate"
                    value={invoiceData.dueDate}
                    onChange={handleInputChange}
                    required
                  />
                </p>
              </div>
            </div>

            <hr />

            {/* From and To Sections */}
            <div className="invoice-sections">
              <div className="section from-section">
                <h3>From:</h3>
                <p>
                  <strong>
                    {companySettings.companyName || "Your Company"}
                  </strong>
                </p>
                <p>{companySettings.companyAddress || "Company Address"}</p>
                <p>
                  Email: {companySettings.companyEmail || "company@example.com"}
                </p>
                <p>Phone: {companySettings.companyPhone || "Phone Number"}</p>
              </div>
              <div className="section to-section">
                <h3>To:</h3>
                <div className="select-container">
                  <strong>Customer:</strong>
                  <Select
                    options={customerOptions}
                    value={
                      selectedCustomer
                        ? {
                            value: selectedCustomer.id,
                            label: selectedCustomer.name,
                          }
                        : null
                    }
                    onChange={handleSelectCustomer}
                    placeholder="-- Select Customer --"
                    isClearable
                    classNamePrefix="react-select"
                    required
                    styles={customSelectStyles}
                    menuPortalTarget={document.body}
                  />
                </div>
                {selectedCustomer && (
                  <div className="customer-details">
                    <p>
                      <strong>Address:</strong> {selectedCustomer.address}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedCustomer.email}
                    </p>
                    <p>
                      <strong>Phone:</strong> {selectedCustomer.phone}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <hr />

            {/* Invoice Items */}
            <div className="invoice-items">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Size / Unit</th>
                    <th>Qty</th>
                    <th>Amount</th>
                    <th>Price / Unit</th>
                    <th>Subtotal (₹)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
              </table>

              <div
                className="invoice-items-scroll-container"
                ref={scrollContainerRef}
              >
                <table>
                  <tbody>
                    {invoiceData.items.map((item, index) => (
                      <React.Fragment key={index}>
                        {/* Main item row */}
                        <tr
                          className={
                            item.isBulk
                              ? "bulk-parent-row"
                              : item.itemType === "discrete"
                              ? "discrete-unit-item"
                              : ""
                          }
                        >
                          <td className="item-select-cell">
                            <Select
                              components={{ Option: CustomOption }}
                              options={itemOptions}
                              value={
                                item.item_id
                                  ? itemOptions.find(
                                      (option) => option.value === item.item_id
                                    )
                                  : null
                              }
                              onChange={(selectedOption) =>
                                handleItemSelection(selectedOption, index)
                              }
                              placeholder="-- Select Item --"
                              isClearable
                              classNamePrefix="react-select-item"
                              menuPortalTarget={document.body}
                              styles={customSelectStyles}
                              isOptionDisabled={(option) => option.isDisabled}
                              required
                            />
                            {item.category && (
                              <div className="item-category">
                                <span>Category: {item.category}</span>
                              </div>
                            )}
                            {item.isBulk && (
                              <div className="bulk-item-label">
                                <div className="bulk-stock-indicator">
                                  <FaList className="bulk-icon" />
                                  Available:{" "}
                                  {getAvailableStock(item.item_id).quantity} CFT
                                </div>
                                {item.custom_dimensions &&
                                  item.custom_dimensions.length > 0 && (
                                    <button
                                      type="button"
                                      className="cuts-toggle-btn"
                                      onClick={() =>
                                        toggleCutsVisibility(index)
                                      }
                                      title="Toggle cuts visibility"
                                    >
                                      {showCutsForItem[index] ? (
                                        <>
                                          <FaMinus /> Hide{" "}
                                          {item.custom_dimensions.length} cut
                                          {item.custom_dimensions.length !== 1
                                            ? "s"
                                            : ""}
                                        </>
                                      ) : (
                                        <>
                                          <FaPlus /> Show{" "}
                                          {item.custom_dimensions.length} cut
                                          {item.custom_dimensions.length !== 1
                                            ? "s"
                                            : ""}
                                        </>
                                      )}
                                    </button>
                                  )}
                              </div>
                            )}
                          </td>
                          <td>
                            {item.itemType === "bulk" ? (
                              item.custom_dimensions &&
                              item.custom_dimensions.length > 0 ? (
                                <div className="dimension-summary">
                                  Bulk wood that can be cut to custom dimensions
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="btn-add-first-cut"
                                  onClick={() => addCustomDimension(index)}
                                >
                                  <FaCut /> Add First Cut
                                </button>
                              )
                            ) : item.itemType === "dimensioned" ? (
                              <div className="dimension-display">
                                <div className="dimension-original">
                                  {formatDimensions(
                                    item.dimension,
                                    item.dim_unit
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="discrete-unit-display">
                                <div
                                  className="discrete-unit-badge"
                                  style={{
                                    background: getUnitColor(item.unit),
                                    boxShadow: `0 2px 4px ${getUnitColor(
                                      item.unit,
                                      0.3
                                    )}`,
                                  }}
                                >
                                  {formatUnitDisplay(item.unit)}
                                </div>
                              </div>
                            )}
                          </td>
                          <td>
                            {item.isBulk ? (
                              item.custom_dimensions &&
                              item.custom_dimensions.length > 0 ? (
                                <span className="piece-count">
                                  {calculateTotalPieces(item.custom_dimensions)}{" "}
                                  {item.unit || "PCS"}
                                </span>
                              ) : (
                                <span>-</span>
                              )
                            ) : (
                              <div className="quantity-wrapper">
                                <div className="quantity-control">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleQuantityDecrement(index)
                                    }
                                    className="quantity-btn decrement-btn"
                                    aria-label={`Decrease quantity for ${item.name}`}
                                  >
                                    <FaMinus />
                                  </button>
                                  <input
                                    type="number"
                                    name="quantity"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleInputChange(e, index, "quantity")
                                    }
                                    min="1"
                                    max={
                                      item.item_id
                                        ? getAvailableStock(item.item_id)
                                            .quantity
                                        : ""
                                    }
                                    required
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleQuantityIncrement(index)
                                    }
                                    className="quantity-btn increment-btn"
                                    aria-label={`Increase quantity for ${item.name}`}
                                  >
                                    <FaPlus />
                                  </button>
                                </div>
                                <span className="unit-label">
                                  {item.unit || "PCS"}
                                </span>
                              </div>
                            )}
                          </td>
                          <td>
                            {item.isBulk ? (
                              item.custom_dimensions &&
                              item.custom_dimensions.length > 0 ? (
                                <span className="volume-value">
                                  {item.total_cft.toFixed(2)} CFT
                                </span>
                              ) : (
                                <span>-</span>
                              )
                            ) : item.itemType === "dimensioned" ? (
                              <span className="volume-value">
                                {(item.total_cft || 0).toFixed(2)} CFT
                              </span>
                            ) : (
                              <span>-</span>
                            )}
                          </td>
                          <td>
                            <input
                              type="number"
                              name="selling_price"
                              value={item.selling_price}
                              onChange={(e) =>
                                handleInputChange(e, index, "selling_price")
                              }
                              step="0.01"
                              min="0"
                              required
                            />
                            <span className="rate-unit">
                              ₹/{item.unit || "PCS"}
                            </span>
                          </td>
                          <td>
                            <input
                              type="number"
                              name="subtotal"
                              value={item.subtotal}
                              onChange={(e) =>
                                handleInputChange(e, index, "subtotal")
                              }
                              step="0.01"
                              min="0"
                              required
                            />
                            <span className="currency-symbol">₹</span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                type="button"
                                className="btn-delete-item"
                                onClick={() => removeItem(index)}
                                title="Delete item"
                              >
                                <FaTrash />
                              </button>
                              {item.isBulk && (
                                <button
                                  type="button"
                                  className="btn-add-cut"
                                  onClick={() => addCustomDimension(index)}
                                  title="Add new cut"
                                  disabled={getRemainingCFT(item) <= 0}
                                >
                                  <FaPlus /> Cut
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Custom Cut Rows for Bulk Items */}
                        {item.isBulk &&
                          item.custom_dimensions &&
                          item.custom_dimensions.length > 0 &&
                          showCutsForItem[index] &&
                          item.custom_dimensions.map((cut, cutIndex) => (
                            <tr
                              key={`cut-${index}-${cutIndex}`}
                              className="custom-cut-row"
                            >
                              <td className="cut-label">
                                <div className="cut-indicator">
                                  <FaCut className="cut-icon" /> Cut #
                                  {cutIndex + 1}
                                </div>
                              </td>
                              <td>
                                <div className="cut-dimensions-inline">
                                  <div className="dimension-field-inline">
                                    <input
                                      type="number"
                                      value={cut.length}
                                      onChange={(e) =>
                                        handleCustomDimensionChange(
                                          index,
                                          cutIndex,
                                          "length",
                                          e.target.value
                                        )
                                      }
                                      min="0"
                                      step="0.01"
                                      placeholder="L (ft)"
                                    />
                                    ×
                                    <input
                                      type="number"
                                      value={cut.width}
                                      onChange={(e) =>
                                        handleCustomDimensionChange(
                                          index,
                                          cutIndex,
                                          "width",
                                          e.target.value
                                        )
                                      }
                                      min="0"
                                      step="0.01"
                                      placeholder="W (ft)"
                                    />
                                    ×
                                    <input
                                      type="number"
                                      value={cut.height}
                                      onChange={(e) =>
                                        handleCustomDimensionChange(
                                          index,
                                          cutIndex,
                                          "height",
                                          e.target.value
                                        )
                                      }
                                      min="0"
                                      step="0.01"
                                      placeholder="H (ft)"
                                    />
                                    <select
                                      value={item.dim_unit}
                                      onChange={(e) =>
                                        handleDimensionUnitChange(
                                          index,
                                          e.target.value
                                        )
                                      }
                                      className="dim-unit-select-inline"
                                    >
                                      {DIMENSION_UNITS.map((unit) => (
                                        <option
                                          key={unit.value}
                                          value={unit.value}
                                        >
                                          {unit.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="pieces-control-inline">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handlePiecesDecrement(index, cutIndex)
                                    }
                                    className="quantity-btn decrement-btn"
                                  >
                                    <FaMinus />
                                  </button>
                                  <input
                                    type="number"
                                    value={cut.pieces}
                                    onChange={(e) =>
                                      handleCustomDimensionChange(
                                        index,
                                        cutIndex,
                                        "pieces",
                                        e.target.value
                                      )
                                    }
                                    min="1"
                                    step="1"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handlePiecesIncrement(index, cutIndex)
                                    }
                                    className="quantity-btn increment-btn"
                                  >
                                    <FaPlus />
                                  </button>
                                </div>
                                <span className="cut-pieces-label">
                                  {item.unit || "PCS"}
                                </span>
                              </td>
                              <td>
                                {calculateVolume(
                                  cut.length,
                                  cut.width,
                                  cut.height,
                                  cut.pieces,
                                  item.dim_unit
                                ).toFixed(2)}{" "}
                                CFT
                              </td>
                              <td>
                                {item.selling_price} ₹/{item.unit || "PCS"}
                              </td>
                              <td>
                                {(
                                  calculateVolume(
                                    cut.length,
                                    cut.width,
                                    cut.height,
                                    cut.pieces,
                                    item.dim_unit
                                  ) * item.selling_price
                                ).toFixed(2)}{" "}
                                ₹
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn-remove-cut-inline"
                                  onClick={() =>
                                    removeCustomDimension(index, cutIndex)
                                  }
                                  title="Remove this cut"
                                >
                                  <FaTrash />
                                </button>
                              </td>
                            </tr>
                          ))}

                        {/* If it's a bulk item with cuts, add a subtotal row for this item */}
                        {item.isBulk &&
                          item.custom_dimensions &&
                          item.custom_dimensions.length > 0 &&
                          showCutsForItem[index] && (
                            <tr className="item-subtotal-row">
                              <td colSpan="2" className="item-subtotal-label">
                                Item Total
                              </td>
                              <td>
                                <strong>
                                  {calculateTotalPieces(item.custom_dimensions)}{" "}
                                  {item.unit || "PCS"}
                                </strong>
                              </td>
                              <td>
                                <strong>{item.total_cft.toFixed(2)} CFT</strong>
                              </td>
                              <td></td>
                              <td>
                                <strong>{item.subtotal.toFixed(2)} ₹</strong>
                              </td>
                              <td></td>
                            </tr>
                          )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              <table>
                <tfoot>
                  <tr className="add-item-row">
                    <td colSpan="7" className="add-item-cell">
                      <button
                        type="button"
                        className="btn-add-item-integrated"
                        onClick={addItem}
                      >
                        <FaPlus /> Add New Item
                      </button>
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Table Footer Summary */}
              <div className="invoice-table-footer">
                <div className="table-footer-cell item-cell"></div>
                <div className="table-footer-cell size-cell"></div>
                <div className="table-footer-cell qty-cell"></div>
                <div className="table-footer-cell amount-cell"></div>
                <div className="table-footer-cell price-cell"></div>
                <div className="table-footer-cell subtotal-cell">
                  <div className="footer-content">
                    <span className="footer-label">Subtotal</span>
                    <span className="footer-value">
                      {summary.subtotal.toFixed(2)} ₹
                    </span>
                  </div>
                </div>
                <div className="table-footer-cell action-cell"></div>
              </div>
            </div>

            {/* Replace the existing invoice-summary and invoice-notes sections with this structure */}
            <div className="invoice-bottom-section">
              {/* Left Column - Notes, Terms and Additional Details */}
              <div className="invoice-left-column">
                <div className="invoice-notes">
                  <div className="notes-section">
                    <label>Thank You Note:</label>
                    <textarea
                      name="notes"
                      value={invoiceData.notes}
                      onChange={handleInputChange}
                      placeholder="Thank you for your business!"
                    ></textarea>
                  </div>
                  <div className="payment-terms-section">
                    <label>Payment Terms:</label>
                    <textarea
                      name="paymentTerms"
                      value={invoiceData.paymentTerms}
                      onChange={handleInputChange}
                      placeholder="Payment due within 15 days."
                    ></textarea>
                  </div>
                </div>

                {/* Payment Details with UPI QR Code and Bank Details */}
                <div className="payment-details">
                  <h4>
                    <FaMoneyCheckAlt />
                    Payment Details
                  </h4>
                  <div className="payment-details-grid">
                    {/* QR Code Section */}
                    <div className="qr-code-section">
                      <div className="qr-code-container">
                        {paymentSettings.qrCodeUrl ? (
                          <img
                            src={paymentSettings.qrCodeUrl}
                            alt="QR Code"
                            width="100"
                            height="100"
                          />
                        ) : (
                          // Fallback SVG if no QR code is available
                          <svg width="100" height="100" viewBox="0 0 100 100">
                            <rect
                              width="30"
                              height="30"
                              x="10"
                              y="10"
                              fill="#000"
                            />
                            <rect
                              width="30"
                              height="30"
                              x="60"
                              y="10"
                              fill="#000"
                            />
                            <rect
                              width="30"
                              height="30"
                              x="10"
                              y="60"
                              fill="#000"
                            />
                            <rect
                              width="10"
                              height="10"
                              x="50"
                              y="30"
                              fill="#000"
                            />
                            <rect
                              width="10"
                              height="10"
                              x="30"
                              y="50"
                              fill="#000"
                            />
                            <rect
                              width="30"
                              height="10"
                              x="50"
                              y="50"
                              fill="#000"
                            />
                            <rect
                              width="10"
                              height="20"
                              x="50"
                              y="70"
                              fill="#000"
                            />
                            <rect
                              width="10"
                              height="10"
                              x="70"
                              y="60"
                              fill="#000"
                            />
                            <rect
                              width="10"
                              height="10"
                              x="80"
                              y="50"
                              fill="#000"
                            />
                            <rect
                              width="10"
                              height="10"
                              x="70"
                              y="80"
                              fill="#000"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="qr-code-label">Scan to pay via UPI</div>
                      <div className="qr-code-upi">
                        {paymentSettings.upiId || "upi@bank"}
                      </div>
                    </div>

                    {/* Bank Details Section */}
                    <div className="bank-details-section">
                      <div className="bank-details-list">
                        <div className="bank-detail-label">Account Name:</div>
                        <div className="bank-detail-value">
                          {paymentSettings.accountName || "Account Name"}
                          <button
                            className="copy-button"
                            title="Copy to clipboard"
                            onClick={() =>
                              copyToClipboard(paymentSettings.accountName)
                            }
                          >
                            <FaRegCopy size={12} /> Copy
                          </button>
                        </div>

                        <div className="bank-detail-label">Bank Name:</div>
                        <div className="bank-detail-value">
                          {paymentSettings.bankName || "Bank Name"}
                        </div>

                        <div className="bank-detail-label">Account No:</div>
                        <div className="bank-detail-value">
                          {paymentSettings.accountNumber || "Account Number"}
                          <button
                            className="copy-button"
                            title="Copy to clipboard"
                            onClick={() =>
                              copyToClipboard(paymentSettings.accountNumber)
                            }
                          >
                            <FaRegCopy size={12} /> Copy
                          </button>
                        </div>

                        <div className="bank-detail-label">IFSC Code:</div>
                        <div className="bank-detail-value">
                          {paymentSettings.ifscCode || "IFSC Code"}
                          <button
                            className="copy-button"
                            title="Copy to clipboard"
                            onClick={() =>
                              copyToClipboard(paymentSettings.ifscCode)
                            }
                          >
                            <FaRegCopy size={12} /> Copy
                          </button>
                        </div>

                        <div className="bank-detail-label">Branch:</div>
                        <div className="bank-detail-value">
                          {paymentSettings.branch || "Branch Name"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Payment Summary */}
              <div className="invoice-right-column">
                <div className="invoice-summary">
                  {/* Payment Method */}
                  <div className="summary-item payment-method-container">
                    <label>Payment:</label>
                    <div className="dropdown-with-icon">
                      <FaMoneyCheckAlt className="payment-method-icon" />
                      <select
                        name="paymentMethod"
                        value={invoiceData.paymentMethod || ""}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Payment Method</option>
                        <option value="Cash">Cash</option>
                        <option value="Bank">Bank</option>
                        <option value="Cheque">Cheque</option>
                        <option value="UPI">UPI</option>
                        <option value="Net Banking">Net Banking</option>
                      </select>
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className="summary-item">
                    <label>Subtotal:</label>
                    <span>
                      {summary.subtotal.toFixed(2)} {invoiceData.currency}
                    </span>
                  </div>

                  {/* Discount */}
                  <div className="summary-item">
                    <label>Discount:</label>
                    <div className="input-with-button">
                      <input
                        type="number"
                        name="discount"
                        value={invoiceData.discount}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                      <button
                        type="button"
                        onClick={handleDiscountIncrement}
                        className="quantity-btn increment-btn"
                        aria-label="Increase discount"
                      >
                        <FaPlus />
                      </button>
                    </div>
                  </div>

                  {/* Taxable Amount */}
                  <div className="summary-item">
                    <label>Taxable Amt:</label>
                    <span>
                      {(summary.subtotal - invoiceData.discount).toFixed(2)}{" "}
                      {invoiceData.currency}
                    </span>
                  </div>

                  {/* Tax Input with GST % */}
                  <div className="summary-item">
                    <label>Tax (GST %):</label>
                    <div className="input-with-button">
                      <input
                        type="number"
                        name="tax"
                        value={invoiceData.tax}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="0"
                      />
                      <button
                        type="button"
                        onClick={handleTaxIncrement}
                        className="quantity-btn increment-btn"
                        aria-label="Increase tax"
                      >
                        <FaPlus />
                      </button>
                    </div>
                  </div>

                  {/* Tax Breakdown Section */}
                  <div className="tax-breakdown">
                    <label>CGST @ {(invoiceData.tax / 2).toFixed(1)}%:</label>
                    <span>
                      {(
                        (summary.subtotal - invoiceData.discount) *
                        (invoiceData.tax / 200)
                      ).toFixed(2)}{" "}
                      {invoiceData.currency}
                    </span>
                  </div>
                  <div className="tax-breakdown">
                    <label>SGST @ {(invoiceData.tax / 2).toFixed(1)}%:</label>
                    <span>
                      {(
                        (summary.subtotal - invoiceData.discount) *
                        (invoiceData.tax / 200)
                      ).toFixed(2)}{" "}
                      {invoiceData.currency}
                    </span>
                  </div>

                  {/* Total Amount */}
                  <div className="summary-item total">
                    <label>Total:</label>
                    <span>
                      {summary.total.toFixed(2)} {invoiceData.currency}
                    </span>
                  </div>

                  {/* Received Amount */}
                  <div className="summary-item">
                    <label>Received:</label>
                    <div className="input-with-icon">
                      <FaRupeeSign className="rupee-icon" />
                      <input
                        type="number"
                        name="receivedAmount"
                        step="0.01"
                        min="0"
                        value={invoiceData.receivedAmount || ""}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        required
                        className="received-amount-input"
                      />
                    </div>
                  </div>

                  {/* Pending Amount */}
                  <div className="summary-item pending-amount">
                    <label>Pending:</label>
                    <span>
                      {(
                        summary.total -
                        (parseFloat(invoiceData.receivedAmount) || 0)
                      ).toFixed(2)}{" "}
                      {invoiceData.currency}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Actions */}
            <div className="invoice-actions">
              <button
                type="submit"
                className="btn-submit"
                disabled={isSubmitting}
              >
                <FaSave /> {isSubmitting ? "Saving..." : "Save Invoice"}
              </button>
            </div>
          </form>

          {/* Recent Invoices */}
          <div className="recent-invoices">
            <h2>Recent Invoices (Last 20)</h2>
            {recentInvoices.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Invoice Number</th>
                    <th>Date</th>
                    <th>Due Date</th>
                    <th>Total</th>
                    <th>Payment Method</th>
                    <th>Received Amount</th>
                    <th>Pending Amount</th>
                    <th>Customer</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((invoice) => {
                    const invoiceItems = invoice.InvoiceItems || [];
                    const total = invoiceItems.reduce(
                      (acc, item) => acc + (parseFloat(item.subtotal) || 0),
                      0
                    );
                    return (
                      <tr key={invoice.id}>
                        <td>{invoice.invoiceNumber}</td>
                        <td>{invoice.invoiceDate}</td>
                        <td>{invoice.dueDate}</td>
                        <td>{`${invoice.currency} ${total.toFixed(2)}`}</td>
                        <td>{invoice.paymentMethod || "N/A"}</td>
                        <td>
                          {invoice.receivedAmount !== undefined
                            ? `${
                                invoice.currency
                              } ${invoice.receivedAmount.toFixed(2)}`
                            : "N/A"}
                        </td>
                        <td>
                          {invoice.invoicePendingAmount !== undefined
                            ? `${
                                invoice.currency
                              } ${invoice.invoicePendingAmount.toFixed(2)}`
                            : "N/A"}
                        </td>
                        <td>
                          {invoice.Customer ? invoice.Customer.name : "N/A"}
                        </td>
                        <td>
                          <Link
                            to={`/fullinvoice/${invoice.id}`}
                            state={{ invoice }}
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p>No recent invoices found.</p>
            )}
          </div>

          {/* Printable Container */}
          <div className="printable-container">
            <div ref={invoiceRef} className="printable-invoice">
              {/* Hidden printable invoice markup if needed */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Billing;
