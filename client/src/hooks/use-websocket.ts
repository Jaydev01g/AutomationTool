import { useState, useEffect, useCallback } from 'react';

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
}

export function useWebSocket(options?: WebSocketOptions): WebSocketHook {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    let ws: WebSocket | null = null;
    
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
        if (options?.onOpen) options.onOpen(event);
      };
      
      ws.onclose = (event) => {
        console.log('WebSocket disconnected from server');
        setConnected(false);
        if (options?.onClose) options.onClose(event);
      };
      
      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection error');
        if (options?.onError) options.onError(event);
      };
      
      ws.onmessage = (event) => {
        if (options?.onMessage) options.onMessage(event);
      };
      
      setSocket(ws);
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setError(`Failed to create WebSocket: ${err}`);
    }
    
    // Cleanup function
    return () => {
      if (ws) {
        console.log('Closing WebSocket connection');
        ws.close();
      }
    };
  }, [options?.onMessage, options?.onOpen, options?.onClose, options?.onError]);
  
  // Send message function
  const sendMessage = useCallback((message: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(typeof message === 'string' ? message : JSON.stringify(message));
    } else {
      console.warn('WebSocket not open, cannot send message');
    }
  }, [socket]);
  
  return { socket, connected, error, sendMessage };
}