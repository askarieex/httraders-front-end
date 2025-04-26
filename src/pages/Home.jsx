// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

import {
  FaBoxOpen,
  FaFolderOpen,
  FaFileInvoiceDollar,
  FaUsers,
  FaChartLine
} from 'react-icons/fa';

function HomePage() {
  // Main data states
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);

  // UI/loading/error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { theme } = useTheme();

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

  const averageInvoiceValue = totalInvoices ? (totalInvoiceAmount / totalInvoices).toFixed(2) : 0;

  /* =======================
    CHART DATA
  ======================= */
  // Stock by Category data
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

  // Invoices by Month data
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

  // Top Customers data
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
  
  const customerMap = new Map(customers.map(c => [c.id, c.name]));
  let pieData = Object.keys(customerTotalsMap).map((custId) => ({
    id: Number(custId),
    name: customerMap.get(Number(custId)) || `Cust#${custId}`,
    total: customerTotalsMap[custId]
  }));
  // Sort descending and take top 5
  pieData.sort((a, b) => b.total - a.total);
  pieData = pieData.slice(0, 5);

  // Some example colors for the pie slices:
  const pieColors = ['#6366f1', '#14b8a6', '#f59e0b', '#ef4444', '#3b82f6'];

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // If loading, show loading state
  if (loading) {
    return (
      <div className="py-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <Card key={i} loading={true} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button 
          variant="outline" 
          onClick={fetchAllData} 
          leftIcon={<span className="material-icons">refresh</span>}
        >
          Refresh Data
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card 
          title="TOTAL STOCK" 
          icon={<FaBoxOpen size={20} />} 
          iconBg="bg-green-500"
          hoverable
        >
          <div className="text-3xl font-bold text-green-500 mt-2">{totalStock.toLocaleString()}</div>
        </Card>
        
        <Card 
          title="TOTAL CATEGORIES" 
          icon={<FaFolderOpen size={20} />} 
          iconBg="bg-green-500"
          hoverable
        >
          <div className="text-3xl font-bold text-green-500 mt-2">{totalCategories}</div>
        </Card>
        
        <Card 
          title="TOTAL INVOICES" 
          icon={<FaFileInvoiceDollar size={20} />} 
          iconBg="bg-blue-500"
          hoverable
        >
          <div className="text-3xl font-bold text-blue-500 mt-2">{totalInvoices}</div>
        </Card>
        
        <Card 
          title="TOTAL CUSTOMERS" 
          icon={<FaUsers size={20} />} 
          iconBg="bg-blue-500"
          hoverable
        >
          <div className="text-3xl font-bold text-blue-500 mt-2">{totalCustomers}</div>
        </Card>
        
        <Card 
          title="AVERAGE INVOICE VALUE" 
          icon={<FaChartLine size={20} />} 
          iconBg="bg-purple-500"
          hoverable
        >
          <div className="text-3xl font-bold text-purple-500 mt-2">{formatCurrency(averageInvoiceValue)}</div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card title="Stock by Category" noPadding>
          <div className="p-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="category" 
                  angle={-45} 
                  textAnchor="end"
                  height={70}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} units`, 'Quantity']} />
                <Bar 
                  dataKey="quantity" 
                  fill={theme === 'dark' ? '#6366f1' : '#4338ca'} 
                  name="Quantity" 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Invoices by Month" noPadding>
          <div className="p-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={lineChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  angle={-45} 
                  textAnchor="end"
                  height={70}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip formatter={(value) => [formatCurrency(value), 'Amount']} />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#ef4444" 
                  strokeWidth={2} 
                  name="Total" 
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Third Row - Customer Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Top 5 Customers by Sales" noPadding>
          <div className="p-4 h-80 flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [formatCurrency(value), 'Sales']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* You can add another chart or table here */}
      </div>
    </div>
  );
}

export default HomePage;
