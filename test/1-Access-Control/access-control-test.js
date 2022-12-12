const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Access Control", () => {
  let deployer, attacker, user;

  beforeEach(async function () {
    // A Signer in hardhat is an abstraction for an Ethereum Address which behaves exactly as any other External Owned Accounts (EOA)
    [deployer, attacker, user] = await ethers.getSigners();

    // A contract factory is another Ether.js abstractin that makes it possible to deploy Smart Contracts
    const AgreedPrice = await ethers.getContractFactory("AgreedPrice", deployer);

    // The factory deploys the contracts and returns a contract instance for it
    // The returned contract instance is saved in the "this" object to make it globally accessible
    this.agreedPrice = await AgreedPrice.deploy(100);
  });

  // describe() groups together a bunch of related tests to validate something in common
  describe("AgreedPrice", () => {

    // it() are used to perform isolated tests from each other
    // Any changes made to the state of a contract that were made within an it() test won't persists outside to scope of that it() test
    it("Should set price at deployment", async function () {
      // If no signer is specified, it will use the default account
      expect(await this.agreedPrice.price()).to.eq(100);
    });

    it("Should set the deployer account as the owner at deployment", async function () {
      expect(await this.agreedPrice.owner()).to.eq(deployer.address);
    });
    
    it("Should be possible for the owner to change price", async function () {
      await this.agreedPrice.updatePrice(1000);
      expect(await this.agreedPrice.price()).to.eq(1000);
    });

    it("Should NOT be possible for other than the owner to change price", async function () {
      // use the connect() method on your ethers.js Contract object/instance to connect it to a different account
      // test the code by sending a transaction from an account (or Signer in ethers.js terminology) other than the default one
      // When testing for executions that are expected to be reverted, the await must be applied for entire expect() statement 
      await expect(this.agreedPrice.connect(attacker).updatePrice(1000)).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should be possible for the owner to transfer ownership", async function () {
      await this.agreedPrice.transferOwnership(user.address);
      expect(await this.agreedPrice.owner()).to.eq(user.address);
    });

    it("Should be possible for a new owner to call updatePrice", async function () {
      await this.agreedPrice.transferOwnership(user.address);
      await this.agreedPrice.connect(user).updatePrice(1000);
      expect(await this.agreedPrice.price()).to.eq(1000);
    });

    it("Should not be possible for other than the owner to transfer ownership", async function () {
      await expect(this.agreedPrice.connect(attacker).transferOwnership(attacker.address)).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});