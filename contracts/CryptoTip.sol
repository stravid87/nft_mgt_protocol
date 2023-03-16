// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;


contract CryptoTip {
    address owner;
    address balance;
    mapping(address => address []) public userTeam;

    constructor(){
        owner = msg.sender;
    }
    function sendTips(address payable[] memory teamMembers) public payable {
        require(msg.value > 0, "Must send some ETH");

        uint totalAmount = msg.value;
        uint amountPerMember = totalAmount / teamMembers.length;
        uint remainder = totalAmount % teamMembers.length;

        for (uint i = 0; i < teamMembers.length; i++) {
            uint amountToSend = amountPerMember;
            if (i == teamMembers.length - 1) {
                // Send the remainder to the last member
                amountToSend += remainder;
            }
            require(address(this).balance >= amountToSend, "Insufficient contract balance");

            (bool sent,) = teamMembers[i].call{value : amountToSend}("");
            require(sent, "Failed to send ETH");
        }
    }

}
