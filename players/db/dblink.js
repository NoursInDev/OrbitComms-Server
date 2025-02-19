import { MongoClient } from "mongodb";
import { Player, PlayerManager } from "../playermanager";

export class DataBase {
    constructor(manager, dbport = 27017, dbname = "orbitcomms") {
        if (!(manager instanceof PlayerManager)) {
            throw new Error("Invalid player manager instance");
        }

        this.manager = manager;
        this.dbport = dbport;
        this.dbname = dbname;

        this.mongoClient = new MongoClient(`mongodb://localhost:${this.dbport}`, { useUnifiedTopology: true });
        this.mongoClient.connect(err => {
            if (err) {
                throw new Error("Failed to connect to MongoDB");
            } else {
                console.log("Connected to MongoDB");
            }
        });
    }

    async addPlayer(player) {
        if (!(player instanceof Player)) {
            throw new Error("Invalid player instance");
        }

        const db = this.mongoClient.db(this.dbname);
        const collection = db.accounts;

        try {
            const existingPlayer = await collection.findOne({ _id: player._id });
            if (existingPlayer) {
                console.error(`Player ${player._id} already exists in the database`);
                return;
            }

            const pass = this.#generatePassword();

            const result = await collection.insertOne({
                _id: player._id,
                channels: player.channels,
                globalPermissions: player.globalPermissions,
                password: pass
            });
            console.log(`Player ${player._id} password: ${pass} added to the database`);
            return result;
        } catch (err) {
            throw new Error("Failed to add player to the database");
        }
    }

    #generatePassword(size = 16) {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
        let password = "";
        for (let i = 0; i < size; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return password;
    }

    async getPlayerByName(username) {
        const db = this.mongoClient.db(this.dbname);
        const collection = db.accounts;

        try {
            const player = await collection.findOne({ _id: username });
            if (!player) {
                throw new Error(`Player ${username} not found`);
            }
            return player;
        } catch (err) {
            throw new Error("Failed to retrieve player from the database");
        }
    }

    async deletePlayer(username) {
        const db = this.mongoClient.db(this.dbname);
        const collection = db.accounts;

        try {
            const result = await collection.deleteOne({ _id: username });
            if (result.deletedCount === 0) {
                console.error(`Player ${username} not found in the database`);
            }
            console.log(`Player ${username} deleted from the database`);
            return result;
        } catch (err) {
            throw new Error("Failed to delete player from the database");
        }
    }

    async modifyPlayer(player) {
        if (!(player instanceof Player)) {
            throw new Error("Invalid player instance");
        }

        const db = this.mongoClient.db(this.dbname);
        const collection = db.accounts;

        try {
            const existingPlayer = await collection.findOne({ _id: player._id });
            if (!existingPlayer) {
                console.error(`Player ${player._id} does not exist in the database`);
                return null;
            }

            const result = await collection.replaceOne(
                { _id: player._id },
                {
                    _id: player._id,
                    channels: player.channels,
                    globalPermissions: player.globalPermissions
                }
            );

            // update player in the manager if they are currently connected
            if (this.manager.getPlayer(player._id)) {
                this.manager.addPlayer(player);
            }

            console.log(`Player ${player._id} modified in the database`);
            return result;
        } catch (err) {
            throw new Error("Failed to modify player in the database");
        }
    }

    async addChannel(name, visibility = "private", allowed_names = [], defaultlevel = 2) {
        const db = this.mongoClient.db(this.dbname);
        const collection = db.channels;

        try {
            const existingChannel = await collection.findOne({ _id: name });
            if (existingChannel) {
                console.error(`Channel ${name} already exists in the database`);
                return null;
            }

            const result = await collection.insertOne({
                _id: name,
                visibility: visibility,
                allowed: allowed_names,
                default: defaultlevel
            });

            console.log(`Channel ${name} added to the database`);
            return result;
        } catch (err) {
            throw new Error("Failed to add channel to the database");
        }
    }

    async getChannel(name) {
        const db = this.mongoClient.db(this.dbname);
        const collection = db.channels;

        try {
            const channel = await collection.findOne({ _id: name });
            if (!channel) {
                throw new Error(`Channel ${name} not found`);
            }
            return channel;
        } catch (err) {
            throw new Error("Failed to retrieve channel from the database");
        }
    }

    async getChannelNames() {
        const db = this.mongoClient.db(this.dbname);
        const collection = db.channels;

        try {
            const channels = await collection.find().toArray();
            return channels.map(channel => channel._id);
        } catch (err) {
            throw new Error("Failed to retrieve channel names from the database");
        }
    }

    async deleteChannel(name) {
        const db = this.mongoClient.db(this.dbname);
        const collection = db.channels;

        try {
            const result = await collection.deleteOne({ _id: name });
            if (result.deletedCount === 0) {
                console.error(`Channel ${name} not found in the database`);
            }

            console.log(`Channel ${name} deleted from the database`);
            return result;
        } catch (err) {
            throw new Error("Failed to delete channel from the database");
        }
    }
}