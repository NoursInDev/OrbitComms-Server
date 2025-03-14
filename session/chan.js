import {Session} from "./session";
import {UserEntity} from "./userEntity";

export class Chan {
    #session
    #id
    #members
    #priority
    #name
    #active = null

    constructor(
        session,
        members,
        name,
        priority = false,
    ) {
        if (
            !(session instanceof Session) ||
            !Array.isArray(members) ||
            !members.every(member => member instanceof UserEntity) ||
            typeof name !== "string" ||
            typeof priority !== "boolean"
        ) {
            throw new Error("while building new chan: invalid arguments")
        }
        this.#session = session
        this.#id = session.newChanId()
        this.#members = members
        this.#name = name
        this.#priority = priority
    }

    addMember(user) {
        if (!(user instanceof UserEntity)) {
            error("while joining chan: invalid arguments")
            return
        }
        if (this.#members.includes(user)) {
            error("while joining chan: user already in chan")
            return
        }
        this.#members.push(user)
    }

    revokeMember(user) {
        if (!(user instanceof UserEntity)) {
            error("while leaving chan: invalid arguments")
            return
        }
        if (!this.#members.includes(user)) {
            error("while leaving chan: user not in chan")
            return
        }
        this.#members = this.#members.filter(member => member !== user)
    }

    getId = () => this.#id

    getPriority = () => this.#priority
    switchPriority = () => this.#priority = !this.#priority

    activate = (user) => {
        if (!(user instanceof UserEntity)) {
            error("while activating chan: invalid arguments")
            return
        }
        if (!this.#members.includes(user)) {
            error("while activating chan: user not in chan")
            return
        }
        // todo : notify + listeners
        this.#active = user
    }

    desactivate = (user) => {
        if (!(user instanceof UserEntity)) {
            error("while desactivating chan: invalid arguments")
            return
        }
        if (this.#active !== user) {
            error("while desactivating chan: user is not the activator")
            return
        }
        // todo : notify + listeners
        this.#active = null
    }
}

