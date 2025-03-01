import { describe, it, before } from "mocha";
import { expect } from "chai";

describe('PlayerManager', () => {

    let lastMessage
    let pm
    let players

    /*
    Mocks
     */
    class ServerMock {
        processMessage(username, data) {
        }

        sendAudioData(username, data) {
            lastMessage = ['audio', username, data]
        }

        sendSuccessMessage(username, message) {
            lastMessage = ['success', username, message]
        }

        sendDeniedMessage(username, message) {
            lastMessage = ['denied', username, message]
        }

        sendUpdatedPermissions(username, data) {
            lastMessage = ['updated', username, data]
        }
    }

    class pdb {
        constructor(_id, channels, globalPermissions) {
            this._id = _id
            this.channels = channels
            this.globalPermissions = globalPermissions
            this.password = "pass"
        }
    }

    class cdb {
        constructor(name, level) {
            this.name = name
            this.level = level
            this.visibility = 'private'
            this.allowed = []
        }
    }

    class DBMock {
        #players
        #channels

        constructor() {
            this.#players = []
            this.#channels = []
        }

        async addPlayer(player) {
            if(this.#players.find(p => p._id === player.username)) return
            this.#players.push(new pdb(player.username, player.channels, player.globalPermissions))
            return
        }

        async getPlayerByName(username) {
            const p = this.#players.find(p => p._id === username)
            if (!p) throw new Error("Failed to retrieve player from the database")
            console.log(p._id)
            return p
        }

        async modifyPlayer(player) {
            const p = this.#players.find(p => p._id === player._id)
            if (!p) return null
            p.channels = player.channels
            p.globalPermissions = player.globalPermissions
        }

        // --- ---

        async addChannel(name, level) {
            if(this.#channels.find(c => c.name === name)) return
            this.#channels.push(new cdb(name, level))
        }

        async getChannel(name) {
            const c = this.#channels.find(c => c.name === name)
            if (!c) throw new Error("Failed to retrieve channel from the database")
            return c
        }

        async getChannelNames() {
            return this.#channels.map(c => c.name)
        }

        async deleteChannel(name) {
            this.#channels = this.#channels.filter(c => c.name !== name)
        }
    }

    /*
    Env variables
     */

    before(async () => {
        const {PlayerManager, Player} = await import("../players/playermanager.js");
        const db = new DBMock()
        players = []
        players.push(new Player("player1"))
        players.push(new Player("player2"))
        players.push(new Player("admin"))
        players[2].globalPermissions = 1
        await db.addPlayer(players[0])
        await db.addPlayer(players[2])
        pm = new PlayerManager(new ServerMock(), db)
    });

    /*
    Tests
     */

    // 00 - Player Connection

    it('should return nothing for a non-connected player', () => {
        expect(pm.getPlayer("player1")).to.equal(undefined)
    })

    it('should add a player to the list', async () => {
        await pm.addPlayer(players[0])
        expect(pm.getPlayer("player1")).to.equal(players[0])
    })

    it('should throw player not found', () => {
        expect(() => pm.addPlayer(players[1])).to.throw("Player player2 not found in the database")
    });

    // 01 - Channel Management

    it('should deny operation to non-admin', async () => {
        const data = {
            command: "create",
            name: "channel0",
            level: 2
        }
        pm.manageChannels("player1", data)
        expect(lastMessage).to.deep.equal(['denied', 'player1', data])
        expect(pm.db.getChannel("channel1")).to.throw("Failed to retrieve channel from the database")
    })

    it('should throw invalid data structure', () => {
        expect(() => pm.manageChannels("admin")).to.throw("Invalid data structure")
        expect(() => pm.manageChannels("admin", {
            chan: "newchannel"
        })).to.throw("Invalid data structure")
        expect(() => pm.manageChannels("admin", {})).to.throw("Invalid data structure")
    })

    it('should accept operation', async () => {
        const data = {
            command: "create",
            name: "channel0",
            level: 2
        }
        await pm.manageChannels("admin", data)
        expect(lastMessage).to.deep.equal(['success', 'admin', data])
        expect(pm.db.getChannel("channel1")).to.deep.equal(new cdb("channel1", 2))
    })

    // 02 - Channel Data

    it('should throw invalid data structure', () => {
        expect(() => pm.processChannelChange("player1")).to.throw("Invalid data structure")
        expect(() => pm.processChannelChange("player1", {
            channel: "channel1"
        })).to.throw("Invalid data structure")
        expect(() => pm.processChannelChange("player1", {
            command: "join"
        })).to.throw("Invalid data structure")
        expect(() => pm.processChannelChange("player1", {})).to.throw("Invalid data structure")
    })

    it('should throw invalid channel', () => {
        expect(() => pm.processChannelChange("player1", {
            command: "join",
            channel: "channel1"
        })).to.throw("Channel channel1 not found in the database")
    })

    it('should throw invalid command', async () => {
        await pm.db.addChannel("channel1", 2)
        expect(() => pm.processChannelChange("player1", {
            command: "invalid",
            channel: "voip" // default channel
        })).to.throw("Invalid command")
    })

    it('should throw player not found', () => {
        expect(() => pm.processChannelChange("player2", {
            command: "join",
            channel: "voip"
        })).to.throw("Player player2 not found in the database")
    })

    it('should deny connection to private channel', async () => {
        const data = {
            command: "join",
            channel: "channel1"
        }
        await pm.processChannelChange("player1", data)
        expect(lastMessage).to.deep.equal(['denied', 'player1', data])
    })

});