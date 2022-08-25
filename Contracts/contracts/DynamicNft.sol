// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
// import "base64-sol/base64.sol";
import "hardhat/console.sol";
import "@quant-finance/solidity-datetime/contracts/DateTime.sol";
// import "https://github.com/bokkypoobah/BokkyPooBahsDateTimeLibrary/blob/master/contracts/BokkyPooBahsDateTimeLibrary.sol";
//
// This contract will mint an NFT
// color will be based upon which month you are in

// Errors
error NeedMoreEthSent();
error TransferFailed();
error NothingToWithdraw();
error NotOwner();

contract DynamicNft is ERC721URIStorage, Ownable {
    // Types
    enum Month {
        January,
        February,
        March,
        April,
        May,
        June,
        July,
        August,
        September,
        October,
        November,
        December
    }

    // NFT Variables

    uint256 private s_tokenCounter;
    uint256 internal immutable i_mintFee;
    uint256 private i_month;
    mapping(uint256 => Month) private s_tokenIdToMonth;
    string[] internal s_monthTokenUris;
    address private immutable i_owner;

    // Events
    event NftMinted(
        Month month,
        address minter,
        address nftContract,
        uint256 tokenId
    );
    // event NftMinted(Month month, address minter, uint256 tokenId);
    event CreatedNft(uint256 s_tokenCounter, address minter);

    constructor(uint256 mintFee, string[12] memory monthTokenUris)
        ERC721("Dynamic Month NFT", "DMN")
    {
        s_tokenCounter = 0;
        i_mintFee = mintFee;
        s_monthTokenUris = monthTokenUris;
        i_owner = owner();
        // i_month = month;
    }

    function mintNft() public payable returns (uint256) {
        if (msg.value < i_mintFee) {
            revert NeedMoreEthSent();
        }

        Month currentMonth = getCurrentMonth();

        uint256 newItemId = s_tokenCounter;
        s_tokenCounter = s_tokenCounter + 1;

        _safeMint(msg.sender, newItemId);
        _setTokenURI(newItemId, s_monthTokenUris[uint256(currentMonth)]);
        emit NftMinted(currentMonth, msg.sender, address(this), s_tokenCounter);
        emit CreatedNft(s_tokenCounter, msg.sender);
        // return s_tokenCounter;
    }

    function getCurrentMonth() public view returns (Month) {
        uint256 month = DateTime.getMonth(block.timestamp);

        return Month(month - 1);
    }

    function withdraw() public onlyOwner {
        if (msg.sender != i_owner) {
            revert NotOwner();
        }

        uint256 amount = address(this).balance;

        if (amount < 0) {
            revert NothingToWithdraw();
        }

        (bool success, ) = payable(msg.sender).call{value: amount}("");

        if (!success) {
            revert TransferFailed();
        }
    }

    // ///////////////////
    // Getter Functions //
    //////////////////////

    function getMintFee() public view returns (uint256) {
        return i_mintFee;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getMonthTokenUris(uint256 index)
        public
        view
        returns (string memory)
    {
        return s_monthTokenUris[index];
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }
}
