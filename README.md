# OrbitComms-Server

OrbitComms Server is the server side of the OrbitComms Project, developped in Node JS.

## WebSocket Structure
All the communication between the server and the client is done through WebSockets :

```json
{
    "type": "messageType",
    "data": { }
}
```
