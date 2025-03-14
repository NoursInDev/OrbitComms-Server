import { MongoClient } from "mongodb";
import {Organization} from "./organization";
import {User} from "./user";

export class DataBase {
    #mongoClient
    #db
    get db() {
        return this.#db
    }

    constructor(dbport = 27017, dbname = "orbitcomms") {
        if (DataBase.instance) {
            throw new Error("while creating new database: database already exists")
        }
        if (typeof dbport !== "number" || typeof dbname !== "string") {
            throw new Error("while creating new database: invalid arguments")
        }
        this.#mongoClient = new MongoClient(`mongodb://localhost:${dbport}`, { useUnifiedTopology: true });
        this.#mongoClient.connect(err => {
            if (err) {
                throw new Error("while connecting to database: failed to connect: " + err)
            } else {
                log("connected to database")
            }
        })
        this.#db = this.#mongoClient.db(dbname)
    }

    doesOrganizationExist = async _id => {
        if (typeof _id !== "string") {
            error("while checking if organization exists: invalid arguments")
            return
        }
        const collection = this.#db.collection("organizations");

        try {
            const organization = await collection.findOne({ _id }, { projection: { _id: 1, members: 0, admins: 0 } });
            return !!organization;
        } catch (err) {
            error("while checking if organization exists: " + err)
        }
    }

    doesUserExist = async _id => {
        if (typeof _id !== "string") {
            error("while checking if user exists: invalid arguments")
            return
        }
        const collection = this.#db.collection("users");

        try {
            const user = await collection.findOne({ _id }, { projection: { _id: 1, organizations: 0, password: 0 } });
            return !!user;
        } catch (err) {
            error("while checking if user exists: " + err)
        }
    }

    updateOrganization = async org => {
        if (!(org instanceof Organization)) {
            error("while updating organization: invalid arguments")
            return
        }
        const collection = this.#db.collection("organizations")
        try {
            await collection.updateOne(
                { _id: org.getName() },
                { $set: { members: org.getMembers(), admins: org.getAdmins() } },
                { upsert: true }
            )
        } catch (err) {
            error("while updating organization: " + err)
        }
    }

    removeOrganization = async name => {
        if (typeof name !== "string") {
            error("while removing organization: invalid arguments")
            return
        }
        const collection = this.#db.collection("organizations")
        try {
            await collection.deleteOne({ _id: name })
        } catch (err) {
            error("while removing organization: " + err)
        }
    }

    getOrganization = async _id => {
        if (typeof name !== "string") {
            error("while retrieving organization: invalid arguments")
            return
        }
        try {
            return this.#db.collection("organizations").findOne({_id})
        } catch (err) {
            error("while retrieving organization: " + err)
        }
    }

    updateUser = async user => {
        if (!(user instanceof User)) {
            error("while updating user: invalid arguments")
            return
        }
        const collection = this.#db.collection("users")
        try {
            await collection.updateOne(
                { _id: user.getName() },
                { $set: { password: user.getPassword() } },
                { upsert: true }
            )
        } catch (err) {
            error("while updating organization: " + err)
        }
    }

    removeUser = async name => {
        if (typeof name !== "string") {
            error("while removing user: invalid arguments")
            return
        }
        const collection = this.#db.collection("users")
        try {
            await collection.deleteOne({ _id: name })
        } catch (err) {
            error("while removing user: " + err)
        }
    }

    assertValidPassword = async (username, password) => {
        if (typeof username !== "string" || typeof password !== "string") {
            error("while asserting valid password: invalid arguments")
            return false
        }
        try {
            const user = await this.#db.collection("users").findOne({ _id: username }, { projection: { password: 1 } });
            if (!user) {
                return false
            }
            return user.password === password
        } catch (err) {
            error("while asserting valid password: " + err)
            return false
        }
    }

    static instance = null;
}