// src/resolvers/user.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const VerifiedID = require('../models/VerifiedIDs');
const Party = require('../models/Party');
const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const {Web3} = require('web3');
const web3 = new Web3('http://localhost:7545'); // Adjust the provider URL

// Ensure your contract address is correct
const contractAddress = '0x40802CA7671d015808c4cAb7024b0B2D2A810d9F';
const VotingContract = require('../blockchain/VotingContract.json').abi; // Your compiled contract
const votingContract = new web3.eth.Contract(VotingContract, contractAddress);
const crypto = require('crypto'); // Import crypto for hashing

const resolvers = {
  Query: {
    verifyID: async (_, { id }) => {
      try {
        console.log('Received ID:', id);  // Debug: Log the received ID
        const existingID = await VerifiedID.findOne({ id });
        console.log('Found ID:', existingID);  // Debug: Log the found ID
        return !!existingID; 
      } catch (error) {
        console.error('Error verifying ID:', error);
        throw new Error('Failed to verify ID');
      }
    },

    parties: async () => {
      try {
        const parties = await Party.find().populate('election');
        return parties;
      } catch (error) {
        console.error("Error fetching parties:", error);
        throw new Error("Error fetching parties");
      }
    },
    
    getParty: async (_, { id }) => {
      try {
        const party = await Party.findById(id);
        if (!party) throw new Error("Party not found");
        return party;
      } catch (error) {
        throw new Error("Error fetching the party");
      }
    },
    //DONE
    elections: async () => {
      try {
        const elections = await Election.find();
        console.log(elections); // Add this line to see what is returned
        return elections;
      } catch (err) {
        throw new Error("Error fetching elections");
      }
    },
    candidates: async () => {
      try {
        // Fetch all candidates from the database
        const candidates = await Candidate.find().populate('party election'); // Assuming you have mongoose models for Candidate, Party, and Election
        return candidates;
      } catch (error) {
        console.error("Error fetching candidates:", error);
        throw new Error("Could not fetch candidates");
      }
    },
  },
  Mutation: {
    // Login function
    loginUser: async (_, { email, password, walletAddress }, context) => {
      try {

          // Check if user exists
          const user = await User.findOne({ email });
          if (!user) {
              throw new Error('User not found');
          }
    
          // Convert the provided wallet address to lowercase
          const normalizedWalletAddress = walletAddress.toLowerCase();
          console.log("Normalized Wallet Address Provided (Login):", normalizedWalletAddress);
    
          // Compare provided walletAddress with the hashed walletAddress in DB
          const walletMatches = await bcrypt.compare(normalizedWalletAddress, user.walletAddress);
          if (!walletMatches) {
              throw new Error('Wallet address does not match');
          }
    
          // Compare password
          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) {
              throw new Error('Invalid password');
          }
    
          // Generate token with user role
          const token = jwt.sign({ 
              userId: user.userId, 
              role: user.role, // Add user role to the token payload
              walletAddress: normalizedWalletAddress
          }, process.env.JWT_SECRET, {
              expiresIn: '1h' // Set token expiration time
          });
    
          // Return token and user data
          return { token, user };
      } catch (error) {
          console.error('Login error:', error);
          throw new Error('Login failed');
      }
    },
    
    // Register function
    registerUser: async (_, { input }) => {
      try {
          const {
              name,
              surname,
              phoneNumber,
              address,
              email,
              id,
              hasVoted,
              password,
              role,
              status,
              walletAddress,
              province
          } = input;
    
          // Check if a user with the provided email already exists
          const existingUser = await User.findOne({ email });
          if (existingUser) {
              throw new Error('User with this email already exists');
          }
    
          // Convert the wallet address to lowercase before hashing
          const normalizedWalletAddress = walletAddress.toLowerCase();
          console.log("Normalized Wallet Address (Register):", normalizedWalletAddress);
    
          // Hash the normalized wallet address
          const hashedWalletAddress = await bcrypt.hash(normalizedWalletAddress, 10);
          console.log("Hashed Wallet Address (Register):", hashedWalletAddress);
    
          // Check if a user with the provided hashed wallet address already exists
          const existingUserByWallet = await User.findOne({ walletAddress: hashedWalletAddress });
          if (existingUserByWallet) {
              throw new Error('Wallet address is already registered. Please use a different wallet.');
          }
    
          // Hash the password
          const hashedPassword = await bcrypt.hash(password, 10);
    
          // Create a new user instance
          const newUser = new User({
              userId: id,
              name,
              surname,
              phoneNumber,
              address,
              email,
              id,
              hasVoted,
              passwordHash: hashedPassword,
              role,
              status,
              walletAddress: hashedWalletAddress,  // Save hashed wallet address in DB
              province
          });
    
          // Save the new user to the database
          const savedUser = await newUser.save();
    
          // Generate a JWT token for the new user
          const token = jwt.sign({ userId: savedUser.userId }, process.env.JWT_SECRET, {
              expiresIn: '1h'
          });
    
          return {
              token,
              user: savedUser
          };
      } catch (error) {
          console.error('Error registering user:', error);
          throw new Error('User registration failed');
      }
    },
    
    // DONE
    logoutUser: async (_, {user}) => {
      try{

        return true;
      } catch (error) {
        console.error('Error logging out', error);
        throw new Error('Failed to log out');
      }
    },    
    castVote: async (_, { electionId, candidateId, walletAddress }, context) => {
      try {
        const { userId } = context;
        if (!userId) {
          console.log("No userId found in context");
          return { success: false, message: 'Authorization required.' };
        }
    
        console.log("The User in Context:", userId);
        console.log("The CandidateId", candidateId);

        const dbUser = await User.findOne({ userId });
    
        if (!dbUser) {
          return { success: false, message: 'User not found in the database.' };
        }
    
        if (dbUser.role !== 'VOTER' || dbUser.status !== 'Active') {
          return { success: false, message: 'User is not authorized to vote.' };
        }
    
        console.log("The provided:", electionId);
        const election = await Election.findById(electionId);
    
        if (!election) {
          return { success: false, message: 'Election ID not found' };
        }
        // Check if the user has already voted in this election (blockchain check)
        if (!web3.utils.isAddress(walletAddress)) {
          return { success: false, message: 'Invalid wallet address.' };
        }
        // Check if the user has already voted in this election (blockchain check)
        const hasVoted = await votingContract.methods.hasVoted(walletAddress).call();
        console.log("Has voted:", hasVoted);

        if (hasVoted) {
          return { success: false, message: 'You have already voted in this election.' };
        }
        const province = dbUser.province;
        console.log("The province of voter is:", province);
        // Estimate gas and cast vote on blockchain
        const gasEstimate = await votingContract.methods.vote(candidateId,province).estimateGas({ from: walletAddress });
        await votingContract.methods.vote(candidateId,province).send({ from: walletAddress, gas: gasEstimate });
    
        // Update the database to record that the user has voted
        dbUser.status = 'Voted';  // Update status to mark as voted
        dbUser.hasVoted = true;
        await dbUser.save();
    
        return { success: true, message: 'Vote successfully cast.' };
    
      } catch (error) {
        console.error("Error casting vote:", error);
    
        let message = 'Failed to cast vote. Please try again.';
        if (error.message.includes('insufficient funds')) {
          message = 'Insufficient funds for transaction gas.';
        } else if (error.message.includes('revert')) {
          message = 'Transaction reverted. Ensure the candidate and election are valid.';
        }
    
        return { success: false, message };
      }
    },
    
    //DONE
    createParty: async (_, { name, regNum, partyAbbrev, election, description, logo, officeTel }) => {
      try {

        // Validate if election exists
        const elec = await Election.findById(election);
        if (!elec) {
          throw new Error('Election not found');
        }
 // Step 2: Validate registration number (you can add other custom validation if needed)
 const existingParty = await Party.findOne({ regNum });
 if (existingParty) {
   throw new Error('A party with this registration number already exists.');
 }

    // Step 3: Handle logo file upload (if a logo was provided)
    let logoPath = '';
    if (logo) {
      // If a logo file is provided, save it to the file system or cloud storage
      const { createReadStream, filename, mimetype } = await logo;
      
      // Validate file type (Optional, e.g. only allow images)
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(mimetype)) {
        throw new Error('Invalid file type. Only JPEG, PNG, and GIF files are allowed.');
      }

      // Define where the file should be saved
      const filePath = path.join(__dirname, `../../uploads/logos/${filename}`);
      
      // Save the file to the server
      const stream = createReadStream();
      await new Promise((resolve, reject) => {
        const out = fs.createWriteStream(filePath);
        stream.pipe(out);
        out.on('finish', resolve);
        out.on('error', reject);
      });

      // Save the file path or URL for later use
      logoPath = `/uploads/logos/${filename}`;
    }

    // Step 4: Create the new party document
    const newParty = new Party({
      name,
      regNum,
      partyAbbrev,
      election,
      description,
      logo: logoPath, // Save the file path or URL here
      officeTel,
      createdAt: new Date().toISOString(),
    });

    // Step 5: Save the party to the database
    const savedParty = await newParty.save();

    // Step 6: Return the created party with populated election details
    return await savedParty.populate('election');

    } catch (err) {
    console.error('Error creating party:', err);
    throw new Error(err.message || 'Failed to create party.');
    }   
    },
    deleteParty: async (_, { id }) => {
      try {
        const party = await Party.findById(id);
        if (!party) {
          throw new Error("Party not found");
        }

        await party.remove();
        return `Party with ID ${id} deleted successfully.`;
      } catch (error) {
        throw new Error("Error deleting party: " + error.message);
      }
    },
    updateParty: async (_, { id, name, regNum, partyAbbrev, election, description, logo, officeTel }) => {
      try {
        const party = await Party.findById(id);
        if (!party) {
          throw new Error("Party not found");
        }

        // Optionally validate the new electionId if provided
        if (election) {
          const election = await Election.findById(election);
          if (!election) {
            throw new Error('Election not found');
          }
          party.election = election;
        }

        // Update fields
        party.name = name || party.name;
        party.regNum = regNum || party.regNum;
        party.partyAbbrev = partyAbbrev || party.partyAbbrev;
        party.description = description || party.description;
        party.logo = logo || party.logo;
        party.officeTel = officeTel || party.officeTel;

        await party.save();
        return party;
      } catch (error) {
        throw new Error('Error updating party: ' + error.message);
      }
    },  
    createElection: async (_,{input}) => {
      try{
        const { name, description, startDate, endDate, type } = input;

        // Determine election status based on the start and end date
        const currentDate = new Date();
        let status = 'UPCOMING';
        const start = new Date(startDate);
        const end = new Date(endDate);
  
        if (currentDate >= start && currentDate <= end) {
          status = 'ACTIVE';
        } else if (currentDate > end) {
          status = 'PAST';
        }
        const newElection = new Election({
          name,
          description,
          startDate,
          endDate,
          status,
          type,
      });
      return await newElection.save();
    }
      catch (err) {
        throw new Error('Error creating election');
      }
    },
    createCandidate: async (_, { election, party, name, identityNo, age, email }) => {
      try {
        // Step 1: Create a new candidate in the database
        const newCandidate = new Candidate({
          name,
          election,
          party,
          identityNo,
          age,
          email,
        });
    
        // Save the candidate to the database and log for debugging
        const savedCandidate = await newCandidate.save();
        console.log('Saved Candidate:', savedCandidate);
        const theid = savedCandidate.id;
        console.log('Passed Candidate ID:', theid);

        // Step 2: Interact with the smart contract
        const accounts = await web3.eth.getAccounts(); // Get user accounts
        const adminAccount = accounts[0];
        const gasEstimate = await votingContract.methods.addCandidate(name, party, election, age, email, theid).estimateGas({ from: adminAccount });
        // Smart contract call to add the candidate with necessary parameters
        const tx = await votingContract.methods
          .addCandidate(name, party, election, age, email, theid)
          .send({ from: adminAccount, gas: gasEstimate });
    
        // Log transaction receipt for debugging
        console.log('Smart Contract Transaction:', tx);
    
        // Optional: If `candidateId` is emitted as an event or returned, extract it
        // const candidateId = tx.events.CandidateAdded.returnValues.candidateId;
    
        // Step 3: Populate additional fields in the candidate document from database
        const populatedCandidate = await Candidate.findById(savedCandidate._id)
          .populate('party')
          .populate('election');
    
        return populatedCandidate;
      } catch (error) {
        console.error('Error creating candidate:', error); // Log error for debugging
        throw new Error('Failed to create candidate: ' + error.message);
      }
    },
    
  },
  Party: {
    // You can also define how the `election` field should be fetched for each party
    election: async (parent) => {
      return await Election.findById(parent.election);
    },
  },

};

module.exports = resolvers;