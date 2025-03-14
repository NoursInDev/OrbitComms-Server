import {User} from "./user";
import {DataBase} from "./dblink";

export class Organization {
    #members
    #admins
    #_id
    #db

    constructor(members, admins, name) {
        if (
            !Array.isArray(members) ||
            !members.every(member => typeof member === "string" && db) ||
            !Array.isArray(admins) ||
            !admins.every(admin => typeof admin === "string" && admin in members) ||
            typeof name !== "string"
        ) {
            throw new Error("while building new organization: invalid arguments")
        }

        const db = DataBase.instance

        if (db === null) throw new Error("while building new organization: db is null")

        this.#db = db

        members.every(member => this.#db.doesUserExist(member).then(r => {
            if (r) {
                throw new Error("while building new organization: " +
                    "member " + member + " does not exist in db")
            }
        }))

        this.#members = members
        this.#admins = admins
        this.#_id = name

        this.#db.updateOrganization(this).then(() => {
            log("Organization updated successfully")
        }).catch(err => {
            error("while updating organization: " + err)
        })
    }

    addMember(username) {
        if (typeof username !== "string") {
            error("while joining organization: invalid arguments")
            return
        }
        if (this.#members.includes(username)) {
            error("while joining organization: user already in organization")
            return
        }
        this.#db.doesUserExist(username).then(r => {
            if (r) {
                error("while joining organization: user does not exist in db")
                return
            }
            // todo notify + listeners
            this.#members.push(username)
            this.#db.updateOrganization(this).then(() => {
                log("Organization updated successfully")
            }).catch(err => {
                error("while updating organization: " + err)
            })
        })
    }

    promoteMember(username) {
        const user = this.#members.find(user => user.username === username)
        if (!user) {
            error("while promoting user: user not in organization")
            return
        }
        // todo notify + listeners
        this.#admins.push(user)
        this.#db.updateOrganization(this).then(() => {
            log("Organization updated successfully")
        }).catch(err => {
            error("while updating organization: " + err)
        })
    }

    demoteMember(username) {
        const user = this.#members.find(user => user.username === username)
        if (!user) {
            error("while demoting user: user not in organization")
            return
        }
        // todo notify + listeners
        this.#admins = this.#admins.filter(admin => admin !== user)
        this.#db.updateOrganization(this).then(() => {
            log("Organization updated successfully")
        }).catch(err => {
            error("while updating organization: " + err)
        })
    }

    revokeMember(username) {
        const user = this.#members.find(user => user.username === username)
        if (!user) {
            error("while revoking user: user not in organization")
            return
        }
        // todo notify + listeners
        this.#members = this.#members.filter(member => member !== user)
        this.#admins = this.#admins.filter(admin => admin !== user)
        this.#db.updateOrganization(this).then(() => {
            log("Organization updated successfully")
        }).catch(err => {
            error("while updating organization: " + err)
        })
    }

    getMembers = () => this.#members
    getAdmins = () => this.#admins
    getName = () => this.#_id
    setName = (name) => {
        this.#db.doesOrganizationExist(name).then(r => {
            if (r) {
                error("while renaming organization: name already taken");
                return;
            }
            this.#_id = name;
            this.#db.updateOrganization(this).then(() => {
                log("Organization updated successfully")
            }).catch(err => {
                error("while updating organization: " + err)
            })
        })
    }
}