// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

// External contract imports
import {DFVerifierFacet} from "./DFVerifierFacet.sol";
import {DFWhitelistFacet} from "./DFWhitelistFacet.sol";

// Library imports
import {ABDKMath64x64} from "../vendor/libraries/ABDKMath64x64.sol";
import {LibDiamond} from "../vendor/libraries/LibDiamond.sol";
import {LibGameUtils} from "../libraries/LibGameUtils.sol";
import {LibArtifactUtils} from "../libraries/LibArtifactUtils.sol";
import {LibPlanet} from "../libraries/LibPlanet.sol";

// Storage imports
import {WithStorage} from "../libraries/LibStorage.sol";

// Type imports
import {SpaceType, Planet, Player, ArtifactType, DFPInitPlanetArgs, DFPMoveArgs, DFPFindArtifactArgs, AdminCreatePlanetArgs, Artifact} from "../DFTypes.sol";

contract DFCoreFacet is WithStorage {
    using ABDKMath64x64 for *;

    event PlayerInitialized(address player, uint256 loc);
    event PlanetUpgraded(address player, uint256 loc, uint256 branch, uint256 toBranchLevel); // emitted in LibPlanet
    event PlanetHatBought(address player, uint256 loc, uint256 tohatLevel, uint256 tohatType);
    event PlanetTransferred(address sender, uint256 loc, address receiver);
    event LocationRevealed(address revealer, uint256 loc, uint256 x, uint256 y);

    event PlanetSilverWithdrawn(address player, uint256 loc, uint256 amount);

    //////////////////////
    /// ACCESS CONTROL ///
    //////////////////////

    modifier onlyAdmin() {
        LibDiamond.enforceIsContractOwner();
        _;
    }

    modifier onlyWhitelisted() {
        require(
            DFWhitelistFacet(address(this)).isWhitelisted(msg.sender) ||
                msg.sender == LibDiamond.contractOwner(),
            "Player is not whitelisted"
        );
        _;
    }

    modifier disabled() {
        require(false, "This functionality is disabled for the current round.");
        _;
    }

    modifier notPaused() {
        require(!gs().paused, "Game is paused");
        _;
    }

    //////////////////////
    /// Game Mechanics ///
    //////////////////////

    function refreshPlanet(uint256 location) public notPaused {
        LibPlanet.refreshPlanet(location);
    }

    function getRefreshedPlanet(uint256 location, uint256 timestamp)
        public
        view
        returns (
            Planet memory,
            // myNotice: when change gameConstants().MAX_RECEIVING_PLANET also need to change here

            uint256[16] memory eventsToRemove,
            uint256[16] memory artifactsToAdd,
            bool shouldDeactiveArtifact
        )
    {
        return LibPlanet.getRefreshedPlanet(location, timestamp);
    }

    function checkRevealProof(
        uint256[2] memory _a,
        uint256[2][2] memory _b,
        uint256[2] memory _c,
        uint256[9] memory _input
    ) public view returns (bool) {
        if (!snarkConstants().DISABLE_ZK_CHECKS) {
            require(
                DFVerifierFacet(address(this)).verifyRevealProof(_a, _b, _c, _input),
                "Failed reveal pf check"
            );
        }

        LibGameUtils.revertIfBadSnarkPerlinFlags(
            [_input[4], _input[5], _input[6], _input[7], _input[8]],
            false
        );

        return true;
    }

    function revealLocation(
        uint256[2] memory _a,
        uint256[2][2] memory _b,
        uint256[2] memory _c,
        uint256[9] memory _input
    ) public onlyWhitelisted {
        require(checkRevealProof(_a, _b, _c, _input), "Failed reveal pf check");

        if (!gs().planets[_input[0]].isInitialized) {
            LibPlanet.initializePlanetWithDefaults(_input[0], _input[1], false);
        }

        LibPlanet.revealLocation(
            _input[0],
            _input[1],
            _input[2],
            _input[3],
            msg.sender != LibDiamond.contractOwner()
        );
        emit LocationRevealed(msg.sender, _input[0], _input[2], _input[3]);
    }

    function initializePlayer(
        uint256[2] memory _a,
        uint256[2][2] memory _b,
        uint256[2] memory _c,
        uint256[8] memory _input
    ) public onlyWhitelisted returns (uint256) {
        LibPlanet.initializePlanet(_a, _b, _c, _input, true);

        uint256 _location = _input[0];
        uint256 _perlin = _input[1];
        uint256 _radius = _input[2];

        require(LibPlanet.checkPlayerInit(_location, _perlin, _radius));

        // Initialize player data
        gs().playerIds.push(msg.sender);
        gs().players[msg.sender] = Player(
            true,
            msg.sender,
            block.timestamp,
            _location,
            0,
            0,
            0,
            gameConstants().SPACE_JUNK_LIMIT,
            false,
            0,
            false,
            0,
            0
        );

        LibGameUtils.updateWorldRadius();
        emit PlayerInitialized(msg.sender, _location);
        return _location;
    }

    function upgradePlanet(uint256 _location, uint256 _branch)
        public
        notPaused
        returns (uint256, uint256)
    {
        // _branch specifies which of the three upgrade branches player is leveling up
        // 0 improves silver production and capacity
        // 1 improves population
        // 2 improves range
        refreshPlanet(_location);
        LibPlanet.upgradePlanet(_location, _branch);
        return (_location, _branch);
    }

    function transferPlanet(uint256 _location, address _player) public notPaused {
        require(gameConstants().PLANET_TRANSFER_ENABLED, "planet transferring is disabled");

        require(gs().planets[_location].isInitialized == true, "Planet is not initialized");

        refreshPlanet(_location);

        require(
            gs().planets[_location].owner == msg.sender,
            "Only owner account can perform that operation on planet."
        );

        require(_player != msg.sender, "Cannot transfer planet to self");

        require(
            gs().players[_player].isInitialized,
            "Can only transfer ownership to initialized players"
        );

        require(!gs().planets[_location].destroyed, "can't transfer a s planet");
        require(!gs().planets[_location].frozen, "can't transfer a frozen planet");

        gs().planets[_location].owner = _player;

        emit PlanetTransferred(msg.sender, _location, _player);
    }

    function buyHat(uint256 _location, uint256 hatType) public payable notPaused {
        require(gs().planets[_location].isInitialized == true, "Planet is not initialized");
        refreshPlanet(_location);

        require(
            gs().planets[_location].owner == msg.sender,
            "Only owner account can perform that operation on planet."
        );

        Artifact memory activeArtifact = LibGameUtils.getActiveArtifact(_location);

        require(activeArtifact.artifactType != ArtifactType.Avatar, "need no active Avatar");

        uint256 cost = (1 << gs().planets[_location].hatLevel) * 1 ether;

        require(msg.value == cost, "Wrong value sent");

        gs().planets[_location].hatLevel += 1;
        gs().planets[_location].hatType = hatType;

        emit PlanetHatBought(
            msg.sender,
            _location,
            gs().planets[_location].hatLevel,
            gs().planets[_location].hatType
        );
    }

    function setHat(
        uint256 _location,
        uint256 hatLevel,
        uint256 hatType
    ) public onlyAdmin {
        require(gs().planets[_location].isInitialized == true, "Planet is not initialized");
        refreshPlanet(_location);

        gs().planets[_location].hatLevel = hatLevel;
        gs().planets[_location].hatType = hatType;
        if (hatLevel >= 1) {
            gs().planets[_location].adminProtect = true;
        } else gs().planets[_location].adminProtect  = false;

        emit PlanetHatBought(
            msg.sender,
            _location,
            gs().planets[_location].hatLevel,
            gs().planets[_location].hatType
        );
    }

    function setPlanetCanShow(uint256 _location, bool _canShow) public onlyAdmin {
        require(gs().planets[_location].isInitialized == true, "Planet is not initialized");
        refreshPlanet(_location);
        gs().planets[_location].canShow = _canShow;
    }

    // withdraw silver
    function withdrawSilver(uint256 locationId, uint256 amount) public notPaused {
        refreshPlanet(locationId);
        LibPlanet.withdrawSilver(locationId, amount);
        emit PlanetSilverWithdrawn(msg.sender, locationId, amount);
    }
}
