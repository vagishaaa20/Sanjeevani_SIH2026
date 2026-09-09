// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PrescriptionAnchor {
    struct Record {
        bytes32 hash;
        address anchoredBy;
        uint256 timestamp;
    }

    mapping(bytes32 => Record) public records;

    event PrescriptionAnchored(bytes32 indexed hash, address indexed anchoredBy, uint256 timestamp);

    function anchor(bytes32 hash) external {
        require(records[hash].timestamp == 0, "Already anchored");
        records[hash] = Record(hash, msg.sender, block.timestamp);
        emit PrescriptionAnchored(hash, msg.sender, block.timestamp);
    }

    function verify(bytes32 hash) external view returns (bool exists, address anchoredBy, uint256 timestamp) {
        Record memory r = records[hash];
        return (r.timestamp != 0, r.anchoredBy, r.timestamp);
    }
}
