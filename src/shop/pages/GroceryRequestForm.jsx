import React, { useState } from "react";
import API from "../../api/axios";
import { generateItemsForDish } from "../services/aiService";

import "./GroceryRequestForm.css";

const GroceryRequestForm = () => {
  const [formData, setFormData] = useState({
    items_text: "",
    budget: "",
    urgency: "2_hours",
    phone_number: "",
    new_address: "",
    latitude: "",
    longitude: "",
    address_text: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [addressMode, setAddressMode] = useState("new");

  const [dish, setDish] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleGenerateItems = async () => {
    const trimmedDish = dish.trim();

    if (!trimmedDish) {
      setGenerateError("Dish is required to generate items.");
      return;
    }

    setIsGenerating(true);
    setGenerateError("");

    try {
      const data = await generateItemsForDish(trimmedDish);

      const rawItemsText =
        data?.items_text ?? data?.itemsText ?? data?.items ?? "";

      const normalizedItemsText = Array.isArray(rawItemsText)
        ? rawItemsText.join("\n")
        : String(rawItemsText ?? "");

      if (!normalizedItemsText.trim()) {
        setGenerateError("AI service returned an empty list. Try another dish.");
        return;
      }

      setFormData((prev) => ({ ...prev, items_text: normalizedItemsText }));
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to generate items. Please try again.";
      setGenerateError(String(message));
    } finally {
      setIsGenerating(false);
    }
  };


  const handleGetLocation = () => {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  setIsLocating(true);

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude, accuracy } = position.coords;

      console.log("Latitude:", latitude);
      console.log("Longitude:", longitude);
      console.log("Accuracy:", accuracy, "meters");

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
        );

        const data = await response.json();

        setFormData((prev) => ({
          ...prev,
          latitude: latitude,
          longitude: longitude,
          address_text:
            data.display_name || "Address unavailable for this location.",
        }));
      } catch (error) {
        console.error("Error fetching address:", error);

        setFormData((prev) => ({
          ...prev,
          latitude,
          longitude,
          address_text: "Address unavailable for this location.",
        }));
      } finally {
        setIsLocating(false);
      }
    },

    (error) => {
      console.error("Geolocation error:", error);

      switch (error.code) {
        case error.PERMISSION_DENIED:
          alert("Location permission denied.");
          break;
        case error.POSITION_UNAVAILABLE:
          alert("Location information unavailable.");
          break;
        case error.TIMEOUT:
          alert("Location request timed out.");
          break;
        default:
          alert("An unknown error occurred.");
      }

      setIsLocating(false);
    },

    {
      enableHighAccuracy: true, // IMPORTANT
      timeout: 15000,           // wait up to 15s
      maximumAge: 0             // do not use cached location
    }
  );
};

  const handleUseCurrentLocation = () => {
    setAddressMode("current");
    handleGetLocation();
  };

  const geocodeAddress = async (address) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`
    );

    if (!response.ok) {
      throw new Error("Failed to geocode address.");
    }

    const results = await response.json();

    if (!results.length) {
      alert("No coordinates found for this address.")
      throw new Error("No coordinates found for this address.");
    }

    return {
      latitude: parseFloat(results[0].lat),
      longitude: parseFloat(results[0].lon),
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        items_text: formData.items_text,
        budget: formData.budget,
        urgency: formData.urgency,
        phone_number: formData.phone_number,
      };

      if (addressMode === "new") {
        const coords = await geocodeAddress(formData.new_address);
        payload.address_text = formData.new_address;
        payload.latitude = coords.latitude;
        payload.longitude = coords.longitude;
      }

      if (addressMode === "current") {
        payload.latitude = formData.latitude;
        payload.longitude = formData.longitude;
        payload.address_text = formData.address_text;
      }

      // await axios.post("/orders/create/", payload);

      await API.post("orders/orders/", payload);

      
      alert("Request Dispatched Successfully");
      setFormData({
        items_text: "",
        budget: "",
        urgency: "2_hours",
        phone_number: "",
        new_address: "",
        latitude: "",
        longitude: "",
        address_text: "",
      });
      setAddressMode("new");
    } catch (err) {
      console.error("Order submission failed:", err?.response?.data || err.message || err);
      alert("Submission error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="focused-page-wrapper">
      <div className="professional-card">
        <header className="form-header">
          <div className="brand-meta">System Dispatch</div>
          <h1>Grocery Request</h1>
          <p>Complete the manifest below to initiate local delivery protocol.</p>
        </header>

        <form onSubmit={handleSubmit} className="professional-form">
          <div className="input-block">
            <label>Generate From Dish (AI)</label>
            <div className="ai-generate-row">
              <input
                type="text"
                value={dish}
                onChange={(e) => setDish(e.target.value)}
                placeholder="e.g., Chicken biryani"
                autoComplete="off"
              />
              <button
                type="button"
                className="ai-generate-btn"
                onClick={handleGenerateItems}
                disabled={isGenerating || !dish.trim()}
              >
                {isGenerating ? "Generating..." : "Generate"}
              </button>
            </div>
            {generateError ? (
              <div className="ai-generate-error" role="alert">
                {generateError}
              </div>
            ) : (
              <div className="ai-generate-hint">
                Generates a grocery list and fills the manifest details.
              </div>
            )}
          </div>

          <div className="input-block">
            <label>Manifest Details</label>
            <textarea
              name="items_text"
              placeholder="List all required items here..."
              value={formData.items_text}
              onChange={handleChange}
              required
            />
          </div>

          <div className="logistics-grid">
            <div className="input-block">
              <label>Max Budget ($)</label>
              <input
                type="number"
                name="budget"
                placeholder="0.00"
                value={formData.budget}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-block">
              <label>Delivery Window</label>
              <select name="urgency" value={formData.urgency} onChange={handleChange}>
                <option value="2_hours">Standard (2 Hours)</option>
                <option value="1_hour">Priority (1 Hour)</option>
                <option value="30_mins">Flash (30 Minutes)</option>
              </select>
            </div>
          </div>

          <div className="input-block">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone_number"
              placeholder="Enter your phone number"
              value={formData.phone_number}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-block">
            <label>Delivery Address</label>
            <div className="address-mode-tabs">
              <button
                type="button"
                className={`address-mode-tab ${addressMode === "new" ? "active" : ""}`}
                onClick={() => setAddressMode("new")}
              >
                Add New Address
              </button>
              <button
                type="button"
                className={`address-mode-tab ${addressMode === "current" ? "active" : ""}`}
                onClick={handleUseCurrentLocation}
              >
                Use Current Location
              </button>
            </div>
            <div className="address-panel">
              {addressMode === "new" && (
                <textarea
                  name="new_address"
                  placeholder="Enter full delivery address"
                  value={formData.new_address}
                  onChange={handleChange}
                  required
                />
              )}

              {addressMode === "current" && (
                <div className="location-card">
                  <p className={`location-helper ${isLocating ? "loading" : ""}`}>
                    {isLocating
                      ? "Detecting your current location..."
                      : "Detected address can be edited before submit."}
                  </p>

                  <div className="location-preview">
                    <p className="location-preview-title">Detected Address</p>
                    <textarea
                      name="address_text"
                      placeholder="Detected address will appear here. You can edit it."
                      value={formData.address_text}
                      onChange={handleChange}
                      required
                    />
                    {!isLocating && !formData.address_text && (
                      <p className="location-empty">Waiting for location permission...</p>
                    )}
                    {formData.latitude && formData.longitude && (
                      <p className="location-coords">
                        Lat: {formData.latitude} | Lng: {formData.longitude}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="form-footer">
            <button type="submit" className="submit-action-btn" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Deploy Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroceryRequestForm;
