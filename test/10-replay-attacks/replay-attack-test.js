const { expect } = require("chai");
const { providers } = require("ethers");
const { ethers } = require("hardhat");

describe("Replay Attack", function () {
  let deployer, owners = [], user, attackers = [];

  beforeEach(async function () {
    [deployer, owners[0], owners[1], user, attackers[0], attackers[1]] = await ethers.getSigners();

    const VulnerableMultiSigWallet = await ethers.getContractFactory("MultiSigWallet", deployer);
    this.vulnerableMultiSigWallet = await VulnerableMultiSigWallet.deploy([owners[0].address,owners[1].address]);

    // Owners fund the VulnerableMultiSig Wallet contract
    for(i = 0; i < owners.length; i++) {
      await owners[i].sendTransaction({ to: this.vulnerableMultiSigWallet.address, value: ethers.utils.parseEther("5") });
    }

    const FixedMultiSigWallet = await ethers.getContractFactory("MultiSigWalletV2", deployer);
    this.fixedeMultiSigWallet = await FixedMultiSigWallet.deploy([owners[0].address,owners[1].address]);

    // Owners fund the FixedMultiSig Wallet contract
    for(i = 0; i < owners.length; i++) {
      await owners[i].sendTransaction({ to: this.fixedeMultiSigWallet.address, value: ethers.utils.parseEther("5") });
    }

  });

  describe.skip("MultiSigWallet - Vulnerable Version", function () {

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

  describe("MultiSigWallet - Fixed Version", function () {
    // nonce is related to the messages that are signed
    let nonce = 0;

    it.skip("Should allow transfer funds after receiving both signatures & mark as executed the hash of the generated signatures", async function () {
      const userBalanceBefore = await ethers.provider.getBalance(user.address);

      let txHashes = []
      let signatures = []
      const amount = ethers.utils.parseEther("1");

      // Owners signing process to generate the signatures for transfering 1ETH to the user account
      for(i = 0; i < owners.length; i++) {
        // The hash of the message that will be signed is the same for the two owners
        txHashes[i] = await this.fixedeMultiSigWallet.connect(owners[i]).getTxHash(this.fixedeMultiSigWallet.address,user.address,amount,nonce);
        // Owners sign their respective message -> Generate the signatures using the private keys of the owners
        // The difference is the signature that is generated by each owner when they sign the message!
        signatures[i] = await owners[i].signMessage(ethers.utils.arrayify(txHashes[i])); // each individual signature will be a string
      }

      await this.fixedeMultiSigWallet.transfer(user.address,amount,signatures,nonce)

      const userBalanceAfter = await ethers.provider.getBalance(user.address);

      expect(userBalanceAfter).to.eq(userBalanceBefore.add(amount));

      for(i = 0; i < signatures.length; i++) {
        //console.log("tx hashes marked as: ", await this.fixedeMultiSigWallet.getExecutedTransactions(signatures[i]));
        expect(await this.fixedeMultiSigWallet.executed(signatures[i])).to.eq(true)
      }
      nonce++;
    });

    it("Should revert if other than the admins sign the tx", async function () {

      let txHashes = []
      let signatures = []
      const amount = ethers.utils.parseEther("1");

      // attackers accounts try to generate the signatures for transfering 1ETH to the user account
      for(i = 0; i < attackers.length; i++) {
        // The hash of the message that will be signed is the same for the two owners
        txHashes[i] = await this.fixedeMultiSigWallet.connect(attackers[i]).getTxHash(this.fixedeMultiSigWallet.address,user.address,amount,nonce);
        // attackers sign their respective message -> Generate the signatures using the private keys of the attackers
        signatures[i] = await attackers[i].signMessage(ethers.utils.arrayify(txHashes[i]));
      }

      await expect(this.fixedeMultiSigWallet.transfer(user.address,amount,signatures,nonce)).to.be.revertedWith("Invalid Signature");

    });

    it("Should revert if the parameters of the signed signature are modified", async function () {

      let txHashes = []
      let signatures = []
      const amount = ethers.utils.parseEther("1");

      // attackers accounts try to generate the signatures for transfering 1ETH to the user account
      for(i = 0; i < attackers.length; i++) {
        // The hash of the message that will be signed is the same for the two owners
        txHashes[i] = await this.fixedeMultiSigWallet.connect(attackers[i]).getTxHash(this.fixedeMultiSigWallet.address,user.address,amount,nonce);
        // attackers sign their respective message -> Generate the signatures using the private keys of the attackers
        signatures[i] = await attackers[i].signMessage(ethers.utils.arrayify(txHashes[i]));
      }

      await expect(this.fixedeMultiSigWallet.transfer(user.address,amount,signatures,nonce)).to.be.revertedWith("Invalid Signature");

    });

    it("Attempting to perform a replay attack on the Fixed MultiSigWallet", async function () {
     
      let txHashes = []
      let signatures = []
      const amount = ethers.utils.parseEther("1");

      // Owners signing process to generate the signatures for transfering 1ETH to the user account
      for(i = 0; i < owners.length; i++) {
        // The hash of the message that will be signed is the same for the two owners
        txHashes[i] = await this.fixedeMultiSigWallet.connect(owners[i]).getTxHash(this.fixedeMultiSigWallet.address,user.address,amount,nonce);
        // Owners sign their respective message -> Generate the signatures using the private keys of the owners
        signatures[i] = await owners[i].signMessage(ethers.utils.arrayify(txHashes[i])); // each individual signature will be a string
      }

      // Replaying the signatures to transfer 2 times what the owners really approved! - The second transaction must be reverted!
      await this.fixedeMultiSigWallet.transfer(user.address,amount,signatures,nonce)
      await expect(this.fixedeMultiSigWallet.transfer(user.address,amount,signatures,nonce)).to.be.revertedWith("Signature has already been executed");
    });



  });


});
