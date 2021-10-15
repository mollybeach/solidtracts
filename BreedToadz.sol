pragma solidity ^0.8.0;


import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721ApproveAndCallFallback.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Metadata.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721ImplicitApproval.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract BreedToads is ERC721, Ownable {
    using SafeMath for uint256;
    using ERC721 for ERC721Receiver;
    using ERC721Metadata for ERC721;
    using ERC721ImplicitApproval for ERC721;
    using ERC721ApproveAndCallFallback for ERC721;
    using ERC721URIStorage for ERC721;
    using Strings for bytes32;

    //toad breeding contract

    event MintBabyToad(address _owner, uint256 _id);

    //uints 
    uint256 public price = 20000000000000000; // 0.02 eth
    uint256 public maxBabyToads = 1000;
    address public babyAddress;
    string public baseURI;

    //bool
    bool private started;

    constructor(address _babyAddress, string _baseURI) public {
        babyAddress = _babyAddress;
        baseURI = _baseURI;
    }

    function getBreedingPrice() public view returns (uint256) {
            if (totalBabyz <= 200) {
                    return 10000000000000000000;
            } else if (totalBabyz > 200 && totalBabyz <= 400) {
                    return 20000000000000000000;
            } else if (totalBabyz > 400 && totalBabyz<= 600) {
                    return 40000000000000000000;
            } else if (totalBabyz> 600 && totalBabyz<= 800) {
                    return 60000000000000000000;
            } else if (totalBabyz> 800 && totalBabyz<= 1000) {
                    return 80000000000000000000;
            } else if(totalBabyz> 1000) {
                    return 100000000000000000000;
            }
        revert();
    }
    //get the max number of babies
    function getMaxBabyToads() public view returns (uint256) {
        return maxBabyToads;
    }
        //get the total number of babies
    function getTotalBabyz() public view returns (uint256) {
        return ERC721.totalSupply(babyAddress);
    }
    //get the address of the baby contract
    function getBabyAddress() public view returns (address) {
        return babyAddress;
    }
    //set the baseURI of the contract
     function setBaseURI(string memory baseURI) public onlyOwner {
        _setBaseURI(baseURI);
    }

    function ValidMatingPair(uint256 _parent1, uint256 _parent2) public view returns (bool) {
        return _parent1 != _parent2;
    }
    //check if Adult to breed
    function isAdult(address toad) public view returns (bool) {
        return toad != address(0) && toad == breedToadzAddress;
    }
    //breed toads
    function breedToads(uint256 _parent1, uint256 _parent2) public payable {
        require(msg.value >= price, "not enough funds to breed");
        require(ValidMatingPair(_parent1, _parent2), "invalid mating pair: toad can't breed with itself!");
        require(ERC721.isApprovedForAll(msg.sender, _parent1, msg.sender) && ERC721.isApprovedForAll(msg.sender, _parent2, msg.sender), "toads not approved for all");
        require(msg.value == getBreedingPrice(), "more $STACK required to mint toad stack");
        require(!isAdult(ERC721.ownerOf(_parent1)) || !isAdult(ERC721.ownerOf(_parent2)), "toads must be owned by you and adults" );

        //mint baby toad
        uint256 _id = ERC721.mint(babyAddress, msg.sender);
        //set metadata
        ERC721Metadata.setApprovalForAll(babyAddress, _id, true);
        ERC721Metadata.setURI(babyAddress, _id, baseURI + _id);
        //breed toad
        ERC721.safeTransferFrom(msg.sender, babyAddress, _id);
        //emit event
        emit BreedToad(msg.sender, _id, _parent1, _parent2);
    }
}










   


    