import { useState, useEffect, useCallback } from "react"
import { useParams } from "react-router-dom"
import { API_BASE_URL } from "../config";

export default function InvoicePrint() {
  const { id } = useParams()
  const [invoice, setInvoice] = useState(null)

  // Handle print functionality
  const handlePrint = useCallback(async () => {
    try {
      // Debug: Check what's available
      console.log('window.electronAPI:', window.electronAPI);
      console.log('window.require:', window.require);
      console.log('navigator.userAgent:', navigator.userAgent);
      
      // Method 1: Try preload API first
      if (window.electronAPI?.showPrintPreview) {
        console.log('Using Electron preload API print preview');
        const result = await window.electronAPI.showPrintPreview();
        console.log('Electron print result:', result);
        if (!result.success) {
          console.error('Electron print preview failed:', result.error);
          window.print();
        }
        return;
      }
      
      // Method 2: Try direct IPC (if nodeIntegration is enabled)
      if (window.require) {
        console.log('Using direct Electron IPC');
        const { ipcRenderer } = window.require('electron');
        const result = await ipcRenderer.invoke('show-print-preview');
        console.log('Direct IPC print result:', result);
        if (!result.success) {
          console.error('Direct IPC print preview failed:', result.error);
          window.print();
        }
        return;
      }
      
      // Method 3: Browser fallback
      console.log('Using browser print');
      window.print();
      
    } catch (error) {
      console.error('Print error:', error);
      // Always fallback to browser print
      window.print();
    }
  }, []);

  // Fetch invoice data
  useEffect(() => {
    fetch(`${API_BASE_URL}/invoices/${id}`)
      .then((res) => res.json())
      .then(async (json) => {
        const enrichedItems = await Promise.all(
          json.items.map(async (item) => {
            const res = await fetch(`${API_BASE_URL}/varieties/${item.variety_id}`);
            const variety = await res.json();
            return { ...item, description: variety.name }; // attach variety name
          })
        );
        setInvoice({ ...json, items: enrichedItems });
      })
      .catch(console.error);
  }, [id]);

  // Auto-print when invoice is loaded
  // useEffect(() => {
  //   if (!invoice) return;

  //   // Add a small delay to ensure the component is fully rendered
  //   const timer = setTimeout(() => {
  //     handlePrint();
  //   }, 1000);

  //   // Cleanup function to clear timeout
  //   return () => clearTimeout(timer);
  // }, [invoice, handlePrint]);

  // Manual print handler
  const handleManualPrint = () => {
    handlePrint();
  };

  if (!invoice)
    return (
      <p
        style={{
          textAlign: "center",
          padding: "20px",
          fontSize: "18px",
          color: "#6b7280",
        }}
      >
        Loading…
      </p>
    )

  const { header, items } = invoice
  const { cust_name, cust_address, cust_phone, issued_at, paid_amount } = header
  const subtotal = items.reduce((sum, i) => sum + i.qty * i.unit_price, 0)
  const paid = paid_amount
  const balance = subtotal - paid

  // Print-specific styles
  const printStyles = `
    @media print {
      body * {
        visibility: hidden;
      }
      .print-area, .print-area * {
        visibility: visible;
      }
      .print-area {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
      }
      .no-print {
        display: none !important;
      }
      @page {
        margin: 0.5in;
        size: A4;
      }
    }
    @media screen {
      .print-area {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
    }
  `

  return (
    <>
      <style>{printStyles}</style>

      {/* Screen-only controls */}
      <div className="no-print" style={{ padding: "20px", textAlign: "center" }}>
        <div style={{ marginBottom: "20px" }}>
          <button
            onClick={() => window.history.back()}
            style={{
              padding: "10px 20px",
              backgroundColor: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              marginRight: "10px",
            }}
          >
            ← Back to Invoices
          </button>
          
          {/* Show different buttons based on environment */}
          {window.electronAPI ? (
            <>
              <button
                onClick={async () => {
                  try {
                    await window.electronAPI.showPdfPreview();
                  } catch (error) {
                    console.error('PDF preview error:', error);
                    window.print();
                  }
                }}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#059669",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  marginRight: "10px",
                }}
              >
                📄 PDF Preview
              </button>
            </>
          ) : (
            <button
              onClick={handleManualPrint}
              style={{
                padding: "10px 20px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              🖨️ Print Invoice
            </button>
          )}
        </div>
        
        {/* Debug info (remove in production) */}
        <div style={{ fontSize: "12px", color: "#666", marginBottom: "10px" }}>
          Environment: {window.electronAPI ? "Electron" : "Browser"} | 
          ElectronAPI Available: {window.electronAPI ? "Yes" : "No"} | 
          Require Available: {window.require ? "Yes" : "No"}
        </div>
      </div>

      {/* Print area - only this will be printed */}
      <div className="print-area">
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e5e7eb",
            padding: "40px",
            fontFamily: "Arial, sans-serif",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "40px",
              paddingBottom: "20px",
              borderBottom: "2px solid #e5e7eb",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: "#1f2937",
                  margin: "0 0 8px 0",
                }}
              >
                AK-Ledger
              </h1>
              <p style={{ margin: "0", color: "#6b7280", fontSize: "14px" }}>123 Finance Road</p>
              <p style={{ margin: "0", color: "#6b7280", fontSize: "14px" }}>Lahore, Pakistan</p>
              <p style={{ margin: "0", color: "#6b7280", fontSize: "14px" }}>Phone: +92-300-1234567</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#3b82f6",
                  margin: "0 0 8px 0",
                }}
              >
                INVOICE #{id}
              </h2>
              <p style={{ margin: "0", color: "#6b7280", fontSize: "14px" }}>
                <strong>Date:</strong> {issued_at.split("T")[0]}
              </p>
            </div>
          </div>

          {/* Customer Info */}
          <div style={{ marginBottom: "40px" }}>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#374151",
                margin: "0 0 12px 0",
              }}
            >
              BILL TO:
            </h3>
            <div
              style={{
                backgroundColor: "#f9fafb",
                padding: "16px",
                borderRadius: "6px",
                border: "1px solid #e5e7eb",
              }}
            >
              <p style={{ margin: "0 0 4px 0", fontWeight: "600", color: "#1f2937" }}>{cust_name}</p>
              <p style={{ margin: "0 0 4px 0", color: "#6b7280" }}>{cust_address}</p>
              <p style={{ margin: "0", color: "#6b7280" }}>{cust_phone}</p>
            </div>
          </div>

          {/* Items Table */}
          <div style={{ marginBottom: "40px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e5e7eb" }}>
              <thead>
                <tr style={{ backgroundColor: "#f9fafb" }}>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      fontWeight: "600",
                      color: "#374151",
                      borderBottom: "1px solid #e5e7eb",
                      borderRight: "1px solid #e5e7eb",
                    }}
                  >
                    Description
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      fontWeight: "600",
                      color: "#374151",
                      borderBottom: "1px solid #e5e7eb",
                      borderRight: "1px solid #e5e7eb",
                      width: "80px",
                    }}
                  >
                    Qty
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "right",
                      fontWeight: "600",
                      color: "#374151",
                      borderBottom: "1px solid #e5e7eb",
                      borderRight: "1px solid #e5e7eb",
                      width: "120px",
                    }}
                  >
                    Unit Price
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "right",
                      fontWeight: "600",
                      color: "#374151",
                      borderBottom: "1px solid #e5e7eb",
                      width: "120px",
                    }}
                  >
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td
                      style={{
                        padding: "12px",
                        borderBottom: "1px solid #f3f4f6",
                        borderRight: "1px solid #e5e7eb",
                        color: "#374151",
                      }}
                    >
                      {item.description}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        borderBottom: "1px solid #f3f4f6",
                        borderRight: "1px solid #e5e7eb",
                        color: "#374151",
                      }}
                    >
                      {item.qty}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        borderBottom: "1px solid #f3f4f6",
                        borderRight: "1px solid #e5e7eb",
                        color: "#374151",
                      }}
                    >
                      PKR{item.unit_price.toFixed(2)}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        borderBottom: "1px solid #f3f4f6",
                        color: "#374151",
                        fontWeight: "600",
                      }}
                    >
                      PKR{(item.qty * item.unit_price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{ minWidth: "300px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td
                      style={{
                        padding: "8px 16px",
                        textAlign: "right",
                        fontWeight: "500",
                        color: "#374151",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      Subtotal:
                    </td>
                    <td
                      style={{
                        padding: "8px 16px",
                        textAlign: "right",
                        fontWeight: "600",
                        color: "#374151",
                        borderBottom: "1px solid #e5e7eb",
                        width: "120px",
                      }}
                    >
                      PKR{subtotal.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        padding: "8px 16px",
                        textAlign: "right",
                        fontWeight: "500",
                        color: "#374151",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      Paid:
                    </td>
                    <td
                      style={{
                        padding: "8px 16px",
                        textAlign: "right",
                        fontWeight: "600",
                        color: "#059669",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      PKR{paid.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        padding: "12px 16px",
                        textAlign: "right",
                        fontWeight: "600",
                        color: "#1f2937",
                        fontSize: "16px",
                        backgroundColor: "#f9fafb",
                      }}
                    >
                      Balance Due:
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        textAlign: "right",
                        fontWeight: "bold",
                        color: balance > 0 ? "#dc2626" : "#059669",
                        fontSize: "16px",
                        backgroundColor: "#f9fafb",
                      }}
                    >
                      PKR{balance.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: "40px",
              paddingTop: "20px",
              borderTop: "1px solid #e5e7eb",
              textAlign: "center",
              color: "#6b7280",
              fontSize: "12px",
            }}
          >
            <p style={{ margin: "0" }}>Thank you for your business!</p>
            <p style={{ margin: "4px 0 0 0" }}>For any queries, please contact us at info@ak-ledger.com</p>
          </div>
        </div>
      </div>
    </>
  )
}