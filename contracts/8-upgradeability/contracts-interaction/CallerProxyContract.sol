// SPDX-License-Identifier: UNLICENSED
// ONLY FOR DEMONSTRATION PURPOSES, DO NOT USE THIS IN PRODUCTION

pragma solidity ^0.8.0;

contract CallerProxyContract {
  address public proxyContract; // Slot 1

  constructor(address _proxy) {
    proxyContract = _proxy;
  }

  // Calling increaseX() from LogicV1 contract through the fallback() of the Proxy contract
  function increaseXUsingCall() external {
    // The proxy contract will handle this call() by using the fallback()
    // The fallback() of the proxy contract will execute a delegateCall() to the LogicV1 contract passing the corresponding signature of the string "increaseX()"
    // And finally, the LogicV1 contract will match the passed signature with the signature of the increaseX() and will execute such function
    (bool success, ) = proxyContract.call(abi.encodeWithSignature("increaseX()"));
    require(success, "Unexpected error");
  }

  /*
  // Attempt to invoke the increaseX() from LogicV1 contract through the fallback() of the Proxy contract
  function increaseXNoLowFunction() external {
      // Explanation of contract interaction
        // Solidity offers the convenience of high-level syntax for calling functions in other contracts (for instance: targetContract.doSomething(...)). 
        // However, this high-level syntax is only available when the target contract’s interface is known at compile time.
          // source: https://jeancvllr.medium.com/solidity-tutorial-all-about-addresses-ffcdf7efc4e7
    (bool success, ) = proxyContract.increaseX(); // Solidity compiler throws a syntax error because there is no an interface to interact with functions from the other contract
    require(success, "Unexpected error");
  }
  */

}
