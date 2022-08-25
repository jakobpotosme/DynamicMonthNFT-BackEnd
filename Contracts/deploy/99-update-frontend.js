const { ethers, network } = require("hardhat");
const fs = require("fs");
// const frontEndContractsFile =
//   "../nextjs-nft-marketplace-moralis/constants/networkMapping.json";
const frontEndContractsFile =
  "../../nextjs-dynamic-month/constants/networkMapping.json";
// const frontEndAbiLocation = "../nextjs-nft-marketplace-moralis/constants/";
const frontEndAbiLocation = "../../nextjs-dynamic-month/constants/";

module.exports = async function () {
  if (process.env.UPDATE_FRONT_END) {
    console.log("updating front end...");
    await updateContractAddresses();
    await updateAbi();
  }
};

async function updateAbi() {
  const dynamicNft = await ethers.getContract("DynamicNft");
  fs.writeFileSync(
    `${frontEndAbiLocation}DynamicNft.json`,
    dynamicNft.interface.format(ethers.utils.FormatTypes.json)
  );
}

async function updateContractAddresses() {
  const dynamicNft = await ethers.getContract("DynamicNft");
  const chainId = network.config.chainId.toString();

  const contractAddresses = JSON.parse(
    fs.readFileSync(frontEndContractsFile, "utf8")
  );
  if (chainId in contractAddresses) {
    if (
      !contractAddresses[chainId]["DynamicNft"].includes(dynamicNft.address)
    ) {
      contractAddresses[chainId]["DynamicNft"].push(dynamicNft.address);
    }
  } else {
    contractAddresses[chainId] = { DynamicNft: [dynamicNft.address] };
  }

  fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses));
}

module.exports.tags = ["all", "frontend"];
