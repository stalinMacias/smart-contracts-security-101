const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Upgradable Proxy Pattern", function () {
  let deployer, user;

  beforeEach(async function () {
    [deployer, user] = await ethers.getSigners();

    /**
     * @dev - Notes about getContractFactory() and getContractAt() hardhat methods
     * 
     * @function - getContractFactory("ArtifactName", <signer>)
     * @param ArtifactName -> The ArtifactName is used by hardhat to get the contract's ABI, thus the available contract's functions
     * @param signer -> signer is the entire object, not only the address!
     * @syntax   - function getContractFactory(name: string, signer?: ethers.Signer): Promise<ethers.ContractFactory>;
     * @purpose -> Apparently, the purpose of getContractFactory is to prepare a contract instance ready to be deployed and signed by the signer!
     * @warning -> If the provided ArtifactName doesn't match any artifact from the current project, an error similar to like the below will appear:
     * @error -> Please replace "WrongArtifactName" for the correct contract name wherever you are trying to read its artifact.
     * 
     * @function - getContractAt("ArtifactName", <address>)
     * @param ArtifactName -> The ArtifactName is used by hardhat to get the contract's ABI, thus the available contract's functions
     * @param address -> address indicates the contract's address from which the storage will be manipulated
     * @syntax   - function getContractAt(name: string, address: string, signer?: ethers.Signer): Promise<ethers.Contract>;
     * @purpose -> Gets a contract instance of an alrady deployed contract
     */

    const FullLogicV1ArtifactName = "contracts/8-upgradeability/storage-collition/LogicV1.sol:LogicV1"
    const FullProxyArtifactName = "contracts/8-upgradeability/storage-collition/Proxy.sol:Proxy"
    const FullLogicV2ArtifactName = "contracts/8-upgradeability/storage-collition/LogicV2.sol:LogicV2"

    const LogicV1 = await ethers.getContractFactory(FullLogicV1ArtifactName, deployer);
    this.logicV1 = await LogicV1.deploy();

    const Proxy = await ethers.getContractFactory(FullProxyArtifactName, deployer);
    this.proxy = await Proxy.deploy(this.logicV1.address);
    
    const LogicV2 = await ethers.getContractFactory(FullLogicV2ArtifactName, deployer);
    this.logicV2 = await LogicV2.deploy();

    this.proxyPattern = await ethers.getContractAt(FullLogicV1ArtifactName, this.proxy.address);
    this.proxyPattern2 = await ethers.getContractAt(FullLogicV2ArtifactName, this.proxy.address);
    
  });

  describe("Proxy", function () {
    it("Should return the address of LogicV1 when calling logicContract()", async function () {
      expect(await this.proxy.logicContract()).to.eq(this.logicV1.address);
    });
    
    it("Should revert if anyone than the owner tries to upgrade", async function () {
      await expect(this.proxy.connect(user).upgrade(this.logicV2.address)).to.be.revertedWith("Access restricted");
    });
    it("Should allow the owner to update the Logic Contract", async function () {
      await this.proxy.upgrade(this.logicV2.address);
      expect(await this.proxy.logicContract()).to.eq(this.logicV2.address);
    });
    it("Calling increaseX of LogicV1 should add 1 to x Proxy's state", async function () {
      await this.proxyPattern.connect(user).increaseX();
      expect(await this.proxy.x()).to.eq(1);
      expect(await this.logicV1.x()).to.eq(0);
    });
    it("Calling increaseX of LogicV2 should add 2 to x Proxy's state", async function () {
      await this.proxy.upgrade(this.logicV2.address);
      await this.proxyPattern2.increaseX();
      expect(await this.proxy.x()).to.eq(2);
      expect(await this.logicV2.x()).to.eq(0);
    });
    it("Should set y", async function () {
      await this.proxy.upgrade(this.logicV2.address);
      await this.proxyPattern2.setY(5);

      // expect(await this.proxy.owner()).to.eq("0x0000000000000000000000000000000000000005");  // <---> Validation of the storage collision before fixing it on the LogicV2 contract

      // Validation that the storage collision on LogicV2 contract was fixed!
      const byte32Y = await ethers.provider.getStorageAt(this.proxy.address, 3);
      const y = await ethers.BigNumber.from(byte32Y);

      expect(y).to.eq(5);
    });
  });
});
