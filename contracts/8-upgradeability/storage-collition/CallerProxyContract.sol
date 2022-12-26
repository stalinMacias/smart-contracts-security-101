// SPDX-License-Identifier: UNLICENSED
// ONLY FOR DEMONSTRATION PURPOSES, DO NOT USE THIS IN PRODUCTION

pragma solidity ^0.8.0;

contract CallerProxyContract {
  address public proxyContract; // Slot 1

  constructor(address _proxy) {
    proxyContract = _proxy;
  }

  // Calling setY(uint256) from LogicV1 contract through the fallback() of the Proxy contract
  function setY(uint256 _num) external {
    // The proxy contract will handle this call() by using the fallback()
    // The fallback() of the proxy contract will execute a delegateCall() to the LogicV1 contract passing the corresponding signature of the string "setY()"
    // And finally, the LogicV1 contract will match the passed signature with the signature of the increaseX() and will execute such function
    (bool success, ) = proxyContract.call(abi.encodeWithSignature("setY(uint256)", _num));
    require(success, "Unexpected error");
  }

}
