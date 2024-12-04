import { io } from 'socket.io-client';

const socket = io(process.env.BACKEND_URL, {
    transports: ["websocket"],
    reconnection: true,
    timeout: 10000,
});

export default socket;