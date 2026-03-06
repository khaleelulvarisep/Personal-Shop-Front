import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../../shop/pages/shop.css";

function MainLayout() {
  return (
    <div className="shop-shell">
      <Navbar />
      <main className="shop-main">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
