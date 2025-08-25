import { API_BASE_URL } from "../config";
import { useState, useEffect } from "react"

export default function VarietyList() {
  // State for fetched varieties, editing, and search
  const [data, setData] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [editingId, setEditingId] = useState(null)
  // Updated editForm state to include category and reorder, allowing null/empty
  const [editForm, setEditForm] = useState({ id: null, name: "", unit_price: 0, category: "", reorder_level: "", qty_on_hand: "" })
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  // Updated addForm state: removed unitCost and reorder
  const [addForm, setAddForm] = useState({ name: "", category: "", unitPrice: "", qty: "" })
  
  ////////////////////////////////////////////////////////////////////////////////////////////
  async function loadVarieties(searchTerm = "") {
    try {
     const res = await fetch(
      `${API_BASE_URL}/varieties?search=${encodeURIComponent(searchTerm)}&limit=100`
    )
      if (!res.ok) throw new Error("Fetch failed")
      const json = await res.json()
      setData(json)
    } catch (e) {
      console.error(e)
    }
  }

  // Fetch varieties on mount and when searchTerm changes
  useEffect(() => {
    loadVarieties(searchTerm)
  }, [searchTerm])

  // Handlers: edit
  const handleEdit = (v) => {
    setEditingId(v.id)
    setEditForm({
      id: v.id,
      name: v.name,
      unit_price: v.unit_price,
      category: v.category || "",          // For dropdown/input
      reorder_level: v.reorder_level || "", // For input
      qty_on_hand: v.qty_on_hand || ""     // Add stock field
    })
  }

  const handleSave = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/varieties/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          category: editForm.category || null, // Send null if empty string
          unitPrice: Number(editForm.unit_price),
          reorder: editForm.reorder_level ? Number(editForm.reorder_level) : undefined, // Send undefined to skip update
          qty: editForm.qty_on_hand ? Number(editForm.qty_on_hand) : null  // added
        }),
      })
      if (!res.ok) throw new Error("Update failed")
      const updated = await res.json()
      
      // Update the data more reliably
      setData(prevData => 
        prevData.map((v) => (v.id === updated.id ? { ...v, ...updated } : v))
      )
      setEditingId(null)
      setEditForm({ id: null, name: "", unit_price: 0, category: "", reorder_level: "", qty_on_hand: "" })
      
      // Reload to ensure data consistency
      await loadVarieties(searchTerm);
    } catch (e) {
      console.error(e)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditForm({ id: null, name: "", unit_price: 0, category: "", reorder_level: "", qty_on_hand: "" })
  }

  const handleAddVariety = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API_BASE_URL}/varieties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addForm.name,
          category: addForm.category, // Category is required
          unitPrice: Number(addForm.unitPrice),
          qty: Number(addForm.qty),
          // unitCost and reorder are no longer sent from the form
        }),
      })
      if (!res.ok) throw new Error("Add variety failed")
      const newVariety = await res.json()
      
      // Add new variety and reload to ensure consistency
      setData(prevData => [...prevData, newVariety].sort((a, b) => a.id - b.id))
      setIsAddModalOpen(false)
      setAddForm({ name: "", category: "", unitPrice: "", qty: "" })
      
      // Reload to ensure all fields are properly populated
      await loadVarieties(searchTerm)
    } catch (e) {
      console.error(e)
      alert("Failed to add variety. Please check console for details.")
    }
  }

  // Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this variety?")) return
    try {
      const res = await fetch(`${API_BASE_URL}/varieties/${id}`, { method: "DELETE" })
      if (res.status === 204) {
        setData(prevData => prevData.filter((v) => v.id !== id))
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Form change
  const handleInputChange = (field, val) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: field === "name" || field === "category" ? val : val,
    }))
  }

  const handleAddInputChange = (field, val) => setAddForm((prev) => ({ ...prev, [field]: val }))

  // Currency format
  const formatCurrency = (amt) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "PKR", minimumFractionDigits: 0 }).format(amt)

  const filteredData = data
    .filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.id - b.id) // Sort by ID

  // Styles
  const headerCell = {
    padding: "12px",
    textAlign: "left",
    fontWeight: 600,
    color: "#374151",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
  }
  const cellStyle = {
    padding: "12px",
    borderBottom: "1px solid #f3f4f6",
    verticalAlign: "middle",
  }
  const rowStyle = { 
    borderBottom: "1px solid #f3f4f6", 
    transition: "background-color 0.2s"
  }
  const inputStyle = {
    width: "100%",
    padding: "8px",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    fontSize: "14px",
  }
  const btnBase = {
    border: "none",
    borderRadius: "4px",
    padding: "6px 8px",
    cursor: "pointer",
    fontSize: "12px",
    color: "#fff",
    whiteSpace: "nowrap",
  }
  const saveStyle = { ...btnBase, backgroundColor: "#059669" }
  const cancelStyle = { ...btnBase, backgroundColor: "#6b7280" }
  const editStyle = { ...btnBase, backgroundColor: "#3b82f6" }
  const deleteStyle = { ...btnBase, backgroundColor: "#dc2626" }

  const modalOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  }

  const modalContentStyle = {
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "10px",
    boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
    width: "90%",
    maxWidth: "500px",
    position: "relative",
  }

  const modalCloseButtonStyle = {
    position: "absolute",
    top: "15px",
    right: "15px",
    background: "none",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: "#6b7280",
  }

  const formGroupStyle = {
    marginBottom: "15px",
  }

  const labelStyle = {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
    marginBottom: "6px",
  }

  const modalInputStyle = {
    width: "100%",
    padding: "10px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
  }

  const modalButtonContainerStyle = {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "20px",
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
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
            Fabric Varieties
          </h1>
          <button
            onClick={() => setIsAddModalOpen(true)}
            style={{
              backgroundColor: "#3b82f6",
              color: "white",
              padding: "10px 20px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#2563eb")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "#3b82f6")}
          >
            + Add Variety
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ padding: "24px", paddingBottom: "16px" }}>
          <div style={{ position: "relative", maxWidth: "400px" }}>
            <input
              type="text"
              placeholder="Search varieties by name..."
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
        <div style={{ padding: "24px" }}>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                tableLayout: "auto",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#f9fafb" }}>
                  <th style={{ ...headerCell, width: "60px" }}>ID</th>
                  <th style={{ ...headerCell, minWidth: "150px" }}>Name</th>
                  <th style={{ ...headerCell, minWidth: "120px" }}>Category</th>
                  <th style={{ ...headerCell, minWidth: "100px" }}>Price</th>
                  <th style={{ ...headerCell, minWidth: "80px" }}>Stock</th>
                  <th style={{ ...headerCell, minWidth: "120px" }}>Created At</th>
                  <th style={{ ...headerCell, textAlign: "center", minWidth: "140px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((v) => (
                  <tr
                    key={v.id}
                    style={rowStyle}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td style={{ ...cellStyle, fontWeight: "bold", color: "#1f2937" }}>{v.id}</td>
                    <td style={cellStyle}>
                      {editingId === v.id ? (
                        <input
                          value={editForm.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          style={inputStyle}
                        />
                      ) : (
                        <span style={{ fontWeight: 500, color: "#1f2937" }}>{v.name}</span>
                      )}
                    </td>
                    <td style={cellStyle}>
                      {editingId === v.id ? (
                        <input
                          type="text"
                          value={editForm.category}
                          onChange={(e) => handleInputChange("category", e.target.value)}
                          style={inputStyle}
                        />
                      ) : (
                        <span style={{ color: "#6b7280" }}>{v.category || "N/A"}</span>
                      )}
                    </td>
                    <td style={cellStyle}>
                      {editingId === v.id ? (
                        <input
                          type="number"
                          value={editForm.unit_price}
                          onChange={(e) => handleInputChange("unit_price", e.target.value)}
                          style={inputStyle}
                        />
                      ) : (
                        <span style={{ fontWeight: 600, color: "#059669" }}>{formatCurrency(v.unit_price)}</span>
                      )}
                    </td>
                    <td style={cellStyle}>
                      {editingId === v.id ? (
                        <input
                          type="number"
                          value={editForm.qty_on_hand}
                          onChange={(e) => handleInputChange("qty_on_hand", e.target.value)}
                          style={inputStyle}
                        />
                      ) : (
                        <span
                          style={{
                            fontWeight: 500,
                            color: v.qty_on_hand < 100 ? "#dc2626" : "#2563eb",
                          }}
                        >
                          {v.qty_on_hand || 0}m
                        </span>
                      )}
                    </td>
                    <td style={{ ...cellStyle, color: "#6b7280" }}>
                      {v.created_at ? new Date(v.created_at).toLocaleDateString() : "N/A"}
                    </td>
                    <td style={{ ...cellStyle, textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "nowrap" }}>
                        {editingId === v.id ? (
                          <>
                            <button onClick={handleSave} style={saveStyle}>
                              Save
                            </button>
                            <button onClick={handleCancel} style={cancelStyle}>
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleEdit(v)} style={editStyle}>
                              Edit
                            </button>
                            <button onClick={() => handleDelete(v.id)} style={deleteStyle}>
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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
              <p style={{ fontSize: 18, marginBottom: 16 }}>
                {searchTerm ? "No matching varieties" : "No varieties found"}
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                style={{
                  backgroundColor: "#3b82f6",
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Add Your First Variety
              </button>
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
              Showing {filteredData.length} of {data.length} varieties
            </p>
            <p style={{ margin: 0 }}>Low stock items: {filteredData.filter((item) => item.qty_on_hand < 100).length}</p>
          </div>
        </div>
      </div>
      {isAddModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <button onClick={() => setIsAddModalOpen(false)} style={modalCloseButtonStyle}>
              &times;
            </button>
            <h2 style={{ fontSize: "22px", fontWeight: "bold", color: "#1f2937", marginBottom: "20px" }}>
              Add New Variety
            </h2>
            <form onSubmit={handleAddVariety}>
              <div style={formGroupStyle}>
                <label style={labelStyle} htmlFor="add-name">
                  Name *
                </label>
                <input
                  id="add-name"
                  type="text"
                  value={addForm.name}
                  onChange={(e) => handleAddInputChange("name", e.target.value)}
                  style={modalInputStyle}
                  required
                />
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle} htmlFor="add-category">
                  Category *
                </label>
                <input
                  id="add-category"
                  type="text"
                  value={addForm.category}
                  onChange={(e) => handleAddInputChange("category", e.target.value)}
                  style={modalInputStyle}
                  required
                />
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle} htmlFor="add-unit-price">
                  Unit Price *
                </label>
                <input
                  id="add-unit-price"
                  type="number"
                  value={addForm.unitPrice}
                  onChange={(e) => handleAddInputChange("unitPrice", e.target.value)}
                  style={modalInputStyle}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle} htmlFor="add-qty-on-hand">
                  Quantity on Hand *
                </label>
                <input
                  id="add-qty-on-hand"
                  type="number"
                  value={addForm.qty}
                  onChange={(e) => handleAddInputChange("qty", e.target.value)}
                  style={modalInputStyle}
                  required
                  min="0"
                />
              </div>
              <div style={modalButtonContainerStyle}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ ...cancelStyle, padding: "10px 20px", fontSize: "14px" }}
                >
                  Cancel
                </button>
                <button type="submit" style={{ ...saveStyle, padding: "10px 20px", fontSize: "14px" }}>
                  Add Variety
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}