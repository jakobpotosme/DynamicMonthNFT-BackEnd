const { network, ethers } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");
const {
  storeImages,
  storeTokenUriMetadata,
} = require("../utils/uploadToPinata");

const MINT_FEE = ethers.utils.parseEther("0.01");
const imagesLocation = "./images";

const metadataTemplate = {
  name: "",
  description: "",
  image: "",
};

let tokenUris = [
  "ipfs://QmaNSopDAsqVTL3Vyq86NAQ1fLhjHpampwTEZUrEhV9n9G",
  "ipfs://QmVbrTzhyqBFW2cjiy5KE4ugKFQhETPK5kmAMrr655vGz6",
  "ipfs://QmaGCeRxFZ16UwS9C7Qisd1GEE6dZtejN3jWPmDuVppWq3",
  "ipfs://QmZtfFAe37498fdYEQ2QdpTxxWihmvtBtF7UVoqvJJMSKa",
  "ipfs://QmToEN4SQmDFpDvGo7P4941wrr8FNx71XiywDdLUAwV51j",
  "ipfs://QmWmbP495c5uZhABBvAACi8VvSWB1QGfpA6nTLGwofoQZP",
  "ipfs://QmYtFrJ26P1bK1KfuRF8znh5oTkC5Es9XbnjrpjUdDir1b",
  "ipfs://QmcUWuoMhuGqK3hkhixUbhAZMTZqkRcUwV99oVSCiVDVWx",
  "ipfs://QmRMfGCqiibcHcPLtZdfmoT5dyws9B91cYTJwYihGx2anN",
  "ipfs://QmZzKGptSYz9aZC7jfAqMhkH8P7QwCmPGWoCqDDEk6k6xc",
  "ipfs://QmUy7qzHJ2UdkvGR69veMvqoAajjnpSwcJLpxc48MJjAyM",
  "ipfs://QmfPZn3Es2C4R5noYEPGEMJjeDM5dSqXgPZPqBQiV4oDh4",
];

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  if (process.env.UPLOAD_TO_PINATA == "true") {
    tokenUris = await handleTokenUris();
  }

  log("--------------------------------------------");
  const args = [MINT_FEE, tokenUris];

  const dynamicNft = await deploy("DynamicNft", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    log("Verifying");
    await verify(dynamicNft.address, args);
  }
  log("--------------------------------------------");
};

async function handleTokenUris() {
  tokenUris = [];

  const { responses: imageUploadResponses, files } = await storeImages(
    imagesLocation
  );

  for (imageUploadResponseIndex in imageUploadResponses) {
    // create metadata

    // upload metadata
    let tokenUriMetadata = { ...metadataTemplate };

    tokenUriMetadata.name = files[imageUploadResponseIndex].replace(".png", "");
    tokenUriMetadata.description = `NFT for the month of ${tokenUriMetadata.name}. Come back next month to get another!`;
    tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponseIndex].IpfsHash}`;
    console.log(`Uploading ${tokenUriMetadata.name}...`);

    // Store JSON to IPFS
    const metadataUploadResponse = await storeTokenUriMetadata(
      tokenUriMetadata
    );

    tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`);
  }
  console.log("Token URI's Uploaded! They are: ");
  console.log(tokenUris);
  return tokenUris;
}

module.exports.tags = ["all", "dynamicNft", "main"];
