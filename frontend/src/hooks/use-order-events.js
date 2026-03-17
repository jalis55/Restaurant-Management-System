import { useEffect, useRef } from "react";


function buildOrdersWebSocketUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;

  if (configuredBaseUrl) {
    const httpUrl = new URL(configuredBaseUrl, window.location.origin);
    const protocol = httpUrl.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${httpUrl.host}/ws/orders/`;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws/orders/`;
}


function useOrderEvents(onEvent) {
  const onEventRef = useRef(onEvent);

  onEventRef.current = onEvent;

  useEffect(() => {
    let socket = null;
    let reconnectTimer = null;
    let isActive = true;

    function connect() {
      socket = new WebSocket(buildOrdersWebSocketUrl());

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          onEventRef.current(payload);
        } catch {
          // Ignore malformed payloads instead of breaking the live stream.
        }
      };

      socket.onclose = () => {
        if (!isActive) {
          return;
        }
        reconnectTimer = window.setTimeout(connect, 2000);
      };
    }

    connect();

    return () => {
      isActive = false;
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }
      if (socket) {
        socket.close();
      }
    };
  }, []);
}


export { useOrderEvents };
