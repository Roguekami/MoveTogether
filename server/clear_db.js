const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('./models/User');
const Trip = require('./models/Trip');
const Rating = require('./models/Rating');
const Report = require('./models/Report');
const TripMessage = require('./models/TripMessage');
const Message = require('./models/Message');

const clearAllData = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');
        
        // Clear all collections
        const trips = await Trip.deleteMany({});
        console.log(`Deleted ${trips.deletedCount} trips.`);

        const users = await User.deleteMany({});
        console.log(`Deleted ${users.deletedCount} users.`);

        const ratings = await Rating.deleteMany({});
        console.log(`Deleted ${ratings.deletedCount} ratings.`);

        const reports = await Report.deleteMany({});
        console.log(`Deleted ${reports.deletedCount} reports.`);

        const tripMsgs = await TripMessage.deleteMany({});
        console.log(`Deleted ${tripMsgs.deletedCount} trip group messages.`);

        const directMsgs = await Message.deleteMany({});
        console.log(`Deleted ${directMsgs.deletedCount} direct messages.`);
        
        console.log('Database cleared successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error clearing database:', err);
        process.exit(1);
    }
};

clearAllData();
