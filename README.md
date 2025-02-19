# OrbitComms-Server

OrbitComms Server is the server side of the OrbitComms Project, developped in Node JS.

# Interact with the server

## Ask for a WebSocket token

In order to get a new WebSocket token, you need to send a POST request to the server with the following body:

```json
{
    "username": "your_username",
    "password": "your_password"
}
```

If valid, the server will respond with the Token.

## Send Datas

### Message Structure
All messages follow this structure:
```json
{
  "type": "message_type",
  "data": { }
}
```

### Message Types
### 1. `audio_data`
This type is used to send real-time audio data.

#### **Expected `data` structure:**
```json
{
  "chan": "channel_name",
  "bytes": "audio_data"
}
```

### 2. `channel_data`
This type is used to manage user actions within a channel.

#### **Expected `data` structure:**
```json
{
  "chan": "channel_name",
  "command": "join" | "leave" | "mute" | "priority"
}
```

### 3. `permissions`
This type is used to modify user permissions. (This requires admin permissions)

#### **Expected `data` structure:**
```json
{
  "target": "target_player_name",
  "modifier": {
    "level": "permission_level",
    "chan": "channel_name" (optional)
  }
}
```

### 4. `channels`
This type is used to manage channel operations. (This requires admin permissions)

#### **Expected `data` structure:**
```json
{
  "type": "add" | "delete" | "force_delete" | "change_default",
  "name": "channel_name" (for `add`),
  "chan": "channel_name" (for `delete` and `force_delete`),
  "level": "permission_level" (for `change_default` or optional for `add`)
}
```
