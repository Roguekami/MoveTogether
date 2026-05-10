const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { notifyPasswordReset, notifyVerificationCode } = require('../utils/emailService');

// ... existing methods ...

// FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found with that email" });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        await user.save();

        // Send email
        await notifyPasswordReset(user.email, user.name, resetToken);

        // Also log to console for development ease
        console.log('\n=============================================');
        console.log('🔐 PASSWORD RESET TOKEN GENERATED');
        console.log(`Email: ${user.email}`);
        console.log(`Token: ${resetToken}`);
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        console.log(`Reset Link: ${clientUrl}/reset-password?token=${resetToken}`);
        console.log('=============================================\n');

        res.json({
            message: "If an account exists with that email, a password reset link has been sent."
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ 
                message: "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character." 
            });
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired reset token" });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.json({ message: "Password has been reset successfully" });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// REGISTER
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // validation
        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // password complexity check
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ 
                message: "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character." 
            });
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // generate 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            verificationCode
        });

        // Log code for development
        console.log('\n=============================================');
        console.log('📧 EMAIL VERIFICATION CODE');
        console.log(`User: ${user.name} (${user.email})`);
        console.log(`Code: ${verificationCode}`);
        console.log('=============================================\n');

        // Send verification code via email
        await notifyVerificationCode(user.email, user.name, verificationCode);

        res.status(201).json({
            message: "User created successfully. Please verify your email.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified
            }
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GOOGLE LOGIN
exports.googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;
        
        if (!credential) {
            return res.status(400).json({ message: "No Google token provided" });
        }

        // Fetch user info from Google using the access token
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${credential}` }
        });

        if (!response.ok) {
            return res.status(400).json({ message: "Invalid Google token" });
        }

        const payload = await response.json();
        const { email, name, picture, email_verified } = payload;

        if (!email_verified) {
            return res.status(400).json({ message: "Google email not verified" });
        }

        let user = await User.findOne({ email });

        if (!user) {
            // Create a random strong password for Google signups
            const randomPassword = crypto.randomBytes(16).toString('hex') + 'A1!';
            const hashedPassword = await bcrypt.hash(randomPassword, 10);

            user = await User.create({
                name,
                email,
                password: hashedPassword,
                isEmailVerified: true,
                profilePicture: picture,
                bio: "Joined via Google"
            });
        }

        if (user.isSuspended) {
            return res.status(403).json({ message: "Account suspended. Contact admin." });
        }

        // Generate JWT
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: "JWT secret not set" });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profilePicture: user.profilePicture
            }
        });

    } catch (err) {
        console.error("Google Auth Error:", err);
        res.status(500).json({ message: err.message });
    }
};

// LOGIN
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // validation
        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        if (user.isSuspended) {
            return res.status(403).json({ message: "Account suspended. Contact admin." });
        }

        // compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // check JWT secret
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: "JWT secret not set" });
        }

        // create token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profilePicture: user.profilePicture
            }
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// LOGOUT
exports.logout = async (req, res) => {
    // JWT is stateless so logout is handled client-side by clearing the token
    res.json({ message: "Logged out successfully" });
};

// GET ME
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(401).json({ message: "User not found, please re-authenticate" });
        }
        res.json({ user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET USER PROFILE (PUBLIC)
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('name bio averageRating isEmailVerified createdAt');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// UPDATE PROFILE
exports.updateProfile = async (req, res) => {
    try {
        const { name, bio, phone } = req.body;

        // Handle emergencyContact from FormData (bracket notation) or plain JSON
        let emergencyContact = req.body.emergencyContact;
        if (!emergencyContact && req.body['emergencyContact[name]'] !== undefined) {
            emergencyContact = {
                name: req.body['emergencyContact[name]'] || '',
                phone: req.body['emergencyContact[phone]'] || ''
            };
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Handle profile picture upload
        if (req.file) {
            user.profilePicture = req.file.path || `/uploads/${req.file.filename}`;
        }

        // Enforce profile picture as compulsory if user doesn't have one yet
        if (!user.profilePicture && !req.file) {
            return res.status(400).json({ 
                message: "A profile picture is required. Please upload one.",
                requiresProfilePicture: true
            });
        }

        // 1. Name Validation
        if (name) {
            if (name.trim().length < 2 || name.trim().length > 50) {
                return res.status(400).json({ message: "Name must be between 2 and 50 characters" });
            }
            user.name = name.trim();
        }

        // 2. Bio Validation
        if (bio !== undefined) {
            if (bio.length > 200) {
                return res.status(400).json({ message: "Bio cannot exceed 200 characters" });
            }
            user.bio = bio;
        }

        // 3. Phone Validation (Basic)
        const phoneRegex = /^\+?[0-9]{10,15}$/;
        if (phone !== undefined && phone !== "") {
            if (!phoneRegex.test(phone)) {
                return res.status(400).json({ message: "Invalid phone number format. Use 10-15 digits." });
            }
            user.phone = phone;
        }

        // 4. Emergency Contact Validation
        if (emergencyContact) {
            if (emergencyContact.name) {
                if (emergencyContact.name.trim().length < 2 || emergencyContact.name.trim().length > 50) {
                    return res.status(400).json({ message: "Emergency contact name must be 2-50 characters" });
                }
            }
            if (emergencyContact.phone) {
                if (!phoneRegex.test(emergencyContact.phone)) {
                    return res.status(400).json({ message: "Invalid emergency phone format. Use 10-15 digits." });
                }
            }
            
            user.emergencyContact = {
                name: emergencyContact.name || (user.emergencyContact ? user.emergencyContact.name : ""),
                phone: emergencyContact.phone || (user.emergencyContact ? user.emergencyContact.phone : "")
            };
        }

        await user.save();

        res.json({
            message: "Profile updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                bio: user.bio,
                phone: user.phone,
                profilePicture: user.profilePicture,
                isEmailVerified: user.isEmailVerified,
                emergencyContact: user.emergencyContact
            }
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// UPDATE PASSWORD
exports.updatePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: "Please provide old and new password" });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Incorrect old password" });
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ 
                message: "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character." 
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.json({ message: "Password updated successfully" });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// VERIFY EMAIL
exports.verifyEmail = async (req, res) => {
    try {
        const { email, code } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.isEmailVerified) return res.status(400).json({ message: "Email already verified" });

        if (user.verificationCode !== code) {
            return res.status(400).json({ message: "Invalid verification code" });
        }

        user.isEmailVerified = true;
        user.verificationCode = undefined;
        await user.save();

        res.json({ message: "Email verified successfully", isEmailVerified: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// RESEND VERIFICATION CODE
exports.resendCode = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.isEmailVerified) return res.status(400).json({ message: "Email already verified" });

        const newCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationCode = newCode;
        await user.save();

        console.log('\n=============================================');
        console.log('📧 RESENT VERIFICATION CODE');
        console.log(`Email: ${user.email}`);
        console.log(`Code: ${newCode}`);
        console.log('=============================================\n');

        // Send verification code via email
        await notifyVerificationCode(user.email, user.name, newCode);

        res.json({ message: "Verification code resent" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};