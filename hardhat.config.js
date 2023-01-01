require("dotenv").config();

require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");

const QUICKNODE_HTTP_URL_GOERLI = process.env.QUICKNODE_HTTP_URL_GOERLI;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

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
      /*
      mining: {
        auto: false,
        interval: 5000,
      },
      */
    },
    goerli: {
      url: QUICKNODE_HTTP_URL_GOERLI,
      accounts: [PRIVATE_KEY],
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
