const clients = new Set();

export const addRealtimeClient = (res) => {
  clients.add(res);
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive'
  });

  res.write('event: connected\ndata: {"status":"connected"}\n\n');

  res.on('close', () => {
    clients.delete(res);
  });
};

export const broadcastRealtimeEvent = (eventName, payload) => {
  const message = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of clients) {
    client.write(message);
  }
};
