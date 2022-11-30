// Copyright 2021 ChainSafe Systems
// SPDX-License-Identifier: LGPL-3.0-only

package example

import (
	"os"
	"os/signal"
	"syscall"

	_ "github.com/meterio/chainbridge-core/config/chain"

	"github.com/ethereum/go-ethereum/common"
	"github.com/meterio/chainbridge-core/chains/evm"
	"github.com/meterio/chainbridge-core/chains/evm/calls/evmtransaction"
	"github.com/meterio/chainbridge-core/config"
	"github.com/meterio/chainbridge-core/flags"
	"github.com/meterio/chainbridge-core/lvldb"
	"github.com/meterio/chainbridge-core/opentelemetry"
	"github.com/meterio/chainbridge-core/relayer"
	"github.com/meterio/chainbridge-core/store"
	"github.com/meterio/chainbridge-core/util"
	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
)

var ZeroAddress = common.HexToAddress("0x0000000000000000000000000000000000000000")

func Run() error {
	errChn := make(chan error)
	stopChn := make(chan struct{})

	configuration, err := config.GetConfig(viper.GetString(flags.ConfigFlagName))
	db, err := lvldb.NewLvlDB(viper.GetString(flags.BlockstoreFlagName))
	if err != nil {
		panic(err)
	}
	blockstore := store.NewBlockStore(db)

	var openTelemetryInst *opentelemetry.OpenTelemetry

	metricsCollectorURL := viper.GetString(flags.MetricUrlFlagName)
	if metricsCollectorURL != "" {
		openTelemetryInst, err = opentelemetry.NewOpenTelemetry(metricsCollectorURL)
		if err != nil {
			panic(err)
		}
	}

	chains := []relayer.RelayedChain{}
	for _, chainConfig := range configuration.ChainConfigs {
		switch chainConfig["type"] {
		case "evm":
			{
				chain, err := evm.SetupDefaultEVMChain(openTelemetryInst, chainConfig, evmtransaction.NewTransaction, blockstore)
				if err != nil {
					panic(err)
				}

				log.Info().Msgf("SetupDefaultEVMChain %v", chain.DomainID())
				chains = append(chains, chain)
			}
			//case "celo":
			//{
			//	config, err := chain.NewEVMConfig(chainConfig)
			//	if err != nil {
			//		panic(err)
			//	}
			//	client, err := evmclient.NewEVMClient(config)
			//	if err != nil {
			//		panic(err)
			//	}
			//	gasPricer := evmgaspricer.NewStaticGasPriceDeterminant(client, nil)
			//	t := signAndSend.NewSignAndSendTransactor(transaction.NewCeloTransaction, gasPricer, client)
			//	bridgeContract := bridge.NewBridgeContract(client, common.HexToAddress(config.Bridge), t)
			//
			//	var airDropErc20Contract erc20.ERC20Contract
			//	if config.AirDropErc20Contract != ZeroAddress {
			//		err = client.EnsureHasBytecode(config.AirDropErc20Contract)
			//		if err != nil {
			//			panic(err)
			//		}
			//
			//		airDropErc20Contract = *erc20.NewERC20Contract(client, config.AirDropErc20Contract, t)
			//	}
			//
			//	var signaturesContract signatures.SignaturesContract
			//	if config.SignatureContract != ZeroAddress {
			//		err = client.EnsureHasBytecode(config.SignatureContract)
			//		if err != nil {
			//			panic(err)
			//		}
			//
			//		signaturesContract = *signatures.NewSignaturesContract(client, config.SignatureContract, t)
			//	}
			//
			//	domainId := config.GeneralChainConfig.Id
			//
			//	emh := listener.NewEVMMessageHandler(*config, airDropErc20Contract, t)
			//	eventHandler := listener.NewETHEventHandler(*bridgeContract)
			//	eventHandler.RegisterEventHandler(config.Erc20Handler, listener.Erc20EventHandler)
			//	eventHandler.RegisterEventHandler(config.Erc721Handler, listener.Erc721EventHandler)
			//	eventHandler.RegisterEventHandler(config.GenericHandler, listener.GenericEventHandler)
			//	evmListener := listener.NewEVMListener(client, eventHandler, common.HexToAddress(config.Bridge), config.SignatureContract, *emh, *domainId, proposalDB)
			//
			//	mh := voter.NewEVMMessageHandler(*bridgeContract)
			//	mh.RegisterMessageHandler(config.Erc20Handler, voter.ERC20MessageHandler)
			//	mh.RegisterMessageHandler(config.Erc721Handler, voter.ERC721MessageHandler)
			//	mh.RegisterMessageHandler(config.GenericHandler, voter.GenericMessageHandler)
			//
			//	evmVoter := voter.NewVoter(*config, proposalDB, mh, client, bridgeContract, &signaturesContract, airDropErc20Contract, *domainId, config.DelayVoteProposals, t)
			//	chains = append(chains, evm.NewEVMChain(evmListener, evmVoter, blockstore, config))
			//}
			//case "optimism":
			//{
			//	chain, err := optimism.SetupDefaultOptimismChain(chainConfig, evmtransaction.NewTransaction, blockstore)
			//	if err != nil {
			//		panic(err)
			//	}
			//
			//	chains = append(chains, chain)
			//}
		}
	}
	util.PathKeypair = nil

	if openTelemetryInst != nil {
		openTelemetryInst.MonitorHeadBlocks(chains)
		openTelemetryInst.MonitorSyncBlocks(chains)
		r := relayer.NewRelayer(
			chains,
			openTelemetryInst,
		)
		go r.Start(stopChn, errChn)
	} else {
		r := relayer.NewRelayer(chains, &opentelemetry.ConsoleTelemetry{})
		go r.Start(stopChn, errChn)
	}

	sysErr := make(chan os.Signal, 1)
	signal.Notify(sysErr,
		syscall.SIGTERM,
		syscall.SIGINT,
		syscall.SIGHUP,
		syscall.SIGQUIT)

	select {
	case err := <-errChn:
		log.Error().Err(err).Msg("failed to listen and serve")
		close(stopChn)
		return err
	case sig := <-sysErr:
		log.Info().Msgf("terminating got [%v] signal", sig)
		return nil
	}
}
