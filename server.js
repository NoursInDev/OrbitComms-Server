/*
Server.js manages the link between player groups, websocket messages sent and audio processor.
 */

import {WebSocketHandler} from "./wshandler";
import {AudioProcessor} from "./audio/audioprocessor";
import {PlayerManager} from "./players/playermanager";

export class Server {
    constructor() {
        this.websocket = new WebSocketHandler(this);
        this.audio = new AudioProcessor(this);
        this.players = new PlayerManager(this);
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
    }
}