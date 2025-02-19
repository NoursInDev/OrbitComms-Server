import {Server} from "../server";

export class AudioProcessor {

    constructor(server) {
        if (!(server instanceof Server)) {
            throw new Error("Invalid server instance");
        }

        this.server = server;
    }

    processAudioData(username, data) {
        if (!data || typeof data !== 'object' || !data.chan || !data.bytes) {
            throw new Error("Invalid data structure");
        }

        const player = this.server.players.getPlayer(username);
        if (!player || !this.server.players.getPlayerChannels(username).includes(data.chan)) {
            throw new Error("Player is not connected to the specified channel");
        }

        // send audio data to all players in the channel
        if (data.chan === 'voip') {
            //todo
            console.error('TODO: Implement audio processing for voip channel');
        } else {
            const players = this.server.players.getChannelPLayerList(data.chan);
            players.forEach(p => {
                if (p.username !== username) {
                    this.server.sendAudioData(p.username, data);
                }
            });
        }
    }
}