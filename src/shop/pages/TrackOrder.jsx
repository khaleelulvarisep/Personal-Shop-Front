import LiveDriverMap from "../../shared/components/LiveDriverMap";
import { useParams } from "react-router-dom";

export default function TrackOrder() {

  const { orderId } = useParams();

  return (

    <div>

      <h2>Track your delivery</h2>

      <LiveDriverMap orderId={orderId} />

    </div>

  );
}
