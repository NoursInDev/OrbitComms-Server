const express = require("express");
const jwt = require("jsonwebtoken");
const WebSocket = require("ws");

const app = express();
const SECRET_KEY = "super_secret_key";
const wss = new WebSocket.Server({ port: 8081 });

app.use(express.json());

// database sim
const users = { "testuser": "password123" };

// auth
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (users[username] && users[username] === password) {
        const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
        return res.json({ token });
    }

    res.status(401).json({ error: "Invalid credentials" });
});

// check jwt token
wss.on("connection", (ws, req) => {
    const urlParams = new URLSearchParams(req.url.split("?")[1]);
    const token = urlParams.get("token");

    if (!token) {
        ws.close();
        return;
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        ws.username = decoded.username;
        console.log(`User ${ws.username} connected via WebSocket`);

        ws.send(JSON.stringify({ message: "Welcome to WebSocket!" }));

        ws.on("message", (message) => {
            console.log(`Message from ${ws.username}: ${message}`);
        });
    } catch (error) {
        ws.close();
    }
});

app.listen(8080, () => console.log("Server running on port 8080"));
