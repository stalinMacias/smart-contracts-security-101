

## Proces to sign a message off-chain ##

1. Original Message in plain text
2. Hash the original message -> hash(msg)
3. Hash the hash(msg) with the prefixed strings to make the message compatible with the Ehtereum standard for messages ----> hash("\x19Ethereum Signed Message:\n32", hash(msg))
    - when you use web3/ethersJS to sign a message hash, you are actually signing:
      - https://eth.wiki/json-rpc/API#eth_sign[`eth_sign`]
      - JSON-RPC method as part of EIP-191.
        - keccak256("\x19Ethereum Signed Message:\n32", message hash)

4. And finally, is time to sign the hash of the ethMessageHash (The hash produced in the step3!)  <---> And this is what is known as the Signature
  - This will be produced by hashing the ethMessageHash + the private keys of the user
