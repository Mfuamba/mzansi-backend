// Import dependencies
const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { ApolloServerPluginLandingPageGraphQLPlayground } = require('@apollo/server-plugin-landing-page-graphql-playground');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');

// Import your typeDefs and resolvers
const typeDefs = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');
const allowedOrigins =[
'http://localhost:3000'
];
// Create an Express app
const app = express();

// Enable CORS for all routes
app.use(
    cors({
      origin: allowedOrigins,
    })
  );
// Add JSON middleware before applying Apollo middleware
app.use(express.json()); // This middleware parses incoming JSON requests

// Connect to MongoDB
const uri = process.env.MONGO_URI;
console.log("Mongo URI:", process.env.MONGO_URI); // Add this line for debugging

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('MongoDB connection error:', err));


// Create an Apollo Server instance
const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [
        ApolloServerPluginLandingPageGraphQLPlayground(), // Optional: Enables GraphQL Playground for testing
    ],
});

// Apply Apollo middleware to the Express app
async function startApolloServer() {
    await server.start();
    app.use('/graphql', expressMiddleware(server));
}

// Start Apollo Server
startApolloServer().then(() => {
    // Define the port
    const PORT = process.env.PORT || 4000;

    // Start the Express server
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}/graphql`);
    });
});
