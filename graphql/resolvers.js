// src/resolvers/user.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const VerifiedID = require('../models/VerifiedIDs');

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
  },
  Mutation: {
    loginUser: async (_, { email, password }) => {
      try {
          // Check if user exists
          const user = await User.findOne({ email });
          if (!user) {
              throw new Error('User not found');
          }
  
          // Compare password
          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) {
              throw new Error('Invalid password');
          }
  
        // Generate token with user role
        const token = jwt.sign({ 
          userId: user.userId, 
          role: user.role // Add user role to the token payload
      }, process.env.JWT_SECRET, {
          expiresIn: '1h' // Set token expiration time
      });

          // Return the token and user data
          return { token, user };
        } catch (error) {
          console.error('Login error:', error);
          throw new Error('Login failed');
      }
  },  
  // DONE
    logoutUser: async (_, {user}) => {
      try{
        user.token = undefined;
        await user.save();
        return true;
      } catch (error) {
        console.error('Error logging out', error);
        throw new Error('Failed to log out');
      }
    },
    //DONE
    registerUser: async (_, { input }) => {
      try {
        const {
          name,
          surname,
          phoneNumber,
          address,
          email,
          id,
          password,
          role,
          status
        } = input;

        // Checking if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          throw new Error('User with this email already exists');
        }

        // Password hashing
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user instance
        const newUser = new User({
          userId: id,  // Assuming id is used as the unique userId
          name,
          surname,
          phoneNumber,
          address,
          email,
          id,  // This is the national ID, not the userId
          passwordHash: hashedPassword,
          role,
          status
        });

        // Save the user to the database
        const savedUser = await newUser.save();

        // Generate a JWT token
        const token = jwt.sign({ userId: savedUser.userId }, process.env.JWT_SECRET, {
          expiresIn: '1h' // Set token expiration time
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
  },
};

module.exports = resolvers;
