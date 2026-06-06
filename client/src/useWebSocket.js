import { useState, useEffect, useRef, useCallback } from 'react';

export function useWebSocket(url, onMessage) {
  const [socket, setSocket] = useState(null);
  const wsRef = useRef(null);
  const onMessageRef = useRef(onMessage);

  // Keep the latest callback ref without triggering re-connects
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    const ws = new WebSocket(url);
    
    ws.onopen = () => {
      console.log('Connected to WebSocket server');
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onMessageRef.current) {
          onMessageRef.current(data);
        }
      } catch (e) {
        console.error("Failed to parse message", event.data);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from WebSocket server');
      setSocket(null);
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [url]);

  const sendMessage = useCallback((msg) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    } else {
      console.error("WebSocket is not connected");
    }
  }, []);

  return { socket, sendMessage };
}
