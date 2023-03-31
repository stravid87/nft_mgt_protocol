import {expect} from "chai";
import {ethers} from "hardhat";
import {BigNumber} from "ethers";

describe("Feature: CryptoTip contract allows users to send and push tips to team members", function () {
    let cryptoTip: any;
    // Team Members address
    let teamMembers: Array<string>;
    let SingedTeamMembers: Array<any>;
    let owner: any;
    const totalAmount = ethers.utils.parseEther("1");

    /**
     * Scenario: User can send tips to team members
     *  Given a user with an Ethereum wallet
     *  And the CryptoTip contract is deployed
     *  And the user has some ETH in their wallet
     */
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
     *  Scenario: User can send tips to team members
     *      Given See <beforeEach>
     *      When the user sends tips to a list of team members
     *      Then the team members receive the correct amount of ETH
     *      And the user's wallet balance is updated
     */
    it("should allow User can send tips to team members", async function () {
        const ownerInitialBalance = await owner.getBalance()
        const cryptoTipInitialBalance = await ethers.provider.getBalance(cryptoTip.address)
        // User sends tips
        await cryptoTip.connect(owner).sendTips(teamMembers, {value: totalAmount})

        // Check the team members receive the correct amount of ETH
        await Promise.all(
            teamMembers.map(async (member: any) => {
                    expect(await cryptoTip.connect(owner).getBalance(member)).to.be.eql(totalAmount.div(teamMembers.length))
                }
            )
        )

        // Check Contract Balance is updated
        expect(await ethers.provider.getBalance(cryptoTip.address)).to.be.eql(cryptoTipInitialBalance.add(totalAmount))

        // Check Owner wallet decrease
        expect(await owner.getBalance()).to.be.below(ownerInitialBalance.sub(totalAmount))
    })


    /**
     * Scenario: User can push tips to team members
     *      Given See <beforeEach>
     *      When the user pushes tips to a list of team members
     *      Then the team members receive the correct amount of ETH
     *      And the user's wallet balance is updated
     */
    it("should allow user to push tips to team members", async function () {
        const cryptoTipInitialBalance = await ethers.provider.getBalance(cryptoTip.address)
        const ownerInitialBalance = await owner.getBalance()
        const initialBalances: Array<BigNumber> = await Promise.all(
            SingedTeamMembers.map((member: any) => member.getBalance())
        );
        await cryptoTip.connect(owner).pushTips(teamMembers, {value: totalAmount})

        // Check Members Wallet balance increase
        await Promise.all(
            SingedTeamMembers.map(async (member: any, index) => {
                    expect( await member.getBalance()).to.be.eql(initialBalances[index].add(totalAmount.div(teamMembers.length)))
                }
            )
        )

        // Check contract wallet do not increase
        expect(cryptoTipInitialBalance).to.be.eql(await  ethers.provider.getBalance(cryptoTip.address))

        // Check Owner wallet decrease
        expect(await owner.getBalance()).to.be.below(ownerInitialBalance.sub(totalAmount))
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
