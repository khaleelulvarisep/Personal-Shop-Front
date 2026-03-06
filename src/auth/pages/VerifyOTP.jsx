import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { verifyOTP } from "../services/authService";
import { parseBackendErrors } from "../utils/errorUtils";
import "./auth.css";

const DISPLAYED_FIELDS = ["email", "otp"];

function VerifyOTP() {
  const [form, setForm] = useState({
    email: "",
    otp: "",
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
      await verifyOTP(form);
      alert("Account verified successfully!");
      navigate("/login");
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
        <h2>Verify OTP</h2>
        <p className="auth-subtitle">Enter the OTP sent to your email address.</p>

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
              className={`auth-input ${fieldErrors.otp ? "has-error" : ""}`}
              type="text"
              name="otp"
              placeholder="Enter OTP"
              onChange={handleChange}
              required
            />
            {fieldErrors.otp ? <p className="auth-error">{fieldErrors.otp}</p> : null}
          </div>

          <button className="auth-button" type="submit">
            Verify
          </button>
        </form>

        <p className="auth-footer">
          Already verified? <Link to="/login">Go to login</Link>
        </p>
      </div>
    </div>
  );
}

export default VerifyOTP;
