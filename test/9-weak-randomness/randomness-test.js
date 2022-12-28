const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Weak Randomness", function () {
  let deployer, attacker, user;

  beforeEach(async function () {
    [deployer, attacker, user] = await ethers.getSigners();

    const Lottery = await ethers.getContractFactory("Lottery", deployer);
    this.lottery = await Lottery.deploy();
    
    this.lotteryFee = ethers.utils.parseEther("1");

    //const LotteryAttacker = await ethers.getContractFactory("LotteryAttacker", attacker);
    //this.lotteryAttacker = await LotteryAttacker.deploy(this.lottery.address);
  });

  describe("Lottery", function () {

    describe.skip("With bets open", function () {
      it("Should allow a user to place a bet", async function () {
        await this.lottery.placeBet(5, { value: this.lotteryFee });
        expect(await this.lottery.bets(deployer.address)).to.eq(5);
      });
      it("Should revert if a user place more than 1 bet", async function () {
        await this.lottery.connect(user).placeBet(10, { value: this.lotteryFee });
        await expect(this.lottery.connect(user).placeBet(1, { value: this.lotteryFee })).to.be.revertedWith("Only one bet per player");
      });
      it("Should rever is bet is != 1 eth", async function () {
        await expect(this.lottery.connect(user).placeBet(3, { value : ethers.utils.parseEther("2")})).to.be.revertedWith("Bet cost: 1 ether");
      });
      it("Should revert is bet number is > 0 or < 255", async function () {
        await expect(this.lottery.connect(user).placeBet(0, { value : ethers.utils.parseEther("1")})).to.be.revertedWith("Must be a number from 1 to 255");
        await expect(this.lottery.connect(user).placeBet(256, { value : ethers.utils.parseEther("1")})).to.be.reverted;
      });
      it("Should revert if the withdrawPrize() function is called while bets are open", async function () {
        await expect(this.lottery.withdrawPrize()).to.be.revertedWith("Bets are still running");
      });

    });
  });

  describe("With bets closed", function () {
    it("Should revert if a user places a bet", async function () {
      await this.lottery.endLottery();
      await expect(this.lottery.placeBet(1, { value: this.lotteryFee })).to.be.revertedWith("Bets are closed");
    });
    it("Should allow only the winner to call withdrawPrize()", async function () {
      await this.lottery.connect(attacker).placeBet(5, { value: this.lotteryFee })
      await this.lottery.connect(user).placeBet(3, { value: this.lotteryFee })
      await this.lottery.placeBet(1, { value: this.lotteryFee })

      await this.lottery.endLottery();

      // Setting a value for the block.timestamp that makes the winningNumber to be equals 5
      await ethers.provider.send("evm_setNextBlockTimestamp", [1672258349]);

      /* Calculating the block.timestamp that makes the winningNumber equals to 5 */      
      let winningNumber = 0;
      // Call the endLottery() to generate the winningNumber until is set to 5
      while(winningNumber != 5) {
        await this.lottery.endLottery();
        winningNumber = await this.lottery.winningNumber()
        console.log("Winning number: ", winningNumber);
      }
      // Printing the details of the latest block that makes winningNumber to be equals 5
      console.log(await ethers.provider.getBlock("latest"));  // timestamp: 1672258349
      
      await expect(this.lottery.connect(user).withdrawPrize()).to.be.revertedWith("You aren't the winner");
      
      const attackerBalanceBefore = await ethers.provider.getBalance(attacker.address);
      await this.lottery.connect(attacker).withdrawPrize()
      const attackerBalanceAfter = await ethers.provider.getBalance(attacker.address);

      // Comparing two numbers
      expect(attackerBalanceAfter).to.be.gt(attackerBalanceBefore);
    });

    

  });

});
