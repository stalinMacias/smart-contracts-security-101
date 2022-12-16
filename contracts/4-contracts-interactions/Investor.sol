// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
interface ISavingsAccount {
  function deposit() external payable;
  function withdraw() external;
}

contract Investor is Ownable{

  ISavingsAccount public immutable savingsAccount;

  constructor(address _savingsAccountAddress) {
    savingsAccount = ISavingsAccount(_savingsAccountAddress);
  }

  function depositOnSavingsAccount() external payable onlyOwner{
    // Forward the received amount of ETH onto the deposit() function from the SavingsAccount contract
    savingsAccount.deposit{ value: msg.value }();
  }

  function withdrawFromSavingAccount() external onlyOwner{
    savingsAccount.withdraw();
  }

  function contractsBalance() external view returns(uint) {
    return address(this).balance;
  }

  // receive() function to enable this contract to receive ethers
  // Should send the received ethers to the contract's owner
  // @warning - If the receive() function is removed, this contract won't be able to receive the ETHs that are sent to the contract by the withdraw() function of the SavingsAccount contract!
    // An error like this one would occur: "Error: Transaction reverted: function selector was not recognized and there's no fallback nor receive function"
  receive() external payable {
    (bool res, ) = payable(owner()).call{ value : address(this).balance }("");
    require(res, "An error occured on the Investor contract when sending the ETH back to the User");
  }

}