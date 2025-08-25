import React from "react";
import { HashRouter,BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";

import Dashboard    from "./pages/Dashboard";
import InvoiceList  from "./pages/InvoiceList";
import InvoiceForm  from "./pages/InvoiceForm";
import InvoicePrint from "./pages/InvoicePrint";
import CustomerList from "./pages/CustomerList";
import VarietyList  from "./pages/VarietyList";
import CustomerLedger from "./pages/CustomerLedger";
const nav = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/invoices",  label: "Invoices"  },
  { to: "/customers", label: "Customers" },
  { to: "/varieties", label: "Varieties" }
];

export default function App() {
  return (
    <HashRouter>
      <div className="app">
        <aside className="sidebar">
          <div className="brand">AK-Ledger</div>
          <nav className="nav">
            {nav.map(({to,label})=>(
              <NavLink
                key={to}
                to={to}
                className={({isActive})=> "nav-link"+(isActive?" active":"")}
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="main">
          <Routes>
            <Route path="/dashboard" element={<Dashboard/>}/>
            <Route path="/invoices" element={<InvoiceList/>}/>
            <Route path="/invoices/new" element={<InvoiceForm/>}/>
            <Route path="/invoices/:id/print" element={<InvoicePrint/>}/>
            <Route path="/customers" element={<CustomerList/>}/>
            <Route path="/varieties" element={<VarietyList/>}/>
            <Route path="/customer-ledger/:userId" element={<CustomerLedger />} />
            <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
            <Route path="/invoices/:id/edit"  element={<InvoiceForm editMode={true} />}/>
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}
