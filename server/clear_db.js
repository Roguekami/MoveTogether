const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const Trip = require('./models/Trip');

const clearOldData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');
        
        const result = await Trip.deleteMany({});
        console.log(`Deleted ${result.deletedCount} trips.`);
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

clearOldData();
