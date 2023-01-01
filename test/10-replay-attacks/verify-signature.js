const { expect } = require("chai");
const { ethers } = require("hardhat");

require("dotenv").config();

// Using a contract that was already deployed on the goerli testnet to run this tests
// contract address: 0xE3AB241ab3595D1a9376dEFE08EE9477bc120B1E

describe("Verify Signatures on chain", function () {
  let signer;

  beforeEach(async function () {
    // Create a wallet to sign the hash with
    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    signer = new ethers.Wallet(PRIVATE_KEY);

    /**
     * @dev - Notes about getContractAt() hardhat methods
     * 
     * @function - getContractAt("ArtifactName", <address>)
     * @param ArtifactName -> The ArtifactName is used by hardhat to get the contract's ABI, thus the available contract's functions
     * @param address -> address indicates the contract's address from which the storage will be manipulated
     * @syntax   - function getContractAt(name: string, address: string, signer?: ethers.Signer): Promise<ethers.Contract>;
     * @purpose -> Gets a contract instance of an alrady deployed contract
     */

    this.verifySignature = await ethers.getContractAt("VerifySignature", "0xE3AB241ab3595D1a9376dEFE08EE9477bc120B1E" );    
  });

  describe("Verify Signature", function () {
    it("Should hash a message", async function () {     
      const hash = await this.verifySignature.getMessageHash("Hello, this is Stalin");  // hash will be a string

      // ethers.utils.arrayify(hash) will convert the string into bytes
      const signature = await signer.signMessage(ethers.utils.arrayify(hash)) // signature will be a string
    });

    it("Should verify a signature is valid", async function () {
      const messageToVerify = "Hello, this message will be verified";
      // Generate the hash of the message that will be verifies
      const hash = await this.verifySignature.getMessageHash(messageToVerify);
      // Sign the message using the private keys of the signer -> Generates the signature
      const signature = await signer.signMessage(ethers.utils.arrayify(hash)) // signature will be a string
      
      expect(await this.verifySignature.verify(signer.address,messageToVerify,signature)).to.eq(true);

      const incorrectSigner = "0x98A906664d1045c64ab61d644CCbaCf168A67d5c";
      // Another account who is not the signer attempts to verify the signature
      expect(await this.verifySignature.verify(incorrectSigner,messageToVerify,signature)).to.eq(false)

      // The correct signer tries to verify the signature but using a different message than the one that was signed
      expect(await this.verifySignature.verify(signer.address,"Another message",signature)).to.eq(false)
    });

    it("Should recover the signer from the signature", async function () {
      const messageToVerify = "Hello, this message will be verified";
      // Generate the hash of the message that will be verifies
      const hash = await this.verifySignature.getMessageHash(messageToVerify);
      // Sign the message using the private keys of the signer -> Generates the signature
      const signature = await signer.signMessage(ethers.utils.arrayify(hash)) // signature will be a string

      // Get the actual hash of the message that is signed - The one that is generated after applying the ethereum format for messages
      // keccak256("\x19Ethereum Signed Message:\n32", message hash)
      const ethHash = await this.verifySignature.getEthSignedMessageHash(hash);

      // Get the signer of the signature
      const originalSigner = await this.verifySignature.recoverSigner(ethHash,signature);

      expect(originalSigner).to.eq(signer.address);
    });
    

  });
});
