// seedUsers.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User'); // Make sure this exists

// Connect to MongoDB
mongoose.connect('mongodb+srv://eventifyadmin:eventify123@cluster0.uhbp5cg.mongodb.net/eventify?retryWrites=true&w=majority')
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

async function seed() {
  await User.deleteMany({}); // Clear existing users

  // Hash passwords
  const hashedStudent = await bcrypt.hash('1234', 10);
  const hashedBusiness = await bcrypt.hash('1234', 10);

  // Create users
await User.create([
{
 email: "maqsood@gmail.com",
 password: hashedStudent,
 role: "student",
 points: 0
},
{
 email: "siri@gmail.com",
 password: hashedBusiness,
 role: "business"
}
]);

  console.log('Users seeded');
  mongoose.disconnect();
}

seed();