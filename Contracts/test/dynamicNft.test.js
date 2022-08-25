const { network, getNamedAccounts, deployments, ethers } = require("hardhat");
const { assert, expect } = require("chai");
const {
  developmentChains,
  networkConfig,
} = require("../helper-hardhat-config");
const { logger } = require("ethers");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("DynamicNft", function () {
      let dynamicNft, deployer;
      let month;

      beforeEach(async function () {
        accounts = await ethers.getSigners();
        deployer = accounts[0];
        await deployments.fixture(["dynamicNft"]);

        dynamicNft = await ethers.getContract("DynamicNft");
      });

      describe("Constructor", async function () {
        it("sets starting values correctly", async function () {
          const monthTokenUriZero = await dynamicNft.getMonthTokenUris(0);
          console.log(monthTokenUriZero);
          assert(monthTokenUriZero.includes("ipfs://"));
        });
      });

      describe("Getting current month", async function () {
        it("Checks that current month matches", async function () {
          // const month = await dynamicNft.getCurrentMonth();
          const month = await dynamicNft.getCurrentMonth();

          assert.equal(month.toString(), "7");
        });
      });

      describe("Withdraw", async function () {
        it("Reverts if not owner of contract", async function () {
          const accounts = await ethers.getSigners();
          const dynamicNftConnectedContract = await dynamicNft.connect(
            accounts[1]
          );
          await expect(
            dynamicNftConnectedContract.withdraw()
          ).to.be.revertedWith("Ownable: caller is not the owner");
        });
      });

      describe("Mint a NFT", async function () {
        it("reverts if payment is less than mint fee", async function () {
          await expect(dynamicNft.mintNft()).to.be.revertedWith(
            "NeedMoreEthSent()"
          );
        });

        it("Mint an NFT based on currentMonth ", async function () {
          await new Promise(async (resolve, reject) => {
            dynamicNft.once("NftMinted", async () => {
              try {
                const tokenUri = await dynamicNft.tokenURI("0");
                console.log(`tokenUri: ${tokenUri}`);
                const tokenCounter = await dynamicNft.getTokenCounter();
                console.log(`tokenCounter: ${tokenCounter}`);

                const contractBalance = await dynamicNft.getBalance();
                console.log(`Contract Balance: ${contractBalance}`);
                // let expectedBalance = ethers.utils.parseEther("0.01");
                assert.equal(tokenUri.toString().includes("ipfs://"), true);
                assert.equal(tokenCounter.toString(), "1");
                assert.equal(
                  contractBalance,
                  ethers.utils.parseEther("0.01").toString()
                );
                resolve();
              } catch (error) {
                console.log(error);
                reject(e);
              }
            });

            try {
              const fee = await dynamicNft.getMintFee();

              const requestNftResponse = await dynamicNft.mintNft({
                value: fee.toString(),
              });
              const requestNftReceipt = await requestNftResponse.wait(1);
            } catch (error) {
              console.log(error);
              reject(e);
            }
          });
        });

        it("Mint an NFT based on next month, withdraw as owner", async function () {
          await network.provider.send("evm_increaseTime", [2629746]);
          await network.provider.send("evm_mine", []);

          await new Promise(async (resolve, reject) => {
            dynamicNft.once("NftMinted", async () => {
              try {
                const tokenUri = await dynamicNft.tokenURI("0");
                console.log(`tokenUri: ${tokenUri}`);
                const tokenCounter = await dynamicNft.getTokenCounter();
                console.log(`tokenCounter: ${tokenCounter}`);

                const contractBalanceBefore = await dynamicNft.getBalance();
                console.log(
                  `Contract Balance Before: ${contractBalanceBefore}`
                );

                const owner = await dynamicNft.owner();
                console.log(`Owner of contract is: ${owner}`);

                console.log(`Deployer address: ${deployer.address}`);

                const deployerBalanceBefore = await deployer.getBalance();
                console.log(
                  `Deployer Balance Before: ${deployerBalanceBefore}`
                );

                const txResponse = await dynamicNft.withdraw();
                const transactionReceipt = await txResponse.wait(1);

                // console.log(`Withdrawn amount: ${withdrawnAmount}`);

                const contractBalance = await dynamicNft.getBalance();
                console.log(`Contract Balance: ${contractBalance}`);

                const deployerBalanceAfter = await deployer.getBalance();
                console.log(`Deployer Balance After: ${deployerBalanceAfter}`);

                assert.equal(tokenUri.toString().includes("ipfs://"), true);
                assert.equal(tokenCounter.toString(), "1");
                // assert.equal(
                //   withdrawnAmount.toString(),
                //   ethers.utils.parseEther("0.1").toString()
                // );
                assert.equal(contractBalance, "0");

                resolve();
              } catch (error) {
                console.log(error);
                reject(e);
              }
            });

            try {
              const fee = await dynamicNft.getMintFee();

              const requestNftResponse = await dynamicNft.mintNft({
                value: fee.toString(),
              });
              const requestNftReceipt = await requestNftResponse.wait(1);
            } catch (error) {
              console.log(error);
              reject(e);
            }
          });
        });

        it("Mint an NFT based on next, next month ", async function () {
          await network.provider.send("evm_increaseTime", [2629746 + 2629746]);
          await network.provider.send("evm_mine", []);

          await new Promise(async (resolve, reject) => {
            dynamicNft.once("NftMinted", async () => {
              try {
                console.log("Should be two months from now");
                let tokenUri = await dynamicNft.tokenURI("0");
                console.log(`tokenUri: ${tokenUri}`);
                let tokenCounter = await dynamicNft.getTokenCounter();
                console.log(`tokenCounter: ${tokenCounter}`);

                await network.provider.send("evm_increaseTime", [2629746]);
                await network.provider.send("evm_mine", []);

                const fee = await dynamicNft.getMintFee();

                const requestNftResponse = await dynamicNft.mintNft({
                  value: fee.toString(),
                });

                await requestNftResponse.wait(1);

                console.log("Should be three months from now");
                tokenUri = await dynamicNft.tokenURI("1");
                console.log(`tokenUri: ${tokenUri}`);
                tokenCounter = await dynamicNft.getTokenCounter();
                console.log(`tokenCounter: ${tokenCounter}`);
                assert.equal(tokenUri.toString().includes("ipfs://"), true);
                assert.equal(tokenCounter.toString(), "2");

                // const tokenUri = await dynamicNft.tokenURI("0");
                // console.log(`tokenUri: ${tokenUri}`);
                // const tokenCounter = await dynamicNft.getTokenCounter();
                // console.log(`tokenCounter: ${tokenCounter}`);
                // assert.equal(tokenUri.toString().includes("ipfs://"), true);
                // assert.equal(tokenCounter.toString(), "1");
                resolve();
              } catch (error) {
                console.log(error);
                reject(e);
              }
            });

            try {
              const fee = await dynamicNft.getMintFee();

              const requestNftResponse = await dynamicNft.mintNft({
                value: fee.toString(),
              });
              const requestNftReceipt = await requestNftResponse.wait(1);
            } catch (error) {
              console.log(error);
              reject(e);
            }
          });
        });
      });
    });
