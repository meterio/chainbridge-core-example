const Web3 = require('web3');
const {exec} = require("child_process");

// ------------------------------------
const bridgeABI = require('./abi/bridge.json');

const avalancheConfig = require('./chain-configs/avalanche.json');
const bscConfig = require('./chain-configs/bsc.json');
const bsctestConfig = require('./chain-configs/bsctest.json');
const ethereumConfig = require('./chain-configs/ethereum.json');
const meterConfig = require('./chain-configs/meter.json');
const metertestConfig = require('./chain-configs/metertest.json');
const moonbeamConfig = require('./chain-configs/moonbeam.json');
const moonriverConfig = require('./chain-configs/moonriver.json');
const polisConfig = require('./chain-configs/polis.json');
const polygonConfig = require('./chain-configs/polygon.json');
const ropstenConfig = require('./chain-configs/ropsten.json');
const telostestConfig = require('./chain-configs/telostest.json');
const thetaConfig = require('./chain-configs/theta.json');
const thetatestConfig = require('./chain-configs/thetatest.json');
const voltatestConfig = require('./chain-configs/voltatest.json');
// ------------------------------------

require('dotenv').config();

// `process.env` is the one defined in the webpack's DefinePlugin
const envVariables = process.env;
// console.info("envVariables:", envVariables);

// Read vars from envVariables object
const {
    ETH_URL,
    MTR_URL,
    MTRTEST_URL,
    BSC_URL,
    MOVR_URL,
    AVAX_URL,
    THETA_URL,
    POLIS_URL,
    GLMR_URL,
    MATIC_URL,

    ETH_BRIDGE,
    ETH_ERC20_HDL,
    ETH_GENERIC_HDL,

    AVAX_BRIDGE,
    AVAX_ERC20_HDL,
    AVAX_GENERIC_HDL,

    MTR_BRIDGE,
    MTR_ERC20_HDL,
    MTR_GENERIC_HDL,

    MTRTEST_BRIDGE,
    MTRTEST_ERC20_HDL,
    MTRTEST_GENERIC_HDL,

    BSC_BRIDGE,
    BSC_ERC20_HDL,
    BSC_GENERIC_HDL,

    MOVR_BRIDGE,
    MOVR_ERC20_HDL,

    THETA_BRIDGE,
    THETA_ERC20_HDL,

    POLIS_BRIDGE,
    POLIS_ERC20_HDL,

    GLMR_BRIDGE,
    GLMR_ERC20_HDL,

    MATIC_BRIDGE,
    MATIC_ERC20_HDL,

    Relay_URL,
    Signature,

    ADMIN_TEST_PRV_KEY,
    Relayer,
    Threshold,
} = envVariables;

const RelayerArr = Relayer.split(',');

let ENV_config = {};

ENV_config["avalancheConfig"] = {
    "url": AVAX_URL,
    "bridge": AVAX_BRIDGE,
    "erc20_hdl": AVAX_ERC20_HDL,
    "generic_hdl": AVAX_GENERIC_HDL,
    tokens: avalancheConfig
};
ENV_config["bscConfig"] = {
    "url": BSC_URL,
    "bridge": BSC_BRIDGE,
    "erc20_hdl": BSC_ERC20_HDL,
    "generic_hdl": BSC_GENERIC_HDL,
    tokens: bscConfig
};
ENV_config["ethereumConfig"] = {
    "url": ETH_URL,
    "bridge": ETH_BRIDGE,
    "erc20_hdl": ETH_ERC20_HDL,
    "generic_hdl": ETH_GENERIC_HDL,
    tokens: ethereumConfig
};
ENV_config["meterConfig"] = {
    "url": MTR_URL,
    "bridge": MTR_BRIDGE,
    "erc20_hdl": MTR_ERC20_HDL,
    "generic_hdl": MTR_GENERIC_HDL,
    tokens: meterConfig
};
ENV_config["metertestConfig"] = {
    "url": MTRTEST_URL,
    "bridge": MTRTEST_BRIDGE,
    "erc20_hdl": MTRTEST_ERC20_HDL,
    "generic_hdl": MTRTEST_GENERIC_HDL,
    tokens: metertestConfig
};
ENV_config["moonbeamConfig"] = {
    "url": GLMR_URL,
    "bridge": GLMR_BRIDGE,
    "erc20_hdl": GLMR_ERC20_HDL,
    "generic_hdl": "",
    tokens: moonbeamConfig
};
ENV_config["moonriverConfig"] = {
    "url": MOVR_URL,
    "bridge": MOVR_BRIDGE,
    "erc20_hdl": MOVR_ERC20_HDL,
    "generic_hdl": "",
    tokens: moonriverConfig
};
ENV_config["polisConfig"] = {
    "url": POLIS_URL,
    "bridge": POLIS_BRIDGE,
    "erc20_hdl": POLIS_ERC20_HDL,
    "generic_hdl": "",
    tokens: polisConfig
};
ENV_config["polygonConfig"] = {
    "url": MATIC_URL,
    "bridge": MATIC_BRIDGE,
    "erc20_hdl": MATIC_ERC20_HDL,
    "generic_hdl": "",
    tokens: polygonConfig
};
ENV_config["thetaConfig"] = {
    "url": THETA_URL,
    "bridge": THETA_BRIDGE,
    "erc20_hdl": THETA_ERC20_HDL,
    "generic_hdl": "",
    tokens: thetaConfig
};

