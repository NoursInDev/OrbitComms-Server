import { Server } from "../server.js";
import { DataBase } from "./db/dblink.js";

export class PlayerManager {

    #connectedPlayers = {};
    #activeChannels

    constructor(server, db = { instance: new DataBase(this) }) {

        this.server = server;
        this.db = db;

        this.#activeChannels = this.db.getChannelNames();
    }

    getPlayer(username) {
        return this.#connectedPlayers[username];
    }

    getPlayerChannels(username) {
        const player = this.getPlayer(username);
        if (!player) {
            throw new Error(`Player ${username} not found`);
        }

        return Object.keys(this.#activeChannels).filter(chan =>
            this.#activeChannels[chan].some(user => user.username === username)
        );
    }

    getChannelPLayerList(channel) {
        return this.#activeChannels[channel];
    }

    addPlayer(player) {
        if (!(player instanceof Player)) {
            throw new Error("Invalid player instance");
        }

        if (!this.db.getPlayerByName(player.username)) {
            throw new Error(`Player ${player.username} not found in the database`);
        }

        this.#connectedPlayers[player._id] = player;
    }

    addChannel(channel, level = 2) {
        if (this.#activeChannels[channel]) {
            throw new Error(`Channel ${channel} already exists`);
        }

        if (this.db.addChannel(channel, level) !== null) {
            this.#activeChannels[channel] = [];
        }
    }

    removePlayer(username) {
        delete this.#connectedPlayers[username];
    }

    removeChannel(channel) {
        if (this.db.deleteChannel(channel) !== null) {
            delete this.#activeChannels[channel];
        }
    }

    processChannelChange(username, data) {
        if (!data || typeof data !== 'object' || !data.chan || !data.command) {
            throw new Error("Invalid data structure");
        }

        const { chan, command } = data;
        const validCommands = ['join', 'leave', 'mute', 'priority'];

        if (!this.#activeChannels[chan]) {
            throw new Error(`Channel ${chan} does not exist`);
        }

        if (!validCommands.includes(command)) {
            throw new Error(`Invalid command ${command}`);
        }

        const player = this.getPlayer(username);
        if (!player) {
            throw new Error(`Player ${username} not found`);
        }

        const permissionLevel = player.getChan(chan);
        if (permissionLevel === 0) {
            console.warn(`Player ${username} does not have the required permissions for channel ${chan}`);
            return;
        }

        switch (command) {
            case 'join':
                const channel = this.db.getChannel(chan);
                if (channel.visibility === 'private' && permissionLevel < 1 && !channel.allowed.includes(username)) {
                    console.error(`Player ${username} does not have the required permissions for channel ${chan}`);
                    this.server.sendDeniedMessage(username, `Player does not have the required permissions for channel ${chan}`);
                    return;
                }
                this.#activeChannels[chan].push({ username, status: 'Active' });
                this.#connectedPlayers[username].setChan(chan, channel.default);
                this.server.sendSuccessMessage(username, `Joined channel ${chan}`);
                break;
            case 'leave':
                const index = this.#activeChannels[chan].findIndex(user => user.username === username);
                if (index === -1) {
                    console.error(`Player ${username} not found in channel ${chan}`);
                    this.server.sendDeniedMessage(username, `Player not found in channel ${chan}`);
                    return;
                }
                this.#activeChannels[chan].splice(index, 1);
                this.server.sendSuccessMessage(username, `Left channel ${chan}`);
                break;
            case 'mute':
                this.#activeChannels[chan].forEach(user => {
                    if (user.username === username) {
                        user.status = 'Sleeping';
                    }
                });
                this.server.sendSuccessMessage(username, `Muted in channel ${chan}`);
                break;
            case 'priority':
                if (permissionLevel < 3) {
                    console.warn(`Player ${username} does not have the required permissions for priority in channel ${chan}`);
                    this.server.sendDeniedMessage(username, `Player does not have the required permissions for priority in channel ${chan}`);
                    return;
                }
                this.#activeChannels[chan].forEach(user => {
                    if (user.username === username) {
                        if (user.status === 'Override') {
                            user.status = 'Active';
                        } else user.status = 'Override';
                    }
                });
                this.server.sendSuccessMessage(username, `Priority in channel ${chan} updated`);
                break;
        }
    }

    managePermissions(username, data) {
        if (!data || typeof data !== 'object' || !data.target || !data.modifier || typeof data.modifier.level === 'undefined') {
            throw new Error("Invalid data structure");
        }

        const { target, modifier } = data;
        const { level, chan } = modifier;

        this.db.getPlayerByName(target).then(player => {
            if (!player) {
                console.error(`Target player ${target} not found in the database`);
                this.server.sendDeniedMessage(username, `Target player ${target} not found`);
                return;
            }

            const user = this.getPlayer(username);
            if (!user || user.getPerm() < 1) {
                console.error(`User ${username} does not have the required permissions`);
                this.server.sendDeniedMessage(username, `Player does not have the required permissions`);
                return;
            }

            if (chan) {
                if (!this.#activeChannels[chan]) {
                    console.error(`Channel ${chan} does not exist`);
                    this.server.sendDeniedMessage(username, `Channel ${chan} does not exist`);
                    return;
                }
                player.setChan(chan, level);
            } else {
                if (player.getPerm() === 2 || level > user.getPerm()) {
                    console.error(`Cannot change global permissions for target player ${target}`);
                    this.server.sendDeniedMessage(username, `Cannot change global permissions for target player ${target}`);
                    return;
                }
                player.setPerm(level);
            }

            this.db.modifyPlayer(player).then(r => {}).catch(err => {
                console.error(`Failed to modify target player ${target}: ${err.message}`);
                this.server.sendDeniedMessage(username, `Failed to modify target player ${target}`);
            });

            this.server.sendSuccessMessage(username, `Permissions for target player ${target} updated`);
            this.server.sendUpdatedPermissions(target, { level, chan });
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

        const { type, chan, name, level } = data;

        switch (type) {
            case "delete":
                if (!this.#activeChannels[chan]) {
                    console.warn(`Channel ${chan} does not exist`);
                    this.server.sendDeniedMessage(username, `Channel ${chan} does not exist`);
                    return;
                }
                if (this.#activeChannels[chan].length > 0) {
                    this.server.sendDeniedMessage(username, `Channel ${chan} is currently occupied`);
                    console.warn(`Channel ${chan} is currently occupied`);
                    return;
                }
                this.removeChannel(chan);
                console.log(`Channel ${chan} deleted`);
                this.server.sendSuccessMessage(username, `Channel ${chan} deleted`);
                break;

            case "force_delete":
                this.removeChannel(chan);
                this.server.sendSuccessMessage(username, `Channel ${chan} deleted`);
                console.log(`Channel ${chan} forcefully deleted`);
                break;

            case "add":
                try {
                    this.addChannel(name, level);
                    this.server.sendSuccessMessage(username, `Channel ${name} added`);
                    break;
                } catch (e) {
                    throw e;
                }

            case "changedefault":
                // TODO: Add logic to change default visibility of the channel
                console.log(`TODO: Add logic to change default visibility of the channel`);
                this.server.sendSuccessMessage(username, `Default visibility of channel ${chan} changed to ${level}`);
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
            if (permissionLevel < 0 || permissionLevel > 3) {
                throw new Error("Invalid permission level");
            }
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
        if (permissionLevel < 0 || permissionLevel > 2) {
            throw new Error("Invalid permission level");
        }
        this.globalPermissions = permissionLevel;
    }

    getPerm() {
        return this.globalPermissions;
    }
}


// todo : Add group system -> player have mutliple groups, sort by priority, player permissions are overriding group permissions
