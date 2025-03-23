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

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = (event) => {
      console.log('WebSocket connected');
      setConnected(true);
      setError(null);
      if (options?.onOpen) options.onOpen(event);
    };

    ws.onclose = (event) => {
      console.log('WebSocket disconnected');
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

    return () => {
      ws.close();
    };
  }, [options]);

  const sendMessage = useCallback((message: any) => {
    if (socket && connected) {
      socket.send(typeof message === 'string' ? message : JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }, [socket, connected]);

  return { socket, connected, error, sendMessage };
}