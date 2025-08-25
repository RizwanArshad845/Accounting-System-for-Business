import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { API_BASE_URL } from "../config";
const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };
export default function InvoiceList() {
  const nav = useNavigate()
  const [search, setSearch] = useState("")
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Fetch invoices
  useEffect(() => {
    async function load() {
      setLoading(true)
      setError("")
      try {
        const res = await fetch(`${API_BASE_URL}/invoices?page=1&limit=50`) // Assuming this endpoint exists
        if (!res.ok) throw new Error("Unable to fetch invoices")
        const json = await res.json()
        setData(json)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Delete invoice
  const handleDelete = async (id) => {
    if (!window.confirm(`Delete invoice #${id}?`)) return
    try {
      const res = await fetch(`${API_BASE_URL}/invoices/${id}`, { method: "DELETE" }) // Assuming this endpoint exists
      if (res.status === 204) setData((d) => d.filter((inv) => inv.id !== id))
      else console.error("Delete failed")
    } catch (e) {
      console.error(e)
    }
  }

  // Filter client-side
  const filtered = data.filter(
    (inv) => inv.id.toString().includes(search) || inv.cust_name.toLowerCase().includes(search.toLowerCase()),
  )

  const getStatusColor = (status) => {
    switch (status) {
      case "PAID":
        return "#059669"
      case "CREDIT":
        return "#dc2626"
      default:
        return "#6b7280"
    }
  }
  const getStatusBg = (status) => {
    switch (status) {
      case "PAID":
        return "#dcfdf7"
      case "CREDIT":
        return "#fef2f2"
      default:
        return "#f3f4f6"
    }
  }

  const buttonStyle = {
    padding: "6px 12px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
    textDecoration: "none",
    display: "inline-block",
    transition: "background-color 0.2s",
  }

  // Styles for header cells - adjusted color to black
  const headerCell = {
    padding: "12px",
    textAlign: "left",
    fontWeight: 600,
    color: "#000000", // Changed to black
    borderBottom: "1px solid #e5e7eb",
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e5e7eb",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#f9fafb",
          }}
        >
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#1f2937",
              margin: 0,
            }}
          >
            Invoices
          </h1>
          <div style={{ display: "flex", gap: "10px" }}>
            <Link
              to="/invoices/new"
              style={{
                ...buttonStyle,
                backgroundColor: "#3b82f6",
                color: "white",
                padding: "10px 20px",
                fontSize: "14px",
              }}
            >
              + Add Invoice
            </Link>
          </div>
        </div>
        {/* Search Bar */}
        <div style={{ padding: "24px", paddingBottom: "16px" }}>
          <div style={{ position: "relative", maxWidth: "400px" }}>
            <input
              type="text"
              placeholder="Search by ID or Customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px 12px 40px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />
            <div
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#6b7280",
                fontSize: "16px",
              }}
            >
              🔍
            </div>
          </div>
        </div>
        {/* Table */}
        <div style={{ padding: "0 24px 24px" }}>
          <div style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f9fafb" }}>
                  <th style={{ ...headerCell, textAlign: "left" }}>Invoice #</th>
                  <th style={{ ...headerCell, textAlign: "left" }}>Customer</th>
                  <th style={{ ...headerCell, textAlign: "left" }}>Date</th>
                  <th style={{ ...headerCell, textAlign: "right" }}>Total</th>
                  <th style={{ ...headerCell, textAlign: "right" }}>Balance</th>
                  <th style={{ ...headerCell, textAlign: "center" }}>Status</th>
                  <th style={{ ...headerCell, textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ padding: "12px", color: "#000000" }}>#{inv.id}</td>
                    <td style={{ padding: "12px", color: "#000000" }}>{inv.cust_name}</td>{" "}
                    {/* Made customer name prominent and black */}
                    <td style={{ padding: "12px", color: "#000000" }}>
                      {inv.issued_at?.split("T")[0]}
                    </td>
                    <td style={{ padding: "12px", textAlign: "right", color: "#000000" }}>
                      PKR{inv.total.toFixed(2)}
                    </td>
                    <td style={{ padding: "12px", textAlign: "right", color: "#000000" }}>
                      PKR{inv.balance.toFixed(2)}
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "bold", // Made status text bold
                          backgroundColor: getStatusBg(inv.status),
                          color: getStatusColor(inv.status),
                        }}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap" }}>
                        <Link
                          to={`/invoices/${inv.id}/edit`}
                          style={{ ...buttonStyle, backgroundColor: "#3b82f6", color: "white" }}
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(inv.id)}
                          style={{ ...buttonStyle, backgroundColor: "#dc2626", color: "white" }}
                        >
                          Delete
                        </button>
                        <Link
                          to={`/invoices/${inv.id}/print`}
                          style={{ ...buttonStyle, backgroundColor: "#059669", color: "white" }}
                        >
                          Print
                        </Link>
                        {inv.status === "CREDIT" && (
                          <Link
                            to={`/customer-ledger/${inv.customer_id}`}
                            style={{ ...buttonStyle, backgroundColor: "#f97316", color: "white" }}
                          >
                            Ledger  
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {filtered.length === 0 && !loading && (
          <p style={{ textAlign: "center", padding: "32px", color: "#6b7280" }}>
            {search ? "No invoices found matching your search" : "No invoices available"}
          </p>
        )}
        {/* Summary */}
        <div
          style={{
            marginTop: "24px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            padding: "20px",
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#3b82f6" }}>{data.length}</div>
            <div style={{ fontSize: "14px", color: "#6b7280" }}>Total Invoices</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#059669" }}>
              {data.filter((inv) => inv.status === "PAID").length}
            </div>
            <div style={{ fontSize: "14px", color: "#6b7280" }}>Paid</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#dc2626" }}>
              {data.filter((inv) => inv.status === "CREDIT").length}
            </div>
            <div style={{ fontSize: "14px", color: "#6b7280" }}>Credit</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#059669" }}>
              PKR{data.reduce((sum, inv) => sum + inv.total, 0).toFixed(2)}
            </div>
            <div style={{ fontSize: "14px", color: "#6b7280" }}>Total Revenue</div>
          </div>
        </div>
      </div>
    </div>
  )
}