import { useEffect, useRef, useState } from "react";
let socket: WebSocket | null = null;
const MAX_RECONNECT_ATTEMPTS = 5;
let reconnectAttempts = 0;
/**
 * Custom hook for managing WebSocket connections.
 * 
 * @param onMessage Callback function to handle incoming messages.
 * @param onOpen Optional callback function to handle WebSocket connection open.
 * @param onClose Optional callback function to handle WebSocket connection close.
 * @param onError Optional callback function to handle WebSocket errors.
 * 
 * @returns An object containing the current connection status (connected), and a function to send messages over the WebSocket connection (sendMessage).
 */
export function useWebSocket({ onMessage, onOpen, onClose, onError }:  {
  onMessage: (event: MessageEvent) => void;
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (error: Event) => void;
}){
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let heartbeatInterval: NodeJS.Timeout | null = null;
    if (wsRef.current) return; // Prevent duplicate connections

    const connect = () => {
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error("Max reconnect attempts reached. Stopping reconnection.");
        return;
      }

      console.log("Connecting to WebSocket: ws://localhost:5501/ws");
      wsRef.current = new WebSocket("ws://localhost:5501/ws");

      wsRef.current.onopen = () => {
        console.log("WebSocket connected");
        setConnected(true);
        reconnectAttempts = 0; // Reset attempts on successful connection
        onOpen?.();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
          console.error("Raw message:", event.data);
        }
        // Optional: Start a heartbeat interval to keep the connection alive
        if (!heartbeatInterval) {
          heartbeatInterval = setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current?.send(JSON.stringify({ type: "ping" }));
            }
          }, 10000); // Send a ping every 10 seconds
        }
        // Optional: Handle the heartbeat response
        if (event.data === "pong") {
          console.log("Received pong from server");
          // Reset the heartbeat interval if needed
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
          }
        }
        // Optional: Handle other message types
        // if (data.type === "someOtherType") {
        //   // Handle the specific message type
        // }
        // } else {
        //   console.warn("Unknown message type:", data.type);
        // }
        // } else {
        //   console.warn("Received non-JSON message:", event.data);
        // }
        onMessage?.(event);
      };

      wsRef.current.onclose = (event) => {
        console.log("WebSocket disconnected from server", event);
        setConnected(false);
        onClose?.(event);

        if (!event.wasClean) {
          reconnectAttempts++;
          const retryDelay= Math.min(5000 * reconnectAttempts, 30000); // Exponential backoff
          console.log(`Reconnecting in ${retryDelay / 1000} seconds...`);
          setTimeout(connect, retryDelay); // Retry after 5 seconds
        }
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        onError?.(error);
      };
    };

    connect();

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [onMessage, onOpen, onClose, onError]);

  const sendMessage = (message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not open. Message not sent:", message);
    }
  };
  useEffect(() => {
    console.log(`WebSocket connection status: ${connected ? "Connected" : "Disconnected"}`);
  }, [connected]);
  return { connected, sendMessage };
}
