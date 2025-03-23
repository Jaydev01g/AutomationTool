import { useState, useEffect, useCallback, useRef } from 'react';

interface WebSocketHook {
  socket: WebSocket | null;
  connected: boolean;
  error: string | null;
  sendMessage: (message: any) => void;
}

interface WebSocketOptions {
  onMessage?: (event: MessageEvent) => void;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  pingInterval?: number;  // Interval in ms between ping messages
}

export function useWebSocket(options?: WebSocketOptions): WebSocketHook {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pingIntervalRef = useRef<number | null>(null);
  const pingInterval = options?.pingInterval || 30000; // Default to 30 seconds

  // Initialize WebSocket connection
  useEffect(() => {
    let ws: WebSocket | null = null;
    
    function setupWebSocket() {
      try {
        // Create WebSocket URL
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        console.log('Connecting to WebSocket:', wsUrl);
        
        // Create WebSocket instance
        ws = new WebSocket(wsUrl);
        
        // Set up event handlers
        ws.onopen = (event) => {
          console.log('WebSocket connected');
          setConnected(true);
          setError(null);
          
          // Start sending ping messages to keep connection alive
          if (pingIntervalRef.current) {
            window.clearInterval(pingIntervalRef.current);
          }
          
          pingIntervalRef.current = window.setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
              console.log('Sending ping to keep connection alive');
              ws.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }));
            }
          }, pingInterval);
          
          if (options?.onOpen) options.onOpen(event);
        };
        
        ws.onclose = (event) => {
          console.log('WebSocket disconnected from server', event);
          setConnected(false);
          
          // Clear ping interval
          if (pingIntervalRef.current) {
            window.clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
          }
          
          if (options?.onClose) options.onClose(event);
          
          // Attempt to reconnect after a delay
          setTimeout(() => {
            console.log('Attempting to reconnect WebSocket...');
            setupWebSocket();
          }, 3000);
        };
        
        ws.onerror = (event) => {
          console.error('WebSocket error:', event);
          setError('WebSocket connection error');
          if (options?.onError) options.onError(event);
        };
        
        ws.onmessage = (event) => {
          // Process special message types
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'PONG') {
              console.log('Received pong from server:', data.timestamp);
              return; // Don't forward pong messages to the application
            }
          } catch (err) {
            // Not JSON or other error, just pass the message along
          }
          
          // Pass message to application
          if (options?.onMessage) options.onMessage(event);
        };
        
        setSocket(ws);
      } catch (err) {
        console.error('Error creating WebSocket:', err);
        setError(`Failed to create WebSocket: ${err}`);
      }
    }
    
    // Initialize the WebSocket connection
    setupWebSocket();
    
    // Cleanup function
    return () => {
      if (pingIntervalRef.current) {
        window.clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      
      if (ws) {
        console.log('Closing WebSocket connection');
        ws.close();
      }
    };
  }, [options?.onMessage, options?.onOpen, options?.onClose, options?.onError, pingInterval]);
  
  // Send message function
  const sendMessage = useCallback((message: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      socket.send(messageStr);
      console.log('Sent WebSocket message:', message);
    } else {
      console.warn('WebSocket not open, cannot send message');
    }
  }, [socket]);
  
  return { socket, connected, error, sendMessage };
}