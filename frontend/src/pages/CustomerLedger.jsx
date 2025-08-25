import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { API_BASE_URL } from "../config";
export default function CustomerLedger() {
  const { userId } = useParams()
  const [entries, setEntries] = useState([])
  const [editEntryId, setEditEntryId] = useState(null)
  const [form, setForm] = useState({ entryType: "PAYMENT", amount: "", remarks: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [newEntryForm, setNewEntryForm] = useState({
    entryType: "PAYMENT",
    amount: "",
    remarks: "",
    invoiceId: ""
  })
  const [showNewEntryForm, setShowNewEntryForm] = useState(false)

  // Fetch entries on component mount and userId change
  useEffect(() => {
    console.log("Requested userId from params:", userId);
    if (!userId) return;
    fetchEntries();
  }, [userId]);

  const fetchEntries = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/ledger/entries?userId=${userId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Fetched entries:", data);
      setEntries(data);
    } catch (err) {
      console.error("Error fetching entries:", err);
      setError("Failed to load ledger entries");
    } finally {
      setLoading(false);
    }
  };

  // Handle adding new entry
  const handleAddNewEntry = async (e) => {
    e.preventDefault();
    
    if (!newEntryForm.amount || isNaN(parseFloat(newEntryForm.amount))) {
      alert('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/ledger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: parseInt(userId),
          invoiceId: newEntryForm.invoiceId ? parseInt(newEntryForm.invoiceId) : null,
          entryType: newEntryForm.entryType,
          amount: parseFloat(newEntryForm.amount),
          remarks: newEntryForm.remarks
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Reset form and refresh entries
      setNewEntryForm({ entryType: "PAYMENT", amount: "", remarks: "", invoiceId: "" });
      setShowNewEntryForm(false);
      await fetchEntries();
      console.log('New entry added successfully');
    } catch (error) {
      console.error('Add entry error:', error);
      setError('Failed to add new entry');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete entry
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this ledger entry?")) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/ledger/${id}`, { 
        method: "DELETE" 
      });
      
      if (response.status === 204) {
        await fetchEntries(); // Refresh to get updated balances
        console.log(`Deleted entry with id: ${id}`);
      } else {
        throw new Error(`Delete failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      setError('Failed to delete entry');
    } finally {
      setLoading(false);
    }
  };

  // Start editing an entry
  const startEdit = (entry) => {
    setEditEntryId(entry.id);
    setForm({ 
      entryType: entry.entry_type, 
      amount: entry.amount.toString(),
      remarks: entry.remarks || "" 
    });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditEntryId(null);
    setForm({ entryType: "PAYMENT", amount: "", remarks: "" });
  };

  // Submit edit
  const submitEdit = async () => {
    if (!form.amount || isNaN(parseFloat(form.amount))) {
      alert('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/ledger/${editEntryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryType: form.entryType,
          amount: parseFloat(form.amount),
          remarks: form.remarks
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Update failed with status: ${response.status}`);
      }
      
      // Refresh entries to get updated balances
      await fetchEntries();
      cancelEdit();
      console.log('Entry updated successfully');
    } catch (error) {
      console.error('Update error:', error);
      setError('Failed to update entry');
    } finally {
      setLoading(false);
    }
  };

  // Calculate total balance (latest entry balance)
  const totalBalance = entries.length > 0 ? entries[entries.length - 1].balance : 0;

  if (loading && entries.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: "center", padding: "40px" }}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>
          Customer Ledger (User ID: {userId})
        </h2>
        <div style={balanceStyle}>
          Total Balance: PKR {totalBalance.toFixed(2)}
        </div>
      </div>

      {error && (
        <div style={errorStyle}>
          {error}
          <button 
            onClick={() => setError("")}
            style={closeErrorStyle}
          >
            ×
          </button>
        </div>
      )}

      {/* Add New Entry Section */}
      <div style={addEntrySection}>
        <button
          onClick={() => setShowNewEntryForm(!showNewEntryForm)}
          style={addButtonStyle}
          disabled={loading}
        >
          {showNewEntryForm ? "Cancel" : "Add New Entry"}
        </button>
      </div>

      {showNewEntryForm && (
        <form onSubmit={handleAddNewEntry} style={formStyle}>
          <div style={formRowStyle}>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Entry Type:</label>
              <select
                value={newEntryForm.entryType}
                onChange={(e) => setNewEntryForm(f => ({ ...f, entryType: e.target.value }))}
                style={selectStyle}
                required
              >
                <option value="PAYMENT">PAYMENT</option>
                <option value="INVOICE">INVOICE</option>
              </select>
            </div>
            
            <div style={formGroupStyle}>
              <label style={labelStyle}>Amount (PKR):</label>
              <input
                type="number"
                step="0.01"
                value={newEntryForm.amount}
                onChange={(e) => setNewEntryForm(f => ({ ...f, amount: e.target.value }))}
                style={inputStyle}
                placeholder="0.00"
                required
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Invoice ID (optional):</label>
              <input
                type="number"
                value={newEntryForm.invoiceId}
                onChange={(e) => setNewEntryForm(f => ({ ...f, invoiceId: e.target.value }))}
                style={inputStyle}
                placeholder="Invoice ID"
              />
            </div>
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Remarks:</label>
            <textarea
              value={newEntryForm.remarks}
              onChange={(e) => setNewEntryForm(f => ({ ...f, remarks: e.target.value }))}
              style={textareaStyle}
              placeholder="Enter remarks..."
              rows="3"
            />
          </div>

          <div style={formActionsStyle}>
            <button type="submit" style={submitButtonStyle} disabled={loading}>
              {loading ? "Adding..." : "Add Entry"}
            </button>
            <button 
              type="button" 
              onClick={() => setShowNewEntryForm(false)}
              style={cancelButtonStyle}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Entries Table */}
      {entries.length === 0 ? (
        <div style={noDataStyle}>
          <p>No ledger entries found.</p>
        </div>
      ) : (
        <div style={tableContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Amount</th>
                <th style={thStyle}>Balance</th>
                <th style={thStyle}>Invoice ID</th>
                <th style={thStyle}>Remarks</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} style={trStyle}>
                  <td style={tdStyle}>
                    {new Date(entry.created_at).toLocaleString()}
                  </td>
                  <td style={tdStyle}>
                    {editEntryId === entry.id ? (
                      <select 
                        value={form.entryType} 
                        onChange={e => setForm(f => ({ ...f, entryType: e.target.value }))}
                        style={editSelectStyle}
                      >
                        <option value="PAYMENT">PAYMENT</option>
                        <option value="INVOICE">INVOICE</option>
                      </select>
                    ) : (
                      <span style={entry.entry_type === "PAYMENT" ? paymentTypeStyle : invoiceTypeStyle}>
                        {entry.entry_type}
                      </span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    {editEntryId === entry.id ? (
                      <input
                        type="number"
                        step="0.01"
                        value={form.amount}
                        onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                        style={editInputStyle}
                      />
                    ) : (
                      <span style={entry.entry_type === "PAYMENT" ? paymentAmountStyle : invoiceAmountStyle}>
                        PKR {entry.amount.toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <span style={entry.balance >= 0 ? positiveBalanceStyle : negativeBalanceStyle}>
                      PKR {entry.balance.toFixed(2)}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {entry.invoice_id || "-"}
                  </td>
                  <td style={tdStyle}>
                    {editEntryId === entry.id ? (
                      <input
                        value={form.remarks}
                        onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
                        style={editInputStyle}
                        placeholder="Remarks..."
                      />
                    ) : (
                      entry.remarks || "-"
                    )}
                  </td>
                  <td style={tdStyle}>
                    {editEntryId === entry.id ? (
                      <>
                        <button 
                          onClick={submitEdit} 
                          style={saveButtonStyle}
                          disabled={loading}
                        >
                          {loading ? "..." : "Save"}
                        </button>
                        <button 
                          onClick={cancelEdit} 
                          style={cancelEditButtonStyle}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => startEdit(entry)} 
                          style={editButtonStyle}
                          disabled={loading}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(entry.id)} 
                          style={deleteButtonStyle}
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {loading && entries.length > 0 && (
        <div style={loadingOverlayStyle}>
          Processing...
        </div>
      )}
    </div>
  )
}

// Styles
const containerStyle = {
  padding: "24px",
  background: "#1f2937",
  color: "white",
  borderRadius: "10px",
  minHeight: "500px",
  position: "relative"
}

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "24px",
  flexWrap: "wrap"
}

const titleStyle = {
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0"
}

const balanceStyle = {
  fontSize: "18px",
  fontWeight: "600",
  padding: "8px 16px",
  backgroundColor: "#374151",
  borderRadius: "6px"
}

const errorStyle = {
  backgroundColor: "#dc2626",
  color: "white",
  padding: "12px",
  borderRadius: "6px",
  marginBottom: "16px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
}

const closeErrorStyle = {
  background: "none",
  border: "none",
  color: "white",
  fontSize: "18px",
  cursor: "pointer",
  padding: "0 4px"
}

const addEntrySection = {
  marginBottom: "20px"
}

const addButtonStyle = {
  backgroundColor: "#10b981",
  color: "white",
  border: "none",
  padding: "10px 20px",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600"
}

const formStyle = {
  backgroundColor: "#374151",
  padding: "20px",
  borderRadius: "8px",
  marginBottom: "24px"
}

const formRowStyle = {
  display: "flex",
  gap: "16px",
  marginBottom: "16px",
  flexWrap: "wrap"
}

const formGroupStyle = {
  flex: "1",
  minWidth: "200px"
}

const labelStyle = {
  display: "block",
  marginBottom: "4px",
  fontSize: "14px",
  fontWeight: "500"
}

const inputStyle = {
  width: "100%",
  padding: "8px",
  backgroundColor: "#4b5563",
  color: "white",
  border: "1px solid #6b7280",
  borderRadius: "4px",
  fontSize: "14px"
}

const selectStyle = {
  ...inputStyle,
  cursor: "pointer"
}

const textareaStyle = {
  ...inputStyle,
  resize: "vertical",
  minHeight: "80px"
}

const formActionsStyle = {
  display: "flex",
  gap: "12px",
  marginTop: "16px"
}

const submitButtonStyle = {
  backgroundColor: "#3b82f6",
  color: "white",
  border: "none",
  padding: "10px 20px",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "14px"
}

const cancelButtonStyle = {
  backgroundColor: "#6b7280",
  color: "white",
  border: "none",
  padding: "10px 20px",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "14px"
}

const noDataStyle = {
  textAlign: "center",
  padding: "40px",
  color: "#9ca3af"
}

const tableContainerStyle = {
  overflowX: "auto"
}

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  backgroundColor: "#111827",
  borderRadius: "8px",
  overflow: "hidden"
}

const thStyle = {
  padding: "12px",
  textAlign: "left",
  backgroundColor: "#2563eb",
  color: "white",
  fontWeight: "600",
  fontSize: "14px"
}

const trStyle = {
  borderBottom: "1px solid #374151"
}

const tdStyle = {
  padding: "12px",
  color: "#f3f4f6",
  fontSize: "14px"
}

const paymentTypeStyle = {
  color: "#10b981",
  fontWeight: "600"
}

const invoiceTypeStyle = {
  color: "#f59e0b",
  fontWeight: "600"
}

const paymentAmountStyle = {
  color: "#10b981"
}

const invoiceAmountStyle = {
  color: "#f59e0b"
}

const positiveBalanceStyle = {
  color: "#10b981",
  fontWeight: "600"
}

const negativeBalanceStyle = {
  color: "#ef4444",
  fontWeight: "600"
}

const editSelectStyle = {
  padding: "4px 8px",
  backgroundColor: "#4b5563",
  color: "white",
  border: "1px solid #6b7280",
  borderRadius: "4px",
  fontSize: "12px"
}

const editInputStyle = {
  padding: "4px 8px",
  backgroundColor: "#4b5563",
  color: "white",
  border: "1px solid #6b7280",
  borderRadius: "4px",
  fontSize: "12px",
  width: "100%"
}

const saveButtonStyle = {
  marginRight: "8px",
  padding: "6px 12px",
  fontSize: "12px",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  backgroundColor: "#10b981",
  color: "white"
}

const cancelEditButtonStyle = {
  padding: "6px 12px",
  fontSize: "12px",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  backgroundColor: "#6b7280",
  color: "white"
}

const editButtonStyle = {
  marginRight: "8px",
  padding: "6px 12px",
  fontSize: "12px",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  backgroundColor: "#3b82f6",
  color: "white"
}

const deleteButtonStyle = {
  padding: "6px 12px",
  fontSize: "12px",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  backgroundColor: "#dc2626",
  color: "white"
}

const loadingOverlayStyle = {
  position: "absolute",
  top: "0",
  left: "0",
  right: "0",
  bottom: "0",
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  fontSize: "16px",
  borderRadius: "10px"
}