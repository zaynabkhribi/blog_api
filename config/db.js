
const mongoose = require('mongoose');

async function connectDB(uri) {
  if (!uri) {
    throw new Error(
      'MongoDB URI is missing from environment variables (.env)'
    );
  }

  await mongoose.connect(uri, {
    autoIndex: true, // Automatically builds indexes (e.g., unique) in development
  });

  console.log('MongoDB Mongoose connection established successfully!');
}

module.exports = connectDB;
