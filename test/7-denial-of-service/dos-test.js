const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DoS", function () {
  let deployer, attacker, user;

  beforeEach(async function () {
    [deployer, attacker, user] = await ethers.getSigners();

    const Auction = await ethers.getContractFactory("Auction", deployer);
    this.auction = await Auction.deploy();

    // Deploy the Attacker Contract that can't receive ETH
    const AttackerContract = await ethers.getContractFactory("AttackerContract", deployer);
    this.attackerContract = await AttackerContract.deploy(this.auction.address);

    this.auction.bid({ value: 100 });
  });

  describe("Auction", function () {

    describe.skip("if bid is lower than highestBid", function () {
      it("Should NOT accept bids lower than current", async function () {
        await expect(this.auction.connect(user).bid({ value: 50 })).to.be.revertedWith("Bid not high enough");
      });
    });

    describe.skip("if bid is higher than highestBid", function () {
      it("Should accept it and update highestBid", async function () {
        await this.auction.connect(user).bid({ value: 150 })
        expect(await this.auction.highestBid()).to.eq(150)
      });
      it("Should make msg.sender currentLeader", async function () {
        await this.auction.connect(user).bid({ value: 150 })
        expect(await this.auction.currentLeader()).to.eq(user.address)
      });
      it("Should add previous leader and highestBid to refunds", async function () {
        const previousLeader = await this.auction.currentLeader()
        const previousHighestBid = await this.auction.highestBid()

        await this.auction.connect(user).bid({ value: 150 })

        const [addr, amount] = await this.auction.refunds(0);

        // Validate previousLeader was added to the refunds[] array!
        expect(previousLeader).to.eq(addr);
        // Validate previousHighestBid was added to the refunds[] array!
        expect(previousHighestBid).to.eq(amount);
      });
    });

    describe("When calling refundAll()", function () {
      it.skip("Should refund the bidders that didn't win and keep the ETH that the highest bidder depositted", async function () {
        // A couple users place their bids
        //parseEther converts to ETH Notation -> 18 decimals
        const userBid = ethers.utils.parseEther("1");
        const attackerBid = ethers.utils.parseEther("2");
        const highestBid = ethers.utils.parseEther("3");

        console.log("1 in ETH Notation looks like: ", userBid);

        await this.auction.connect(user).bid({ value: userBid })
        await this.auction.connect(attacker).bid({ value: attackerBid })
        await this.auction.connect(deployer).bid({ value: highestBid })

        // Take a snapshot of the balances of the users after their bids
        const userOldBalance = await ethers.provider.getBalance(user.address);
        const attackerOldBalance = await ethers.provider.getBalance(attacker.address);

        // Execute the refundAll() function
        await this.auction.refundAll();

        // Validate the users were refunded correctly
        expect(await ethers.provider.getBalance(user.address)).to.eq(userOldBalance.add(userBid))
        expect(await ethers.provider.getBalance(attacker.address)).to.eq(attackerOldBalance.add(attackerBid))

        // Validate that the remaining ETH on the contract is the equivalent that the highest bidder depositted
        // formatEther converts from ETH Notation to normal int notation -> From 18 decimals to 1
        const remainingETH = ethers.utils.formatEther(await ethers.provider.getBalance(this.auction.address));
        expect(ethers.utils.parseEther(remainingETH)).to.eq(highestBid);

      });

      it("DoS attacked caused by an unexpected reverted <-> Should revert if any refunded bidder is a contract that can't received the refunded ETH", async function () {
        // Validate auction contract set in the attacker contract is the same address as the one deployed from this test file!
        expect(await this.attackerContract.auctionContract()).to.eq(this.auction.address)

        // Send a bid from the attacker contract!
        await this.attackerContract.bid({ value: ethers.utils.parseEther("1") })

        // Send a higher bid from a normal account to move the attacker contract address into the refunds[] array
        await this.auction.connect(user).bid({ value: ethers.utils.parseEther("2") })

        // Execute the refundAll() function - Should fail
        await expect(this.auction.refundAll()).to.be.revertedWith("'Address: unable to send value, recipient may have reverted'");

        // Validate the attacker contract address is on the refunds[] at the position 1
        const [addr, amount] = await this.auction.refunds(1);
        expect(addr).to.eq(this.attackerContract.address);

      });

      it("Should revert if the amount of computation hits the block gas limit", async function () {

      });
    });



  });
});
