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
  "ipfs://QmPLSuvBpUgMeFLCwmdyLPckfkDeHDvj6VMZJQCQUFh1fb",
  "ipfs://Qme9vx69jqmLGYTZxjrKKPGG1SbGNi55WNEykdRN5xAC63",
  "ipfs://QmRLduwyZWLGXdp14ysUfMFtSkqPPnUdfUu7xHyoAQpRzR",
  "ipfs://QmTtCSt44keYdB9jzLnRHzbgaihHzi6oENjkBXnJbLKGhs",
  "ipfs://QmeqXezq9tuoQx2w3pUC3Y5V37ZhEm9dtsrGLhcuHHfHxk",
  "ipfs://QmNLyY5bShLs6RSoYUoM73WGwVwmvNiH8fBygrti5rNJ3t",
  "ipfs://QmRSpVKxTjp9MAWm7d5ssTfH5r6UbRyVUw9mEboeFCiDhd",
  "ipfs://QmSwMpBopBzVnKHXLCUt5tLVDXacHYNhAFFJFCiu7pJBBx",
  "ipfs://QmUYJnSNrTgPgWpSdy4gKCKyhTrFWDvXVCoyZQQdeyguCJ",
  "ipfs://QmbVnma6VajU6xXrRH5HW9nCVNq1tpDHQd7AN9eacuso7Q",
  "ipfs://Qmcbx7vd4h5nLJAsdtXySkvomRpwXwVcXJNbQ9XBkNFDq1",
  "ipfs://QmSkRBGyCk3x9d3qg9VbLUuYD7BYGDhrds4QKiGnWcufyg",
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
