import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import "./Orders.css";

const normalizeStatus = (status) =>
  String(status ?? "unknown")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

const statusBadgeClass = (status) => {
  const normalized = normalizeStatus(status);
  if (normalized === "accepted") return "processing";
  if (normalized === "in-transit" || normalized === "out-for-delivery") {
    return "processing";
  }
  if (normalized === "canceled") return "cancelled";
  if (
    normalized === "pending" ||
    normalized === "processing" ||
    normalized === "delivered" ||
    normalized === "cancelled"
  ) {
    return normalized;
  }
  return "default";
};

const statusLabel = (status) => {
  const normalized = normalizeStatus(status);
  if (normalized === "in-transit") return "In transit";
  if (normalized === "out-for-delivery") return "Out for delivery";
  if (normalized === "canceled") return "Cancelled";
  if (!normalized || normalized === "unknown") return "Unknown";
  return normalized.replace(/-/g, " ");
};

const formatMoney = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "-";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(numeric);
  } catch {
    return `\u20B9${numeric.toFixed(0)}`;
  }
};

const MyOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async ({ silent = false } = {}) => {
    try {
      setError("");
      if (!silent) setLoading(true);
      setRefreshing(silent);

      const response = await API.get("/orders/my-orders/");
      setOrders(response?.data?.data ?? []);
    } catch (err) {
      console.error("Error fetching orders", err);
      setError("Could not load your orders. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!selectedOrder) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setSelectedOrder(null);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedOrder]);

  const displayOrders = useMemo(() => {
    const safeOrders = Array.isArray(orders) ? orders : [];
    const getCreatedAt = (order) => {
      const time = new Date(order?.created_at ?? 0).getTime();
      return Number.isFinite(time) ? time : 0;
    };
    return [...safeOrders].sort((a, b) => getCreatedAt(b) - getCreatedAt(a));
  }, [orders]);

  if (loading) {
    return (
      <div className="orders-loading" role="status" aria-live="polite">
        <div className="orders-loading-title">Loading your orders...</div>
        <div className="orders-skeleton" aria-hidden="true">
          <div className="orders-skeleton-row" />
          <div className="orders-skeleton-row" />
          <div className="orders-skeleton-row" />
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page shop-page">
      <div className="orders-header">
        <div>
          <h1 className="orders-title">My grocery requests</h1>
        </div>

        <div className="orders-header-actions">
          <button
            type="button"
            className="orders-action-btn orders-primary-btn"
            onClick={() => navigate("/order")}
          >
            New request
          </button>
          <button
            type="button"
            className="orders-action-btn orders-secondary-btn"
            onClick={() => fetchOrders({ silent: true })}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="orders-error" role="alert">
          {error}
        </div>
      ) : null}

      {displayOrders.length === 0 ? (
        <div className="orders-empty">
          <div className="orders-empty-title">No orders found!</div>
          <div className="orders-empty-text">
            You haven't created any grocery requests yet.
          </div>
          <button
            type="button"
            className="orders-action-btn orders-primary-btn"
            onClick={() => navigate("/order")}
          >
            Create your first request
          </button>
        </div>
      ) : (
        <div className="orders-grid-wrap">
          <div className="orders-grid" role="list">
            {displayOrders.map((order) => {
              const trackingAvailable = Boolean(order?.delivery_partner);
              const chatAvailable = normalizeStatus(order?.status) === "accepted";
              const createdAt = order?.created_at
                ? new Date(order.created_at).toLocaleString()
                : "-";
              return (
                <div
                  key={order?.id}
                  role="listitem"
                  className="orders-card"
                  tabIndex={0}
                  onClick={() => setSelectedOrder(order)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedOrder(order);
                    }
                  }}
                  aria-label={`Open order ${order?.id ?? ""} details`}
                >
                  <div className="orders-card-top">
                    <div>
                      <div className="orders-order-id">#{order?.id ?? "-"}</div>
                      <div className="orders-card-created">{createdAt}</div>
                    </div>

                    <span
                      className={`order-status-badge ${statusBadgeClass(
                        order?.status
                      )}`}
                      title={String(order?.status ?? "Unknown")}
                    >
                      {statusLabel(order?.status)}
                    </span>
                  </div>

                  <div className="orders-card-meta">
                    <div className="orders-card-meta-item">
                      <div className="orders-card-meta-label">Address</div>
                      <div className="orders-order-address">
                        {order?.address_text ?? "-"}
                      </div>
                    </div>

                    <div className="orders-card-meta-item">
                      <div className="orders-card-meta-label">Items</div>
                      <div className="orders-items-cell">
                        {order?.items_text ?? "-"}
                      </div>
                    </div>
                  </div>

                  <div className="orders-card-bottom">
                    <div className="orders-card-chips">
                      <div className="orders-chip">
                        <div className="orders-chip-label">Budget</div>
                        <div className="orders-chip-value">
                          {formatMoney(order?.budget)}
                        </div>
                      </div>

                      <span
                        className={`orders-urgency ${
                          normalizeStatus(order?.urgency) || "default"
                        }`}
                        title="Urgency"
                      >
                        {order?.urgency ?? "-"}
                      </span>
                    </div>

                    <div className="orders-card-actions">
                      <button
                        type="button"
                        className="orders-track-btn"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (!trackingAvailable) return;
                          navigate(`/track/${order.delivery_partner}`);
                        }}
                        disabled={!trackingAvailable}
                        title={
                          trackingAvailable
                            ? "Track your delivery partner"
                            : "Tracking becomes available after a driver is assigned"
                        }
                      >
                        Track
                      </button>

                      <button
                        type="button"
                        className="orders-chat-btn"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (!chatAvailable) return;
                          navigate(`/chat/${order?.id}`);
                        }}
                        disabled={!chatAvailable}
                        title={
                          chatAvailable
                            ? "Open chat with your driver"
                            : "Chat becomes available after your order is accepted"
                        }
                      >
                        Chat
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedOrder ? (
        <div
          className="orders-modal-backdrop"
          role="presentation"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="orders-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Order #${selectedOrder?.id ?? ""} details`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="orders-modal-head">
              <div>
                <div className="orders-modal-title">
                  Order #{selectedOrder?.id ?? "-"}
                </div>
                <div className="orders-modal-subtitle">
                  {selectedOrder?.created_at
                    ? new Date(selectedOrder.created_at).toLocaleString()
                    : "-"}
                </div>
              </div>

              <div className="orders-modal-head-right">
                <span
                  className={`order-status-badge ${statusBadgeClass(
                    selectedOrder?.status
                  )}`}
                  title={String(selectedOrder?.status ?? "Unknown")}
                >
                  {statusLabel(selectedOrder?.status)}
                </span>

                <button
                  type="button"
                  className="orders-modal-close"
                  onClick={() => setSelectedOrder(null)}
                  aria-label="Close order details"
                  title="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="orders-modal-content">
              <div className="orders-modal-grid">
                <div className="orders-modal-section">
                  <div className="orders-modal-section-title">Request</div>
                  <div className="orders-modal-row">
                    <div className="orders-modal-label">Items</div>
                    <div className="orders-modal-value">
                      {selectedOrder?.items_text ?? "-"}
                    </div>
                  </div>
                  <div className="orders-modal-row">
                    <div className="orders-modal-label">Budget</div>
                    <div className="orders-modal-value">
                      {formatMoney(selectedOrder?.budget)}
                    </div>
                  </div>
                  <div className="orders-modal-row">
                    <div className="orders-modal-label">Urgency</div>
                    <div className="orders-modal-value">
                      <span
                        className={`orders-urgency ${
                          normalizeStatus(selectedOrder?.urgency) || "default"
                        }`}
                      >
                        {selectedOrder?.urgency ?? "-"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="orders-modal-section">
                  <div className="orders-modal-section-title">Delivery</div>
                  <div className="orders-modal-row">
                    <div className="orders-modal-label">Address</div>
                    <div className="orders-modal-value">
                      {selectedOrder?.address_text ?? "-"}
                    </div>
                  </div>
                  <div className="orders-modal-row">
                    <div className="orders-modal-label">Phone</div>
                    <div className="orders-modal-value">
                      {selectedOrder?.phone_number ?? "-"}
                    </div>
                  </div>
                  <div className="orders-modal-row">
                    <div className="orders-modal-label">Driver</div>
                    <div className="orders-modal-value">
                      {selectedOrder?.delivery_partner
                        ? `#${selectedOrder.delivery_partner}`
                        : "-"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="orders-modal-actions">
                <button
                  type="button"
                  className="orders-track-btn"
                  onClick={() =>
                    selectedOrder?.delivery_partner
                      ? navigate(`/track/${selectedOrder.delivery_partner}`)
                      : null
                  }
                  disabled={!selectedOrder?.delivery_partner}
                  title={
                    selectedOrder?.delivery_partner
                      ? "Track your delivery partner"
                      : "Tracking becomes available after a driver is assigned"
                  }
                >
                  Track
                </button>
                <button
                  type="button"
                  className="orders-chat-btn"
                  onClick={() => navigate(`/chat/${selectedOrder?.id}`)}
                  disabled={normalizeStatus(selectedOrder?.status) !== "accepted"}
                  title={
                    normalizeStatus(selectedOrder?.status) === "accepted"
                      ? "Open chat with your driver"
                      : "Chat becomes available after your order is accepted"
                  }
                >
                  Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MyOrders;
