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

    RELAY_URL,
    SIGNATURE,

    ADMIN_PRV_KEY,
    RELAYER,
    THRESHOLD,

    DRY,
} = envVariables;

const RelayerArr = RELAYER.split(',');

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
        wrap_exec(`./chainbridge-core-example evm-cli admin add-relayer --bridge ${env_config['bridge']} --relayer ${relayer} --url ${env_config['url']} --private-key ${ADMIN_PRV_KEY}`);
    });

    wrap_exec(`./chainbridge-core-example evm-cli admin set-threshold --bridge ${env_config['bridge']} --threshold ${THRESHOLD} --url ${env_config['url']} --private-key ${ADMIN_PRV_KEY}`);

    for (const token of env_config.tokens) {
        if (token.native) {
            wrap_exec(`./chainbridge-core-example evm-cli bridge register-native-resource --bridge ${env_config['bridge']} --handler ${env_config['erc20_hdl']} --resource ${token.resourceId} --target ${token.address} --native true --url ${env_config['url']} --private-key ${ADMIN_PRV_KEY}`)
        } else {
            wrap_exec(`./chainbridge-core-example evm-cli bridge register-resource --bridge ${env_config['bridge']} --handler ${env_config['erc20_hdl']} --resource ${token.resourceId} --target ${token.address} --url ${env_config['url']} --private-key ${ADMIN_PRV_KEY}`)
        }

        wrap_exec(`./chainbridge-core-example evm-cli bridge set-burn --bridge ${env_config['bridge']} --handler ${env_config['erc20_hdl']} --token-contract ${token.address} --url ${env_config['url']} --private-key ${ADMIN_PRV_KEY}`);
        wrap_exec(`./chainbridge-core-example evm-cli erc20 add-minter --contract ${token.address} --minter ${env_config['erc20_hdl']} --url ${env_config['url']} --private-key ${ADMIN_PRV_KEY}`)
    }

    if (RELAY_URL && SIGNATURE) {
        let web3 = new Web3(env_config['url']);
        let bridgeContract = new web3.eth.Contract(bridgeABI, env_config['bridge']);

        RelayerArr.map(relayer => {
            wrap_exec(`./chainbridge-core-example evm-cli relaychain add-relayer --signature ${SIGNATURE} --relayer ${relayer} --url ${RELAY_URL} --private-key ${ADMIN_PRV_KEY}`);
        });

        let domainID = await bridgeContract.methods._domainID().call().catch(console.error);
        if (domainID) {
            wrap_exec(`./chainbridge-core-example evm-cli relaychain set-threshold --signature ${SIGNATURE} --domain ${domainID} --threshold ${THRESHOLD} --url ${RELAY_URL} --private-key ${ADMIN_PRV_KEY}`);
        }

        let chainID = await web3.eth.getChainId().catch(console.error);
        if (domainID && chainID) {
            wrap_exec(`./chainbridge-core-example evm-cli admin set-dest-chain-id --signature ${SIGNATURE} --domain ${domainID} --chainId ${chainID} --url ${RELAY_URL} --private-key ${ADMIN_PRV_KEY}`);
        }
    }
}

function wrap_exec(command) {
    console.info(command);
    if (!DRY) {
        exec(command, callbackFunc);
    }
}

async function main() {
    if (metertestConfig) {
        console.info('metertestConfig ----------------------------------');
        await run(ENV_config["metertestConfig"]);
    }

    if (avalancheConfig) {
        console.info('avalancheConfig ----------------------------------');
        await run(ENV_config["avalancheConfig"]);
    }

    if (bscConfig) {
        console.info('bscConfig ----------------------------------');
        await run(ENV_config["bscConfig"]);
    }

    if (ethereumConfig) {
        console.info('ethereumConfig ----------------------------------');
        await run(ENV_config["ethereumConfig"]);
    }

    if (meterConfig) {
        console.info('meterConfig ----------------------------------');
        await run(ENV_config["meterConfig"]);
    }

    if (moonbeamConfig) {
        console.info('moonbeamConfig ----------------------------------');
        await run(ENV_config["moonbeamConfig"]);
    }

    if (moonriverConfig) {
        console.info('moonriverConfig ----------------------------------');
        await run(ENV_config["moonriverConfig"]);
    }

    if (polisConfig) {
        console.info('polisConfig ----------------------------------');
        await run(ENV_config["polisConfig"]);
    }

    if (polygonConfig) {
        console.info('polygonConfig ----------------------------------');
        await run(ENV_config["polygonConfig"]);
    }

    if (thetaConfig) {
        console.info('thetaConfig ----------------------------------');
        await run(ENV_config["thetaConfig"]);
    }
}

main();
