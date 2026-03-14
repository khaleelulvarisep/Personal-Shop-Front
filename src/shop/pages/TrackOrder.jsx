import LiveDriverMap from "../../shared/components/LiveDriverMap";
import { useParams } from "react-router-dom";
import "./TrackOrder.css";

export default function TrackOrder() {

  const { driverId  } = useParams();
  const parsedDriverId = Number(driverId);
  return (

    <div className="trackOrderPage">
      <div className="trackOrderCard">
        <div className="trackOrderHeader">
          <h2 className="trackOrderTitle">Track your delivery</h2>
          <div className="trackOrderSub">Live location updates from your delivery partner</div>
        </div>

        <LiveDriverMap driverId={parsedDriverId} />
      </div>
    </div>

  );
}
