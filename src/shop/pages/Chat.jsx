// import React, { useEffect, useMemo, useRef, useState } from "react";
// import "./Chat.css";

// const Chat = ({ orderId, userId }) => {
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState("");
//   const [connectionState, setConnectionState] = useState("connecting");
//   const socketRef = useRef(null);
//   const scrollAnchorRef = useRef(null);

//   useEffect(() => {
//     const ws = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${orderId}/`);
//     socketRef.current = ws;

//     ws.onopen = () => setConnectionState("connected");
//     ws.onmessage = (event) => {
//       const data = JSON.parse(event.data);
//       setMessages((prev) => [...prev, data]);
//     };
//     ws.onerror = () => setConnectionState("error");
//     ws.onclose = () => setConnectionState("disconnected");

//     return () => {
//       socketRef.current = null;
//       ws.close();
//     };
//   }, [orderId]);

//   useEffect(() => {
//     scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages.length]);

//   const normalizedUserId = String(userId ?? "");

//   const isConnected = connectionState === "connected";

//   const statusLabel = useMemo(() => {
//     if (connectionState === "connected") return "Connected";
//     if (connectionState === "disconnected") return "Offline";
//     if (connectionState === "error") return "Connection issue";
//     return "Connecting…";
//   }, [connectionState]);

//   const hintText = useMemo(() => {
//     if (isConnected) return "Press Enter to send.";
//     if (connectionState === "disconnected") return "Reconnect to send messages.";
//     if (connectionState === "error") return "Fix your connection to send messages.";
//     return "Connecting… you can type while we connect.";
//   }, [connectionState, isConnected]);

//   const sendMessage = () => {
//     const text = input.trim();
//     if (!text) return;

//     const socket = socketRef.current;
//     if (!socket || socket.readyState !== WebSocket.OPEN) return;

//     socket.send(
//       JSON.stringify({
//         message: text,
//         user_id: userId,
//       })
//     );
//     setInput("");
//   };

//   const handleSubmit = (event) => {
//     event.preventDefault();
//     sendMessage();
//   };

//   return (
//     <section className="chat-page shop-page">
//       <header className="chat-header">
//         <div>
//           <div className="shop-badge">Chat</div>
//           <h1 className="chat-title">Order #{orderId}</h1>
//           <p className="chat-subtitle">
//             Message your delivery partner about this order.
//           </p>
//         </div>
//         <div className={`chat-status chat-status--${connectionState}`}>
//           <span className="chat-status-dot" aria-hidden="true" />
//           <span>{statusLabel}</span>
//         </div>
//       </header>

//       <div
//         className="chat-card"
//         role="group"
//         aria-label="Chat"
//       >
//         <div
//           className={`chat-messages ${
//             messages.length === 0 ? "chat-messages--empty" : ""
//           }`}
//           aria-label="Messages"
//           role="log"
//           aria-live="polite"
//           aria-relevant="additions text"
//         >
//           {messages.length === 0 ? (
//             <div className="chat-empty">
//               <div className="chat-empty-title">No messages yet</div>
//               <div className="chat-empty-text">
//                 Send a quick note like “I’m at the gate” or “Please call when
//                 you arrive”.
//               </div>
//             </div>
//           ) : (
//             messages.map((msg, i) => {
//               const isMine = String(msg?.user_id ?? "") === normalizedUserId;
//               return (
//                 <div
//                   key={`${i}-${String(msg?.user_id ?? "")}`}
//                   className={`chat-row ${
//                     isMine ? "chat-row--me" : "chat-row--them"
//                   }`}
//                 >
//                   <div
//                     className={`chat-bubble ${
//                       isMine ? "chat-bubble--me" : "chat-bubble--them"
//                     }`}
//                   >
//                     <div className="chat-bubble-text">{msg?.message ?? ""}</div>
//                   </div>
//                 </div>
//               );
//             })
//           )}
//           <div ref={scrollAnchorRef} />
//         </div>

