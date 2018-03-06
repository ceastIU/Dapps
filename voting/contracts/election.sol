pragma solidity ^0.4.2;

contract Election {
    // Model candidate
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }
    // Store candidate
    
    // Fetch candidate
    // Store accounts that have voted
    mapping(address => bool) public voters;
    // A mapping from id to candidate, stores candidates
    mapping (uint => Candidate) public candidates;
    // Store candidates count
    uint public candidatesCount; // There's no way to iterate over mappings, thus we must keep counter

    // Read candidate
    string public candidate;

    // voted event
    event votedEvent (
        uint indexed _candidateId
    );


    // Constructor
    function Election () public {
        addCandidate("Candidate 1");
        addCandidate("Candidate 2");
    }

    // Adds candidate to mapping, private to prevent access, and _name denotes local variable NOT state
    function addCandidate(string _name) private {
        candidatesCount ++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
    }

    function vote (uint _candidateId) public {
        // require that they haven't voted before
        require(!voters[msg.sender]);

        // require a valid candidate
        require(_candidateId > 0 && _candidateId <= candidatesCount);

        // record that voter has voted
        voters[msg.sender] = true;

        // update candidate vote Count
        candidates[_candidateId].voteCount ++;

        // trigger voted event
        votedEvent(_candidateId);
    }


}
