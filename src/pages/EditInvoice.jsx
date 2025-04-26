import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Select from 'react-select';
import CustomOption from '../components/CustomOption'; // Your custom item option (optional)
import './css/Billing.css'; // Re-use or create a new CSS file
import { FaTrash, FaPlus, FaMinus, FaSave } from 'react-icons/fa';
import logo from '../assets/logo.png';

function EditInvoice() {
  const { id } = useParams();      // Invoice ID from URL
  const navigate = useNavigate();

  // Existing invoice data
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // For selecting customers (if you allow changing the customer)
  const [customers, setCustomers] = useState([]);
  const [itemsStock, setItemsStock] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // Authentication header
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch invoice + related data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        // 1) Fetch existing invoice
        const invRes = await axios.get(`http://localhost:3000/api/invoices/${id}`, {
          headers: getAuthHeader(),
        });
        // 2) Fetch all customers (if needed)
        const custRes = await axios.get(`http://localhost:3000/api/customers`, {
          headers: getAuthHeader(),
        });
        // 3) Fetch all items
        const itemsRes = await axios.get(`http://localhost:3000/api/items`, {
          headers: getAuthHeader(),
        });

        setInvoiceData({
          ...invRes.data,
          // Transform invoice items to a shape similar to your "create" form
          items: invRes.data.InvoiceItems?.map((it) => ({
            item_id: it.item_id,
            name: it.name,
            category: it.category || '',       // or handle null
            dimension: it.dimension,
            selling_price: parseFloat(it.selling_price),
            unit: it.unit,
            quantity: it.quantity,
            subtotal: parseFloat(it.subtotal),
          })) || [],
        });
        setCustomers(custRes.data);
        setItemsStock(itemsRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.message || 'Error fetching invoice data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  // Utility to add an alert
  const addAlert = (type, message) => {
    const alertId = Date.now();
    setAlerts((prev) => [...prev, { id: alertId, type, message }]);
    setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    }, 5000);
  };

  // Handler for changing invoice fields
  const handleInvoiceChange = (e) => {
    setInvoiceData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Handler for changing invoice item fields
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...invoiceData.items];
    updatedItems[index][field] = value;

    // Recalculate subtotal if changing price or quantity
    if (field === 'selling_price' || field === 'quantity') {
      const price = parseFloat(updatedItems[index].selling_price) || 0;
      const qty = parseFloat(updatedItems[index].quantity) || 1;
      updatedItems[index].subtotal = parseFloat((price * qty).toFixed(2));
    }

    setInvoiceData((prev) => ({
      ...prev,
      items: updatedItems,
    }));
  };

  // Add a new item row
  const addItemRow = () => {
    setInvoiceData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          item_id: '',
          name: '',
          category: '',
          dimension: '',
          selling_price: 0,
          unit: '',
          quantity: 1,
          subtotal: 0,
        },
      ],
    }));
  };

  // Remove an item row
  const removeItemRow = (index) => {
    const updatedItems = invoiceData.items.filter((_, i) => i !== index);
    setInvoiceData((prev) => ({ ...prev, items: updatedItems }));
  };

  // Handle changing which item is selected from the dropdown
  const handleItemSelection = (selectedOption, index) => {
    if (!selectedOption) {
      // Clear item row if no selection
      handleItemChange(index, 'item_id', '');
      handleItemChange(index, 'name', '');
      handleItemChange(index, 'category', '');
      handleItemChange(index, 'dimension', '');
      handleItemChange(index, 'selling_price', 0);
      handleItemChange(index, 'unit', '');
      handleItemChange(index, 'subtotal', 0);
      return;
    }

    const stockItem = itemsStock.find((i) => i.id === selectedOption.value);
    if (stockItem) {
      handleItemChange(index, 'item_id', stockItem.id);
      handleItemChange(index, 'name', stockItem.name || '');
      handleItemChange(index, 'category', stockItem.Category ? stockItem.Category.name : '');
      handleItemChange(index, 'dimension', stockItem.dimension || '');
      handleItemChange(index, 'selling_price', parseFloat(stockItem.selling_price) || 0);
      handleItemChange(index, 'unit', stockItem.unit || '');
      handleItemChange(index, 'quantity', 1); // default to 1
      handleItemChange(index, 'subtotal', parseFloat(stockItem.selling_price) || 0);
    }
  };

  // Calculate summary
  const calculateSummary = () => {
    if (!invoiceData) return { subtotal: 0, discount: 0, tax: 0, total: 0 };
    const itemsSubtotal = invoiceData.items.reduce((acc, it) => acc + (parseFloat(it.subtotal) || 0), 0);
    const discountVal = parseFloat(invoiceData.discount) || 0;
    // If discount is stored as a float, you can also do: itemsSubtotal - discountVal
    // But if your discount is a "percentage," adjust logic. (Below code assumes discount is a fixed amount)
    const taxableAmount = itemsSubtotal - discountVal;
    const taxVal = parseFloat(invoiceData.tax) || 0;
    // If your `tax` is a percentage, do: (taxVal / 100) * taxableAmount
    // If your `tax` is a fixed amount, do: taxVal
    // Adapt to your existing logic. Let's assume it is a percentage as in your previous code:
    const taxAmount = (taxVal / 100) * taxableAmount;
    const total = taxableAmount + taxAmount;
    return {
      subtotal: itemsSubtotal,
      discount: discountVal,
      tax: taxAmount,
      total,
    };
  };

  // Handle form submission (PUT request)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!invoiceData) return;

    // Basic validations
    if (!invoiceData.customer_id) {
      addAlert('warning', 'Please select a customer.');
      return;
    }
    if (!invoiceData.items.length) {
      addAlert('warning', 'Please add at least one item.');
      return;
    }

    // Construct data to send
    // Make sure `customer_id` is correct. If you allow editing the customer, handle that.
    // If invoiceData.customer is an object, do invoiceData.customer.id or so.
    const payload = {
      invoiceDate: invoiceData.invoiceDate,
      dueDate: invoiceData.dueDate,
      discount: invoiceData.discount,
      tax: invoiceData.tax,
      taxType: invoiceData.taxType,
      currency: invoiceData.currency,
      notes: invoiceData.notes,
      paymentTerms: invoiceData.paymentTerms,
      customer_id: invoiceData.customer_id,
      items: invoiceData.items.map((i) => ({
        item_id: i.item_id,
        name: i.name,
        dimension: i.dimension,
        category: i.category,
        selling_price: i.selling_price,
        unit: i.unit,
        quantity: i.quantity,
        subtotal: i.subtotal,
      })),
    };

    try {
      await axios.put(`http://localhost:3000/api/invoices/${invoiceData.id}`, payload, {
        headers: getAuthHeader(),
      });
      addAlert('success', 'Invoice updated successfully!');
      // Redirect or do something else
      navigate(`/fullinvoice/${invoiceData.id}`);
    } catch (err) {
      console.error('Error updating invoice:', err);
      addAlert('danger', err.response?.data?.message || 'Failed to update invoice.');
    }
  };

  if (loading) {
    return (
      <div className="billing-page-wrapper">
        <Sidebar />
        <div className="billing-container">
          <p>Loading invoice data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="billing-page-wrapper">
        <Sidebar />
        <div className="billing-container">
          <p style={{ color: 'red' }}>{error}</p>
          <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  if (!invoiceData) {
    return (
      <div className="billing-page-wrapper">
        <Sidebar />
        <div className="billing-container">
          <p>Invoice not found.</p>
          <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  const summary = calculateSummary();

  // Prepare data for react-select (Customers, Items)
  const customerOptions = customers.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const itemOptions = itemsStock.map((it) => ({
    value: it.id,
    label: `${it.name} (${it.dimension})`,
    category: it.Category ? it.Category.name : 'N/A',
  }));

  // Find current customer in options (if you let user re-assign the invoice)
  const selectedCustomerOption = customerOptions.find((opt) => opt.value === invoiceData.customer_id);

  return (
    <div className="billing-page-wrapper">
      <Sidebar />
      <div className="billing-container">
        {/* Alerts */}
        <div className="alert-container">
          {alerts.map((alert) => (
            <div key={alert.id} className={`alert alert-${alert.type}`}>
              <span>{alert.message}</span>
            </div>
          ))}
        </div>

        <h1>Edit Invoice #{invoiceData.invoiceNumber}</h1>
        <form onSubmit={handleSubmit} className="invoice-form">

          {/* Invoice Header Info */}
          <div className="invoice-header">
            <div className="business-info">
              <img src={logo} alt="Logo" className="business-logo" />
              <div className="business-details">
                <h2>Himalayan Timber Traders</h2>
                <p>Quality Timber Suppliers</p>
              </div>
            </div>
            <div className="invoice-details">
              <h3>Invoice</h3>
              <p>
                <strong>Number:</strong> {invoiceData.invoiceNumber}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                <input
                  type="date"
                  name="invoiceDate"
                  value={invoiceData.invoiceDate || ''}
                  onChange={handleInvoiceChange}
                  required
                />
              </p>
              <p>
                <strong>Due Date:</strong>{" "}
                <input
                  type="date"
                  name="dueDate"
                  value={invoiceData.dueDate || ''}
                  onChange={handleInvoiceChange}
                  required
                />
              </p>
            </div>
          </div>

          <hr />

          {/* From / To Sections */}
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
                {/** If you do NOT want to change the customer, just display info:
                  <p>{invoiceData.Customer?.name} etc.
                */}
                <Select
                  options={customerOptions}
                  value={selectedCustomerOption || null}
                  onChange={(sel) =>
                    setInvoiceData((prev) => ({ ...prev, customer_id: sel?.value }))
                  }
                  placeholder="-- Select Customer --"
                  isClearable
                />
              </div>
              {/* Show existing data about the selected customer if you want */}
              {/* Alternatively, you can remove this or fetch details from the customers array */}
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
                  <th>Price (₹)</th>
                  <th>Unit</th>
                  <th>Quantity</th>
                  <th>Subtotal (₹)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.items.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <Select
                        components={{ Option: CustomOption }}
                        options={itemOptions}
                        value={
                          item.item_id
                            ? itemOptions.find((opt) => opt.value === item.item_id)
                            : null
                        }
                        onChange={(selected) => handleItemSelection(selected, index)}
                        placeholder="Select item"
                        isClearable
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="category"
                        value={item.category}
                        onChange={(e) =>
                          handleItemChange(index, 'category', e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="dimension"
                        value={item.dimension}
                        onChange={(e) =>
                          handleItemChange(index, 'dimension', e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="selling_price"
                        value={item.selling_price}
                        onChange={(e) =>
                          handleItemChange(index, 'selling_price', parseFloat(e.target.value) || 0)
                        }
                        step="0.01"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="unit"
                        value={item.unit}
                        onChange={(e) =>
                          handleItemChange(index, 'unit', e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <div className="quantity-control">
                        <button
                          type="button"
                          onClick={() =>
                            handleItemChange(index, 'quantity', Math.max(item.quantity - 1, 1))
                          }
                          className="quantity-btn"
                        >
                          <FaMinus />
                        </button>
                        <input
                          type="number"
                          name="quantity"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(index, 'quantity', parseFloat(e.target.value) || 1)
                          }
                          min="1"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleItemChange(index, 'quantity', item.quantity + 1)
                          }
                          className="quantity-btn"
                        >
                          <FaPlus />
                        </button>
                      </div>
                    </td>
                    <td>
                      <input
                        type="number"
                        name="subtotal"
                        value={item.subtotal}
                        onChange={(e) =>
                          handleItemChange(index, 'subtotal', parseFloat(e.target.value) || 0)
                        }
                        step="0.01"
                        readOnly
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-delete-item"
                        onClick={() => removeItemRow(index)}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" className="btn-add-item" onClick={addItemRow}>
              <FaPlus /> Add Item
            </button>
          </div>

          {/* Summary */}
          <div className="invoice-summary">
            <div className="summary-item">
              <label>Subtotal:</label>
              <span>₹{summary.subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-item">
              <label>Discount:</label>
              <input
                type="number"
                name="discount"
                value={invoiceData.discount || 0}
                onChange={handleInvoiceChange}
                step="0.01"
              />
            </div>
            <div className="summary-item">
              <label>Tax (%):</label>
              <input
                type="number"
                name="tax"
                value={invoiceData.tax || 0}
                onChange={handleInvoiceChange}
                step="0.01"
              />
            </div>
            <div className="summary-item total">
              <label>Total:</label>
              <span>₹{summary.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Notes & Payment Terms */}
          <div className="invoice-notes">
            <label>Notes:</label>
            <textarea
              name="notes"
              value={invoiceData.notes || ''}
              onChange={handleInvoiceChange}
            />
            <label>Payment Terms:</label>
            <textarea
              name="paymentTerms"
              value={invoiceData.paymentTerms || ''}
              onChange={handleInvoiceChange}
            />
          </div>

          {/* Submit */}
          <div className="invoice-actions">
            <button type="submit" className="btn-submit">
              <FaSave /> Save Changes
            </button>
            <button type="button" className="btn-back" onClick={() => navigate(-1)}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditInvoice;