let callbackFunc = function (error, stdout, stderr) {
    if (error) {
        console.error("ERROR:", error.message);
        return;
    }

    if (stdout) {
        console.log("stdout:", stdout);
    }

    if (stderr) {
        console.error("stderr:", stderr);
    }
};

async function run(env_config) {
    RelayerArr.map(relayer => {
        // admin add-relayer
        exec(`./chainbridge-core-example evm-cli admin add-relayer --bridge ${env_config['bridge']} --relayer ${relayer} --url ${env_config['url']} --private-key ${ADMIN_TEST_PRV_KEY}`, callbackFunc);
    });

    // admin set-threshold
    exec(`./chainbridge-core-example evm-cli admin set-threshold --bridge ${env_config['bridge']} --threshold ${Threshold} --url ${env_config['url']} --private-key ${ADMIN_TEST_PRV_KEY}`, callbackFunc);

    for (const token of env_config.tokens) {
        if (token.native) {
            // bridge register-native-resource
            exec(`./chainbridge-core-example evm-cli bridge register-native-resource --bridge ${env_config['bridge']} --handler ${env_config['erc20_hdl']} --resource ${token.resourceId} --target ${token.address} --native true --url ${env_config['url']} --private-key ${ADMIN_TEST_PRV_KEY}`, callbackFunc)
        } else {
            // bridge register-resource
            exec(`./chainbridge-core-example evm-cli bridge register-resource --bridge ${env_config['bridge']} --handler ${env_config['erc20_hdl']} --resource ${token.resourceId} --target ${token.address} --url ${env_config['url']} --private-key ${ADMIN_TEST_PRV_KEY}`, callbackFunc)
        }

        // bridge set-burn
        exec(`./chainbridge-core-example evm-cli bridge set-burn --bridge ${env_config['bridge']} --handler ${env_config['erc20_hdl']} --token-contract ${token.address} --url ${env_config['url']} --private-key ${ADMIN_TEST_PRV_KEY}`, callbackFunc);

        // erc20 add-minter
        exec(`./chainbridge-core-example evm-cli erc20 add-minter --contract ${token.address} --minter ${env_config['erc20_hdl']} --url ${env_config['url']} --private-key ${ADMIN_TEST_PRV_KEY}`, callbackFunc)
    }

    if (Relay_URL && Signature) {
        let web3 = new Web3(env_config['url']);
        let bridgeContract = new web3.eth.Contract(bridgeABI, env_config['bridge']);

        let domainID = await bridgeContract.methods._domainID().call();
        let chainID = await web3.eth.getChainId();

        // relaychain set-threshold
        exec(`./chainbridge-core-example evm-cli relaychain set-threshold --signature ${Signature} --domain ${domainID} --threshold ${Threshold} --url ${Relay_URL} --private-key ${ADMIN_TEST_PRV_KEY}`, callbackFunc);

        RelayerArr.map(relayer => {
            // relaychain add-relayer
            exec(`./chainbridge-core-example evm-cli relaychain add-relayer --signature ${Signature} --relayer ${relayer} --url ${Relay_URL} --private-key ${ADMIN_TEST_PRV_KEY}`, callbackFunc);
        });

        // admin set-dest-chain-id
        exec(`./chainbridge-core-example evm-cli admin set-dest-chain-id --signature ${Signature} --domain ${domainID} --chainId ${chainID} --url ${Relay_URL} --private-key ${ADMIN_TEST_PRV_KEY}`, callbackFunc);
    }
}

async function main() {
    if (metertestConfig) {
        await run(ENV_config["metertestConfig"]);
    }

    // ------------

    if (avalancheConfig && false) {
        await run(ENV_config["avalancheConfig"]);
    }

    if (bscConfig && false) {
        await run(ENV_config["bscConfig"]);
    }

    if (ethereumConfig && false) {
        await run(ENV_config["ethereumConfig"]);
    }

    if (meterConfig && false) {
        await run(ENV_config["meterConfig"]);
    }

    if (moonbeamConfig && false) {
        await run(ENV_config["moonbeamConfig"]);
    }

    if (moonriverConfig && false) {
        await run(ENV_config["moonriverConfig"]);
    }

    if (polisConfig && false) {
        await run(ENV_config["polisConfig"]);
    }

    if (polygonConfig && false) {
        await run(ENV_config["polygonConfig"]);
    }

    if (thetaConfig && false) {
        await run(ENV_config["thetaConfig"]);
    }
}

main();
