import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./components/pages/Home";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./services/firebase";
import "./App.css";

// Import placeholder for undeveloped pages
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="p-6 bg-cream border border-oldInk text-center">
    <h2 className="font-serif text-xl text-oldInk mb-3">{title}</h2>
    <p className="font-mono text-sm text-oldInk">
      This page is still being developed. Check back soon!
    </p>
  </div>
);

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAdmin(!!user);
    });

    return () => unsubscribe();
  }, []);

  if (isAdmin === null) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-pulse">
          <p className="font-serif text-oldInk">Checking credentials...</p>
        </div>
      </div>
    );
  }

  return isAdmin ? <>{children}</> : <Navigate to="/admin/login" replace />;
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
                <PlaceholderPage title="Admin Dashboard" />
              </AdminRoute>
            }
          />
          <Route
            path="login"
            element={<PlaceholderPage title="Admin Login" />}
          />
        </Route>

        <Route path="*" element={<Layout isAdmin={false} />}>
          <Route
            index
            element={
              <div className="text-center py-10">
                <h2 className="newspaper-headline">Page Not Found</h2>
                <p className="font-serif mt-4">
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
