import express from "express";
import jwt from "jsonwebtoken";
import WebSocket from "ws";
import { Server } from "./server.js";

export class WebSocketHandler {
    constructor(server, SECRET_KEY = "super_secret_key") {
        if (!(server instanceof Server)) {
            throw new Error("Invalid server instance");
        }

        this.server = server;
        this.app = express();
        this.SECRET_KEY = SECRET_KEY;
        this.wss = new WebSocket.Server({ port: 8081 });
        this.app.use(express.json());
        this.setupRoutes();
        this.setupWebSocket();
    }

    setupRoutes() {
        this.app.post("/login", (req, res) => {
            const { username, password } = req.body;

            const player = this.server.players.db.getPlayerByName(username);
            if (player && player.password === password) {
                const token = jwt.sign({ username }, this.SECRET_KEY, { expiresIn: "12h" });
                return res.json({ token });
            }

            res.status(401).json({ error: "Invalid credentials" });
        });
    }

    setupWebSocket() {
        this.wss.on("connection", (ws, req) => {
            const urlParams = new URLSearchParams(req.url.split("?")[1]);
            const token = urlParams.get("token");

            if (!token) {
                ws.close();
                return;
            }

            try {
                const decoded = jwt.verify(token, this.SECRET_KEY);
                ws.username = decoded.username;
                console.log(`User ${ws.username} connected via WebSocket`);

                const player = this.server.players.db.getPlayerByName(ws.username);
                this.server.players.addPlayer(player);

                ws.send(JSON.stringify({ message: "Welcome to OrbitComms Server!" }));

                ws.on("message", (message) => {
                    this.server.processMessage(ws.username, message);
                });
            } catch (error) {
                ws.close();
            }

            ws.on("close", () => {
                this.server.players.removePlayer(ws.username);
            });
        });
    }

    sendMessageToUser(username, data) {
        this.wss.clients.forEach(client => {
            if (client.username === username && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ username: "server", data }));
            }
        });
    }

}