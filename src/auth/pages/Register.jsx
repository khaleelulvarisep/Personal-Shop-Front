import { useState } from "react";
import { registerUser } from "../services/authService";
import { useNavigate, Link } from "react-router-dom";
import { parseBackendErrors } from "../utils/errorUtils";
import "./auth.css";

const DISPLAYED_FIELDS = [
  "first_name",
  "last_name",
  "email",
  "phone_number",
  "role",
  "password",
  "confirm_password",
];

function Register() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
    phone_number: "",
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
      await registerUser(form);
      alert("OTP sent to email");
      navigate("/verify");
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
        <h2>Create Account</h2>
        <p className="auth-subtitle">Register first, then verify OTP to activate.</p>

        {formError ? <p className="auth-error auth-error-global">{formError}</p> : null}
        {extraFieldErrors.map(([key, message]) => (
          <p key={key} className="auth-error auth-error-global">
            {message}
          </p>
        ))}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-row two-col">
            <div className="auth-field">
              <input
                className={`auth-input ${fieldErrors.first_name ? "has-error" : ""}`}
                type="text"
                name="first_name"
                placeholder="First Name"
                onChange={handleChange}
                required
              />
              {fieldErrors.first_name ? (
                <p className="auth-error">{fieldErrors.first_name}</p>
              ) : null}
            </div>

            <div className="auth-field">
              <input
                className={`auth-input ${fieldErrors.last_name ? "has-error" : ""}`}
                type="text"
                name="last_name"
                placeholder="Last Name"
                onChange={handleChange}
                required
              />
              {fieldErrors.last_name ? (
                <p className="auth-error">{fieldErrors.last_name}</p>
              ) : null}
            </div>
          </div>

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
              className={`auth-input ${fieldErrors.phone_number ? "has-error" : ""}`}
              type="tel"
              name="phone_number"
              placeholder="Phone Number"
              onChange={handleChange}
              required
            />
            {fieldErrors.phone_number ? (
              <p className="auth-error">{fieldErrors.phone_number}</p>
            ) : null}
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
            {fieldErrors.password ? <p className="auth-error">{fieldErrors.password}</p> : null}
          </div>

          <div className="auth-field">
            <input
              className={`auth-input ${fieldErrors.confirm_password ? "has-error" : ""}`}
              type="password"
              name="confirm_password"
              placeholder="Confirm Password"
              onChange={handleChange}
              required
            />
            {fieldErrors.confirm_password ? (
              <p className="auth-error">{fieldErrors.confirm_password}</p>
            ) : null}
          </div>

          <button className="auth-button" type="submit">
            Register
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
