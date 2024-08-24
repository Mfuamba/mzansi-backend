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
    status: String!
  }

  input RegisterInput {
    name: String!
    surname: String!
    phoneNumber: String!  # Changed to String
    address: String!
    email: String!
    id: String!
    password: String!
    role: Role!  # Changed to Role enum type
    status: String!
  }

  type Query {
    verifyID(id: String!): Boolean
  }

  type Mutation {
    loginUser(email: String!, password: String!): AuthPayload
    logoutUser: Boolean
    registerUser(input: RegisterInput!): AuthPayload
  }
`;

module.exports = typeDefs;
