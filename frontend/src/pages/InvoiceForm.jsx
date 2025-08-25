import { API_BASE_URL } from "../config";
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"

export default function InvoiceForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const editMode = Boolean(id)

  // Customer fields
  const [custName, setCustName]       = useState("")
  const [custPhone, setCustPhone]     = useState("")
  const [custAddress, setCustAddress] = useState("")

  // Real varieties from DB
  const [varieties, setVarieties]   = useState([])
  const [varLoading, setVarLoading] = useState(true)

  // Line items
  const [items, setItems] = useState([{ varietyId: "", qty: " ", unitPrice: 0 }])

  // Payment
  const [paidNow, setPaidNow]           = useState("") // keep string
  const [creditEnable, setCreditEnable] = useState(false)
  const [dueAt, setDueAt]               = useState("")

  // Fetch varieties once on mount
  useEffect(() => {
    async function loadVarieties() {
      try {
        const res = await fetch(`${API_BASE_URL}/varieties?limit=100`);
        if (!res.ok) throw new Error("Failed to load varieties")
        const data = await res.json()
        setVarieties(data)
      } catch (e) {
        console.error(e)
      } finally {
        setVarLoading(false)
      }
    }
    loadVarieties()
  }, [])

  // Fetch invoice for edit mode
  useEffect(() => {
    if (!editMode) return
    fetch(`${API_BASE_URL}/invoices/${id}`)
      .then((r) => r.json())
      .then((json) => {
        const { header, items } = json
        setCustName(header.cust_name)
        setCustPhone(header.cust_phone)
        setCustAddress(header.cust_address)
        setItems(
          items.map((i) => ({
            varietyId: i.variety_id.toString(),
            qty:       i.qty,
            unitPrice: i.unit_price,
          }))
        )
        setPaidNow(header.paid_amount.toString())
        setCreditEnable(header.status === "CREDIT")
        if (header.due_at) setDueAt(header.due_at.split("T")[0])
      })
      .catch(console.error)
  }, [editMode, id])

  // Totals
  const subtotal   = items.reduce((s, i) => s + i.qty * i.unitPrice, 0)
  const paidAmount = parseFloat(paidNow) || 0
  const balance    = subtotal - paidAmount

  // Style objects (unchanged)
  const inputStyle = {
    width: "100%",
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    transition: "border-color 0.2s",
  }
  const buttonStyle = {
    padding: "10px 20px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "background-color 0.2s",
  }
  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#3b82f6",
    color: "white",
  }
  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#6b7280",
    color: "white",
  }
  const dangerButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#dc2626",
    color: "white",
    padding: "6px 10px",
    fontSize: "12px",
  }

  // Handlers
  const handleItemChange = (idx, field, value) => {
    const newItems = [...items]
    if (field === "varietyId") {
      newItems[idx].varietyId = value
      const sel = varieties.find((v) => v.id.toString() === value)
      newItems[idx].unitPrice = sel ? sel.unit_price : 0
    } else {
      newItems[idx][field] = Number(value)
    }
    setItems(newItems)
  }
  const addItem    = () => setItems([...items, { varietyId: "", qty: 1, unitPrice: 0 }])
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      custName,
      custPhone,
      custAddress,
      items: items.map((it) => ({
        varietyId: Number(it.varietyId),
        qty:       it.qty,
        unitPrice: it.unitPrice,
      })),
      paidNow: paidAmount,
      credit:  creditEnable ? { enable: true, dueAt } : undefined,
    }
    const url    = editMode ? `${API_BASE_URL}/invoices/${id}` : `${API_BASE_URL}/invoices`
    const method = editMode ? "PUT" : "POST"

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      })
      if (!res.ok) {
        console.error("Save failed", res.status, await res.text())
        return alert("Failed to save—see console.")
      }
      const data = await res.json()
      nav(editMode ? -1 : `/invoices/${data.invoiceId}/print`)
    } catch (e) {
      console.error(e)
      alert("Network error—see console.")
    }
  }

  // Show loading state for varieties
  if (varLoading) {
    return <p style={{ textAlign: "center", padding: "24px" }}>Loading varieties…</p>
  }

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "24px",
        backgroundColor: "white",
        borderRadius: "12px",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
        border: "1px solid #e5e7eb",
      }}
    >
      <h1
        style={{
          fontSize: "28px",
          fontWeight: "bold",
          color: "#1f2937",
          margin: "0 0 24px 0",
        }}
      >
        {editMode ? `Edit Invoice #${id}` : "New Invoice"}
      </h1>

      <form onSubmit={handleSubmit}>
        {/* ── Customer Info ── */}
        <div style={{ backgroundColor: "#f9fafb", padding: "20px", borderRadius: "8px", marginBottom: "24px", border: "1px solid #e5e7eb" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#374151", margin: "0 0 16px 0" }}>
            Customer Information
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>
                Customer Name *
              </label>
              <input
                type="text"
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
                required
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>
                Phone *
              </label>
              <input
                type="text"
                value={custPhone}
                onChange={(e) => setCustPhone(e.target.value)}
                required
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
              />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>
              Address
            </label>
            <input
              type="text"
              value={custAddress}
              onChange={(e) => setCustAddress(e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />
          </div>
        </div>

        {/* ── Items ── */}
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#374151", margin: "0 0 16px 0" }}>Items</h3>
          <div style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f9fafb" }}>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e5e7eb" }}>
                    Variety
                  </th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e5e7eb", width: "100px" }}>
                    Qty
                  </th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e5e7eb", width: "120px" }}>
                    Unit Price
                  </th>
                  <th style={{ padding: "12px", textAlign: "right", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e5e7eb", width: "120px" }}>
                    Amount
                  </th>
                  <th style={{ padding: "12px", textAlign: "center", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e5e7eb", width: "60px" }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "12px" }}>
                      <select
                        value={it.varietyId}
                        onChange={(e) => handleItemChange(idx, "varietyId", e.target.value)}
                        required
                        style={{ ...inputStyle, margin: 0 }}
                      >
                        <option value="">Select Variety…</option>
                        {varieties.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <input
                        type="number"
                        value={it.qty}
                        onChange={(e) => handleItemChange(idx, "qty", e.target.value)}
                        required
                        min="1"
                        style={{ ...inputStyle, margin: 0 }}
                      />
                    </td>
                    <td style={{ padding: "12px" }}>
                      <input
                        type="text"
                        value={`PKR${it.unitPrice.toFixed(2)}`}
                        readOnly
                        style={{ ...inputStyle, margin: 0, backgroundColor: "#f9fafb", color: "#6b7280" }}
                      />
                    </td>
                    <td style={{ padding: "12px", textAlign: "right", fontWeight: "600", color: "#059669" }}>
                      PKR{(it.qty * it.unitPrice).toFixed(2)}
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <button type="button" onClick={() => removeItem(idx)} style={dangerButtonStyle} title="Remove Item">
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={addItem} style={{ ...primaryButtonStyle, marginTop: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>+</span> Add Item
          </button>
        </div>

        {/* ── Payment ── */}
        <div style={{ backgroundColor: "#f9fafb", padding: "20px", borderRadius: "8px", marginBottom: "24px", border: "1px solid #e5e7eb" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#374151", margin: "0 0 16px 0" }}>Payment Details</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px", alignItems: "end" }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
                Subtotal: PKR{subtotal.toFixed(2)}
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>
                Paid Now
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={paidNow}
                onChange={(e) => setPaidNow(e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
              />
            </div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: "600", color: balance > 0 ? "#dc2626" : "#059669", marginBottom: "8px" }}>
                Balance Due: PKR{balance.toFixed(2)}
              </div>
            </div>
          </div>
          <div style={{ marginTop: "16px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "500", color: "#374151", cursor: "pointer" }}>
              <input type="checkbox" checked={creditEnable} onChange={(e) => setCreditEnable(e.target.checked)} style={{ width: "16px", height: "16px" }} />
              Enable Credit Terms
            </label>
            {creditEnable && (
              <div style={{ marginTop: "12px", maxWidth: "200px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>
                  Due Date *
                </label>
                <input
                  type="date"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  required={creditEnable}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                  onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Actions ── */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => nav(-1)}
            style={secondaryButtonStyle}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#4b5563")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "#6b7280")}
          >
            ← Cancel
          </button>
          <button
            type="submit"
            style={primaryButtonStyle}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#2563eb")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "#3b82f6")}
          >
            {editMode ? "Update Invoice" : "Save Invoice"}
          </button>
        </div>
      </form>
    </div>
  )
}

