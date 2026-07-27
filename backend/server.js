const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log('MongoDB Error:', err));

// User Schema
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  refreshToken: String // for two-token system
});
const User = mongoose.model('User', UserSchema);

// Token functions
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// SIGNUP API
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'Signup successful' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// LOGIN API - returns 2 tokens now
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
    user.refreshToken = refreshToken; // save in DB
    await user.save();
    
    res.json({ 
      accessToken, 
      refreshToken,
      user: { id: user._id, name: user.name, email: user.email } 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// REFRESH TOKEN API
app.post('/api/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: 'No token' });
  
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }
    
    const newAccessToken = generateAccessToken(user._id);
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(403).json({ message: 'Invalid token' });
  }
});

app.get('/', (req, res) => res.send("Gath Backend Running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));