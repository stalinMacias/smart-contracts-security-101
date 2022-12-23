require("dotenv").config();

require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.6.0",
      },
      {
        version: "0.5.0",
      },
      {
        version: "0.8.9",
        settings: {},
      },
    ],
  },
  networks: {
    hardhat: {
      blockGasLimit: 20000000,
    },
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
  },
  mocha: {
    timeout: 2000000000,
  },
};
