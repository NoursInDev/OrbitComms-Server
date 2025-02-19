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

            const result = await collection.insertOne({
                _id: player._id,
                channels: player.channels,
                globalPermissions: player.globalPermissions
            });
            console.log(`Player ${player._id} added to the database`);
            return result;
        } catch (err) {
            throw new Error("Failed to add player to the database");
        }
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

    async addChannel(name) {

    }
}