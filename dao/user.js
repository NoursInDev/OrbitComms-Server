import {Organization} from "./organization";

export class User {
    #username
    #password

    constructor(username) {
        if (typeof username !== "string") {
            throw new Error("while building new user: invalid arguments")
        }
        this.#username = username
        this.#password = this.#generatePassword()
        User.users.push(this)

    }

    #generatePassword(size = 16) {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
        let password = "";
        for (let i = 0; i < size; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return password;
    }

    getPassword = () => this.#password

    static users = []
    static getUser = username => User.users.find(user => user.#username === username)
}