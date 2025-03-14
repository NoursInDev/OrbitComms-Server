import {Chan} from "./chan";
import {Session} from "./session";

export class UserEntity {
    #session
    #username
    #chans

    constructor(
        session,
        username,
    ) {
        if (!(session instanceof Session) || typeof username != "string") {
            throw new Error("while building new user: invalid arguments")
        }
        this.#session = session
        this.#username = username
        this.#chans = []
    }
}