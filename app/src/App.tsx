import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./components/pages/Home";
import AdminLogin from "./components/pages/AdminLogin";
import AdminDashboard from "./components/pages/AdminDashboard";
import "./App.css";

const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="p-6 bg-newsprint border border-old-ink text-center">
    <h2 className="font-serif text-xl text-old-ink mb-3 font-medium">
      {title}
    </h2>
    <p className="font-mono text-sm text-old-ink">
      This page is still being developed. Check back soon!
    </p>
  </div>
);

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated =
    sessionStorage.getItem("isAdminAuthenticated") === "true";

  return isAuthenticated ? (
    <>{children}</>
  ) : (
    <Navigate to="/admin/login" replace />
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route
            path="gallery"
            element={<PlaceholderPage title="Bench Gallery" />}
          />
          <Route
            path="bench/:id"
            element={<PlaceholderPage title="Bench Details" />}
          />
          <Route path="map" element={<PlaceholderPage title="Bench Map" />} />
        </Route>

        {/* Admin routes with Layout and isAdmin prop */}
        <Route path="/admin" element={<Layout isAdmin />}>
          <Route
            index
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route path="login" element={<AdminLogin />} />
        </Route>

        <Route path="*" element={<Layout />}>
          <Route
            index
            element={
              <div className="text-center py-10">
                <h2 className="newspaper-headline text-old-ink text-2xl">
                  Page Not Found
                </h2>
                <p className="font-serif mt-4 text-old-ink">
                  This edition is not available.
                </p>
              </div>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
