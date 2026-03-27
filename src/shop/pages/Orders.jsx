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

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

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

  const statusOptions = useMemo(() => {
    const values = new Set(
      (orders ?? []).map((o) => normalizeStatus(o?.status)).filter(Boolean)
    );
    return ["all", ...Array.from(values).sort()];
  }, [orders]);

  const orderCounts = useMemo(() => {
    const counts = {
      total: 0,
      pending: 0,
      processing: 0,
      delivered: 0,
      cancelled: 0,
    };

    (orders ?? []).forEach((order) => {
      counts.total += 1;
      const bucket = statusBadgeClass(order?.status);
      if (bucket in counts) counts[bucket] += 1;
    });

    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const safeOrders = Array.isArray(orders) ? orders : [];
    const q = query.trim().toLowerCase();

    const filtered = safeOrders.filter((order) => {
      const matchesStatus =
        statusFilter === "all" ||
        normalizeStatus(order?.status) === statusFilter;
      if (!matchesStatus) return false;

      if (!q) return true;
      const haystack = [
        order?.items_text,
        order?.address_text,
        order?.phone_number,
        String(order?.id ?? ""),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });

    const getCreatedAt = (order) => {
      const time = new Date(order?.created_at ?? 0).getTime();
      return Number.isFinite(time) ? time : 0;
    };

    const getBudget = (order) => {
      const numeric = Number(order?.budget);
      return Number.isFinite(numeric) ? numeric : 0;
    };

    return [...filtered].sort((a, b) => {
      if (sortBy === "oldest") return getCreatedAt(a) - getCreatedAt(b);
      if (sortBy === "budget_asc") return getBudget(a) - getBudget(b);
      if (sortBy === "budget_desc") return getBudget(b) - getBudget(a);
      return getCreatedAt(b) - getCreatedAt(a);
    });
  }, [orders, query, sortBy, statusFilter]);

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
          <div className="shop-badge">Orders</div>
          <h1 className="orders-title">My grocery requests</h1>
          <p className="orders-subtitle">
            Search, filter, and track your latest requests.
          </p>
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

      <div className="orders-summary" aria-label="Order summary">
        <div className="orders-summary-card">
          <div className="orders-summary-label">Total</div>
          <div className="orders-summary-value">{orderCounts.total}</div>
        </div>
        <div className="orders-summary-card">
          <div className="orders-summary-label">Pending</div>
          <div className="orders-summary-value">{orderCounts.pending}</div>
        </div>
        <div className="orders-summary-card">
          <div className="orders-summary-label">In progress</div>
          <div className="orders-summary-value">{orderCounts.processing}</div>
        </div>
        <div className="orders-summary-card">
          <div className="orders-summary-label">Delivered</div>
          <div className="orders-summary-value">{orderCounts.delivered}</div>
        </div>
      </div>

      <div className="orders-filters" aria-label="Order filters">
        <div className="orders-field orders-field-wide">
          <label className="orders-label" htmlFor="orders-search">
            Search
          </label>
          <input
            id="orders-search"
            className="orders-input"
            type="search"
            placeholder="Search by items, address, phone, or order #"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="orders-field">
          <label className="orders-label" htmlFor="orders-status">
            Status
          </label>
          <select
            id="orders-status"
            className="orders-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statusOptions.map((value) => (
              <option key={value} value={value}>
                {value === "all" ? "All" : value.replace(/-/g, " ")}
              </option>
            ))}
          </select>
        </div>

        <div className="orders-field">
          <label className="orders-label" htmlFor="orders-sort">
            Sort
          </label>
          <select
            id="orders-sort"
            className="orders-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="budget_desc">Budget: high to low</option>
            <option value="budget_asc">Budget: low to high</option>
          </select>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="orders-empty">
          <div className="orders-empty-title">No orders found!</div>
          <div className="orders-empty-text">
            {orders.length === 0
              ? "You haven't created any grocery requests yet."
              : "Try adjusting your search or filters."}
          </div>
          {orders.length === 0 ? (
            <button
              type="button"
              className="orders-action-btn orders-primary-btn"
              onClick={() => navigate("/order")}
            >
              Create your first request
            </button>
          ) : null}
        </div>
      ) : (
        <div className="orders-table-wrap">
          <table className="orders-table">
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Status</th>
                <th scope="col">Items</th>
                <th scope="col">Budget</th>
                <th scope="col">Urgency</th>
                <th scope="col">Contact</th>
                <th scope="col">Created</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const trackingAvailable = Boolean(order?.delivery_partner);
                return (
                  <tr key={order?.id}>
                    <td className="orders-order-cell">
                      <div className="orders-order-id">#{order?.id ?? "-"}</div>
                      <div className="orders-order-address">
                        {order?.address_text ?? "-"}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`order-status-badge ${statusBadgeClass(
                          order?.status
                        )}`}
                        title={String(order?.status ?? "Unknown")}
                      >
                        {statusLabel(order?.status)}
                      </span>
                    </td>
                    <td className="orders-items-cell">
                      {order?.items_text ?? "-"}
                    </td>
                    <td>{formatMoney(order?.budget)}</td>
                    <td>
                      <span
                        className={`orders-urgency ${
                          normalizeStatus(order?.urgency) || "default"
                        }`}
                      >
                        {order?.urgency ?? "-"}
                      </span>
                    </td>
                    <td className="orders-contact-cell">
                      <div>{order?.phone_number ?? "-"}</div>
                    </td>
                    <td>
                      {order?.created_at
                        ? new Date(order.created_at).toLocaleString()
                        : "-"}
                    </td>
                    <td>
                      <div className="orders-tracking-actions">
                        <button
                          type="button"
                          className="orders-track-btn"
                          onClick={() =>
                            navigate(`/track/${order.delivery_partner}`)
                          }
                          disabled={!trackingAvailable}
                          title={
                            trackingAvailable
                              ? "Track your delivery partner"
                              : "Tracking becomes available after a driver is assigned"
                          }
                        >
                          Track
                        </button>

                        {normalizeStatus(order?.status) === "accepted" ? (
                          <button
                            type="button"
                            className="orders-chat-btn"
                            onClick={() => navigate(`/chat/${order?.id}`)}
                            title="Open chat with your driver"
                          >
                            Chat
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="orders-table-footnote">
            Showing {filteredOrders.length} of {orders.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
