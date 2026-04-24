import React, { useEffect, useMemo, useRef, useState } from "react";
import "./AiEstimatePrices.css";

function useDebouncedValue(value, delayMs) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debouncedValue;
}

const formatINR = (value) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Not available";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
};

const parseItemsPreview = (text) => {
  const parts = String(text ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.slice(0, 12);
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const DEFAULT_ENDPOINT = `${API_BASE_URL.replace(/\/$/, "")}/api/ai/estimate/`;

const normalizeSourceText = (sourceText) =>
  String(sourceText ?? "")
    .replace(/\n+/g, ", ")
    .replace(/\s+/g, " ")
    .trim();

export default function AiEstimatePrices({ text, endpoint = DEFAULT_ENDPOINT }) {
  const normalized = useMemo(() => normalizeSourceText(text), [text]);
  const debouncedText = useDebouncedValue(normalized, 500);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const abortRef = useRef(null);

  useEffect(() => {
    return () => abortRef.current?.abort?.();
  }, []);

  const previewItems = useMemo(() => parseItemsPreview(debouncedText), [debouncedText]);

  const startRequest = () => {
    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;
    return controller;
  };

  const handleEstimate = async () => {
    const trimmed = normalized.trim();
    if (!trimmed) {
      setError("Add items in Manifest Details first (e.g., “milk, rice”).");
      setResult(null);
      return;
    }
    if (loading) return;

    setLoading(true);
    setError("");
    setResult(null);

    const controller = startRequest();

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
        signal: controller.signal,
      });

      if (!res.ok) {
        let detail = "";
        try {
          const data = await res.json();
          detail = data?.detail || data?.error || JSON.stringify(data);
        } catch {
          detail = await res.text();
        }

        throw new Error(detail || `Request failed (${res.status})`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      if (err?.name === "AbortError") return;
      setError(err?.message || "Failed to fetch estimate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="ai-estimate">
      <header className="ai-estimate__header">
        <div className="ai-estimate__title">AI Price Estimate</div>
        <div className="ai-estimate__subtitle">
          Uses the text from your Manifest Details and fetches a price breakdown.
        </div>
      </header>

      <div className="ai-estimate__controls">
        <div className="ai-estimate__row ai-estimate__row--buttonOnly">
          <button type="button" className="ai-estimate__btn" onClick={handleEstimate} disabled={loading}>
            {loading ? "Loading..." : "Estimate Prices"}
          </button>
          <div className="ai-estimate__hint">
            {normalized ? "Ready to estimate." : "Add items in Manifest Details to enable estimation."}
          </div>
        </div>

        <div className="ai-estimate__meta">
          <div className="ai-estimate__preview" aria-live="polite">
            {normalized && debouncedText !== normalized ? "Typing…" : null}
            {previewItems.length ? (
              <span>
                {previewItems.length === 1 ? "Detected:" : "Detected:"} {previewItems.join(", ")}
                {parseItemsPreview(debouncedText).length >= 12 ? "…" : null}
              </span>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="ai-estimate__error" role="alert">
            {error}
          </div>
        ) : null}
      </div>

      {result ? (
        <div className="ai-estimate__results">
          <div className="ai-estimate__resultsHeader">
            <div className="ai-estimate__resultsTitle">Estimated Prices</div>
            <div className="ai-estimate__total">
              Total: <span className="ai-estimate__totalValue">{formatINR(result?.estimated_total)}</span>
            </div>
          </div>

          <div className="ai-estimate__grid">
            {(Array.isArray(result?.items) ? result.items : []).map((row, idx) => (
              <div className="ai-estimate__card" key={`${row?.item || "item"}-${idx}`}>
                <div className="ai-estimate__cardLabel">{row?.item || "Item"}</div>
                <div className="ai-estimate__cardValue">{formatINR(row?.estimated_price)}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