//         <form className="chat-composer" onSubmit={handleSubmit}>
//           <label className="chat-input-label" htmlFor="chat-message">
//             Message
//           </label>
//           <div className="chat-composer-row">
//             <input
//               id="chat-message"
//               className="chat-input"
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               placeholder={
//                 isConnected ? "Type a message…" : "Connecting to chat…"
//               }
//               autoComplete="off"
//             />
//             <button
//               type="submit"
//               className="chat-send-btn"
//               disabled={!isConnected || input.trim().length === 0}
//               title={
//                 !isConnected
//                   ? "Waiting for connection"
//                   : input.trim().length === 0
//                     ? "Type a message first"
//                     : "Send message"
//               }
//             >
//               Send
//             </button>
//           </div>
//           <div className="chat-hint">{hintText}</div>
//         </form>
//       </div>
//     </section>
//   );
// };

// export default Chat;






import React, { useEffect, useMemo, useRef, useState } from "react";
import "./Chat.css";
import API from "../../api/axios"; // ✅ IMPORT YOUR AXIOS INSTANCE

const Chat = ({ orderId, userId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [connectionState, setConnectionState] = useState("connecting");

  const socketRef = useRef(null);
  const scrollAnchorRef = useRef(null);

  // ✅ NEW: FETCH OLD MESSAGES
  const fetchMessages = async () => {
    try {
      const res = await API.get(`orders/chat/${orderId}/`);
      setMessages(res.data);
    } catch (error) {
      console.log("❌ Error fetching messages:", error);
    }
  };

  // ✅ UPDATED useEffect
  useEffect(() => {
    if (!orderId) return;

    fetchMessages(); // 🔥 LOAD OLD MESSAGES

    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${orderId}/`);
    socketRef.current = ws;

    ws.onopen = () => setConnectionState("connected");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]); // ✅ append new messages
    };

    ws.onerror = () => setConnectionState("error");
    ws.onclose = () => setConnectionState("disconnected");

    return () => {
      socketRef.current = null;
      ws.close();
    };
  }, [orderId]);

  // ✅ AUTO SCROLL (no change)
  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const normalizedUserId = Number(userId);

  const isConnected = connectionState === "connected";

  const statusLabel = useMemo(() => {
    if (connectionState === "connected") return "Connected";
    if (connectionState === "disconnected") return "Offline";
    if (connectionState === "error") return "Connection issue";
    return "Connecting…";
  }, [connectionState]);

  const hintText = useMemo(() => {
    if (isConnected) return "Press Enter to send.";
    if (connectionState === "disconnected") return "Reconnect to send messages.";
    if (connectionState === "error") return "Fix your connection to send messages.";
    return "Connecting… you can type while we connect.";
  }, [connectionState, isConnected]);

  // ✅ FIXED sendMessage (ensure number)
  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;

    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    socket.send(
      JSON.stringify({
        message: text,
        user_id: Number(userId), // 🔥 IMPORTANT FIX
      })
    );

    setInput("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  return (
    <section className="chat-page shop-page">
      <header className="chat-header">
        <div>
          <div className="shop-badge">Chat</div>
          <h1 className="chat-title">Order #{orderId}</h1>
          <p className="chat-subtitle">
            Message your delivery partner about this order.
          </p>
        </div>
        <div className={`chat-status chat-status--${connectionState}`}>
          <span className="chat-status-dot" />
          <span>{statusLabel}</span>
        </div>
      </header>

      <div className="chat-card">
        <div
          className={`chat-messages ${
            messages.length === 0 ? "chat-messages--empty" : ""
          }`}
        >
          {messages.length === 0 ? (
            <div className="chat-empty">
              <div className="chat-empty-title">No messages yet</div>
              <div className="chat-empty-text">
                Send a quick note like “I’m at the gate”
              </div>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMine = Number(msg?.user_id) === normalizedUserId;

              return (
                <div
                  key={i}
                  className={`chat-row ${
                    isMine ? "chat-row--me" : "chat-row--them"
                  }`}
                >
                  <div
                    className={`chat-bubble ${
                      isMine ? "chat-bubble--me" : "chat-bubble--them"
                    }`}
                  >
                    <div className="chat-bubble-text">
                      {msg?.message ?? ""}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={scrollAnchorRef} />
        </div>

        <form className="chat-composer" onSubmit={handleSubmit}>
          <div className="chat-composer-row">
            <input
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isConnected ? "Type a message…" : "Connecting..."
              }
            />

            <button
              type="submit"
              className="chat-send-btn"
              disabled={!isConnected || input.trim().length === 0}
            >
              Send
            </button>
          </div>

          <div className="chat-hint">{hintText}</div>
        </form>
      </div>
    </section>
  );
};

export default Chat;
