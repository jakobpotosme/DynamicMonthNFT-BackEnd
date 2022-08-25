const { network, ethers } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");
const fs = require("fs");

module.exports = async function ({ getNamedAccounts }) {
  const { deployer } = await getNamedAccounts();

  // Dynamic NFT
  const dynamicNft = await ethers.getContract("DynamicNft", deployer);
  const mintFee = await dynamicNft.getMintFee();

  console.log("Minting NFT...");
  await new Promise(async (resolve, reject) => {
    setTimeout(resolve, 300000); // 5 min
    dynamicNft.once("NftMinted", async function () {
      resolve();
    });

    const dynamicMintTx = await dynamicNft.mintNft({
      value: mintFee.toString(),
    });
    await dynamicMintTx.wait(1);
    console.log(
      `Dynamic NFT index 0 has tokenURI: ${await dynamicNft.tokenURI(0)}`
    );
  });
};

module.exports.tags = ["all", "mint"];
