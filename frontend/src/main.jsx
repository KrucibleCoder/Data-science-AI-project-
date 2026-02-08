import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./index.css";
import App from "./App.jsx";
import DevDashboard from "./pages/DevDashboard.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* User-facing app */}
        <Route path="/" element={<App />} />

        {/* Developer-only dashboard (hidden route) */}
        <Route path="/__dev/dashboard" element={<DevDashboard />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
