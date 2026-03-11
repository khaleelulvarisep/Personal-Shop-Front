import LiveDriverMap from "../../shared/components/LiveDriverMap";

export default function TrackOrder() {

  const orderId = 53;

  return (

    <div>

      <h2>Track your delivery</h2>

      <LiveDriverMap orderId={orderId} />

    </div>

  );
}
