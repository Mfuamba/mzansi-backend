const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { ApolloServerPluginLandingPageGraphQLPlayground } = require('@apollo/server-plugin-landing-page-graphql-playground');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');

// Import typeDefs and resolvers
const typeDefs = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:4000/graphql', // GraphQL Playground
];

// Create an Express app
const app = express();

// Set Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy headers
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

// Enable CORS for all routes
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type'], // Allow Authorization header
  })
);

// Add JSON middleware before Apollo middleware
app.use(express.json()); // Parses incoming JSON requests

// Connect to MongoDB
const uri = process.env.MONGO_URI;
console.log("Mongo URI:", uri); // Debug Mongo URI

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Set up Multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Define file upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  res.status(200).send({ message: 'File uploaded successfully.' });
});

// Apollo Server context function with debugging
const context = ({ req }) => {
  const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;

  if (token) {
    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Decoded Token:", decodedToken); // Log decoded token details
      return { userId: decodedToken.userId, walletAddress: decodedToken.walletAddress}; // Return user details in context
    } catch (error) {
      console.error("Token verification failed:", error.message); // Log specific token error
      throw new Error('Invalid token');
    }
  } else {
    console.log("No token provided in request."); // Log missing token
  }

  return {}; // Return empty context if no token
};

// Apollo Server setup
const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [
    ApolloServerPluginLandingPageGraphQLPlayground(), // Enable GraphQL Playground
  ],
});

// Start Apollo Server and apply middleware
async function startApolloServer() {
  await server.start();
  app.use('/graphql', expressMiddleware(server, { context })); // Apply context
}

// Start the server
startApolloServer().then(() => {
  const PORT = process.env.PORT || 4000;

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}/graphql`);
  });
});
