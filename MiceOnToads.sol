// SPDX-License-Identifier: MIT


pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol"; 
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol"; 
import "@openzeppelin/contracts/utils/Strings.sol"; 
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MiceOnToadz is ERC721Enumerable, Ownable {
    using Strings for uint256;
    event MintMiceOnToadz(address indexed sender, uint256 startWith, uint256 times);

    //supply counters 
    uint256 public totalMiceOnToadz;
    uint256 public totalCount = 1700;
    //token Index tracker 
    //create a variable for the $STACK token address.
    address public stackAddress;
    
    //string
    string public baseURI;

    //bool
    bool private started;

    mapping (address => bool) public whiteList;

     //constructor args : initialize the stack token address
    constructor(string memory name_, string memory symbol_, address _stackTokenAddress, string memory baseURI_) ERC721(name_, symbol_) {
        baseURI = baseURI_; 
        stackAddress = _stackTokenAddress;
    }

    //basic functions. 
    function _baseURI() internal view virtual override returns (string memory){
        return baseURI;
    }
    function setBaseURI(string memory _newURI) public onlyOwner {
        baseURI = _newURI;
    }
    function setWhitelist(address[] whiteListAddresses) public onlyOwner {
        for (uint256 i; i< whiteListAddresses.length; i++) {
            whiteList[i] = true;
        }
    }

    //erc721 
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token."); 
        
        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0
            ? string(abi.encodePacked(baseURI, tokenId.toString(), ".json")) : '.json';  
    }
    }
    function setStart(bool _start) public onlyOwner {
        started = _start;
    }

    function tokensOfOwner(address owner)
        public
        view
        returns (uint256[] memory)
    {
        uint256 count = balanceOf(owner);
        uint256[] memory ids = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            ids[i] = tokenOfOwnerByIndex(owner, i);
        }
        return ids;
    }
    //public view function that returns the currentStackPrice
        function currentStackPrice()  public view returns (uint256) {
            if (totalMiceOnToadz <= 200) {
                    return 10000000000000000000;
            } else if (totalMiceOnToadz > 200 && totalMiceOnToadz <= 400) {
                    return 20000000000000000000;
            } else if (totalMiceOnToadz > 400 && totalMiceOnToadz<= 600) {
                    return 40000000000000000000;
            } else if (totalMiceOnToadz> 600 && totalMiceOnToadz<= 800) {
                    return 60000000000000000000;
            } else if (totalMiceOnToadz> 800 && totalMiceOnToadz<= 1000) {
                    return 80000000000000000000;
            } else if(totalMiceOnToadz> 1000 && totalMiceOnToadz<= 1200) {
                    return 100000000000000000000;
            }else if(totalMiceOnToadz> 1200 && totalMiceOnToadz<= 1400) {
                    return 120000000000000000000;
            }else if(totalMiceOnToadz> 1400 && totalMiceOnToadz<= 1600) {
                    return 140000000000000000000;
            }else if(totalMiceOnToadz> 1600) {
                    return 160000000000000000000;
            }
            revert();
        }


    //leave the first mintWhitelist function, its done
    function mintWhitelist(uint256 _times) public {
        require(whiteList[msg.sender] == true, "must be whitelisted");
        require(_times == 1, "may only redeem one");
        require(totalMiceOnToadz + _times <= totalCount, "max supply reached!");
        payable(owner()).transfer(msg.value);
        emit MintMiceOnToadz(_msgSender(), totalMiceOnToadz+1, _times); 
        for(uint256 i=0; i< _times; i++){ 
            _mint(_msgSender(), 1 + totalMiceOnToadz++); 
        }
    }

    function mintWithStack(uint256 _times) public {
        require(IERC20(stackAddress).balanceOf(msg.sender) >= currentStackPrice() * _times, "not enough tokens");  
        require(totalMiceOnToadz + _times <= totalCount, "max supply reached!"); 
        IERC20(stackAddress).transfer(msg.sender, currentStackPrice() * _times); 
        emit MintMiceOnToadz(_msgSender(), totalMiceOnToadz+1, _times); 
        for(uint256 i=0; i< _times; i++){ 
            _mint(_msgSender(), 1 + totalMiceOnToadz++);  
        }
    }

    /*   
    Create mintWithStack function: 
        1. checks if they have enough tokens using IERC20(stackaddress) & check price using currentStackPrice
        2, checks if the total supply is less than the total count
        3. transfer the tokens to the contract using IERC20(stackaddress)
        4. emits the event
        5. mint the tokens & increment the totalMiceOnToadz
    */

}



