/*
Server.js manages the link between player groups, websocket messages sent and audio processor.
 */

import {WebSocketHandler} from "./wshandler";
import {AudioProcessor} from "./audio/audioprocessor";
import {PlayerManager} from "./players/playermanager";

export class Server {
    constructor(
        websocket = new WebSocketHandler(this),
        audio = new AudioProcessor(this),
        players = new PlayerManager(this)
    ) {
        this.websocket = websocket;
        this.audio = audio;
        this.players = players;
    }

    processMessage(username, data) {
        let message;
        try {
            message = JSON.parse(data);
        } catch (e) {
            throw new Error("Invalid JSON data");
        }

        if (!message.type) {
            throw new Error("Message type is missing");
        }

        try {
            switch (message.type) {
                case "audio_data":
                    this.audio.processAudioData(username, data);
                    break;
                case "channel_data":
                    this.players.processChannelChange(username, data);
                    break;
                case "permissions":
                    this.players.managePermissions(username, data);
                    break;
                case "channels":
                    this.players.manageChannels(username, data);
                    break;
                default:
                    throw new Error("Unknown message type: " + message.type);
            }
        } catch (e) {
            console.error("Error in Server on request type " + message.type + " -> " + e);
            this.sendDeniedMessage(username, "Error processing request");
        }

    }

    sendAudioData(username, data) {
        this.websocket.sendMessageToUser(username, {type: "audio_data", data});
    }

    sendSuccessMessage(username, message) {
        this.websocket.sendMessageToUser(username, {type: "request_success", message});
    }

    sendDeniedMessage(username, message) {
        this.websocket.sendMessageToUser(username, {type: "request_denied", message});
    }

    sendUpdatedPermissions(username, data) {
        this.websocket.sendMessageToUser(username, {type: "permission_updated", data});
    }
}