const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type AuthPayload {
    token: String
    user: User
  }

  enum Role {
    ADMIN
    VOTER
    MODERATOR
  }

  type User {
    userId: ID!
    name: String!
    surname: String!
    phoneNumber: String!  # Changed to String
    address: String!
    email: String!
    id: String!
    role: Role!
    hasVoted: Boolean!
    status: String!
    walletAddress: String!
    province: String!
  }
  type Party {
  id: ID!
  name: String!
  regNum: String!
  partyAbbrev: String!
  election: Election!  # Changed to reference the Election object
  description: String
  logo: String
  officeTel: String!
  createdAt: String!
  }
  type Election {
    id: ID!
    name: String!
    description: String
    startDate: String!
    endDate: String!
    status: String!
    createdAt: String!
    parties: [Party]
    type: String!
  }
  input CreateElectionInput {
    name: String!
    description: String
    startDate: String!
    endDate: String!
    type: String!
  }

  input RegisterInput {
    name: String!
    surname: String!
    phoneNumber: String!  # Changed to String
    address: String!
    email: String!
    id: String!
    hasVoted: Boolean
    password: String!
    confirmPassword: String!
    role: Role!  # Changed to Role enum type
    status: String!
    walletAddress: String!
    province: String!
  }
input CreateParty {
    name: String!,
    regNum: String!,
    partyAbbrev: String!,
    election: ID!,
    description: String,
    logo: String,
    officeTel: String!
}
    type Candidate {
  id: ID!
  name: String!
  email: String!
  age: String!
  identityNo: String!
  party: Party
  election: Election
}
# Response type for the castVote mutation
type VoteResponse {
  success: Boolean!
  message: String!
}
  type Query {
    verifyID(id: String!): Boolean
    getParties: [Party!]!
    parties: [Party!]!
    getParty(id: ID!): Party
    elections: [Election]
    candidates: [Candidate!]!

  }

  type Mutation {
    loginUser(email: String!, password: String!, walletAddress: String!): AuthPayload
    logoutUser: Boolean
    registerUser(input: RegisterInput!): AuthPayload
    createParty(name: String!, logo: String, regNum: String!, partyAbbrev: String!,election: ID!,description: String, officeTel: String): Party!
    updateParty(id: ID!, name: String, regNum: String, partyAbbrev: String, election: ID, description: String, logo: String, officeTel: String ): Party!
    deleteParty(id: ID!): String!  
    createElection(input: CreateElectionInput!): Election!
    createCandidate(election: ID!, party: ID!, name: String!, identityNo: String!, email: String!, age: String!): Candidate!
    castVote(electionId: String!, candidateId: String!, walletAddress: String!): VoteResponse
    }
`;

module.exports = typeDefs;
