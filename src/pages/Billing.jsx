import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import './css/Billing.css'; // Ensure this is the updated CSS file below
import Select from 'react-select';
import CustomOption from '../components/CustomOption';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { 
  FaTrash, 
  FaPlus, 
  FaMinus, 
  FaSave,
  // Added these two icons for your styling
  FaMoneyCheckAlt,
  FaRupeeSign
} from 'react-icons/fa';
import logo from '../assets/logo.png';

function Billing() {
  // State Management
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [itemsStock, setItemsStock] = useState([]);
  const [latestInvoiceNumber, setLatestInvoiceNumber] = useState(null);

  // We add two new fields: paymentMethod & receivedAmount
  const [invoiceData, setInvoiceData] = useState({
    invoiceDate: '',
    dueDate: '',
    poNumber: '',
    to: { name: '', address: '', email: '', phone: '' },
    items: [
      { item_id: '', name: '', dimension: '', category: '', selling_price: 0, unit: '', quantity: 1, subtotal: 0 }
    ],
    discount: 0,
    tax: 0,
    taxType: 'GST',
    currency: '₹',
    notes: '',
    paymentTerms: '',

    // New fields
    paymentMethod: '',  // e.g. 'Cash', 'Bank', 'Cheque', 'UPI', 'Net Banking'
    receivedAmount: ''  // numeric input from user
  });

  const [alerts, setAlerts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const invoiceRef = useRef();

  // Authentication Header
  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Alerts
  const addAlert = (type, message) => {
    const id = Date.now();
    setAlerts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== id));
    }, 5000);
  };

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/customers', {
          headers: getAuthHeader(),
        });
        setCustomers(response.data);
      } catch (error) {
        console.error('Error fetching customers:', error);
        addAlert('danger', 'Failed to fetch customers.');
      }
    };
    fetchCustomers();
  }, []);

  // Fetch stock items
  useEffect(() => {
    const fetchStockItems = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/items', {
          headers: getAuthHeader(),
        });
        setItemsStock(response.data);
      } catch (error) {
        console.error('Error fetching stock items:', error);
        addAlert('danger', 'Failed to fetch stock items.');
      }
    };
    fetchStockItems();
  }, []);

  // Fetch latest invoice number
  useEffect(() => {
    const fetchLatestInvoiceNumber = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/invoices/latest', {
          headers: getAuthHeader(),
        });
        setLatestInvoiceNumber(response.data.invoiceNumber);
      } catch (error) {
        console.error('Error fetching latest invoice number:', error);
        addAlert('danger', 'Failed to fetch latest invoice number.');
      }
    };
    fetchLatestInvoiceNumber();
  }, []);

  // Default invoice date = today
  useEffect(() => {
    if (!invoiceData.invoiceDate) {
      const today = new Date().toISOString().split('T')[0];
      setInvoiceData(prev => ({ ...prev, invoiceDate: today }));
    }
  }, [invoiceData.invoiceDate]);

  // Automatically set due date 10 days ahead
  useEffect(() => {
    if (invoiceData.invoiceDate) {
      const date = new Date(invoiceData.invoiceDate);
      date.setDate(date.getDate() + 10);
      const due = date.toISOString().split('T')[0];
      setInvoiceData(prev => ({ ...prev, dueDate: due }));
    }
  }, [invoiceData.invoiceDate]);

  // Fetch last 20 invoices
  useEffect(() => {
    const fetchRecentInvoices = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/invoices?limit=20', {
          headers: getAuthHeader(),
        });
        setRecentInvoices(response.data);
      } catch (error) {
        console.error('Error fetching recent invoices:', error);
        addAlert('danger', 'Failed to fetch recent invoices.');
      }
    };
    fetchRecentInvoices();
  }, []);

  // Select a customer
  const handleSelectCustomer = (selectedOption) => {
    const customerId = selectedOption ? selectedOption.value : '';
    const customer = customers.find(c => String(c.id) === String(customerId));
    setSelectedCustomer(customer || null);
    if (customer) {
      setInvoiceData(prev => ({
        ...prev,
        to: {
          name: customer.name,
          address: customer.address,
          email: customer.email,
          phone: customer.phone
        }
      }));
    } else {
      setInvoiceData(prev => ({
        ...prev,
        to: { name: '', address: '', email: '', phone: '' }
      }));
    }
  };

  // Stock helper
  const getAvailableStock = (item_id) => {
    const stockItem = itemsStock.find(item => item.id === item_id);
    return stockItem ? stockItem.quantity : 0;
  };

  // Handle changes
  const handleInputChange = (e, index = null, field = null) => {
    const { name, value } = e.target;
    if (index !== null && field) {
      const updatedItems = [...invoiceData.items];
      if (name === 'subtotal') {
        const parsedValue = parseFloat(value);
        updatedItems[index][name] = !isNaN(parsedValue) ? parsedValue : 0;
      } else {
        updatedItems[index][name] = value;
      }

      if (name === 'selling_price' || name === 'quantity') {
        const sellingPrice = parseFloat(updatedItems[index].selling_price);
        const quantity = parseInt(updatedItems[index].quantity, 10);
        if (!isNaN(sellingPrice) && !isNaN(quantity)) {
          updatedItems[index].subtotal = parseFloat((sellingPrice * quantity).toFixed(2));
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

  // Increment/Decrement quantity
  const handleQuantityIncrement = (index) => {
    const items = [...invoiceData.items];
    let currentQty = parseInt(items[index].quantity, 10) || 0;
    const available = getAvailableStock(items[index].item_id);
    if (currentQty < available) {
      currentQty++;
      items[index].quantity = currentQty;
      const sp = parseFloat(items[index].selling_price) || 0;
      items[index].subtotal = parseFloat((sp * currentQty).toFixed(2));
      setInvoiceData({ ...invoiceData, items });
    } else {
      addAlert('warning', `Cannot exceed available stock (${available}) for "${items[index].name}".`);
    }
  };

  const handleQuantityDecrement = (index) => {
    const items = [...invoiceData.items];
    let currentQty = parseInt(items[index].quantity, 10) || 0;
    if (currentQty > 1) {
      currentQty--;
      items[index].quantity = currentQty;
      const sp = parseFloat(items[index].selling_price) || 0;
      items[index].subtotal = parseFloat((sp * currentQty).toFixed(2));
      setInvoiceData({ ...invoiceData, items });
    } else {
      addAlert('warning', `Quantity for "${items[index].name}" cannot be less than 1.`);
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
    setInvoiceData(prev => ({
      ...prev,
      items: [...prev.items, { item_id: '', name: '', dimension: '', category: '', selling_price: 0, unit: '', quantity: 1, subtotal: 0 }]
    }));
  };

  const removeItem = (index) => {
    const updatedItems = invoiceData.items.filter((_, i) => i !== index);
    setInvoiceData(prev => ({ ...prev, items: updatedItems }));
  };

  // Handle item select
  const handleItemSelection = (selectedOption, index) => {
    const itemId = selectedOption ? selectedOption.value : '';
    const selectedItem = itemsStock.find(item => String(item.id) === String(itemId));
    const updatedItems = [...invoiceData.items];
    if (selectedItem) {
      updatedItems[index] = {
        ...updatedItems[index],
        item_id: selectedItem.id,
        name: selectedItem.name,
        dimension: selectedItem.dimension,
        category: selectedItem.Category ? selectedItem.Category.name : 'N/A',
        selling_price: selectedItem.selling_price,
        unit: selectedItem.unit || '',
        quantity: Math.min(updatedItems[index].quantity || 1, selectedItem.quantity),
        subtotal: parseFloat((selectedItem.selling_price * (updatedItems[index].quantity || 1)).toFixed(2)),
      };
    } else {
      updatedItems[index] = {
        ...updatedItems[index],
        item_id: '',
        name: '',
        dimension: '',
        category: '',
        selling_price: 0,
        unit: '',
        subtotal: 0,
        quantity: 1,
      };
    }
    setInvoiceData({ ...invoiceData, items: updatedItems });
  };

  // Calculate summary
  const calculateSummary = () => {
    const subtotal = invoiceData.items.reduce((acc, item) => acc + (parseFloat(item.subtotal) || 0), 0);
    const discount = parseFloat(invoiceData.discount) || 0;
    const taxableAmount = subtotal - discount;
    const tax = ((parseFloat(invoiceData.tax) || 0) / 100) * taxableAmount;
    const total = taxableAmount + tax;
    return { subtotal, discount, tax, total };
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // BASIC VALIDATIONS
    if (!selectedCustomer) {
      addAlert('warning', 'Please select a customer.');
      setIsSubmitting(false);
      return;
    }

    if (!invoiceData.paymentMethod) {
      addAlert('warning', 'Payment Method is required.');
      setIsSubmitting(false);
      return;
    }

    if (!invoiceData.receivedAmount || parseFloat(invoiceData.receivedAmount) < 0) {
      addAlert('warning', 'Received Amount is required (cannot be negative).');
      setIsSubmitting(false);
      return;
    }

    // Validate each item
    for (let i = 0; i < invoiceData.items.length; i++) {
      const item = invoiceData.items[i];
      if (!item.item_id) {
        addAlert('warning', `Please select an item for row ${i + 1}.`);
        setIsSubmitting(false);
        return;
      }
      if (item.quantity < 1) {
        addAlert('warning', `Quantity for item "${item.name}" must be at least 1.`);
        setIsSubmitting(false);
        return;
      }
      const availableStock = getAvailableStock(item.item_id);
      if (item.quantity > availableStock) {
        addAlert('warning', `Quantity for item "${item.name}" exceeds available stock (${availableStock}).`);
        setIsSubmitting(false);
        return;
      }
      if (item.selling_price < 0) {
        addAlert('warning', `Selling Price for item "${item.name}" cannot be negative.`);
        setIsSubmitting(false);
        return;
      }
      if (item.subtotal < 0) {
        addAlert('warning', `Subtotal for item "${item.name}" cannot be negative.`);
        setIsSubmitting(false);
        return;
      }
    }

    // Build request object
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
      items: invoiceData.items.map(item => ({
        item_id: item.item_id,
        name: item.name,
        dimension: item.dimension,
        category: item.category,
        unit: item.unit,
        quantity: item.quantity,
        selling_price: item.selling_price,
        subtotal: parseFloat(item.subtotal),
      })),
      paymentMethod: invoiceData.paymentMethod,
      receivedAmount: parseFloat(invoiceData.receivedAmount) || 0
    };

    console.log('Invoice Data to Submit:', invoiceToSubmit);

    try {
      const response = await axios.post('http://localhost:3000/api/invoices', invoiceToSubmit, {
        headers: getAuthHeader(),
      });

      setLatestInvoiceNumber(response.data.invoiceNumber);
      // Prepend new invoice in "recent invoices"
      setRecentInvoices(prev => [response.data, ...prev.slice(0, 19)]);
      addAlert('success', `Invoice ${response.data.invoiceNumber} created successfully.`);

      // Reset form
      setInvoiceData({
        invoiceDate: '',
        dueDate: '',
        poNumber: '',
        to: { name: '', address: '', email: '', phone: '' },
        items: [
          { item_id: '', name: '', dimension: '', category: '', selling_price: 0, unit: '', quantity: 1, subtotal: 0 }
        ],
        discount: 0,
        tax: 0,
        taxType: 'GST',
        currency: '₹',
        notes: '',
        paymentTerms: '',
        paymentMethod: '',
        receivedAmount: ''
      });

      // Refresh stock
      const refreshedStock = await axios.get('http://localhost:3000/api/items', {
        headers: getAuthHeader(),
      });
      setItemsStock(refreshedStock.data);

      // Update latest invoice number
      const latestResponse = await axios.get('http://localhost:3000/api/invoices/latest', {
        headers: getAuthHeader(),
      });
      setLatestInvoiceNumber(latestResponse.data.invoiceNumber);

    } catch (error) {
      console.error('Error creating invoice:', error);
      if (error.response && error.response.data && error.response.data.message) {
        addAlert('danger', error.response.data.message);
      } else {
        addAlert('danger', 'Failed to create invoice.');
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
  const customerOptions = customers.map(customer => ({
    value: customer.id,
    label: customer.name,
  }));

  const itemOptions = itemsStock.map(item => ({
    value: item.id,
    label: `${item.name} (${item.dimension})`,
    category: item.Category ? item.Category.name : 'N/A',
    availableStock: item.quantity,
    unit: item.unit,
    isDisabled: item.quantity <= 0,
  }));

  const customSelectStyles = {
    menu: (provided) => ({
      ...provided,
      maxHeight: '200px',
      overflowY: 'auto',
      width: '400px',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? 'var(--color-secondary)'
        : state.isFocused
          ? '#e3f2fd'
          : 'transparent',
      color: state.isSelected ? '#fff' : '#333',
      cursor: 'pointer',
    }),
    control: (provided) => ({
      ...provided,
      minHeight: '38px',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#333',
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: '#333',
    }),
    indicatorSeparator: (provided) => ({
      ...provided,
      backgroundColor: '#ccc',
    }),
  };

  return (
    <div className="billing-page-wrapper">
      <Sidebar />
      <div className="billing-container">
        <div className="container">
          <h1 className="page-title">Billing Management</h1>

          {/* Alerts */}
          <div className="alert-container">
            {alerts.map(alert => (
              <div key={alert.id} className={`alert alert-${alert.type}`}>
                <span>{alert.message}</span>
                <button
                  className="close-btn"
                  onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
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
                <img src={logo} alt="Business Logo" className="business-logo" />
                <div className="business-details">
                  <h2>Himalayan Timber Traders</h2>
                  <p>Quality Timber Suppliers</p>
                </div>
              </div>
              <div className="invoice-details">
                <h3>Invoice</h3>
                <p>
                  <strong>Number:</strong>{' '}
                  {latestInvoiceNumber ? incrementInvoiceNumber(latestInvoiceNumber) : 'Fetching...'}
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
                <p><strong>Himalayan Timber Traders</strong></p>
                <p>456 Timber Lane, Kathmandu, Nepal</p>
                <p>Email: contact@himalyantimbertraders.com</p>
                <p>Phone: +977-1-2345678</p>
              </div>
              <div className="section to-section">
                <h3>To:</h3>
                <div className="select-container">
                  <strong>Customer:</strong>
                  <Select
                    options={customerOptions}
                    value={selectedCustomer ? { value: selectedCustomer.id, label: selectedCustomer.name } : null}
                    onChange={handleSelectCustomer}
                    placeholder="-- Select Customer --"
                    isClearable
                    classNamePrefix="react-select"
                    required
                    styles={customSelectStyles}
                  />
                </div>
                {selectedCustomer && (
                  <div className="customer-details">
                    <p><strong>Address:</strong> {selectedCustomer.address}</p>
                    <p><strong>Email:</strong> {selectedCustomer.email}</p>
                    <p><strong>Phone:</strong> {selectedCustomer.phone}</p>
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
                    <th>Category</th>
                    <th>Dimension</th>
                    <th>Selling Price (₹)</th>
                    <th>Unit</th>
                    <th>Quantity</th>
                    <th>Subtotal (₹)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.items.map((item, index) => (
                    <tr key={index}>
                      <td className="item-select-cell">
                        <Select
                          components={{ Option: CustomOption }}
                          options={itemOptions}
                          value={
                            item.item_id
                              ? itemOptions.find(option => option.value === item.item_id)
                              : null
                          }
                          onChange={(selectedOption) => handleItemSelection(selectedOption, index)}
                          placeholder="-- Select Item --"
                          isClearable
                          classNamePrefix="react-select-item"
                          menuPortalTarget={document.body}
                          styles={customSelectStyles}
                          isOptionDisabled={(option) => option.isDisabled}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          name="category"
                          value={item.category}
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          name="dimension"
                          value={item.dimension}
                          onChange={(e) => handleInputChange(e, index, 'dimension')}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          name="selling_price"
                          value={item.selling_price}
                          onChange={(e) => handleInputChange(e, index, 'selling_price')}
                          step="0.01"
                          min="0"
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          name="unit"
                          value={item.unit}
                          readOnly
                        />
                      </td>
                      <td>
                        <div className="quantity-control">
                          <button
                            type="button"
                            onClick={() => handleQuantityDecrement(index)}
                            className="quantity-btn decrement-btn"
                            aria-label={`Decrease quantity for ${item.name}`}
                          >
                            <FaMinus />
                          </button>
                          <input
                            type="number"
                            name="quantity"
                            value={item.quantity}
                            onChange={(e) => handleInputChange(e, index, 'quantity')}
                            min="1"
                            max={item.item_id ? getAvailableStock(item.item_id) : ''}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => handleQuantityIncrement(index)}
                            className="quantity-btn increment-btn"
                            aria-label={`Increase quantity for ${item.name}`}
                          >
                            <FaPlus />
                          </button>
                        </div>
                        {item.item_id && (
                          <small className="quantity-info">
                            Available: {getAvailableStock(item.item_id)} {item.unit}
                          </small>
                        )}
                      </td>
                      <td>
                        <input
                          type="number"
                          name="subtotal"
                          value={item.subtotal}
                          onChange={(e) => handleInputChange(e, index, 'subtotal')}
                          step="0.01"
                          min="0"
                          required
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-delete-item"
                          onClick={() => removeItem(index)}
                        >
                          <FaTrash /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="button" className="btn-add-item" onClick={addItem}>
                <FaPlus /> Add Item
              </button>
            </div>

            {/* Invoice Summary */}
            <div className="invoice-summary">
              <div className="summary-item">
                <label>Subtotal:</label>
                <span>{summary.subtotal.toFixed(2)} {invoiceData.currency}</span>
              </div>

              {/* Payment Method (wrapped in a container for the icon) */}
              <div className="summary-item payment-method-container">
                <label>Payment Method:</label>
                <div className="dropdown-with-icon">
                  <FaMoneyCheckAlt className="payment-method-icon" />
                  <select
                    name="paymentMethod"
                    value={invoiceData.paymentMethod || ''}
                    onChange={handleInputChange}
                    required
                    className="payment-method-select"
                  >
                    <option value="">-- Select --</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank</option>
                    <option value="Cheque">Cheque</option>
                    <option value="UPI">UPI</option>
                    <option value="Net Banking">Net Banking</option>
                  </select>
                </div>
              </div>

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
                </div> {invoiceData.currency}
              </div>
              <div className="summary-item">
                <label>Tax ({invoiceData.taxType} %):</label>
                <div className="input-with-button">
                  <input
                    type="number"
                    name="tax"
                    value={invoiceData.tax}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                  <button
                    type="button"
                    onClick={handleTaxIncrement}
                    className="quantity-btn increment-btn"
                    aria-label="Increase tax"
                  >
                    <FaPlus />
                  </button>
                </div> {invoiceData.currency}
              </div>
              <div className="summary-item total">
                <label>Total:</label>
                <span>{summary.total.toFixed(2)} {invoiceData.currency}</span>
              </div>

              {/* Received Amount (wrapped in a container for the icon) */}
              <div className="summary-item received-amount-container">
                <label>Received Amount:</label>
                <div className="input-with-icon">
                  <FaRupeeSign className="rupee-icon" />
                  <input
                    type="number"
                    name="receivedAmount"
                    step="0.01"
                    min="0"
                    value={invoiceData.receivedAmount || ''}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    required
                    className="received-amount-input"
                  />
                </div>
              </div>
            </div>

            {/* Invoice Notes */}
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

            {/* Invoice Actions */}
            <div className="invoice-actions">
              <button type="submit" className="btn-submit" disabled={isSubmitting}>
                <FaSave /> {isSubmitting ? 'Saving...' : 'Save Invoice'}
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
                        <td>{invoice.paymentMethod || 'N/A'}</td>
                        <td>{invoice.receivedAmount !== undefined ? invoice.receivedAmount : 'N/A'}</td>
                        <td>{invoice.Customer ? invoice.Customer.name : 'N/A'}</td>
                        <td>
                          <Link to={`/fullinvoice/${invoice.id}`} state={{ invoice }}>
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

      {/* Alerts container (layered) */}
      <div className="alert-container">
        {alerts.map(alert => (
          <div key={alert.id} className={`alert alert-${alert.type}`} data-icon="">
            <span>{alert.message}</span>
            <button
              className="close-btn"
              onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper function to increment the invoice number
const incrementInvoiceNumber = (currentNumber) => {
  const parts = currentNumber.split('-');
  if (parts.length !== 3) return 'INV-YYYYMM-XXXX';
  let prefix = parts[0];
  let datePart = parts[1];
  let numberPart = parts[2];
  let nextNumber = parseInt(numberPart, 10) + 1;
  nextNumber = nextNumber.toString().padStart(4, '0');
  return `${prefix}-${datePart}-${nextNumber}`;
};

export default Billing;
