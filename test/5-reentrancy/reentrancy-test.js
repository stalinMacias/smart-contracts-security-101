const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Reentrancy", function () {
  let deployer, user, attacker;

  beforeEach(async function () {
    [deployer, user, attacker] = await ethers.getSigners();

    const SavingsAccountV2 = await ethers.getContractFactory("SavingsAccountV2", deployer);
    this.savingsAccountV2 = await SavingsAccountV2.deploy();

    // Deployer account deposits 100ETH on SavingsAccountV2 (Victim) Contract
    await this.savingsAccountV2.deposit({ value: ethers.utils.parseEther("100") });
    // User account deposits 50ETH on SavingsAccountV2 (Victim) Contract
    await this.savingsAccountV2.connect(user).deposit({ value: ethers.utils.parseEther("50") });

    const InvestorV2 = await ethers.getContractFactory("InvestorV2", attacker);
    // Deploy InvestorV2 contract as the attacker account!
    this.investorV2 = await InvestorV2.connect(attacker).deploy(this.savingsAccountV2.address);

    console.log("InvestorV2 owner: ", await this.investorV2.owner())
    console.log("Attacker address: ", attacker.address);

  });

  describe.skip("SavingsAccountV2 - From an EOA to the SavingsAccountV2 contract", function () {
    console.log("When EOA Accounts interact directly with the Victim contract there is no risk of reentrancy, because EOA accounts can't respond to an incoming transaction");
    it("Should accept deposits", async function () {
      const deployerBalance = await this.savingsAccountV2.balanceOf(deployer.address);
      expect(deployerBalance).to.eq(ethers.utils.parseEther("100"));

      const userBalance = await this.savingsAccountV2.balanceOf(user.address);
      expect(userBalance).to.eq(ethers.utils.parseEther("50"));
    });

    it("Should accept withdrawals", async function(){
      await this.savingsAccountV2.withdraw();
      const deployerBalanceAfterWithdraw = await this.savingsAccountV2.balanceOf(deployer.address);
      expect(deployerBalanceAfterWithdraw).to.eq(ethers.utils.parseEther("0"));

      await this.savingsAccountV2.connect(user).withdraw();
      const userBalanceAfterWithdraw = await this.savingsAccountV2.balanceOf(user.address);
      expect(userBalanceAfterWithdraw).to.eq(ethers.utils.parseEther("0"));
    });
  });

  describe("InvestorV2 - From the Attacker Contract to the Victim Contract", function () {
    console.log("When Contract Accounts interact with the Victim contract arises the risk of reentrancy. The reason is that contracts can execute arbitrary logic when receiving ETH");
    it("Performing the reentrancy attack", async function () { 
      const deployerBalance = await this.savingsAccountV2.balanceOf(deployer.address);
      expect(deployerBalance).to.eq(ethers.utils.parseEther("100"));

      const userBalance = await this.savingsAccountV2.balanceOf(user.address);
      expect(userBalance).to.eq(ethers.utils.parseEther("50"));

      console.log("");
      console.log("*** Before ***");
      console.log("Attacker's ETH balance before performing the attack: ", ethers.utils.formatEther(await attacker.getBalance()));

      // The attacker will fund its account with 1 ETH to start the attack
      // That implies that each time the attacker contract reentrants the victim contract will take 1 ETH
      await this.investorV2.connect(attacker).attack({ value: ethers.utils.parseEther("13")}); //attack() function is a payable function, to send ETH from hardhat to a payable function is by using the function({value : <totalETH> }) syntax!

      console.log("");
      console.log("*** After ***");
      console.log(`Attacker's ETH balance after performing the attack: , ${ethers.utils.formatEther(await attacker.getBalance()).toString()}`)
      console.log(`SavingsAccountV2's balance after performing the attack: ${ethers.utils.formatEther(await ethers.provider.getBalance(this.savingsAccountV2.address)).toString()}`);

    });

  });

});
