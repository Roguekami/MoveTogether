const Trip = require('../models/Trip');
const TripMessage = require('../models/TripMessage');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { notifyNewJoinRequest, notifyRequestAccepted, notifyTripStatusChange } = require('../utils/emailService');

// Helper function to create system messages
const createSystemMessage = async (tripId, text, io) => {
    const msg = await TripMessage.create({
        tripId,
        sender: null,
        text,
        messageType: 'system'
    });
    // Emit system message via socket if available
    if (io) {
        io.to(`trip-${tripId}`).emit('receive-message', msg);
    }
};

// Helper function to check if user is a participant
const isParticipant = async (tripId, userId) => {
    const trip = await Trip.findById(tripId);
    
    if (!trip) {
        return { isParticipant: false, error: 'Trip not found' };
    }
    
    const isCreator = trip.creator.toString() === userId.toString();
    const isTraveler = trip.travelers.some(
        t => t.toString() === userId.toString()
    );
    
    return { 
        isParticipant: isCreator || isTraveler, 
        trip,
        error: null 
    };
};

// CREATE a new trip
exports.createTrip = async (req, res) => {
    try {
        // 1. Verify profile completeness
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const isProfileComplete = 
            user.name && 
            user.bio && 
            user.phone && 
            user.isEmailVerified && 
            user.emergencyContact?.name && 
            user.emergencyContact?.phone;

        if (!isProfileComplete) {
            return res.status(403).json({ 
                message: "Please complete your profile (Bio, Phone, Verified Email, and Emergency Contact) before creating a trip.",
                isProfileIncomplete: true
            });
        }

        const { title, origin, destination, meeting_point, departureDate, transportType, category, maxTravelers, totalCost, imageUrl, originCoords, destinationCoords, meetingPointCoords } = req.body;

        // Validation
        if (!title || title.length < 3 || title.length > 100) return res.status(400).json({ message: "Title must be between 3 and 100 characters" });
        if (!origin || !destination || !meeting_point) return res.status(400).json({ message: "Origin, destination, and meeting point are required" });
        if (!departureDate || new Date(departureDate) < new Date()) return res.status(400).json({ message: "Departure date must be in the future" });
        if (!transportType || !['Bus', 'Car', 'Train', 'Flight', 'Walk', 'Bike', 'Other'].includes(transportType)) return res.status(400).json({ message: "Invalid transport type" });
        if (!category || !['Transport', 'Fitness', 'Adventure', 'Events', 'Social', 'Other'].includes(category)) return res.status(400).json({ message: "Invalid category" });
        if (!maxTravelers || maxTravelers < 2 || maxTravelers > 50) return res.status(400).json({ message: "Max travelers must be between 2 and 50" });
        if (totalCost === undefined || totalCost < 0) return res.status(400).json({ message: "Total cost cannot be negative" });
        
        // Handle uploaded image
        let finalImageUrl = imageUrl || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1000';
        if (req.file) {
            finalImageUrl = req.file.path || `/uploads/${req.file.filename}`;
        }

        // Parse coords if sent as JSON strings (from FormData)
        const parseCoords = (val) => {
            if (!val) return undefined;
            if (typeof val === 'string') {
                try { return JSON.parse(val); } catch { return undefined; }
            }
            return val;
        };

        const newTrip = new Trip({
            creator: req.user.id,
            title,
            origin,
            destination,
            meeting_point,
            departureDate,
            transportType,
            category,
            maxTravelers,
            totalCost,
            travelers: [req.user.id],
            imageUrl: finalImageUrl,
            originCoords: parseCoords(originCoords),
            destinationCoords: parseCoords(destinationCoords),
            meetingPointCoords: parseCoords(meetingPointCoords)
        });

        await newTrip.save();
        
        // Populate creator info before sending back
        await newTrip.populate('creator', 'name email');

        res.status(201).json({ message: "Trip created successfully", trip: newTrip });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET all active trips (for Explore / Nearby) with filtering
exports.getAllTrips = async (req, res) => {
    try {
        const { search, q, category, date, status, sort, transportType, maxPrice } = req.query;
        let query = {};

        // Keyword Search (title, description, origin, destination)
        const searchTerm = q || search;
        if (searchTerm) {
            query.$or = [
                { title: { $regex: searchTerm, $options: 'i' } },
                { description: { $regex: searchTerm, $options: 'i' } }, // description doesn't exist in Trip model yet, but safe to include
                { origin: { $regex: searchTerm, $options: 'i' } },
                { destination: { $regex: searchTerm, $options: 'i' } }
            ];
        }

        // Filter by category
        if (category && category !== 'All') {
            query.category = category;
        }

        // Filter by transport type
        if (transportType && transportType !== 'All') {
            query.transportType = transportType;
        }

        // Filter by date
        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            
            query.departureDate = { $gte: startOfDay, $lte: endOfDay };
        }

        // Filter by status
        if (status && status !== 'All') {
            query.status = status;
        } else {
            query.status = 'active'; // Default to active only
        }

        // Sort
        let sortOption = { createdAt: -1 }; // Default: newest
        if (sort === 'soonest') {
            sortOption = { departureDate: 1 };
        } else if (sort === 'almost-full') {
            // We'll sort after fetching since ratio calculation requires dynamic check
            sortOption = { createdAt: -1 }; 
        }

        const trips = await Trip.find(query)
            .populate('creator', 'name')
            .populate('travelers', 'name')
            .sort(sortOption);

        // Map to include dynamic cost
        let tripsWithCost = trips.map(trip => {
            const travelerCount = trip.travelers.length;
            const currentCostPerPerson = travelerCount > 0 ? trip.totalCost / travelerCount : trip.totalCost;
            const fillRatio = travelerCount / trip.maxTravelers;
            return { ...trip._doc, currentCostPerPerson, fillRatio };
        });

        // Handle 'almost-full' sort in memory
        if (sort === 'almost-full') {
            tripsWithCost.sort((a, b) => b.fillRatio - a.fillRatio);
        }

        res.json({ trips: tripsWithCost });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET my trips (Created or Joined - for Dashboard)
exports.getMyTrips = async (req, res) => {
    try {
        const myTrips = await Trip.find({ 
            $or: [
                { creator: req.user.id },
                { travelers: req.user.id }
            ]
        })
        .populate('creator', 'name')
        .sort({ departureDate: 1 });

        const tripsWithCost = myTrips.map(trip => {
            const travelerCount = trip.travelers.length;
            const currentCostPerPerson = travelerCount > 0 ? trip.totalCost / travelerCount : trip.totalCost;
            return { ...trip._doc, currentCostPerPerson };
        });

        res.json({ trips: tripsWithCost });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET single trip details
exports.getTripById = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id)
            .populate('creator', 'name bio phone')
            .populate('travelers', 'name bio')
            .populate('pendingRequests', 'name bio');

        if (!trip) {
            return res.status(404).json({ message: "Trip not found" });
        }

        // Safe cost calculation
        const travelerCount = trip.travelers.length;
        const currentCostPerPerson = travelerCount > 0 ? trip.totalCost / travelerCount : trip.totalCost;

        res.json({ trip: { ...trip._doc, currentCostPerPerson } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// REQUEST to join a trip
exports.joinTrip = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);

        if (!trip) {
            return res.status(404).json({ message: "Trip not found" });
        }

        // Prevent joining terminal or confirmed trips
        if (['confirmed', 'completed', 'cancelled'].includes(trip.status)) {
            return res.status(400).json({ message: `Cannot join a trip that is ${trip.status}` });
        }

        // Prevent creator from joining their own trip
        if (trip.creator.toString() === req.user.id) {
            return res.status(400).json({ message: "Creators cannot request to join their own trip" });
        }

        // Check if full
        if (trip.travelers.length >= trip.maxTravelers) {
            return res.status(400).json({ message: "This trip is full" });
        }

        // Check if already a traveler
        if (trip.travelers.includes(req.user.id)) {
            return res.status(400).json({ message: "You are already a traveler on this trip" });
        }

        // Check if already requested
        if (trip.pendingRequests.includes(req.user.id)) {
            // Cancel request if already exists (toggle)
            trip.pendingRequests = trip.pendingRequests.filter(id => id.toString() !== req.user.id);
            await trip.save();
            return res.json({ message: "Join request cancelled", trip });
        }

        trip.pendingRequests.push(req.user.id);
        await trip.save();

        // Email the trip creator about the new join request
        const creator = await User.findById(trip.creator).select('name email');
        const requester = await User.findById(req.user.id).select('name');
        if (creator && requester) {
            notifyNewJoinRequest(creator.email, creator.name, requester.name, trip.title);
            
            // Create in-app notification
            await Notification.create({
                recipient: trip.creator,
                type: 'join_request',
                message: `${requester.name} has requested to join your trip "${trip.title}"`,
                relatedTrip: trip._id
            });
            // Emit socket event if io is available
            const io = req.app.get('io');
            if (io) io.to(trip.creator.toString()).emit('new-notification');
        }

        res.json({ message: "Join request sent to creator", trip });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ACCEPT a join request (Creator only)
exports.acceptRequest = async (req, res) => {
    try {
        const { tripId, userId } = req.params;
        const trip = await Trip.findById(tripId);

        if (!trip) return res.status(404).json({ message: "Trip not found" });

        // Only creator can accept
        if (trip.creator.toString() !== req.user.id) {
            return res.status(403).json({ message: "Only the creator can accept requests" });
        }

        // Check if user is in pending
        if (!trip.pendingRequests.includes(userId)) {
            return res.status(400).json({ message: "User has no pending request" });
        }

        // Check if full
        if (trip.travelers.length >= trip.maxTravelers) {
            return res.status(400).json({ message: "Trip is full, cannot accept more travelers" });
        }

        // Move from pending to travelers
        trip.pendingRequests = trip.pendingRequests.filter(id => id.toString() !== userId);
        trip.travelers.push(userId);

        // Update status if full
        if (trip.travelers.length === trip.maxTravelers) {
            trip.status = 'full';
        }

        await trip.save();
        const updatedTrip = await Trip.findById(tripId)
            .populate('creator', 'name bio phone')
            .populate('travelers', 'name bio')
            .populate('pendingRequests', 'name bio');

        // Notify group when someone joins
        const joinedUser = updatedTrip.travelers.find(t => t._id.toString() === userId);
        if (joinedUser) {
            await createSystemMessage(tripId, `${joinedUser.name} joined the trip`, req.app.get('io'));
        }

        // Email the accepted traveler
        const acceptedUser = await User.findById(userId).select('name email');
        if (acceptedUser) {
            notifyRequestAccepted(acceptedUser.email, acceptedUser.name, updatedTrip.title);
            
            // Create in-app notification
            await Notification.create({
                recipient: userId,
                type: 'request_accepted',
                message: `Your request to join "${updatedTrip.title}" was accepted!`,
                relatedTrip: tripId
            });
            // Emit socket event
            const io = req.app.get('io');
            if (io) io.to(userId).emit('new-notification');
        }

        res.json({ message: "Request accepted", trip: updatedTrip });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// REJECT a join request (Creator only)
exports.rejectRequest = async (req, res) => {
    try {
        const { tripId, userId } = req.params;
        const trip = await Trip.findById(tripId);

        if (!trip) return res.status(404).json({ message: "Trip not found" });

        if (trip.creator.toString() !== req.user.id) {
            return res.status(403).json({ message: "Only the creator can reject requests" });
        }

        trip.pendingRequests = trip.pendingRequests.filter(id => id.toString() !== userId);
        await trip.save();
        
        const updatedTrip = await Trip.findById(tripId)
            .populate('creator', 'name bio phone')
            .populate('travelers', 'name bio')
            .populate('pendingRequests', 'name bio');

        res.json({ message: "Request rejected", trip: updatedTrip });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// REMOVE a traveler (Creator only)
exports.removeTraveler = async (req, res) => {
    try {
        const { tripId, userId } = req.params;
        const trip = await Trip.findById(tripId);

        if (!trip) return res.status(404).json({ message: "Trip not found" });

        if (trip.creator.toString() !== req.user.id) {
            return res.status(403).json({ message: "Only the creator can remove travelers" });
        }

        if (userId === trip.creator.toString()) {
            return res.status(400).json({ message: "Cannot remove the creator" });
        }

        trip.travelers = trip.travelers.filter(id => id.toString() !== userId);
        
        if (trip.status === 'full') {
            trip.status = 'active';
        }

        await trip.save();
        const updatedTrip = await Trip.findById(tripId)
            .populate('creator', 'name bio phone')
            .populate('travelers', 'name bio')
            .populate('pendingRequests', 'name bio');

        await createSystemMessage(tripId, `A traveler was removed from the trip`, req.app.get('io'));

        res.json({ message: "Traveler removed", trip: updatedTrip });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// LEAVE a trip
exports.leaveTrip = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);

        if (!trip) {
            return res.status(404).json({ message: "Trip not found" });
        }

        // Check if creator (creator cannot leave, must delete)
        if (trip.creator.toString() === req.user.id) {
            return res.status(400).json({ message: "Creator cannot leave the trip. You must delete it instead." });
        }

        // Check if user is actually in the trip
        if (!trip.travelers.includes(req.user.id)) {
            return res.status(400).json({ message: "You are not a traveler on this trip" });
        }

        // Remove user
        trip.travelers = trip.travelers.filter(id => id.toString() !== req.user.id);
        
        // Update status if it was full
        if (trip.status === 'full') {
            trip.status = 'active';
        }

        await trip.save();
        await trip.populate('travelers', 'name bio');

        // Notify group when someone leaves
        await createSystemMessage(req.params.id, `${req.user.name} left the trip`, req.app.get('io'));

        res.json({ message: "Successfully left trip", trip });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE a trip
exports.deleteTrip = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);

        if (!trip) {
            return res.status(404).json({ message: "Trip not found" });
        }

        // Only creator can delete
        if (trip.creator.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to delete this trip" });
        }

        await Trip.findByIdAndDelete(req.params.id);

        res.json({ message: "Trip deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// EDIT a trip
exports.editTrip = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);
        
        if (!trip) return res.status(404).json({ message: "Trip not found" });
        
        if (trip.creator.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only trip creator can edit' });
        }
        
        if (['confirmed', 'completed', 'cancelled'].includes(trip.status)) {
            return res.status(400).json({ message: 'Cannot edit trip in this status' });
        }

        const { title, origin, destination, meeting_point, departureDate, transportType, category, maxTravelers, totalCost, imageUrl, originCoords, destinationCoords, meetingPointCoords } = req.body;
        
        // Parse coords helper
        const parseCoords = (val) => {
            if (!val) return undefined;
            if (typeof val === 'string') {
                try { return JSON.parse(val); } catch { return undefined; }
            }
            return val;
        };

        // Validation updates
        if (title) {
            if (title.length < 3 || title.length > 100) return res.status(400).json({ message: "Title must be between 3 and 100 characters" });
            trip.title = title;
        }
        if (origin) trip.origin = origin;
        if (destination) trip.destination = destination;
        if (meeting_point) trip.meeting_point = meeting_point;
        if (departureDate) {
            if (new Date(departureDate) < new Date()) return res.status(400).json({ message: "Departure date must be in the future" });
            trip.departureDate = departureDate;
        }
        if (transportType) trip.transportType = transportType;
        if (category) trip.category = category;
        if (maxTravelers) {
            if (maxTravelers < 2 || maxTravelers > 50) return res.status(400).json({ message: "Max travelers must be between 2 and 50" });
            trip.maxTravelers = maxTravelers;
        }
        if (totalCost !== undefined) {
            if (totalCost < 0) return res.status(400).json({ message: "Total cost cannot be negative" });
            trip.totalCost = totalCost;
        }
        
        // Handle coordinates update
        const parsedOriginCoords = parseCoords(originCoords);
        const parsedDestCoords = parseCoords(destinationCoords);
        const parsedMeetCoords = parseCoords(meetingPointCoords);
        if (parsedOriginCoords) trip.originCoords = parsedOriginCoords;
        if (parsedDestCoords) trip.destinationCoords = parsedDestCoords;
        if (parsedMeetCoords) trip.meetingPointCoords = parsedMeetCoords;

        // Handle image update
        if (req.file) {
            trip.imageUrl = req.file.path || `/uploads/${req.file.filename}`;
        } else if (imageUrl) {
            trip.imageUrl = imageUrl;
        }

        await trip.save();
        res.json({ message: "Trip updated successfully", trip });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// UPDATE trip status
exports.updateTripStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const trip = await Trip.findById(req.params.id);
        
        if (!trip) return res.status(404).json({ message: "Trip not found" });
        
        if (trip.creator.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only trip creator can change status' });
        }

        // Block if already terminal state
        if (trip.status === 'completed' || trip.status === 'cancelled') {
            return res.status(400).json({ message: `Cannot change status from ${trip.status}` });
        }
        
        // Validate transition
        const validTransitions = {
            'active': ['full', 'confirmed', 'cancelled'],
            'full': ['active', 'confirmed', 'cancelled'],
            'confirmed': ['completed', 'cancelled']
        };
        
        if (!validTransitions[trip.status]?.includes(status)) {
            return res.status(400).json({ message: `Cannot transition from ${trip.status} to ${status}` });
        }
        
        trip.status = status;
        await trip.save();

        // Email all travelers about the status change
        if (['confirmed', 'cancelled', 'completed'].includes(status)) {
            const populatedTrip = await Trip.findById(trip._id).populate('travelers', 'name email');
            const travelerEmails = populatedTrip.travelers.map(t => ({ email: t.email, name: t.name }));
            notifyTripStatusChange(travelerEmails, trip.title, status);
            
            // Create in-app notifications
            const io = req.app.get('io');
            const statusMessages = {
                confirmed: `Your trip "${trip.title}" has been confirmed!`,
                cancelled: `Your trip "${trip.title}" was cancelled by the creator.`,
                completed: `Your trip "${trip.title}" has been marked completed.`
            };
            const msg = statusMessages[status] || `Your trip "${trip.title}" changed status to ${status}.`;
            
            for (const t of populatedTrip.travelers) {
                await Notification.create({
                    recipient: t._id,
                    type: 'trip_status_change',
                    message: msg,
                    relatedTrip: trip._id
                });
                if (io) io.to(t._id.toString()).emit('new-notification');
            }
        }

        res.json({ message: `Trip status updated to ${status}`, trip });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET messages for a specific trip
exports.getTripMessages = async (req, res) => {
    try {
        const { id: tripId } = req.params;
        const userId = req.user.id;
        
        // Verify participant
        const { isParticipant: isPart, error } = await isParticipant(tripId, userId);
        
        if (!isPart) {
            return res.status(403).json({ error: error || 'Only trip participants can view messages' });
        }
        
        // Fetch messages with sender details
        const messages = await TripMessage.find({ tripId })
            .populate('sender', 'name')
            .sort({ createdAt: 1 })
            .limit(100);
            
        res.json({ messages });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST send a message to a trip chat
exports.sendTripMessage = async (req, res) => {
    try {
        const { id: tripId } = req.params;
        const userId = req.user.id;
        const { text, latitude, longitude } = req.body;
        
        // Verify participant
        const { isParticipant: isPart, trip, error } = await isParticipant(tripId, userId);
        
        if (!isPart) {
            return res.status(403).json({ error: error || 'Only trip participants can send messages' });
        }
        
        // Check if chat is read-only
        if (trip.status === 'completed' || trip.status === 'cancelled') {
            return res.status(400).json({ error: `Cannot send messages: trip is ${trip.status}` });
        }
        
        // Validate message content
        if (!text && (!latitude || !longitude)) {
            return res.status(400).json({ error: 'Message must contain text or location' });
        }
        
        // Determine message type
        let messageType = 'text';
        if (latitude && longitude) {
            messageType = 'location';
        }
        
        // Create message
        const message = await TripMessage.create({
            tripId,
            sender: userId,
            text: text || '',
            latitude,
            longitude,
            messageType
        });
        
        // Populate sender details before returning
        await message.populate('sender', 'name');
        
        // Emit to trip room via Socket.io
        const io = req.app.get('io');
        if (io) {
            io.to(`trip-${tripId}`).emit('receive-message', message);
        }

        res.status(201).json({ message });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE a trip chat message (sender only)
exports.deleteTripMessage = async (req, res) => {
    try {
        const { tripId, messageId } = req.params;
        const userId = req.user.id;

        // Verify participant
        const { isParticipant: isPart, error } = await isParticipant(tripId, userId);
        if (!isPart) {
            return res.status(403).json({ error: error || 'Not a participant' });
        }

        const message = await TripMessage.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Only sender can delete
        if (!message.sender || message.sender.toString() !== userId) {
            return res.status(403).json({ message: 'You can only delete your own messages' });
        }

        await TripMessage.findByIdAndDelete(messageId);

        // Notify room via socket
        const io = req.app.get('io');
        if (io) {
            io.to(`trip-${tripId}`).emit('message-deleted', messageId);
        }

        res.json({ message: 'Message deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

