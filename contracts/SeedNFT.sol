// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SeedNFT {
    string public name = "SeedNFT";
    string public symbol = "SEED";
    
    mapping(uint256 => address) public owners;
    mapping(uint256 => string) public metadata;
    uint256 public totalSupply;
    
    event SeedMinted(uint256 indexed id, address indexed owner, string metadata);
    
    function mintSeed(address recipient, string memory _metadata) public {
        uint256 id = totalSupply++;
        owners[id] = recipient;
        metadata[id] = _metadata;
        emit SeedMinted(id, recipient, _metadata);
    }
    
    function getOwner(uint256 id) public view returns (address) {
        return owners[id];
    }
}
