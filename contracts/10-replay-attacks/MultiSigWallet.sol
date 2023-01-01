// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "@openzeppelin/contracts-release-v4.5/utils/cryptography/ECDSA.sol";

//@vulnerability -> Same signature can be used multiple times to execute a function. This can be harmful if the signer's intention was to approve a transaction once.

contract MultiSigWallet {
    using ECDSA for bytes32;

    address[2] public owners;

    constructor(address[2] memory _owners) payable {
        owners = _owners;
    }

    //address _to & uint _amount combined are the original message that the signers are signing
    // Is a must to send the _sigs array in order, starting from the first owner and then the second owner
    function transfer(address _to, uint _amount, bytes[2] memory _sigs) external {
        // Get the hash of the original message
        bytes32 txHash = getTxHash(_to, _amount);
        require(_checkSigs(_sigs, txHash), "invalid sig");

        (bool sent, ) = _to.call{value: _amount}("");
        require(sent, "Failed to send Ether");
    }
    function getTxHash(address _to, uint _amount) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_to, _amount));
    }

    function _checkSigs(
        bytes[2] memory _sigs,
        bytes32 _txHash
    ) private view returns (bool) {
        // Get the hash of the EthSignedMessage -> The actual hash that was used with the private keys to generate the signaure
        // 	When you use web3/ethersJS to sign a message hash, you are actually signing:
		        // https://eth.wiki/json-rpc/API#eth_sign[`eth_sign`]
		        // JSON-RPC method as part of EIP-191.
                // keccak256("\x19Ethereum Signed Message:\n32", message hash)
        bytes32 ethSignedHash = _txHash.toEthSignedMessageHash();

        for (uint i = 0; i < _sigs.length; i++) {
            address signer = ethSignedHash.recover(_sigs[i]);
            bool valid = signer == owners[i];

            if (!valid) {
                return false;
            }
        }

        return true;
    }

    receive() external payable {}

}