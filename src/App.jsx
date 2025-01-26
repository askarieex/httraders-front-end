import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Stock from "./pages/Stock";
import Departments from "./pages/departments";
import PrivateRoute from "./PrivateRoute"; // Import the PrivateRoute component
import Categories from "./pages/Categories";
import Billing from "./pages/Billing";
import Customers from "./pages/Customers";
import CustomerDetails from "./pages/CustomerDetails";
import InvoiceDetailedView from "./pages/InvoiceDetailedView";
import EditInvoice from "./pages/EditInvoice";
import TransactionEdit from "./pages/TransactionEdit";
function App() {
  return (
    <Routes>
      {/* Public route */}
     
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Login />} />
      {/* Protected routes */}
      <Route
        path="/home"
        element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        }
      />
      <Route
        path="/customers"
        element={
          <PrivateRoute>
            <Customers />
          </PrivateRoute>
        }
      />
      <Route
        path="/stock"
        element={
          <PrivateRoute>
            <Stock />
          </PrivateRoute>
        }
      />
      <Route
        path="/departments"
        element={
          <PrivateRoute>
            <Departments />
          </PrivateRoute>
        }
      />
      <Route
        path="/categories"
        element={
          <PrivateRoute>
            <Categories />
          </PrivateRoute>
        }
      />
      <Route
        path="/customer/:id"
        element={
          <PrivateRoute>
            <CustomerDetails />
          </PrivateRoute>
        }
      />
      <Route
        path="/billing"
        element={
          <PrivateRoute>
            <Billing />
          </PrivateRoute>
        }
      />
      <Route path="/fullinvoice/:id" element={<InvoiceDetailedView />} />
      <Route path="/edit-invoice/:id" element={<EditInvoice />} />
      <Route path="/transaction/edit/:id" element={<TransactionEdit />} />
    </Routes>
  );
}

export default App;
