const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SavingsAccount", function () {
  let deployer, user;

  beforeEach(async function () {
    [deployer, user] = await ethers.getSigners();

    const SavingsAccount = await ethers.getContractFactory("SavingsAccount", deployer);
    this.savingsAccount = await SavingsAccount.deploy();

    const Investor = await ethers.getContractFactory("Investor", deployer);
    this.investor = await Investor.deploy(this.savingsAccount.address);
    // The deployer account is the owner of the Investor contract!
  });

  describe.skip("From an EOA to the SavingsAccount contract", function () {
    it("Should be possible to deposit", async function () {
      expect(await this.savingsAccount.balanceOf(user.address)).to.eq(0);

      await this.savingsAccount.connect(user).deposit({ value: 100 });

      expect(await this.savingsAccount.balanceOf(user.address)).to.eq(100);
    });

    it("Should be possible to withdraw", async function () {
      expect(await this.savingsAccount.balanceOf(user.address)).to.eq(0);

      await this.savingsAccount.connect(user).deposit({ value: 100 });

      expect(await this.savingsAccount.balanceOf(user.address)).to.eq(100);

      await this.savingsAccount.connect(user).withdraw();

      expect(await this.savingsAccount.balanceOf(user.address)).to.eq(0);
    });
  });

  describe("From an Intermediary Contract (Investor) to the SavingsAccount", function () {
    // Depositing and Withdrawing from the Investor account!
    // The balances that will be updated on the SavingsAccount contract will be corresponding to the Investor contract address, not the account address that initiates the transactions!
    it.skip("Should be possible to deposit", async function () {
      expect(await this.savingsAccount.balanceOf(this.investor.address)).to.eq(0);

      // deployer deposits 100 ETH on the Investor contract! (The 100 ETH will be forwarded to the SavingsAccount and the Investor contract address balance will be updated!)
      await this.investor.depositOnSavingsAccount({ value: 100 });
      expect(await this.savingsAccount.balanceOf(this.investor.address)).to.eq(100);
    });

    it("Should be possible to withdraw", async function () {
      await this.investor.depositOnSavingsAccount({ value: 100 });
      expect(await this.savingsAccount.balanceOf(this.investor.address)).to.eq(100);

      const deployerBalanceAfterDepositing = await deployer.getBalance();
      console.log("deployerBalanceAfterDepositing: ", ethers.utils.formatEther(deployerBalanceAfterDepositing));

      await this.investor.withdrawFromSavingAccount();
      expect(await this.savingsAccount.balanceOf(this.investor.address)).to.eq(0);

      console.log("ETH on the investor contract after withdraw should be 0: ", await this.investor.contractsBalance());
      expect(await this.investor.contractsBalance()).to.eq(0);

      const deployerBalanceAfterWithdrawn = await deployer.getBalance();
      console.log("deployerBalanceAfterWithdrawn: ", ethers.utils.formatEther(deployerBalanceAfterWithdrawn));

    });
  });

});