// src/config.js
const API_BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:4000"   // when running `npm run dev`
    : "http://localhost:4000";  // when running in Electron build or production

export { API_BASE_URL };
