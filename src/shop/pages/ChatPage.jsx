// ChatPage.jsx

import { useParams } from "react-router-dom";
import Chat from "./Chat";

const ChatPage = () => {
  const { orderId } = useParams();
  const userId = localStorage.getItem("user_id");

  return <Chat key={orderId} orderId={orderId} userId={userId} />;
};

export default ChatPage;
