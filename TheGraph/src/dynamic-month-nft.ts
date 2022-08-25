import { Address, BigInt } from "@graphprotocol/graph-ts"
import {
  DynamicMonthNft,
  Approval,
  ApprovalForAll,
  CreatedNft,
  NftMinted as NftMintedEvent,
  OwnershipTransferred,
  Transfer
} from "../generated/DynamicMonthNft/DynamicMonthNft"
import { NftMinted } from "../generated/schema"


export function handleNftMinted(event: NftMintedEvent): void {
  
  
  
  let itemMinted = NftMinted.load(getIdFromEventParams(event.params.tokenId, event.params.nftContract))

  if(!itemMinted){
    itemMinted = new NftMinted(getIdFromEventParams(event.params.tokenId, event.params.nftContract))
  }

  itemMinted.minter = event.params.minter;
  itemMinted.month = event.params.month;
  itemMinted.nftAddress = event.params.nftContract
  itemMinted.tokenId = event.params.tokenId

  itemMinted.save() 
}


export function handleApprovalForAll(event: ApprovalForAll): void {}

export function handleCreatedNft(event: CreatedNft): void {}


export function handleOwnershipTransferred(event: OwnershipTransferred): void {}

export function handleTransfer(event: Transfer): void {}


function getIdFromEventParams(tokenId: BigInt, nftAddress: Address): string{
  return (tokenId.toHexString()+nftAddress.toHexString())
}