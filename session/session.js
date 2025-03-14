export class Session {
    #chan_id = 0

    newChanId() {
        this.#chan_id++
        return this.#chan_id
    }
}