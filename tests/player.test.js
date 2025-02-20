/*
Test DATAs
player1 :
    globalPermissions 1
    channels "channel1" : 2 "channels2" : 0 "channels3" : 1

player2 :
    globalPermissions 0
    channels "channel1" : 2 "channels2" : 1 "channels3" : 2
 */

import { describe, it, before } from "mocha";
import { expect } from "chai";

describe('Player', () => {

    let p1;

    before(async () => {
        const { Player } = await import("../players/playermanager.js");
        p1 = new Player("player1");
    });

    /*
    Initialization States
     */
    it('should have a global permission of 0', () => {
        expect(p1.globalPermissions).to.equal(0);
    });

    it('should have a voip permission of 2', () => {
        expect(p1.channels["voip"]).to.equal(2);
    });

    it('should not have the channel1', () => {
        expect(p1.channels["channel1"]).to.equal(undefined);
    })

    /*
    Channel Permissions
     */

    it('should have a channel1 permission of 2', () => {
        p1.setChan("channel1", 2);
        expect(p1.channels["channel1"]).to.equal(2);
    });

    it('should not have the channel1', () => {
        p1.setChan("channel1", 0);
        expect(p1.channels["channel1"]).to.equal(undefined);
    })

    it('should throw error on invalid channel permission > 3', () => {
        expect(() => p1.setChan("channel1", 4)).to.throw("Invalid permission level");
    });

    it('should have a voip permission of 2', () => {
        expect(p1.getChan("voip")).to.equal(2);
    })

    /*
    Global Permissions
     */

    it('should have a global permission of 1', () => {
        p1.setPerm(1);
        expect(p1.globalPermissions).to.equal(1);
    });

    it('should throw error on invalid global permission > 2', () => {
        expect(() => p1.setPerm(3)).to.throw("Invalid permission level");
    });

    it('should throw error on invalid global permission < 0', () => {

        expect(() => p1.setPerm(-1)).to.throw("Invalid permission level");
    });
});