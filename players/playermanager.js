import { Server } from "../server";
import { DataBase } from "./db/dblink";

export class PlayerManager {

    #connectedPlayers = {};
    #activeChannels = {
        "voip": []
    }

    constructor(server, dbport = 27017) {
        if (!(server instanceof Server)) {
            throw new Error("Invalid server instance");
        }

        this.server = server;
        this.db = new DataBase(dbport);
    }

    getPlayer(username) {
        return this.#connectedPlayers[username];
    }

    addPlayer(player) {
        if (!(player instanceof Player)) {
            throw new Error("Invalid player instance");
        }

        this.#connectedPlayers[player._id] = player;
    }

    removePlayer(username) {
        delete this.#connectedPlayers[username];
    }

    processChannelChange(username, data) {
        if (!data || typeof data !== 'object' || !data.channel || !data.command) {
            throw new Error("Invalid data structure");
        }

        const { channel, command } = data;
        const validCommands = ['join', 'leave', 'mute', 'priority'];

        if (!this.#activeChannels[channel]) {
            throw new Error(`Channel ${channel} does not exist`);
        }

        if (!validCommands.includes(command)) {
            throw new Error(`Invalid command ${command}`);
        }

        const player = this.getPlayer(username);
        if (!player) {
            throw new Error(`Player ${username} not found`);
        }

        const permissionLevel = player.getChan(channel);
        if (permissionLevel === 0) {
            console.warn(`Player ${username} does not have the required permissions for channel ${channel}`);
            return;
        }

        switch (command) {
            case 'join':
                this.#activeChannels[channel].push({ username, status: 'Active' });
                break;
            case 'leave':
                const index = this.#activeChannels[channel].findIndex(user => user.username === username);
                if (index === -1) {
                    console.error(`Player ${username} not found in channel ${channel}`);
                    return;
                }
                this.#activeChannels[channel].splice(index, 1);
                break;
            case 'mute':
                this.#activeChannels[channel].forEach(user => {
                    if (user.username === username) {
                        user.status = 'Sleeping';
                    }
                });
                break;
            case 'priority':
                if (permissionLevel < 3) {
                    console.warn(`Player ${username} does not have the required permissions for priority in channel ${channel}`);
                    return;
                }
                this.#activeChannels[channel].forEach(user => {
                    if (user.username === username) {
                        user.status = 'Override';
                    }
                });
                break;
        }
    }

    managePermissions(username, data) {
        if (!data || typeof data !== 'object' || !data.target || !data.modifier || typeof data.modifier.level === 'undefined') {
            throw new Error("Invalid data structure");
        }

        const { target, modifier } = data;
        const { level, channel } = modifier;

        this.db.getPlayerByName(target).then(player => {
            if (!player) {
                console.error(`Target player ${target} not found in the database`);
                return;
            }

            const user = this.getPlayer(username);
            if (!user || user.getPerm() < 1) {
                console.error(`User ${username} does not have the required permissions`);
                return;
            }

            if (channel) {
                if (!this.#activeChannels[channel]) {
                    console.error(`Channel ${channel} does not exist`);
                    return;
                }
                player.setChan(channel, level);
            } else {
                if (player.getPerm() === 2 || level > user.getPerm()) {
                    console.error(`Cannot change global permissions for target player ${target}`);
                    return;
                }
                player.setPerm(level);
            }

            this.db.modifyPlayer(player);
        }).catch(err => {
            console.error(`Failed to retrieve target player ${target} from the database: ${err.message}`);
        });
    }

    manageChannels(username, data) {
        const player = this.getPlayer(username);
        if (!player || player.getPerm() < 1) {
            throw new Error(`Player ${username} does not have the required permissions`);
        }

        if (!data || typeof data !== 'object' || !data.type) {
            throw new Error("Invalid data structure");
        }

        const { type, channel, name, level } = data;

        switch (type) {
            case "delete":
                if (!this.#activeChannels[channel]) {
                    console.warn(`Channel ${channel} does not exist`);
                    return;
                }
                if (this.#activeChannels[channel].length > 0) {
                    console.warn(`Channel ${channel} is currently occupied`);
                    return;
                }
                delete this.#activeChannels[channel];
                console.log(`Channel ${channel} deleted`);
                break;

            case "force_delete":
                delete this.#activeChannels[channel];
                console.log(`Channel ${channel} forcefully deleted`);
                break;

            case "add":
                // TODO: Add logic to add a new channel
                console.log(`TODO: Add logic to add a new channel`);
                break;

            case "changedefault":
                // TODO: Add logic to change default visibility of the channel
                console.log(`TODO: Add logic to change default visibility of the channel`);
                break;

            default:
                throw new Error(`Unknown type: ${type}`);
        }
    }
}

export class Player {
    /*
        globalPermissions : 0 = user, 1 = admin, 2 = superuser
        permissionLevel : 0 = none, 1 = muted, 2 = active, 3 = priority
     */

    constructor(username) {
        this._id = username;
        this.channels = { "voip": 2 };
        this.globalPermissions = 0;
    }

    setChan(channel, permissionLevel) {
        if (permissionLevel === 0) {
            delete this.channels[channel];
        } else {
            this.channels[channel] = permissionLevel;
        }
    }

    getChan(channel) {
        return this.channels[channel] || 0;
    }

    getChans() {
        return Object.keys(this.channels);
    }

    setPerm(permissionLevel) {
        this.globalPermissions = permissionLevel;
    }

    getPerm() {
        return this.globalPermissions;
    }
}


// todo : Add group system -> player have mutliple groups, sort by priority, player permissions are overriding group permissions