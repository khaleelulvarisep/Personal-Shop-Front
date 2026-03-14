import React, { useEffect, useState} from "react";
import API from "../../api/axios";
import "./Orders.css";
import { useNavigate } from "react-router-dom";
const MyOrders = () => {
  const navigate=useNavigate()
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const response = await API.get("/orders/my-orders/");
      setOrders(response.data.data);
    } catch (error) {
      console.error("Error fetching orders", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) {
    return <div className="orders-loading">Loading orders...</div>;
  }

  return (
    <div className="orders-page">

      <h2 className="orders-title">My Grocery Requests</h2>

      {orders.length === 0 ? (
        <p className="no-orders">No orders created yet.</p>
      ) : (
        <div className="orders-grid">

          {orders.map((order) => (
            <div key={order.id} className="order-card">

              <div className="order-header">
                <span className="order-id">Order #{order.id}</span>
                <span className={`order-status ${order.status}`}>
                  {order.status}
                </span>
              </div>

              <div className="order-body">

                <p>
                  <strong>Items:</strong> {order.items_text}
                </p>

                <p>
                  <strong>Budget:</strong> ₹{order.budget}
                </p>

                <p>
                  <strong>Urgency:</strong> {order.urgency}
                </p>

                <p>
                  <strong>Phone:</strong> {order.phone_number}
                </p>

                <p>
                  <strong>Address:</strong> {order.address_text}
                </p>

              </div>

              <div className="order-footer">
                <small>
                  Created: {new Date(order.created_at).toLocaleString()}
                </small>
              </div>
             <button
  onClick={() => {
    if (!order?.delivery_partner) {
      console.log("Driver not assigned yet");
      return;
    }

    navigate(`/track/${order.delivery_partner}`);
  }}
>
  Track Order
</button>

            </div>
          ))}

        </div>
      )}

    </div>
  );
};

export default MyOrders;