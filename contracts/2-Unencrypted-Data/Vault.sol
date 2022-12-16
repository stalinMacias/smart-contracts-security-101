// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Vault is Ownable {
  // @warning - Even though this is a private variable, be aware that their value can be read from the blockchain
  // How to read its value? Get the memory location where the data is stored in the smart contract, and just pull it out!
  
  // Example of reading the value of this variable using ethersJS
    // The getStorageAt() function from ethers returns the values that are stored in a contract at an specific slot
    // Returns the Bytes32 value of the position pos at address addr, as of the blockTag.
    // Syntax: await ethers.provider.getStorageAt(<address>, <slot>) 
      //const pwd = await ethers.provider.getStorageAt(this.vault.address, 1);

  bytes32 private password; // Because this is the first variable and it sizes 32 bytes, it will be stored in the 1st slot of the memory's contract

  constructor(bytes32 _password) {
    password = _password;
  }

  modifier checkPassword(bytes32 _password) {
    require(password == _password, "Wrong password.");
    _;
  }

  function deposit() external payable onlyOwner {}

  function withdraw(bytes32 _password) external checkPassword(_password) {
    payable(msg.sender).transfer(address(this).balance);
  }
}