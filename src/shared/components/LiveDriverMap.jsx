import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";

const icon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [40, 40]
});

export default function LiveDriverMap({ orderId }) {

  const [location, setLocation] = useState(null);

  useEffect(() => {

    const socket = new WebSocket(
      `ws://127.0.0.1:8000/ws/order/${orderId}/`
    );

    socket.onmessage = (event) => {

      const data = JSON.parse(event.data);

      setLocation({
        lat: data.latitude,
        lng: data.longitude
      });

    };

    return () => socket.close();

  }, [orderId]);

  if (!location) return <h3>Waiting for driver location...</h3>;

  return (

    <MapContainer
      center={[location.lat, location.lng]}
      zoom={15}
      style={{ height: "500px" }}
    >

      <TileLayer
        attribution="OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker
        position={[location.lat, location.lng]}
        icon={icon}
      />

    </MapContainer>

  );
}