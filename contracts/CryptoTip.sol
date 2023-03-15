// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract CryptoTip {
    address owner;
    //
    //    struct Team {
    //        string name;
    //        address owner;
    //        address [] members;
    //    }

    mapping(address => address []) public userTeam;

    constructor(){
        owner = msg.sender;
    }

    function addTeamMember(address member) public {
        userTeam[msg].push(member);
    }

    function getUserTeam() public view returns (address []) {
        return userTeam[msg];
    }

        function sendTips() public payable {
            address [] myTeam = userTeam[msg];
            uint amount = msg.value / myTeam.length();
            uint remain = msg.value - amount * myTeam.length();
        }
}
