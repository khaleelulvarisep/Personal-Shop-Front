import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../auth/pages/Login";
import Register from "../auth/pages/Register";
import VerifyOTP from "../auth/pages/VerifyOTP";
import MainLayout from "../shared/layouts/MainLayout";
import Home from "../shop/pages/Home";
import Orders from "../shop/pages/Orders";
import About from "../shop/pages/About";
import Contact from "../shop/pages/Contact";
import GroceryRequestForm from "../shop/pages/GroceryRequestForm";

const isAuthenticated = () => {
  return Boolean(localStorage.getItem("access_token"));
};

function ProtectedLayout() {
  return isAuthenticated() ? <MainLayout /> : <Navigate to="/login" replace />;
}

function PublicOnlyRoute({ children }) {
  return isAuthenticated() ? <Navigate to="/home" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={isAuthenticated() ? "/home" : "/login"} replace />}
      />

      <Route element={<ProtectedLayout />}>
        <Route path="/home" element={<Home />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/order" element={<GroceryRequestForm />} />

      </Route>

      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/verify"
        element={
          <PublicOnlyRoute>
            <VerifyOTP />
          </PublicOnlyRoute>
        }
      />
    </Routes>
  );
}

export default AppRoutes;
