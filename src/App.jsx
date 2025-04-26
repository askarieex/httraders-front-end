import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "./context/ThemeContext";

// Pages
import Login from "./pages/Login";
import Home from "./pages/Home";
import Stock from "./pages/Stock";
import Departments from "./pages/departments";
import PrivateRoute from "./PrivateRoute";
import Categories from "./pages/Categories";
import Billing from "./pages/Billing";
import Customers from "./pages/Customers";
import CustomerDetails from "./pages/CustomerDetails";
import InvoiceDetailedView from "./pages/InvoiceDetailedView";
import EditInvoice from "./pages/EditInvoice";
import TransactionEdit from "./pages/TransactionEdit";
import AllTransactions from "./pages/AllTransactions";

// Components
import Sidebar from "./components/Sidebar";

// Layout component to wrap authenticated pages
const AppLayout = ({ children }) => {
  const { theme } = useTheme();
  const location = useLocation();
  
  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'bg-neutral-900 text-white' : 'bg-neutral-50 text-neutral-900'}`}>
      <Sidebar />
      <main className="flex-1 overflow-auto ml-[80px] lg:ml-[250px] transition-all duration-300 p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="container mx-auto max-w-7xl"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

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
            <AppLayout>
            <Home />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/customers"
        element={
          <PrivateRoute>
            <AppLayout>
            <Customers />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/stock"
        element={
          <PrivateRoute>
            <AppLayout>
            <Stock />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/departments"
        element={
          <PrivateRoute>
            <AppLayout>
            <Departments />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/categories"
        element={
          <PrivateRoute>
            <AppLayout>
            <Categories />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/customer/:id"
        element={
          <PrivateRoute>
            <AppLayout>
            <CustomerDetails />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/billing"
        element={
          <PrivateRoute>
            <AppLayout>
            <Billing />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route 
         path="/fullinvoice/:id" 
         element={
           <PrivateRoute>
             <AppLayout>
             <InvoiceDetailedView />
             </AppLayout>
           </PrivateRoute>
         }
       />
      <Route 
        path="/edit-invoice/:id" 
        element={
          <PrivateRoute>
            <AppLayout>
            <EditInvoice />
            </AppLayout>
          </PrivateRoute>
        } 
      />
      <Route 
        path="/transaction/edit/:id" 
        element={
          <PrivateRoute>
            <AppLayout>
            <TransactionEdit />
            </AppLayout>
          </PrivateRoute>
        } 
      />
      <Route 
        path="/all-trasactions"
        element={
          <PrivateRoute>
            <AppLayout>
              <AllTransactions />
            </AppLayout>
          </PrivateRoute>
        } 
      />
    </Routes>
  );
}

export default App;
