import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/authService";
import { parseBackendErrors } from "../utils/errorUtils";
import "./auth.css";

const DISPLAYED_FIELDS = ["email", "password"];

function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");

  const navigate = useNavigate();

  const extraFieldErrors = Object.entries(fieldErrors).filter(
    ([key]) => !DISPLAYED_FIELDS.includes(key)
  );

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value,
    });

    setFieldErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setFormError("");

    try {
      const response = await loginUser(form);
      const { access, refresh } = response.data || {};

      if (access) {
        localStorage.setItem("access_token", access);
      }

      if (refresh) {
        localStorage.setItem("refresh_token", refresh);
      }
     
      localStorage.setItem("user_id", response.data.user.id);
      alert("Login successful!");
      
      navigate("/home");
    } catch (error) {
      const { fieldErrors: parsedFieldErrors, formError: parsedFormError } =
        parseBackendErrors(error);

      setFieldErrors(parsedFieldErrors);
      setFormError(parsedFormError || "");
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h2>Welcome Back</h2>
        <p className="auth-subtitle">Login to continue to your account.</p>

        {formError ? <p className="auth-error auth-error-global">{formError}</p> : null}
        {extraFieldErrors.map(([key, message]) => (
          <p key={key} className="auth-error auth-error-global">
            {message}
          </p>
        ))}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <input
              className={`auth-input ${fieldErrors.email ? "has-error" : ""}`}
              type="email"
              name="email"
              placeholder="Email"
              onChange={handleChange}
              required
            />
            {fieldErrors.email ? <p className="auth-error">{fieldErrors.email}</p> : null}
          </div>

          <div className="auth-field">
            <input
              className={`auth-input ${fieldErrors.password ? "has-error" : ""}`}
              type="password"
              name="password"
              placeholder="Password"
              onChange={handleChange}
              required
            />
            {fieldErrors.password ? (
              <p className="auth-error">{fieldErrors.password}</p>
            ) : null}
          </div>

          <button className="auth-button" type="submit">
            Login
          </button>
        </form>

        <p className="auth-footer">
          New user? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
