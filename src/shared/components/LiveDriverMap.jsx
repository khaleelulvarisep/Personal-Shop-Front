import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "./LiveDriverMap.css";

const driverIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [36, 36],
  iconAnchor: [18, 34],
  popupAnchor: [0, -30]
});

function getWsBaseUrl() {
  const explicit = import.meta.env?.VITE_WS_BASE_URL;
  if (explicit) return explicit;

  const isSecureContext = window.location.protocol === "https:";
  const protocol = isSecureContext ? "wss:" : "ws:";
  const host = window.location.hostname || "localhost";
  const port = import.meta.env?.VITE_WS_PORT || "8000";
  return `${protocol}//${host}:${port}`;
}

export default function LiveDriverMap({ driverId }) {
  const mapRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const socketRef = useRef(null);
  const followDriverRef = useRef(true);
  const forceReconnectRef = useRef(false);

  const [location, setLocation] = useState(null);
  const [followDriver, setFollowDriver] = useState(true);
  const [wsStatus, setWsStatus] = useState("connecting"); // connecting | connected | disconnected | error
  const [errorMessage, setErrorMessage] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const wsUrl = useMemo(() => {
    const base = getWsBaseUrl();
    return `${base}/ws/driver/${driverId}/`;
  }, [driverId]);

  const lastUpdateLabel = useMemo(() => {
    if (!lastUpdatedAt) return "—";
    return new Date(lastUpdatedAt).toLocaleTimeString();
  }, [lastUpdatedAt]);

  useEffect(() => {
    followDriverRef.current = followDriver;
  }, [followDriver]);

  useEffect(() => {
    if (!Number.isFinite(driverId)) return undefined;

    let isStale = false;

    const connect = () => {
      if (isStale) return;

      try {
        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
          if (isStale) return;
          setWsStatus("connected");
          setErrorMessage("");
        };

        socket.onmessage = (event) => {
          if (isStale) return;
          try {
            const data = JSON.parse(event.data);
            const lat = Number(data.latitude);
            const lng = Number(data.longitude);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

            setLocation({ lat, lng });
            setLastUpdatedAt(Date.now());

            if (followDriverRef.current && mapRef.current) {
              const map = mapRef.current;
              const currentZoom = map.getZoom();
              const nextZoom = currentZoom < 15 ? 15 : currentZoom;
              map.flyTo([lat, lng], nextZoom, { animate: true, duration: 0.7 });
            }
          } catch {
            setWsStatus("error");
            setErrorMessage("Received invalid location payload");
          }
        };

        socket.onerror = () => {
          if (isStale) return;
          setWsStatus("error");
          setErrorMessage("WebSocket error");
        };

        socket.onclose = () => {
          if (isStale) return;
          const wasForced = forceReconnectRef.current;
          forceReconnectRef.current = false;

          if (!wasForced) setWsStatus("disconnected");

          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = setTimeout(() => {
            setWsStatus("connecting");
            connect();
          }, wasForced ? 50 : 1200);
        };
      } catch {
        setWsStatus("error");
        setErrorMessage("Failed to connect to WebSocket");
      }
    };

    clearTimeout(reconnectTimerRef.current);
    reconnectTimerRef.current = setTimeout(() => {
      setWsStatus("connecting");
      setErrorMessage("");
      connect();
    }, 0);

    return () => {
      isStale = true;
      clearTimeout(reconnectTimerRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, [wsUrl, driverId]);

  if (!Number.isFinite(driverId)) {
    return (
      <div className="liveDriverMap">
        <div className="liveDriverMap__frame">
          <div className="liveDriverMap__skeleton" aria-live="polite">
            <div className="liveDriverMap__skeletonTitle">Unable to start tracking</div>
            <div className="liveDriverMap__skeletonSub">Invalid driver id</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="liveDriverMap">
      <div className="liveDriverMap__frame">
        {location ? (
          <MapContainer
            center={[location.lat, location.lng]}
            zoom={15}
            zoomControl={false}
            className="liveDriverMap__map"
            whenCreated={(map) => {
              mapRef.current = map;
            }}
          >
            <TileLayer
              attribution="OpenStreetMap"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <ZoomControl position="bottomright" />

            <Marker position={[location.lat, location.lng]} icon={driverIcon}>
              <Popup>
                <div className="liveDriverMap__popup">
                  <div className="liveDriverMap__popupTitle">Delivery partner</div>
                  <div className="liveDriverMap__popupMeta">Last update: {lastUpdateLabel}</div>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        ) : (
          <div className="liveDriverMap__skeleton" aria-live="polite">
            <div className="liveDriverMap__skeletonTitle">Waiting for driver location…</div>
            <div className="liveDriverMap__skeletonSub">Connecting to live tracking</div>
          </div>
        )}

        <div className="liveDriverMap__overlay">
          <div className="liveDriverMap__topRow">
            <div className={`liveDriverMap__status liveDriverMap__status--${wsStatus}`}>
              <span className="liveDriverMap__statusDot" aria-hidden="true" />
              <span className="liveDriverMap__statusText">{wsStatus}</span>
            </div>

            <div className="liveDriverMap__meta">
              <div className="liveDriverMap__metaLabel">Last update</div>
              <div className="liveDriverMap__metaValue">{lastUpdateLabel}</div>
            </div>
          </div>

          <div className="liveDriverMap__actions">
            <button
              type="button"
              className={`liveDriverMap__btn ${followDriver ? "is-active" : ""}`}
              onClick={() => setFollowDriver((v) => !v)}
            >
              {followDriver ? "Following" : "Follow"}
            </button>

            <button
              type="button"
              className="liveDriverMap__btn"
              onClick={() => {
                forceReconnectRef.current = true;
                clearTimeout(reconnectTimerRef.current);
                if (socketRef.current) socketRef.current.close();
              }}
            >
              Reconnect
            </button>
          </div>

          {errorMessage ? <div className="liveDriverMap__error">{errorMessage}</div> : null}
        </div>
      </div>
    </div>
  );
}
