// SPDX-License-Identifier: MIT


pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";

/*
STACK THESE MF'ERS                                
*/

// we are going to create a contract where people can mint unstacked toads 
// and then they can stake their unstacked toads in a staking contract, which will give them the $STACK token 
// and then they can use their $STACK token in this contract to stack 3 toads into a triple stack. 

// what token standards does this contract need to be able to interact with? 
    // ERC20's, in the form of the $STACK token 
    // ERC721's in the form of unstacked toads 
    // this contract is actually minting two different types of toads, unstacked toads, and stacked toads. 

// possible issues with this contract - we may find that we need to create a separate contrct to handle the minting of the stacked toads. 


contract StackedToadz is ERC721URIStorage, Ownable {
    using Strings for uint256;
    event MintToad (address indexed sender, uint256 startWith, uint256 times);

    //uints 
    uint256 public totalToadz;
    uint256 public totalCount = 6000;
    uint256 public maxBatch = 10;
    uint256 public price = 20000000000000000; // 0.02 eth
    string public baseURI;

    //bool
    bool private started;

    //constructor args 
    constructor(string memory name_, string memory symbol_, string memory baseURI_) ERC721(name_, symbol_) {
        baseURI = baseURI_;
    }
    function totalSupply() public view virtual returns (uint256) {
        return totalToadz;
    }
    function _baseURI() internal view virtual override returns (string memory){
        return baseURI;
    }
    function setBaseURI(string memory _newURI) public onlyOwner {
        baseURI = _newURI;
    }
    function changePrice(uint256 _newPrice) public onlyOwner {
        price = _newPrice;
    }
    function changeBatchSize(uint256 _newBatch) public onlyOwner {
        maxBatch = _newBatch;
    }
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token.");
        
        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0
            ? string(abi.encodePacked(baseURI, tokenId.toString(), ".json")) : '.json';
    }
    function setTokenURI(uint256 _tokenId, string memory _tokenURI) public onlyOwner {
        _setTokenURI(_tokenId, _tokenURI);
    }
    function setStart(bool _start) public onlyOwner {
        started = _start;
    }
    function devMint(uint256 _times) public onlyOwner {
        emit MintToad(_msgSender(), totalToadz+1, _times);
        for(uint256 i=0; i<_times; i++) {
            _mint(_msgSender(), 1 + totalToadz++);
        }
    }
    function mintToad(uint256 _times) payable public {
        require(started, "not started");
        require(_times >0 && _times <= maxBatch, "wake wrong number");
        require(totalToadz + _times <= totalCount, "wake too much");
        require(msg.value == _times * price, "value error");
        payable(owner()).transfer(msg.value);
        emit MintToad(_msgSender(), totalToadz+1, _times);
        for(uint256 i=0; i< _times; i++){
            _mint(_msgSender(), 1 + totalToadz++);
        }
    }  
}