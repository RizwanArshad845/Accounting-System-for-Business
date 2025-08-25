
import { useState, useEffect, useRef } from "react"
import { API_BASE_URL } from "../config";
// Custom hook for count-up animation
function useCountUp(end, duration = 2000) {
  const [count, setCount] = useState(0)
  const requestRef = useRef()
  const startTimeRef = useRef()

  useEffect(() => {
    startTimeRef.current = null
    setCount(0) // Reset count when end value changes or component mounts

    const animate = (currentTime) => {
      if (!startTimeRef.current) startTimeRef.current = currentTime
      const progress = (currentTime - startTimeRef.current) / duration

      if (progress < 1) {
        setCount(Math.floor(progress * end))
        requestRef.current = requestAnimationFrame(animate)
      } else {
        setCount(end)
      }
    }

    requestRef.current = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(requestRef.current)
  }, [end, duration]) // Re-run effect if end value or duration changes [^1]

  return count
}

export default function Dashboard() {
  const [isContentVisible, setIsContentVisible] = useState(false)

  useEffect(() => {
    // Trigger fade-in after component mounts
    const timer = setTimeout(() => {
      setIsContentVisible(true)
    }, 100) // Small delay to ensure CSS transitions apply

    return () => clearTimeout(timer)
  }, [])

  // Animated numbers for stats (replace with actual data if available)
  const animatedInvoices = useCountUp(0)
  const animatedCustomers = useCountUp(0)
  const animatedVarieties = useCountUp(4)
  const animatedRevenue = useCountUp(0)

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      {/* Hero Section */}
      <div
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          padding: "80px 24px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background Pattern */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url("C:\Users\arsha\OneDrive\Desktop\Accounting System\frontend\public\images\Background.png")`,
            opacity: 0.3,
          }}
        />

        <div
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
          }}
        >
          <h1
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              marginBottom: "24px",
              textShadow: "0 2px 4px rgba(0,0,0,0.1)",
              lineHeight: "1.2",
            }}
          >
            Our Mission
          </h1>
          <p
            style={{
              fontSize: "20px",
              lineHeight: "1.6",
              opacity: 0.95,
              maxWidth: "700px",
              margin:"0 auto"
            }}
          >
            At AK-Ledger, we streamline your cloth-variety accounting with lightning-fast invoicing, intuitive credit
            tracking, and real-time stock updates—so you spend less time on paperwork and more time delighting your
            customers.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "40px 24px",
          opacity: isContentVisible ? 1 : 0,
          transform: isContentVisible ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
        }}
      >
        {/* Welcome Card */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "32px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            marginBottom: "32px",
            border: "1px solid #e2e8f0",
          }}
        >
          <h2
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#1a202c",
              marginBottom: "16px",
              margin: "0 0 16px 0",
            }}
          >
            Welcome to AK-Ledger
          </h2>
          <p
            style={{
              fontSize: "16px",
              lineHeight: "1.6",
              color: "#4a5568",
              margin: "0",
            }}
          >
            Navigate the sidebar to create invoices, manage customers, and track your varieties. Your financials,
            organized, efficient, and always up-to-date in a sleek dark-mode interface.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px",
            marginBottom: "32px",
          }}
        >
          {/* Quick Actions Card */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e2e8f0",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)"
              e.target.style.boxShadow = "0 10px 25px -5px rgba(0, 0, 0, 0.15)"
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)"
              e.target.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                backgroundColor: "#667eea",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <span style={{ fontSize: "24px" }}>⚡</span>
            </div>
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#1a202c",
                marginBottom: "8px",
                margin: "0 0 8px 0",
              }}
            >
              Quick Actions
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "#4a5568",
                lineHeight: "1.5",
                margin: "0",
              }}
            >
              Create invoices, add customers, and manage varieties with just a few clicks.
            </p>
          </div>

          {/* Real-time Updates Card */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e2e8f0",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)"
              e.target.style.boxShadow = "0 10px 25px -5px rgba(0, 0, 0, 0.15)"
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)"
              e.target.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                backgroundColor: "#48bb78",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <span style={{ fontSize: "24px" }}>📊</span>
            </div>
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#1a202c",
                marginBottom: "8px",
                margin: "0 0 8px 0",
              }}
            >
              Real-time Updates
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "#4a5568",
                lineHeight: "1.5",
                margin: "0",
              }}
            >
              Track your inventory and financial data with live updates across all devices.
            </p>
          </div>

          {/* Smart Organization Card */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e2e8f0",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)"
              e.target.style.boxShadow = "0 10px 25px -5px rgba(0, 0, 0, 0.15)"
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)"
              e.target.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                backgroundColor: "#ed8936",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <span style={{ fontSize: "24px" }}>🎯</span>
            </div>
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#1a202c",
                marginBottom: "8px",
                margin: "0 0 8px 0",
              }}
            >
              Smart Organization
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "#4a5568",
                lineHeight: "1.5",
                margin: "0",
              }}
            >
              Intelligent categorization and search to find what you need instantly.
            </p>
          </div>
        </div>
          </div>
        </div>
  )
}
