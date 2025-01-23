// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import './css/HomePage.css';

/* ===== Recharts Imports ===== */
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer,
  LineChart, Line,
  PieChart, Pie, Cell,
  RadialBarChart, RadialBar, PolarAngleAxis
} from 'recharts';

function HomePage() {
  // Main data states
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);

  // UI/loading/error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Helper for auth header
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError('');
    try {
      const [itemsRes, categoriesRes, invoicesRes, customersRes] = await Promise.all([
        axios.get('http://localhost:3000/api/items', { headers: getAuthHeader() }),
        axios.get('http://localhost:3000/api/categories', { headers: getAuthHeader() }),
        axios.get('http://localhost:3000/api/invoices', { headers: getAuthHeader() }),
        axios.get('http://localhost:3000/api/customers', { headers: getAuthHeader() }),
      ]);
      setItems(itemsRes.data);
      setCategories(categoriesRes.data);
      setInvoices(invoicesRes.data);
      setCustomers(customersRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  /* =======================
      SUMMARY STATS
  ======================= */
  const totalStock = items.reduce((acc, item) => acc + (item.quantity || 0), 0);
  const totalCategories = categories.length;
  const totalInvoices = invoices.length;
  const totalCustomers = customers.length;

  let totalInvoiceAmount = 0;
  invoices.forEach(inv => {
    if (inv.InvoiceItems?.length) {
      const invoiceSum = inv.InvoiceItems.reduce(
        (sum, it) => sum + (it.subtotal || 0),
        0
      );
      totalInvoiceAmount += invoiceSum;
    }
  });

  /* =======================
    RECENT 5 INVOICES
  ======================= */
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate))
    .slice(0, 5);

  /* =======================
    RECENT 5 CUSTOMERS
  ======================= */
  const recentCustomers = [...customers]
    .sort((a, b) => b.id - a.id)
    .slice(0, 5);

  /* =======================
    LOW-STOCK ITEMS
  ======================= */
  const lowStockItems = [...items]
    .sort((a, b) => (a.quantity || 0) - (b.quantity || 0))
    .slice(0, 5);

  /* =======================
    NEW ARRIVALS (assuming item.createdAt exists)
  ======================= */
  const newArrivals = [...items]
    .filter((it) => it.createdAt)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  /* =======================
    1) BAR CHART: Stock by Category
  ======================= */
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));
  const itemsByCategory = {};
  items.forEach(item => {
    const catId = item.category_id;
    if (!itemsByCategory[catId]) itemsByCategory[catId] = 0;
    itemsByCategory[catId] += (item.quantity || 0);
  });
  const barChartData = Object.entries(itemsByCategory).map(([catId, qty]) => ({
    category: categoryMap.get(Number(catId)) || `Cat#${catId}`,
    quantity: qty
  }));

  /* =======================
    2) LINE CHART: Invoices by Month
  ======================= */
  function formatMonthYear(date) {
    return `${date.getMonth() + 1}/${date.getFullYear()}`; // "7/2023"
  }
  const invoiceByMonthMap = {};
  invoices.forEach(inv => {
    if (!inv.invoiceDate) return;
    const d = new Date(inv.invoiceDate);
    const key = formatMonthYear(d);
    let invSum = 0;
    if (inv.InvoiceItems?.length) {
      invSum = inv.InvoiceItems.reduce((sum, it) => sum + (it.subtotal || 0), 0);
    }
    invoiceByMonthMap[key] = (invoiceByMonthMap[key] || 0) + invSum;
  });
  const lineChartData = Object.keys(invoiceByMonthMap)
    .sort((a, b) => {
      // parse "M/YYYY" => date
      const [aM, aY] = a.split('/');
      const [bM, bY] = b.split('/');
      return new Date(Number(aY), Number(aM) - 1) - new Date(Number(bY), Number(bM) - 1);
    })
    .map(monthStr => ({
      month: monthStr,
      total: invoiceByMonthMap[monthStr]
    }));

  /* =======================
    3) PIE CHART: Top 5 Customers by Invoice Amount
  ======================= */
  // We'll sum invoice totals by customer
  const customerTotalsMap = {};
  invoices.forEach(inv => {
    const custId = inv.customer_id;
    if (!custId) return;
    let invSum = 0;
    if (inv.InvoiceItems?.length) {
      invSum = inv.InvoiceItems.reduce((sum, it) => sum + (it.subtotal || 0), 0);
    }
    customerTotalsMap[custId] = (customerTotalsMap[custId] || 0) + invSum;
  });

  // Convert to array { name, total } and link to Customer name
  const customerMap = new Map(customers.map(c => [c.id, c.name]));
  let pieData = Object.keys(customerTotalsMap).map((custId) => ({
    id: Number(custId),
    name: customerMap.get(Number(custId)) || `Cust#${custId}`,
    total: customerTotalsMap[custId]
  }));
  // Sort descending
  pieData.sort((a, b) => b.total - a.total);
  // Take top 5
  pieData = pieData.slice(0, 5);

  // Some example colors for the pie slices:
  const pieColors = ['#ff6384', '#36a2eb', '#ffcd56', '#4bc0c0', '#9966ff'];

  /* =======================
    4) RADIAL BAR CHART: Item Type Distribution
  ======================= */
  // We'll group items by "type" (assuming item.type is a string).
  const typeMap = {};
  items.forEach(item => {
    const t = item.type || 'Unknown';
    typeMap[t] = (typeMap[t] || 0) + (item.quantity || 0);
  });
  // Convert to array for radial bar usage
  const radialData = Object.entries(typeMap).map(([type, qty]) => ({
    name: type,
    value: qty
  }));
  // Sort descending
  radialData.sort((a, b) => b.value - a.value);

  // We can limit to top ~5 if needed
  // radialData = radialData.slice(0, 5);

  /* =======================
    RENDER
  ======================= */
  if (loading) {
    return (
      <div className="home-page-loading">
        <Sidebar />
        <div className="home-main">
          <TopNavbar />
          <div className="loading-message">Loading, please wait...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-page-error">
        <Sidebar />
        <div className="home-main">
          <TopNavbar />
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <Sidebar />
      <div className="home-main">
        <TopNavbar />

        <div className="home-content">
          <h1 className="dashboard-title">Dashboard</h1>

          {/* === TOP SUMMARY CARDS === */}
          <div className="summary-cards">
            <div className="summary-card">
              <h3>Total Stock</h3>
              <p>{totalStock}</p>
            </div>
            <div className="summary-card">
              <h3>Total Categories</h3>
              <p>{totalCategories}</p>
            </div>
            <div className="summary-card">
              <h3>Total Invoices</h3>
              <p>{totalInvoices}</p>
            </div>
            <div className="summary-card">
              <h3>Total Invoice Amount (₹)</h3>
              <p>{totalInvoiceAmount.toFixed(2)}</p>
            </div>
            <div className="summary-card">
              <h3>Total Customers</h3>
              <p>{totalCustomers}</p>
            </div>
          </div>

          {/* === CHARTS ROW 1: Bar + Line === */}
          <div className="dashboard-row">
            {/* Bar Chart: Stock by Category */}
            <div className="dashboard-panel chart-panel">
              <h2>Stock by Category</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="quantity" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Line Chart: Invoices by Month */}
            <div className="dashboard-panel chart-panel">
              <h2>Invoices by Month</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#82ca9d" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* === CHARTS ROW 2: Pie + Radial Bar === */}
          <div className="dashboard-row">
            {/* Pie Chart: Top 5 Customers by Invoice Amount */}
            <div className="dashboard-panel chart-panel">
              <h2>Top 5 Customers</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="total"
                    nameKey="name"
                    outerRadius={100}
                    label
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`pie-cell-${index}`}
                        fill={pieColors[index % pieColors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Radial Bar: Item Type Distribution */}
            <div className="dashboard-panel chart-panel">
              <h2>Item Type Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <RadialBarChart 
                  cx="50%" 
                  cy="50%" 
                  innerRadius="10%" 
                  outerRadius="80%" 
                  data={radialData}
                  startAngle={180} 
                  endAngle={0}
                >
                  <PolarAngleAxis 
                    dataKey="value" 
                    type="number" 
                    domain={[0, Math.max(...radialData.map(d => d.value)) || 1]} 
                    angleAxisId={0} 
                    tick={false} // hide ticks if you want a cleaner look
                  />
                  <RadialBar 
                    minAngle={15} 
                    background 
                    clockWise 
                    dataKey="value" 
                    fill="#ff7300" 
                  />
                  <Legend 
                    iconSize={10} 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right" 
                    formatter={(value, entry, i) => radialData[i]?.name} 
                  />
                  <Tooltip />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* === ROW: Recent Invoices & Customers === */}
          <div className="dashboard-row">
            <div className="dashboard-panel recent-invoices">
              <h2>Recent Invoices</h2>
              <table>
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Total (Subtotal)</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.length > 0 ? (
                    recentInvoices.map(inv => {
                      const invoiceSubtotal = inv.InvoiceItems?.reduce(
                        (sum, it) => sum + (it.subtotal || 0),
                        0
                      ) || 0;
                      return (
                        <tr key={inv.id}>
                          <td>{inv.invoiceNumber}</td>
                          <td>{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                          <td>{inv.Customer ? inv.Customer.name : 'N/A'}</td>
                          <td>₹{invoiceSubtotal.toFixed(2)}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4">No recent invoices found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="dashboard-panel recent-customers">
              <h2>Recent Customers</h2>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Address</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCustomers.length > 0 ? (
                    recentCustomers.map(cust => (
                      <tr key={cust.id}>
                        <td>{cust.name}</td>
                        <td>{cust.address}</td>
                        <td>₹{(cust.balance || 0).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3">No recent customers found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* === ROW: Low-Stock, New Arrivals === */}
          <div className="dashboard-row">
            <div className="dashboard-panel low-stock-panel">
              <h2>Low Stock Items</h2>
              <table>
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.length > 0 ? (
                    lowStockItems.map(item => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2">No items found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="dashboard-panel new-stock-panel">
              <h2>New Arrivals</h2>
              <table>
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {newArrivals.length > 0 ? (
                    newArrivals.map(item => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2">No new items found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default HomePage;
