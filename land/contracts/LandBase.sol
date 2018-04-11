pragma solidity ^0.4.2;

import "./landaccess.sol";


/// @title Base contract for CryptoHoosiers. Holds all common structs, events and base variables.
/// @author Chris East
contract LandBase is LandAccess {
    /*** EVENTS ***/

    /// @dev The Build event is fired whenever a new property is generated. 
    event Build(address owner, string name, uint256 landId, int256 lat, int256 long);

    /// @dev Transfer event as defined in current draft of ERC721. Emitted every time property
    ///  ownership is assigned, including builds.
    event Transfer(address from, address to, uint256 tokenId);

    /*** DATA TYPES ***/
    /// @dev The main Kitty struct. Every cat in CryptoKitties is represented by a copy
    ///  of this structure, so great care was taken to ensure that it fits neatly into
    ///  exactly two 256-bit words. Note that the order of the members in this structure
    ///  is important because of the byte-packing rules used by Ethereum.
    ///  Ref: http://solidity.readthedocs.io/en/develop/miscellaneous.html
    struct Land {
        // The id of the land, each is unquie to the property
        uint256 id;
        string name;
        //uint64 cooldownEndBlock;    // The minimum timestamp after which this land can collect rent again. 
        uint64 buildTime;           // The timestamp from the block when this land was 'built'.
        // lat and long position of the property, filled in with the main result from google api 
        int64 lat;
        int64 long;

        //int32 value;                // The value of the property
        //uint16 rent;                // The rent value of the property
        //uint8 coolDownPeriod;       // The cooldown length for this property, used for collecting rent 
        //uint8 level;                 // The level of the property 

    }

    struct Kitty {
        // The Kitty's genetic code is packed into these 256-bits, the format is
        // sooper-sekret! A cat's genes never change.
        uint256 genes;

        // The timestamp from the block when this cat came into existence.
        uint64 birthTime;

        // The minimum timestamp after which this cat can engage in breeding
        // activities again. This same timestamp is used for the pregnancy
        // timer (for matrons) as well as the siring cooldown.
        uint64 cooldownEndBlock;

        // The ID of the parents of this kitty, set to 0 for gen0 cats.
        // Note that using 32-bit unsigned integers limits us to a "mere"
        // 4 billion cats. This number might seem small until you realize
        // that Ethereum currently has a limit of about 500 million
        // transactions per year! So, this definitely won't be a problem
        // for several years (even as Ethereum learns to scale).
        uint32 matronId;
        uint32 sireId;

        // Set to the ID of the sire cat for matrons that are pregnant,
        // zero otherwise. A non-zero value here is how we know a cat
        // is pregnant. Used to retrieve the genetic material for the new
        // kitten when the birth transpires.
        uint32 siringWithId;

        // Set to the index in the cooldown array (see below) that represents
        // the current cooldown duration for this Kitty. This starts at zero
        // for gen0 cats, and is initialized to floor(generation/2) for others.
        // Incremented by one for each successful breeding action, regardless
        // of whether this cat is acting as matron or sire.
        uint16 cooldownIndex;

        // The "generation number" of this cat. Cats minted by the CK contract
        // for sale are called "gen0" and have a generation number of 0. The
        // generation number of all other cats is the larger of the two generation
        // numbers of their parents, plus one.
        // (i.e. max(matron.generation, sire.generation) + 1)
        uint16 generation;
    }

    /*** CONSTANTS ***/
    /// @dev A lookup table indicating the cooldown duration after any successful
    ///  breeding action, called "pregnancy time" for matrons and "siring cooldown"
    ///  for sires. Designed such that the cooldown roughly doubles each time a cat
    ///  is bred, encouraging owners not to just keep breeding the same cat over
    ///  and over again. Caps out at one week (a cat can breed an unbounded number
    ///  of times, and the maximum cooldown is always seven days).
    uint32[11] public cooldowns = [
        uint32(10 minutes),
        uint32(30 minutes),
        uint32(1 hours),
        uint32(2 hours),
        uint32(4 hours),
        uint32(8 hours),
        uint32(16 hours),
        uint32(1 days),
        uint32(2 days),
        uint32(4 days),
        uint32(7 days)
    ];

    // An approximation of currently how many seconds are in between blocks.
    uint256 public secondsPerBlock = 15;

    /*** STORAGE ***/

    /// @dev An array containing the Kitty struct for all Kitties in existence. The ID
    ///  of each cat is actually an index into this array. Note that ID 0 is a negacat,
    ///  the unKitty, the mythical beast that is the parent of all gen0 cats. A bizarre
    ///  creature that is both matron and sire... to itself! Has an invalid genetic code.
    ///  In other words, cat ID 0 is invalid... ;-)
    Land[] public properties;

    uint256[] built; 

    /// @dev A mapping from land IDs to the address that owns them. 
    mapping (uint256 => address) public landIndexToOwner;

    // @dev A mapping from owner address to count of tokens that address owns.
    //  Used internally inside balanceOf() to resolve ownership count.
    mapping (address => uint256) ownershipTokenCount;

    /// @dev A mapping from KittyIDs to an address that has been approved to call
    ///  transferFrom(). Each Kitty can only have one approved address for transfer
    ///  at any time. A zero value means no approval is outstanding.
    mapping (uint256 => address) public landIndexToApproved;

    modifier notBuilt(string _name) {
        require(built[uint(keccak256(_name))] == 0);
        _;
    }

    // Owner can fix how many seconds per blocks are currently observed.
    function setSecondsPerBlock(uint256 secs) external onlyOwner {
        require(secs < cooldowns[0]);
        secondsPerBlock = secs;
    }

    /// @dev The address of the ClockAuction contract that handles sales of Land. This
    ///  same contract handles both peer-to-peer sales
    //SaleClockAuction public saleAuction;
    /// @dev Assigns ownership of a specific property to an address.
    function _transfer(address _from, address _to, uint256 _tokenId) internal {
        // Since the number of properties is far lower than 2^32 we can't overflow this
        ownershipTokenCount[_to]++;
        // transfer ownership
        landIndexToOwner[_tokenId] = _to;
        // When creating new properties _from is 0x0, but we can't account that address.
        if (_from != address(0)) {
            // Decrease token count for seller
            ownershipTokenCount[_from]--;
            // clear any previously approved ownership exchange
            delete landIndexToApproved[_tokenId];
        }
        // Emit the transfer event.
        Transfer(_from, _to, _tokenId);
    }

    /// @dev An internal method that creates a new kitty and stores it. This
    ///  method doesn't do any checking and should only be called when the
    ///  input data is known to be valid. Will generate both a Birth event
    ///  and a Transfer event.
    /// _matronId The kitty ID of the matron of this cat (zero for gen0)
    ///  _sireId The kitty ID of the sire of this cat (zero for gen0)
    ///  _generation The generation number of this cat, must be computed by caller.
    /// m _genes The kitty's genetic code.
    /// ram _owner The inital owner of this cat, must be non-zero (except for the unKitty, ID 0)
    // function _createKitty(
    //     uint256 _matronId,
    //     uint256 _sireId,
    //     uint256 _generation,
    //     uint256 _genes,
    //     address _owner
    // )
    //     internal
    //     returns (uint)
    // {
    //     // These requires are not strictly necessary, our calling code should make
    //     // sure that these conditions are never broken. However! _createKitty() is already
    //     // an expensive call (for storage), and it doesn't hurt to be especially careful
    //     // to ensure our data structures are always valid.
    //     require(_matronId == uint256(uint32(_matronId)));
    //     require(_sireId == uint256(uint32(_sireId)));
    //     require(_generation == uint256(uint16(_generation)));
    //     // New kitty starts with the same cooldown as parent gen/2
    //     uint16 cooldownIndex = uint16(_generation / 2);
    //     if (cooldownIndex > 13) {
    //         cooldownIndex = 13;
    //     }
    //     Kitty memory _kitty = Kitty({
    //         genes: _genes,
    //         birthTime: uint64(now),
    //         cooldownEndBlock: 0,
    //         matronId: uint32(_matronId),
    //         sireId: uint32(_sireId),
    //         siringWithId: 0,
    //         cooldownIndex: cooldownIndex,
    //         generation: uint16(_generation)
    //     });
    //     //uint256 newKittenId = kitties.push(_kitty) - 1;
    //     // It's probably never going to happen, 4 billion cats is A LOT, but
    //     // let's just be 100% sure we never let this happen.
    //     //equire(newKittenId == uint256(uint32(newKittenId)));
    //     // emit the birth event 
    //     // Birth(
    //     //     _owner,
    //     //     newKittenId,
    //     //     uint256(_kitty.matronId),
    //     //     uint256(_kitty.sireId),
    //     //     _kitty.genes
    //     // );
    //     // // This will assign ownership, and also emit the Transfer event as
    //     // // per ERC721 draft
    //     // _transfer(0, _owner, newKittenId);
    //     // return newKittenId;
    // }
    /// @dev An internal method that creates a new kitty and stores it. This
    ///  method doesn't do any checking and should only be called when the
    ///  input data is known to be valid. Will generate both a Birth event
    ///  and a Transfer event.
    /// param _matronId The kitty ID of the matron of this cat (zero for gen0)
    /// param _sireId The kitty ID of the sire of this cat (zero for gen0)
    /// param _generation The generation number of this cat, must be computed by caller.
    /// param _genes The kitty's genetic code.
    /// param _owner The inital owner of this cat, must be non-zero (except for the unKitty, ID 0)
    function _createLand(
        string _name,
        int256 _lat,
        int256 _long,
        address _owner,
        uint256 _coolDownPeriod
    )
        internal onlyOwner
        returns (uint)
    {
        // These requires are not strictly necessary, our calling code should make
        // sure that these conditions are never broken. However! _createKitty() is already
        // an expensive call (for storage), and it doesn't hurt to be especially careful
        // to ensure our data structures are always valid.
        require(_lat == int256(int64(_lat)));
        require(_long == int256(int64(_long)));
        
        //uint16 cooldownIndex = uint16(_generation / 2);

        // if (cooldownIndex > 13) {
        //     cooldownIndex = 13;
        // }
        // The id of the land, each is unquie to the property
        
        Land memory _land = Land({
            id: uint(keccak256(_name)),
            name: string(_name),
            buildTime: uint64(now),
            //cooldownEndBlock: uint64(0),
            lat: int64(_lat),
            long: int64(_long)//,
            //value: uint16(0),
            //rent: uint16(0),
            //coolDownPeriod: uint8(_coolDownPeriod),
            //level: uint8(1)
        });
        uint256 newLandId = properties.push(_land) - 1;

        // It's probably never going to happen, 4 billion cats is A LOT, but
        // let's just be 100% sure we never let this happen.
        require(newLandId == uint256(uint32(newLandId)));

        // emit the birth event ~ event Build(address owner, string name, uint256 landId, uint256 lat, uint256 long);
        Build(_owner, _name, newLandId, _land.lat, _land.long);



        // This will assign ownership, and also emit the Transfer event as
        // per ERC721 draft
        _transfer(0, _owner, newLandId);

        return newLandId;
    }

    function createLand(string _name, int256 _lat, int256 _long) external onlyOwner {
        //require() - Require the hash of this is not in the array already
        _createLand(_name, _lat, _long, msg.sender, 0);
    }

    
}