// const mongoose = require("mongoose");

// const connectDB = async () => {
//   const mongoURI = process.env.MONGO_URI;

//   if (!mongoURI) {
//     throw new Error("MONGO_URI is missing from environment variables");
//   }

//   try {
//     const connection = await mongoose.connect(mongoURI);

//     console.log(
//       `MongoDB connected: ${connection.connection.host}/${connection.connection.name}`,
//     );

//     return connection;
//   } catch (error) {
//     console.error("MongoDB connection failed:", error.message);
//     throw error;
//   }
// };

// module.exports = connectDB;

const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    throw new Error("MONGO_URI is missing from environment variables");
  }

  try {
    console.log("Connecting to MongoDB Atlas...");

    const connection = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("MongoDB connected successfully!");
    console.log("Host:", connection.connection.host);
    console.log("Database:", connection.connection.name);

    return connection;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};

module.exports = connectDB;
