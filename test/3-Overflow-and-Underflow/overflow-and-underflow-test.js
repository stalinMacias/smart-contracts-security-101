const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleToken", function () {
  let deployer, attacker, user;

  beforeEach(async function () {
    [deployer, attacker, user] = await ethers.getSigners();

    const SimpleToken = await ethers.getContractFactory("SimpleToken", deployer);
    this.simpleToken = await SimpleToken.deploy(1000);
  });

  it("Should allow a user to transfer amounts smaller than or equal to its balance", async function () {
    // Transfer to user 1 token - The tokens are going out from the deployer (The contract creator!)
    await this.simpleToken.transfer(user.address,1);

    expect(await this.simpleToken.balanceOf(user.address)).to.eq(1);
    expect(await this.simpleToken.balanceOf(deployer.address)).to.eq((await this.simpleToken.totalSupply()) - 1);
  });

  it.skip("Should revert if the attacker tries to transfer an amount greater than its balance - BEFORE using the SafeMath library", async function  () {
    await this.simpleToken.transfer(attacker.address,10);
    // connect() to test the code by sending a transaction from an account other than the default one
    await expect(this.simpleToken.connect(attacker).transfer(user.address,11)).to.be.revertedWith("Not enough tokens");
    // Error: VM Exception while processing transaction: reverted with reason string 'SafeMath: subtraction overflow'
  });

  it.skip("Should overflow if an attacker transfer an amount greater than its balance - BEFORE using the SafeMath library", async function () {
    await this.simpleToken.transfer(attacker.address,10);

    const initialAttackerBalance = await this.simpleToken.balanceOf(attacker.address);
    console.log(`Initital attacker balance: ${initialAttackerBalance.toString()} tokens`);
    const initialUserBalance = await this.simpleToken.balanceOf(user.address);
    console.log(`Initital user balance: ${initialUserBalance.toString()} tokens`);

    await this.simpleToken.connect(attacker).transfer(user.address,11)

    const finalAttackerBalance = await this.simpleToken.balanceOf(attacker.address);
    console.log(`Final attacker balance: ${finalAttackerBalance.toString()} tokens`);
    const finalUserBalance = await this.simpleToken.balanceOf(user.address);
    console.log(`Final user balance: ${finalUserBalance.toString()} tokens`);

    // If the attacker's transfer() caused an overflow, the attacker balance will be updated to the equivalent value of all 1111111
    expect(finalAttackerBalance).to.eq(ethers.constants.MaxUint256);

    // And the user should've received the 11 tokens that were sent!
    expect(finalUserBalance.toString()).to.eq('11')

  });

  it("Should revert if the attacker tries to transfer an amount greater than its balance - AFTER using the SafeMath library", async function () {
    await this.simpleToken.transfer(attacker.address,10);
    await expect(this.simpleToken.connect(attacker).transfer(user.address,11)).to.be.revertedWith("'SafeMath: subtraction overflow'");
  });



});