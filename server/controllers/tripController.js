const Trip = require('../models/Trip');

// CREATE a new trip
exports.createTrip = async (req, res) => {
    try {
        const { title, origin, destination, meeting_point, departureDate, transportType, category, maxTravelers, totalCost, imageUrl } = req.body;

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
            finalImageUrl = `/uploads/${req.file.filename}`;
        }

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
            travelers: [req.user.id], // Creator is automatically the first traveler
            imageUrl: finalImageUrl
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
        const { search, transportType, maxPrice } = req.query;
        let filter = { status: 'active' };

        // Search by origin or destination
        if (search) {
            filter.$or = [
                { origin: { $regex: search, $options: 'i' } },
                { destination: { $regex: search, $options: 'i' } },
                { title: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by transport type
        if (transportType && transportType !== 'All') {
            filter.transportType = transportType;
        }

        // Filter by max price
        if (maxPrice) {
            filter.totalCost = { $lte: Number(maxPrice) * 2 }; // Rough estimate filter for now
        }

        const trips = await Trip.find(filter)
            .populate('creator', 'name')
            .sort({ departureDate: 1 }); // Soonest first
            
        // Map to include dynamic cost
        const tripsWithCost = trips.map(trip => {
            const travelerCount = trip.travelers.length;
            const currentCostPerPerson = travelerCount > 0 ? trip.totalCost / travelerCount : trip.totalCost;
            return { ...trip._doc, currentCostPerPerson };
        });

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

        const { title, origin, destination, meeting_point, departureDate, transportType, category, maxTravelers, totalCost, imageUrl } = req.body;
        
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
        
        // Handle image update
        if (req.file) {
            trip.imageUrl = `/uploads/${req.file.filename}`;
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
        res.json({ message: `Trip status updated to ${status}`, trip });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
