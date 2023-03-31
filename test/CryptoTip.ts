import {expect} from "chai";
import {ethers} from "hardhat";

describe("CryptoTip", function () {
    let cryptoTip: any;
    // Team Members address
    let teamMembers: Array<string>;
    let SingedTeamMembers: any;
    let owner: any;
    const totalAmount = ethers.utils.parseEther("1");

    beforeEach(async function () {
        const CryptoTip = await ethers.getContractFactory("CryptoTip");

        cryptoTip = await CryptoTip.deploy();
        await cryptoTip.deployed();

        const [signer, teamMember1, teamMember2] = await ethers.getSigners();
        owner = signer;
        teamMembers = [teamMember1.address, teamMember2.address];
        SingedTeamMembers = [teamMember1, teamMember2];
    });

    /**
     * Scenario: User can send tips
     *  Given Fresh Deploy Crypto Tips Contract
     *  When A user send "X" Amount Tips
     *  Then Crypto Tips Contract balance should increase of X
     */
    it("should allow user to send tips to team members", async function () {
        await cryptoTip.connect(owner).sendTips(teamMembers, {value: totalAmount})
        expect(await ethers.provider.getBalance(cryptoTip.address)).to.be.eql(totalAmount)
    })


    /**
     * Scenario: User can send check other user balance
     *  Given Fresh Deploy Crypto Tips Contract
     *  When A user send Tips to his team,
     *  Then he can check their balance before and after who should increase
     */
    it("should allow user to get their balance tips to team members", async function () {
        const initialBalances = await Promise.all(
            teamMembers.map((member: any) => cryptoTip.connect(owner).getBalance(member))
        );

        await cryptoTip.connect(owner).sendTips(teamMembers, {value: totalAmount})

        const finalBalances = await Promise.all(
            teamMembers.map((member: any) => cryptoTip.connect(owner).getBalance(member))
        );

        expect(initialBalances).to.not.be.eql(finalBalances);
    })

    /**
     * Scenario: User can send tips
     *  Given Fresh Deploy Crypto Tips Contract
     *  When A user send "X" Amount Tips using pushTips
     *  Then Crypto Tips Contract balance should not increase
     *  Then Team members wallet balance should increase
     */
    it.only("should allow user to push tips to team members", async function () {
        const initialContractBalance= await ethers.provider.getBalance(cryptoTip.address)
        const initialBalances = await Promise.all(
            teamMembers.map((member: any) => ethers.provider.getBalance(member))
        );
        await cryptoTip.connect(owner).pushTips(teamMembers, {value: totalAmount})

        const finalBalances = await Promise.all(
            teamMembers.map((member: any) => cryptoTip.connect(owner).getBalance(member))
        );

        expect(initialBalances).to.not.be.eql(finalBalances);
        expect(await ethers.provider.getBalance(cryptoTip.address)).to.be.eql(initialContractBalance)
    })

    it("Should allow Team Member to withdraw theirs accounts. ", async function () {
        const initialBalances = await Promise.all(
            teamMembers.map((member: any) => ethers.provider.getBalance(member))
        );
        const totalAmount = ethers.utils.parseEther("0.1");
        await cryptoTip.connect(owner).sendTips(teamMembers, {value: totalAmount})
        expect(await ethers.provider.getBalance(cryptoTip.address)).to.be.eql(totalAmount)

        // await cryptoTip.sendTips(teamMembers);
        await Promise.all(
            SingedTeamMembers.map(async (signedMember: any) => {
                await cryptoTip.connect(signedMember).withdraw()
            })
        );
        const finalBalances = await Promise.all(
            teamMembers.map(async (member: any) => {
                return ethers.provider.getBalance(member)
            })
        );

        for (let i = 0; i < teamMembers.length; i++) {
            expect(finalBalances[i]).to.be.gt(initialBalances[i]);
        }
    });

    it("emits TipsSent event", async function () {

        const tx = await cryptoTip.connect(owner).sendTips(teamMembers, {value: totalAmount})
        const receipt = await tx.wait();

        const event = receipt.events.pop();
        expect(event.event).to.equal("TipsSent");
        expect(event.args.teamMembers).to.eql(teamMembers);
        expect(event.args.amount).to.equal(totalAmount);
    });
});
