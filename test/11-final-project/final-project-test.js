const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Final Project", function () {
  let deployer, user, user2, user3, attacker;

  beforeEach(async function () {
    [deployer, user, user2, user3, attacker] = await ethers.getSigners();

    // formating a string into bytes32
    // ethers.utils.formatBytes32String("eatTheBlocks")

    const EtbToken = await ethers.getContractFactory("ETBToken", deployer);
    this.etbToken = await EtbToken.deploy(ethers.utils.parseEther("1000"));

    const EtbDex = await ethers.getContractFactory("EtbDex", deployer);
    // this.etbDex = await EtbDex.deploy(this.etbToken.address, this.dexContractPassword);
    this.etbDex = await EtbDex.deploy(this.etbToken.address);

    await this.etbDex.setFee(1);
    await this.etbToken.setDexAddress(this.etbDex.address);
    await this.etbToken.approve(this.etbDex.address, ethers.utils.parseEther("1000"));

    const AttackDEXContract = await ethers.getContractFactory("AttackDEXContract", attacker);
    this.attackerDEXContract = await AttackDEXContract.deploy(this.etbDex.address, this.etbToken.address);


  });

  describe.skip("ETB Token", function () {
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
        await expect(this.etbToken.connect(attacker).setDexAddress(this.etbDex.address)).to.be.revertedWith("Ownable: caller is not the owner");
        //await this.etbToken.connect(attacker).setDexAddress(this.etbDex.address)
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
        await expect(this.etbToken.connect(user).transfer(user2.address, amountToSend)).to.be.revertedWith("SafeMath: subtraction overflow")
        
        
        /** Results of executing the transaction with an underflow bug!:
         * //await this.etbToken.connect(user).transfer(user2.address, amountToSend);
         * console.log("User2 funds at the end: ", await this.etbToken.balanceOf(user2.address));
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

      it("If spender tries to transferFrom the owner more tokens than what is allowed to, the transaction should be reverted", async function () {
        // deployer transfers 100 to user, and user approves user2 to spend 10 tokens on their behalf
        await this.etbToken.transfer(user.address,ethers.utils.parseEther("100"));
        await this.etbToken.connect(user).approve(user2.address,amountToSend);

        // user2 attempts to send 100 tokens from the user balance to the user3
        await expect(this.etbToken.connect(user2).transferFrom(user.address,user3.address, wrongAmount)).to.be.revertedWith("SafeMath: subtraction overflow")
        //await this.etbToken.connect(user2).transferFrom(user.address,user3.address, wrongAmount)
        console.log("User3 funds at the end: ", await this.etbToken.balanceOf(user3.address));
      });

      it("If the token's owner has not enough balance to send the requested amount, the transaction should be reverted", async function () {
        // user approves to send 100 tokens to user2
        await this.etbToken.connect(user).approve(user2.address,wrongAmount);

        // user2 attempts to send 100 tokens from the user balance to the user3
        // user2 has indeed the allowance to spend 100 tokens from the user balance, but the user balance is 0
        await expect(this.etbToken.connect(user2).transferFrom(user.address,user3.address, wrongAmount)).to.be.revertedWith("SafeMath: subtraction overflow")
        //await this.etbToken.connect(user2).transferFrom(user.address,user3.address, wrongAmount)
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


  describe("EtbDex contract tests", function () {
    describe("Validate variables were initialized properly when the contract was created", function () {
      it("Validate owner was set properly", async function () {
        expect(await this.etbDex.owner()).to.eq(deployer.address);
      });
      it("Validate etbToken address was set correct", async function () {
        const etbTokenAddressBytes32 = await ethers.provider.getStorageAt(this.etbDex.address,1)
        const etbTokenAddress = await ethers.utils.hexStripZeros(etbTokenAddressBytes32);
        expect(etbTokenAddress.toUpperCase()).to.eq((this.etbToken.address).toUpperCase());
      });
    });
    
    describe("buyTokens() function", function () {
      it("unhappy path - NO ETHs are sent", async function () {
        await expect(this.etbDex.connect(user).buyTokens({ value : ethers.utils.parseEther("0") })).to.be.revertedWith("Should send ETH to buy tokens");
      });

      it("unhappy path - owner has not enough balance to send the requested amount of tokens", async function () {
        // Decrease the owner's token balance to less than 50 tokens (deployer account is the owner)
        const currentOwnerBalance = await this.etbToken.balanceOf(deployer.address);
        const depleteOwnerBalance = ethers.utils.parseEther("960")
        // console.log("currentOwnerBalance" , currentOwnerBalance);
        // const depleteOwnerBalanceAmount = currentOwnerBalance - ethers.utils.parseEther("960")
        await this.etbToken.transfer(user2.address, depleteOwnerBalance)
        /*
        const balanceOwnerAfter = await this.etbToken.balanceOf(deployer.address);
        console.log("balanceOwnerAfter: ", ethers.utils.formatEther(balanceOwnerAfter));
        expect(balanceOwnerAfter).to.eq((currentOwnerBalance).sub(depleteOwnerBalance))
        */

        // user attempts to buy more tokens than the remaining owner's balance
        await expect(this.etbDex.connect(attacker).buyTokens({ value : ethers.utils.parseEther("50") })).to.be.revertedWith("SafeMath: subtraction overflow")

        /*
        await this.etbDex.connect(attacker).buyTokens({ value : ethers.utils.parseEther("80") });

        const attackerTokenBalance = await this.etbToken.balanceOf(attacker.address);
        console.log("Attacker token's balance after buying tokens and generating an underflow issue: ", ethers.utils.formatEther(attackerTokenBalance));

        const balanceOwnerAfterAttack = await this.etbToken.balanceOf(deployer.address);
        console.log("balanceOwnerAfterAttack: ", ethers.utils.formatEther(balanceOwnerAfterAttack));
        *

        /** ====================== NOTES ======================
         * When an underflow happens while buying tokens the next events will be true:
         * buyer will receive the tokens they bought
         * owner's token balance will totally be wrecked (The underflow will happen on this variable!)
                * Attacker token's balance after buying tokens and generating an underflow issue:  80.0
                * balanceOwnerAfterAttack:  115792089237316195423570985008687907853269984665640564039417.584007913129639936
         */

      });

      it("happy path - buyTokens() is executed successfully", async function () {
        const tokensToBuy = ethers.utils.parseEther("5");
        const fee = await this.etbDex.fee();
        const fees = tokensToBuy.div(100).mul(fee);

        await this.etbDex.connect(user).buyTokens({ value : tokensToBuy });

        const userTokensBalance = await this.etbToken.balanceOf(user.address);
        expect(userTokensBalance).to.eq((tokensToBuy).sub(fees))
      });

    });

    describe("sellTokens() function", function () {
      /*
      * The ETBToken contract (victim contract) has been patched and there is no more reentrancy vulnerabilities
      it("Exploiting reentrancy on the DEX Contract by performing an attack from an Attacker Contract", async function () {
        const tokens = ethers.utils.parseEther("5")
        expect(await this.attackerDEXContract.owner()).to.eq(attacker.address);
        // Buy 5 tokens on the Attacker Contract from the DEX Contract
        await this.attackerDEXContract.connect(attacker).buyTokens({ value: tokens });
        
        const attackerContractTokensBalance = await this.etbToken.balanceOf(this.attackerDEXContract.address);
        const fee = await this.etbDex.fee();
        const fees = tokens.div(100).mul(fee);

        expect(attackerContractTokensBalance).to.eq((tokens).sub(fees))

        // Another users buy tokens using the DEX Contract -> Just to increase the ETH balance on the DEX Contract
        await this.etbDex.connect(user).buyTokens({ value: tokens });
        await this.etbDex.connect(user2).buyTokens({ value: tokens });
        await this.etbDex.connect(user3).buyTokens({ value: ethers.utils.parseEther("7") });

        console.log("DEX Contract ETH Balance BEFORE the attack: ", ethers.utils.formatEther(await ethers.provider.getBalance(this.etbDex.address)));
        console.log("Attacker account ETH Balance BEFORE performing the attack: ", ethers.utils.formatEther(await ethers.provider.getBalance(attacker.address)));
        console.log("============================================================================");
        
        // Attack the DEX Contract
        // await this.attackerDEXContract.connect(attacker).sellTokens(attackerContractTokensBalance);
        // Attacker contract was updated to not revert a transactionn if reentrancy doesn't work...
        await this.attackerDEXContract.connect(attacker).sellTokens(attackerContractTokensBalance)
        
        console.log("============================================================================");
        console.log("DEX Contract ETH Balance AFTER the attack: ", ethers.utils.formatEther(await ethers.provider.getBalance(this.etbDex.address)));
        console.log("Attacker account ETH Balance AFTER performing the attack: ", ethers.utils.formatEther(await ethers.provider.getBalance(attacker.address)));
      })
      */

      it("unhappy path - Caller has not enough tokens to sell", async function () {
        // Buy some tokens from other users - Just to fund with ETH the dex contract
        await this.etbDex.connect(user).buyTokens({ value: ethers.utils.parseEther("5") });
        await this.etbDex.connect(user2).buyTokens({ value: ethers.utils.parseEther("5") });

        await expect(this.etbDex.connect(user).sellTokens(ethers.utils.parseEther("5"))).to.be.revertedWith("SafeMath: subtraction overflow");
        
        /*
        const ownerTokensBefore = await this.etbToken.balanceOf(deployer.address);
        const userTokensBefore = await this.etbToken.balanceOf(user.address);
        console.log("ownerTokensBefore: ", ownerTokensBefore);
        console.log("userTokensBefore: ", userTokensBefore);

        await this.etbDex.connect(user).sellTokens(ethers.utils.parseEther("5"));

        const ownerTokensAfter = await this.etbToken.balanceOf(deployer.address);
        const userTokensAfter = await this.etbToken.balanceOf(user.address);
        console.log("ownerTokensAfter: ", ownerTokensAfter);
        console.log("userTokensAfter: ", userTokensAfter);
        */
        
      });
      
      it("happy path - sellTokens() is executed successfully", async function () {
        const buyAmount = ethers.utils.parseEther("5");
        await this.etbDex.connect(user).buyTokens({ value: buyAmount });

        const sellTokensAmount = await this.etbToken.balanceOf(user.address);
        
        const withdrawalsBefore = await this.etbDex.withdrawals(user.address);

        await this.etbDex.connect(user).sellTokens(sellTokensAmount);

        const withdrawalsAfter = await this.etbDex.withdrawals(user.address);

        expect(withdrawalsAfter).gt(withdrawalsBefore);

      });
    });

    describe("Validate withdraw() function", function () {
      it("unhappy path - an user with no withdraw funds calls the withdraw() function", async function () {
        // attaker account calls withdraw() even though he doesn't have any funds to withdraw
        await expect(this.etbDex.connect(attacker).withdraw()).to.be.revertedWith("Error withdrawing funds, user has no funds to withdraw");
      });

      it("happy path - withdraw() function is executed successfully", async function () {
        const buyAmount = ethers.utils.parseEther("5");
        await this.etbDex.connect(user).buyTokens({ value: buyAmount });

        const sellTokensAmount = await this.etbToken.balanceOf(user.address);
        await this.etbDex.connect(user).sellTokens(sellTokensAmount);

        const userETHBalanceBefore = await ethers.provider.getBalance(user.address); 

        // user account withdraw its funds from the DEX Contract
        await this.etbDex.connect(user).withdraw();

        const userETHBalanceAfter = await ethers.provider.getBalance(user.address);
        expect(userETHBalanceAfter).gt(userETHBalanceBefore)

        // Validate the value of withdrawals is set to 0 after the withdraw is completed!
        const userWithdrawalValueAfter = await this.etbDex.withdrawals(user.address);
        expect(userWithdrawalValueAfter).to.eq("0");
      })
    })

    describe("Validate setFee()", function () {
      it("Validate fee was set properly", async function () {
        const fee = await this.etbDex.fee();
        console.log("fee: ",ethers.utils.formatEther(fee));
        expect(fee).to.eq(1);
      });

      it("Only owner can call the setFee() function", async function () {
        await expect(this.etbDex.connect(attacker).setFee(2)).to.be.revertedWith("Ownable: caller is not the owner")
      })
      
    });

    describe("Validate withdrawFees()", function () {
      it("unhappy path - Incorrect access", async function () {
        await expect(this.etbDex.connect(attacker).withdrawFees()).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("happy path - withdrawFees() is executed successfully", async function () {
        // Buy some tokens from other users - Just to fund with ETH the dex contract and accrue some interests to the owner
        await this.etbDex.connect(attacker).buyTokens({ value: ethers.utils.parseEther("50") });
        await this.etbDex.connect(user3).buyTokens({ value: ethers.utils.parseEther("50") });
        await this.etbDex.connect(user).buyTokens({ value: ethers.utils.parseEther("50") });
        await this.etbDex.connect(user2).buyTokens({ value: ethers.utils.parseEther("50") });

        const ownerETHBalanceBefore = await ethers.provider.getBalance(deployer.address);

        await this.etbDex.withdrawFees()

        const ownerETHBalanceAfter = await ethers.provider.getBalance(deployer.address);

        expect(ownerETHBalanceAfter).gt(ownerETHBalanceBefore);

        const etbDEXContractBalance = await ethers.provider.getBalance(this.etbDex.address);
        expect(etbDEXContractBalance).gt("0");
      });
    });

  });

});
