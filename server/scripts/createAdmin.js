const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const adminExists = await User.findOne({ email: 'admin@movetogether.com' });
    if (adminExists) {
      console.log('Admin already exists!');
      process.exit();
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await User.create({
      name: 'Admin',
      email: 'admin@movetogether.com',
      password: hashedPassword,
      role: 'admin',
      isEmailVerified: true
    });
    
    console.log('Admin user created successfully!');
    process.exit();
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();
