import { Server } from "../server";

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
    }
}