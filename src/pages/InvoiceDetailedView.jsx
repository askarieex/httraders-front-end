import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Sidebar from "../components/Sidebar";
import TopNavbar from "../components/TopNavbar";
import {
  FaArrowLeft,
  FaEdit,
  FaTrash,
  FaPrint,
  FaFilePdf,
} from "react-icons/fa";
import "./css/InvoiceDetailedView.css";
import logo from "../assets/logo.png";

function InvoiceDetailedView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // For printing a styled HTML section
  const printRef = useRef(null);

  // Authentication header
  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch invoice + associated customer
  useEffect(() => {
    async function fetchInvoiceAndCustomer() {
      try {
        const invoiceRes = await axios.get(
          `http://localhost:3000/api/invoices/${id}`,
          {
            headers: getAuthHeader(),
          }
        );
        setInvoice(invoiceRes.data);

        if (invoiceRes.data && invoiceRes.data.customer_id) {
          const customerRes = await axios.get(
            `http://localhost:3000/api/customers/${invoiceRes.data.customer_id}`,
            {
              headers: getAuthHeader(),
            }
          );
          setCustomer(customerRes.data);
          console.log("_____________________________");
          console.log(customerRes.data);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.response?.data?.message || "Error fetching data");
      } finally {
        setLoading(false);
      }
    }
    fetchInvoiceAndCustomer();
  }, [id]);

  // Handler: Edit Invoice
  const handleEditInvoice = () => {
    navigate(`/edit-invoice/${id}`);
  };

  // Handler: Delete Invoice
  const handleDeleteInvoice = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this invoice? This action cannot be undone."
      )
    ) {
      try {
        await axios.delete(`http://localhost:3000/api/invoices/${id}`, {
          headers: getAuthHeader(),
        });
        alert("Invoice deleted successfully.");
        navigate(-1);
      } catch (err) {
        console.error("Error deleting invoice:", err);
        alert(err.response?.data?.message || "Error deleting invoice.");
      }
    }
  };

  // Handler: Print Invoice (HTML printing)
  const handlePrintInvoice = () => {
    if (!printRef.current) return;
    const printContents = printRef.current.innerHTML;
    const newWindow = window.open("", "_blank", "width=800,height=900");
    newWindow.document.write(`
      <html>
        <head>
          <title>Print Invoice</title>
          <link rel="stylesheet" href="${window.location.origin}/css/InvoiceDetailedView.css" />
        </head>
        <body onload="window.print(); window.close();">
          ${printContents}
        </body>
      </html>
    `);
    newWindow.document.close();
  };

  // Handler: Download Invoice as PDF using jsPDF & jsPDF-AutoTable
  const handleDownloadPDF = () => {
    if (!invoice) return;
    const doc = new jsPDF("p", "pt", "letter");
    const pageWidth = doc.internal.pageSize.getWidth();

    // Draw a header background
    doc.setFillColor(25, 118, 210); // primary color
    doc.rect(0, 0, pageWidth, 60, "F");

    // White text for header
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", pageWidth / 2, 35, { align: "center" });

    // Company Info under that header
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    let yPos = 80;
    doc.text("From:", 40, yPos);
    yPos += 14;
    doc.text("Himalayan Timber Traders", 40, yPos);
    yPos += 12;
    doc.text("456 Timber Lane, Kathmandu, Nepal", 40, yPos);
    yPos += 12;
    doc.text("Email: contact@himalyantimbertraders.com", 40, yPos);
    yPos += 12;
    doc.text("Phone: +977-1-2345678", 40, yPos);

    // Invoice info on right side
    let xPos = pageWidth / 2 + 40;
    let infoY = 80;
    doc.setFontSize(11);
    doc.text(`Invoice #: ${invoice.invoiceNumber || ""}`, xPos, infoY);
    infoY += 14;
    doc.text(
      `Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`,
      xPos,
      infoY
    );
    infoY += 14;
    doc.text(
      `Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`,
      xPos,
      infoY
    );
    infoY += 14;
    if (invoice.poNumber) {
      doc.text(`PO Number: ${invoice.poNumber}`, xPos, infoY);
      infoY += 14;
    }

    // Bill To
    infoY += 10;
    doc.setFont("helvetica", "normal");
    doc.text("Bill To:", xPos, infoY);
    infoY += 14;
    doc.text(customer ? `Name: ${customer.name}` : "Name: N/A", xPos, infoY);
    infoY += 12;
    doc.text(
      customer ? `Address: ${customer.address}` : "Address: N/A",
      xPos,
      infoY
    );
    infoY += 12;
    doc.text(customer ? `Email: ${customer.email}` : "Email: N/A", xPos, infoY);
    infoY += 12;
    doc.text(customer ? `Phone: ${customer.phone}` : "Phone: N/A", xPos, infoY);

    // Build table for items
    const tableBody = [];
    if (invoice.InvoiceItems && invoice.InvoiceItems.length > 0) {
      invoice.InvoiceItems.forEach((item, idx) => {
        // Try to get the category from item.category or item.Item.Category
        const categoryName = item.category
          ? item.category
          : item.Item?.Category?.name || "N/A";

        tableBody.push([
          (idx + 1).toString(),
          item.name || "N/A",
          categoryName,
          item.dimension || "N/A",
          `₹${(item.selling_price || 0).toFixed(2)}`,
          item.unit || "N/A",
          item.quantity.toString(),
          `₹${(item.subtotal || 0).toFixed(2)}`,
        ]);
      });
    }

    // Use autoTable to generate items table
    doc.autoTable({
      startY: yPos + 30,
      head: [
        [
          "#",
          "Item",
          "Category",
          "Dimension",
          "Price",
          "Unit",
          "Qty",
          "Subtotal",
        ],
      ],
      body: tableBody,
      theme: "grid",
      headStyles: {
        fillColor: [25, 118, 210],
        textColor: 255,
        fontStyle: "bold",
      },
      margin: { left: 40, right: 40 },
      styles: { fontSize: 9, cellPadding: 4 },
    });

    // Totals
    const invoiceSubtotal =
      invoice.total ||
      invoice.InvoiceItems?.reduce((sum, it) => sum + it.subtotal, 0) ||
      0;
    const discountAmount = (invoiceSubtotal * (invoice.discount || 0)) / 100;
    const taxAmount = (invoiceSubtotal * (invoice.tax || 0)) / 100;
    const finalTotal = invoiceSubtotal - discountAmount + taxAmount;

    const finalY = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Subtotal: ₹${invoiceSubtotal.toFixed(2)}`, 40, finalY);
    doc.text(`Discount: ₹${discountAmount.toFixed(2)}`, 40, finalY + 14);
    doc.text(
      `Tax (${invoice.tax || 0}%): ₹${taxAmount.toFixed(2)}`,
      40,
      finalY + 28
    );
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Total: ₹${finalTotal.toFixed(2)}`, 40, finalY + 48);

    // Notes / Payment Terms
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    let notesY = finalY + 70;
    if (invoice.notes) {
      doc.text("Notes:", 40, notesY);
      notesY += 14;
      doc.text(invoice.notes, 40, notesY, { maxWidth: pageWidth - 80 });
      notesY += 28;
    }
    if (invoice.paymentTerms) {
      doc.text("Payment Terms:", 40, notesY);
      notesY += 14;
      doc.text(invoice.paymentTerms, 40, notesY, { maxWidth: pageWidth - 80 });
      notesY += 28;
    }

    // Save PDF
    doc.save(`Invoice-${invoice.invoiceNumber || "untitled"}.pdf`);
  };

  // Loading / error states
  if (loading) {
    return (
      <div className="invoice-detailed-view-wrapper">
        <Sidebar />
        <div className="invoice-detailed-view-container">
          <TopNavbar />
          <div className="invoice-detailed-view-content">
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="invoice-detailed-view-wrapper">
        <Sidebar />
        <div className="invoice-detailed-view-container">
          <TopNavbar />
          <div className="invoice-detailed-view-content">
            <p className="error-message">{error}</p>
            <button className="btn-back" onClick={() => navigate(-1)}>
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="invoice-detailed-view-wrapper">
        <Sidebar />
        <div className="invoice-detailed-view-container">
          <TopNavbar />
          <div className="invoice-detailed-view-content">
            <p>Invoice not found.</p>
            <button className="btn-back" onClick={() => navigate(-1)}>
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate totals
  const invoiceSubtotal =
    invoice.total ||
    invoice.InvoiceItems?.reduce((sum, item) => sum + item.subtotal, 0) ||
    0;
  const discountAmount = (invoiceSubtotal * (invoice.discount || 0)) / 100;
  const taxAmount = (invoiceSubtotal * (invoice.tax || 0)) / 100;
  const finalTotal = invoiceSubtotal - discountAmount + taxAmount;

  return (
    <div className="invoice-detailed-view-wrapper">
      <Sidebar />
      <div className="invoice-detailed-view-container">
        <TopNavbar />

        {/* Top bar with back button */}
        <div className="invoice-top-bar">
          <button className="btn-back-top" onClick={() => navigate(-1)}>
            <FaArrowLeft /> Back
          </button>
        </div>

        {/* MAIN CONTENT */}
        <div className="invoice-card" ref={printRef}>
          {/* Header Section */}
          <div className="invoice-header">
            <div className="invoice-header-left">
              <img src={logo} alt="Company Logo" className="company-logo" />
              <div className="company-details">
                <h2>Himalayan Timber Traders</h2>
                <p>Quality Timber Suppliers</p>
              </div>
            </div>
            <div className="invoice-header-right">
              <h3>INVOICE</h3>
              <p>
                <strong>Number:</strong> {invoice.invoiceNumber || "N/A"}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(invoice.invoiceDate).toLocaleDateString()}
              </p>
              <p>
                <strong>Due Date:</strong>{" "}
                {new Date(invoice.dueDate).toLocaleDateString()}
              </p>
              {invoice.poNumber && (
                <p>
                  <strong>PO Number:</strong> {invoice.poNumber}
                </p>
              )}
            </div>
          </div>

          <hr />

          {/* Billing Sections */}
          <div className="invoice-section">
            <div className="section from-section">
              <h2>From</h2>
              <p>
                <strong>Himalayan Timber Traders</strong>
              </p>
              <p>456 Timber Lane, Kathmandu, Nepal</p>
              <p>Email: contact@himalyantimbertraders.com</p>
              <p>Phone: +977-1-2345678</p>
            </div>
            <div className="section to-section">
              <h2>Bill To</h2>
              <p>
                <strong>Name:</strong> {customer ? customer.name : "N/A"}
              </p>
              <p>
                <strong>Address:</strong> {customer ? customer.address : "N/A"}
              </p>
              <p>
                <strong>Email:</strong> {customer ? customer.email : "N/A"}
              </p>
              <p>
                <strong>Phone:</strong> {customer ? customer.phone : "N/A"}
              </p>
            </div>
          </div>

          <hr />

          {/* Invoice Items */}
          <div className="invoice-items">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Dimension</th>
                  <th>Price (₹)</th>
                  <th>Unit</th>
                  <th>Qty</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {invoice.InvoiceItems && invoice.InvoiceItems.length > 0 ? (
                  invoice.InvoiceItems.map((item, index) => {
                    // Attempt to show category
                    const categoryName = item.category
                      ? item.category
                      : item.Item?.Category?.name || "N/A";
                    return (
                      <tr key={item.id}>
                        <td>{index + 1}</td>
                        <td>{item.name || "N/A"}</td>
                        <td>{categoryName}</td>
                        <td>{item.dimension || "N/A"}</td>
                        <td>{`₹${(item.selling_price || 0).toFixed(2)}`}</td>
                        <td>{item.unit || "N/A"}</td>
                        <td>{item.quantity}</td>
                        <td>{`₹${(item.subtotal || 0).toFixed(2)}`}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center" }}>
                      No items found for this invoice.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="invoice-summary">
            <div className="summary-row">
              <p>Subtotal:</p>
              <p>₹{invoiceSubtotal.toFixed(2)}</p>
            </div>
            <div className="summary-row">
              <p>Discount:</p>
              <p>₹{discountAmount.toFixed(2)}</p>
            </div>
            <div className="summary-row">
              <p>Tax ({invoice.tax || 0}%):</p>
              <p>₹{taxAmount.toFixed(2)}</p>
            </div>
            <div className="summary-row total">
              <p>Total:</p>
              <p>₹{finalTotal.toFixed(2)}</p>
            </div>
          </div>

          {/* Notes */}
          <div className="invoice-notes">
            <h3>Notes:</h3>
            <p>{invoice.notes || "N/A"}</p>
            <h3>Payment Terms:</h3>
            <p>{invoice.paymentTerms || "N/A"}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="invoice-actions">
          <button className="btn-primary" onClick={handlePrintInvoice}>
            <FaPrint /> Print Invoice
          </button>
          <button className="btn-primary" onClick={handleDownloadPDF}>
            <FaFilePdf /> Download PDF
          </button>
          <button className="btn-edit" onClick={handleEditInvoice}>
            <FaEdit /> Edit
          </button>
          <button className="btn-delete" onClick={handleDeleteInvoice}>
            <FaTrash /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default InvoiceDetailedView;
