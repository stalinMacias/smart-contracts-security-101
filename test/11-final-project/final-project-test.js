const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Final Project", function () {
  let deployer, user, user2, user3, attacker;

  beforeEach(async function () {
    [deployer, user, user2, user3, attacker] = await ethers.getSigners();

    const dexContractPassword = ethers.utils.formatBytes32String("eatTheBlocks")

    const EtbToken = await ethers.getContractFactory("ETBToken", deployer);
    this.etbToken = await EtbToken.deploy(ethers.utils.parseEther("1000"));

    const EtbDex = await ethers.getContractFactory("EtbDex", deployer);
    this.etbDex = await EtbDex.deploy(this.etbToken.address, dexContractPassword);

    await this.etbDex.setFee(1, dexContractPassword);
    await this.etbToken.setDexAddress(this.etbDex.address);
    await this.etbToken.approve(this.etbDex.address, ethers.utils.parseEther("1000"));
  });

  describe("ETB Token", function () {
    it("totalSupply should match Initial supply", async function () {
      expect(await this.etbToken.totalSupply()).to.eq(ethers.utils.parseEther("1000"));
    });

    // 😃 Let's test every path for every function!
    describe("setDexAddress function", function () {
      it("owner should be able to update the dexAddress", async function () {
        await this.etbToken.setDexAddress(this.etbDex.address);
        const dexAddress = await this.etbToken.etbDex();
        expect(dexAddress).to.eq(this.etbDex.address)
      });
      it("only the owner should be able to update the dexAddress", async function () {
        // @note - Update this test after fixing the vulnerabilities in the contracts
        //await expect(this.etbToken.connect(attacker).setDexAddress(this.etbDex.address)).to.be.reverted;
        await this.etbToken.connect(attacker).setDexAddress(this.etbDex.address)
      });
    });

    describe("transfer function", function () {
      const amountToSend = ethers.utils.parseEther("10");
      it("If the receiver is the 0x address, the transaction should be reverted", async function () {
        await expect(this.etbToken.connect(user).transfer(ethers.constants.AddressZero, amountToSend)).to.be.revertedWith("ERC20: transfer from the zero address")
      });
      it("If sender has not enough balance, transaction should be reverted", async function () {
        console.log("User funds: ", await this.etbToken.balanceOf(user.address));
        // @note - Update this test after fixing the vulnerabilities in the contracts
        //await expect(this.etbToken.connect(user).transfer(user2.address, amountToSend)).to.be.revertedWith("Not enough balance")
        await this.etbToken.connect(user).transfer(user2.address, amountToSend);
        console.log("User2 funds at the end: ", await this.etbToken.balanceOf(user2.address));
        /** Results of executing the transaction with an underflow bug!:
         *  User funds:  BigNumber { value: "0" }
         * User2 funds at the end:  BigNumber { value: "10000000000000000000" }
         *    *** Explanation ***
         * User has no funds in the contract and attempts to transfer 10 tokens to User2, because of the underflow bug:
         * The function doesnt validate properly and also makes a wrong calculation, thus, resulting in user2 receiving a tremendous amount of tokens
         */
      });
      it("transfer if sender has enough funds", async function () {
        await this.etbToken.transfer(user2.address, amountToSend);
        const user2Balance = await this.etbToken.balanceOf(user2.address);
        expect(user2Balance).to.eq(amountToSend)
      });
    });

    describe("approve function", function () {
      const approvedAmount = ethers.utils.parseEther("10");
      it("if spender is the zero address, the transaction should be reverted", async function () {
        await expect(this.etbToken.connect(user).approve(ethers.constants.AddressZero, approvedAmount)).to.be.revertedWith("ERC20: approve to the zero address");
      });
      it("User approves User2 to spend 10 tokens", async function () {
        await this.etbToken.connect(user).approve(user2.address, approvedAmount);
        const user2Allowance = await this.etbToken.allowanceOf(user.address,user2.address);
        expect(user2Allowance).to.eq(approvedAmount);
      });
    });

    describe("transferFrom function", function () {
      const amountToSend = ethers.utils.parseEther("10");
      const wrongAmount = ethers.utils.parseEther("100");

      // @note - Update this test after fixing the vulnerabilities in the contracts
      it("If spender tries to transferFrom the owner more tokens than what is allowed to, the transaction should be reverted", async function () {
        // deployer transfers 100 to user, and user approves user2 to spend 10 tokens on their behalf
        await this.etbToken.transfer(user.address,ethers.utils.parseEther("100"));
        await this.etbToken.connect(user).approve(user2.address,amountToSend);

        // user2 attempts to send 100 tokens from the user balance to the user3
        //await expect(this.etbToken.connect(user2).transferFrom(user.address,user3.address, wrongAmount)).to.be.revertedWith("ERC20: amount exceeds allowance")
        await this.etbToken.connect(user2).transferFrom(user.address,user3.address, wrongAmount)
        console.log("User3 funds at the end: ", await this.etbToken.balanceOf(user3.address));
      });

      // @note - Update this test after fixing the vulnerabilities in the contracts
      it("If the token's owner has not enough balance to send the requested amount, the transaction should be reverted", async function () {
        // deployer transfers 100 to user, and user approves user2 to spend 10 tokens on their behalf
        await this.etbToken.transfer(user.address,ethers.utils.parseEther("100"));
        await this.etbToken.connect(user).approve(user2.address,amountToSend);

        // user approves the user2 to spend 100 tokens - But user total balance is only 10 tokens
        await this.etbToken.connect(user).approve(user2.address, wrongAmount);

        // user2 attempts to send 100 tokens from the user balance to the user3
        // user2 has indeed the allowance to spend 100 tokens from the user balance, but the user balance is only 10 tokens!
        //await expect(this.etbToken.connect(user2).transferFrom(user.address,user3.address, wrongAmount)).to.be.revertedWith("Not enough balance")
        await this.etbToken.connect(user2).transferFrom(user.address,user3.address, wrongAmount)
        console.log("User3 funds at the end: ", await this.etbToken.balanceOf(user3.address));
      });

      it("Happy path, transferFrom should works properly", async function () {
        // deployer transfers 100 to user, and user approves user2 to spend 10 tokens on their behalf
        await this.etbToken.transfer(user.address,ethers.utils.parseEther("100"));
        await this.etbToken.connect(user).approve(user2.address,amountToSend);

        const user3BalanceBefore = await this.etbToken.balanceOf(user3.address);
        const userBalanceBefore = await this.etbToken.balanceOf(user.address);
        const user2AllowanceBefore = await this.etbToken.allowanceOf(user.address,user2.address);

        // user2 attempts to send 100 tokens from the user balance to the user3
        //await expect(this.etbToken.connect(user2).transferFrom(user.address,user3.address, wrongAmount)).to.be.revertedWith("ERC20: amount exceeds allowance")
        await this.etbToken.connect(user2).transferFrom(user.address,user3.address, amountToSend)
        const user3BalanceAfter = await this.etbToken.balanceOf(user3.address);
        const userBalanceAfter = await this.etbToken.balanceOf(user.address);
        const user2AllowanceAfter = await this.etbToken.allowanceOf(user.address,user2.address);

        expect(user3BalanceAfter).to.eq((user3BalanceBefore).add(amountToSend));
        expect(userBalanceAfter).to.eq((userBalanceBefore).sub(amountToSend));
        expect(user2AllowanceAfter).to.eq((user2AllowanceBefore).sub(amountToSend));
      });

    });

    describe("mint function", function () {
      it("unhappy path - only the dex contract can mint new tokens, if the mint() is called by any other address, the transaction should be reverted", async function () {
        await expect(this.etbToken.connect(attacker).mint(ethers.utils.parseEther("1"))).to.be.revertedWith("Restricted Access");
      });
      it("happy path - only the dex contract can mint new tokens, if the mint() is called by any other address, the transaction should be reverted", async function () {
        // Source about how to `Call A Smart Contract Function With Another Deployed Smart Contract Address As "msg.sender " From Hardhat Test`
        // https://ethereum.stackexchange.com/questions/122959/call-a-smart-contract-function-with-another-deployed-smart-contract-address-as/142534#142534
        gasPrice = await ethers.provider.getGasPrice()
        await deployer.sendTransaction({
          to: this.etbDex.address, 
          value: ethers.utils.parseEther("1"),
          gasLimit: parseInt("65000"),
          gasPrice: gasPrice,
        })

        await hre.network.provider.request({
          method: "hardhat_impersonateAccount",
          params: [this.etbDex.address],
        });

        const etbDexContractSigner = await ethers.getSigner(this.etbDex.address);

        const totalSupplyBefore = await this.etbToken.totalSupply();
        await this.etbToken.connect(etbDexContractSigner).mint(ethers.utils.parseEther("1"));
        const totalSupplyAfter = await this.etbToken.totalSupply();
        expect(totalSupplyAfter).to.eq((totalSupplyBefore).add(ethers.utils.parseEther("1")))

        await hre.network.provider.request({
          method: "hardhat_stopImpersonatingAccount",
          params: [this.etbDex.address],
        });

      });

    });

    describe("burn function", function () {
      it("unhappy path - only the dex contract can burn tokens, if the burn() is called by any other address, the transaction should be reverted", async function () {
        await expect(this.etbToken.connect(attacker).burn(deployer.address,ethers.utils.parseEther("1"))).to.be.revertedWith("Restricted Access");
      });
      it("happy path - only the dex contract can burn tokens, if the burn() is called by any other address, the transaction should be reverted", async function () {
        // Source about how to `Call A Smart Contract Function With Another Deployed Smart Contract Address As "msg.sender " From Hardhat Test`
        // https://ethereum.stackexchange.com/questions/122959/call-a-smart-contract-function-with-another-deployed-smart-contract-address-as/142534#142534
        gasPrice = await ethers.provider.getGasPrice()
        await deployer.sendTransaction({
          to: this.etbDex.address, 
          value: ethers.utils.parseEther("1"),
          gasLimit: parseInt("65000"),
          gasPrice: gasPrice,
        })

        await hre.network.provider.request({
          method: "hardhat_impersonateAccount",
          params: [this.etbDex.address],
        });

        const etbDexContractSigner = await ethers.getSigner(this.etbDex.address);

        const totalSupplyBefore = await this.etbToken.totalSupply();
        await this.etbToken.connect(etbDexContractSigner).burn(deployer.address,ethers.utils.parseEther("1"));
        const totalSupplyAfter = await this.etbToken.totalSupply();
        expect(totalSupplyAfter).to.eq((totalSupplyBefore).sub(ethers.utils.parseEther("1")))

        await hre.network.provider.request({
          method: "hardhat_stopImpersonatingAccount",
          params: [this.etbDex.address],
        });

      });
    });

  });




});
