import { useState, useEffect } from "react"
import { API_BASE_URL } from "../config";
export default function CustomerList() {
  // State for fetched customers, editing, and forms
  const [data, setData] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ full_name: "", phone: "", address: "" })
  const [searchTerm, setSearchTerm] = useState("")

  // Fetch customers
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/users?search=${encodeURIComponent(searchTerm)}&limit=15`)
        if (!res.ok) throw new Error("Fetch failed")
        setData(await res.json())
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [searchTerm]) // Re-fetch when search term changes [^1]

  // Handlers: edit
  const handleEdit = (c) => {
    setEditingId(c.id)
    setEditForm({ full_name: c.full_name, phone: c.phone, address: c.address })
  }

  const handleSave = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })
      if (res.ok) {
        const updated = await res.json()
        setData(data.map((c) => (c.id === updated.id ? updated : c)))
        setEditingId(null)
      } else console.error("Update failed")
    } catch (e) {
      console.error(e)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditForm({ full_name: "", phone: "", address: "" })
  }

  // Delete
  const handleDelete = async (id) => {
    if (!confirm("Delete this customer?")) return
    try {
      const res = await fetch(`${API_BASE_URL}/users/${id}`, { method: "DELETE" })
      if (res.status === 204) setData(data.filter((c) => c.id !== id))
    } catch (e) {
      console.error(e)
    }
  }

  // Handle input change for edit form
  const handleInputChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  // Filter and sort
  const filteredData = data
    .filter(
      (c) =>
        c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        c.address.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => a.id - b.id) // Sort by ID in ascending order

  // Styles
  const headerCell = {
    padding: "12px",
    textAlign: "left",
    fontWeight: "600",
    color: "#374151",
    borderBottom: "1px solid #e5e7eb",
  }
  const rowStyle = {
    borderBottom: "1px solid #f3f4f6",
    transition: "background-color 0.2s",
  }
  const inputStyle = {
    width: "100%",
    padding: "8px",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    fontSize: "14px",
  }
  const saveButtonStyle = {
    backgroundColor: "#059669",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "6px 8px",
    cursor: "pointer",
    fontSize: "12px",
    marginRight: "4px",
  }
  const cancelButtonStyle = {
    backgroundColor: "#6b7280",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "6px 8px",
    cursor: "pointer",
    fontSize: "12px",
  }
  const editButtonStyle = {
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "6px 8px",
    cursor: "pointer",
    fontSize: "12px",
    marginRight: "4px",
  }
  const deleteButtonStyle = {
    backgroundColor: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "6px 8px",
    cursor: "pointer",
    fontSize: "12px",
  }
  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
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
              fontSize: "24px",
              fontWeight: "bold",
              color: "#1f2937",
              margin: 0,
            }}
          >
            Customers
          </h1>
        </div>
        {/* Search Bar */}
        <div style={{ padding: "24px", paddingBottom: "16px" }}>
          <div style={{ position: "relative", maxWidth: "400px" }}>
            <input
              type="text"
              placeholder="Search by name, phone, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                  <th style={headerCell}>ID</th>
                  <th style={headerCell}>Customer Name</th>
                  <th style={headerCell}>Phone</th>
                  <th style={headerCell}>Address</th>
                  <th style={{ ...headerCell, textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((c) => {
                  return (
                    <tr
                      key={c.id}
                      style={rowStyle}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <td style={{ padding: "12px", fontWeight: "bold", color: "#1f2937" }}>{c.id}</td>
                      <td style={{ padding: "12px" }}>
                        {editingId === c.id ? (
                          <input
                            value={editForm.full_name}
                            onChange={(e) => handleInputChange("full_name", e.target.value)}
                            style={inputStyle}
                          />
                        ) : (
                          <span style={{ fontWeight: "500", color: "#1f2937" }}>{c.full_name}</span>
                        )}
                      </td>
                      <td style={{ padding: "12px" }}>
                        {editingId === c.id ? (
                          <input
                            value={editForm.phone}
                            onChange={(e) => handleInputChange("phone", e.target.value)}
                            style={inputStyle}
                          />
                        ) : (
                          <span style={{ fontWeight: "500", color: "#2563eb" }}>{c.phone}</span>
                        )}
                      </td>
                      <td style={{ padding: "12px" }}>
                        {editingId === c.id ? (
                          <input
                            value={editForm.address}
                            onChange={(e) => handleInputChange("address", e.target.value)}
                            style={inputStyle}
                          />
                        ) : (
                          <span style={{ color: "#6b7280" }}>{c.address}</span>
                        )}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                          {editingId === c.id ? (
                            <>
                              <button onClick={handleSave} style={saveButtonStyle} title="Save">
                                ✓
                              </button>
                              <button onClick={handleCancel} style={cancelButtonStyle} title="Cancel">
                                ✕
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => handleEdit(c)} style={editButtonStyle} title="Edit">
                                Edit
                              </button>
                              <button onClick={() => handleDelete(c.id)} style={deleteButtonStyle} title="Delete">
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filteredData.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "48px 0",
                color: "#6b7280",
              }}
            >
              <p style={{ fontSize: "18px", marginBottom: "16px" }}>
                {searchTerm ? "No customers found matching your search" : "No customers found"}
              </p>
            </div>
          )}
          {/* Summary */}
          <div
            style={{
              marginTop: "24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "14px",
              color: "#6b7280",
              padding: "16px",
              backgroundColor: "#f9fafb",
              borderRadius: "6px",
            }}
          >
            <p style={{ margin: 0 }}>
              Showing {filteredData.length} of {data.length} customers
            </p>
            <p style={{ margin: 0 }}>Total customers: {data.length}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
