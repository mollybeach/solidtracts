// SPDX-License-Identifier: MIT


pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";

/*
STACK                               

// 
we are going to create a contract where people retreive there $STACK token
  from their Toad Stack 
  Stack 3 toads into a triple stack. 

  what token standards does this contract need to be able to interact with? 
  ERC20's, in the form of the $STACK token 

// write function called stack 
//alter the mint  function to take in 3 tokenIds from the StackedToadz collection, make sure that the person inputing those tokenIds are the owners of those tokenIds. Then, create an input for an amount of $STACK required to mint the stackedToadz. Remove the 'times' input as we will only allow one stacking to occur per. The $STACK cost of minting should increase every 200 tokenId's of stacked toads by some amount, for now let's just say 1 stack call costs 10 and for every 200 stacked it'll double in cost. 
// something like: 
// if tokenIds <= 200 cost = 10 STACK 
// if tokenIds > 200 && <= 400 cost = $20 STACK 
// if tokenIds > 400 && <= 600 cost = $40 STACK 
// if tokenids > 600 && <= 800 cost = $60 STACK 
// if tokenids > 800 && <= 1000 cost = $120 STACK 

    */


contract Stack is ERC721URIStorage, Ownable {
    using Strings for uint256;
    event MintStack (address indexed sender, uint256 startWith);

    //uints 
    
    uint256 public totalCount = 6000;
    uint256 public maxBatch = 10;
    uint256 public _tokenIds;
    uint256 public totalToadz;
    address public unstackedToadAddress;
    address public stackAddress;
    string public baseURI;

    //bool
    bool private started;

    //constructor args 
    constructor(string memory name_, string memory symbol_, address _unstackedAddress, string memory baseURI_) ERC721(name_, symbol_) {
        unstackedToadAddress = _unstackedAddress;
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
    function setTokenURI(uint256 _tokenIds, string memory _tokenURI) public onlyOwner {
        _setTokenURI(_tokenIds, _tokenURI);
    }
    function setStart(bool _start) public onlyOwner {
        started = _start;
    }
    function getStackPrice() public view returns (uint256) {
          if (totalToadz <= 200) {
                  return 10000000000000000000;
          } else if (totalToadz > 200 && totalToadz <= 400) {
                  return 20000000000000000000;
          } else if (totalToadz > 400 && totalToadz<= 600) {
                  return 40000000000000000000;
          } else if (totalToadz> 600 && totalToadz<= 800) {
                  return 60000000000000000000;
          } else if (totalToadz> 800 && totalToadz<= 1000) {
                  return 80000000000000000000;
          } else if(totalToadz> 1000) {
                  return 100000000000000000000;
          }
      revert();
    }

    function stack(uint256[] calldata _tokenIds, uint256 stackAmount) public {
        require(started, "not started");
        require(IERC721(unstackedToadAddress).isApprovedForAll(_msgSender(), address(this)), "unstackedToadz not approved for spending");
        require(_totalIds.length == 3, "you need 3 unstacked toads to stack");
        require(totalToadz + 1 <= totalCount, "not enough toadz");
        require(msg.value == getStackPrice(), "more $STACK required to mint toad stack");
        IERC20(stackAddress).transferFrom(msg.sender, address(this), getStackPrice());
        for (uint256 i; i < _tokenIds.length; i++) {
          IERC721(unstackedToadAddress).safeTransferFrom(_msgSender(), address(this), _tokenIds[i]);
        }
        emit MintStack(_msgSender(), totalToadz+1, 1); //emit a MintStackEvent
        _mint(msgSender(), 1 + totalToadz++);
    }
}