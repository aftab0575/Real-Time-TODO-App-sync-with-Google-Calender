import User from '../models/User.js';
import pkg from 'bcryptjs';
const { hash, compare } = pkg;

import pkgg from 'jsonwebtoken';
const { sign } = pkgg;

export async function signup(req, res) {
  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await hash(password, 10);
    user = new User({ name, email, password: hashedPassword });
    await user.save();

    const token = sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user: { name: user.name, email: user.email }, token });

  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ user: { name: user.name, email: user.email }, token });

  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}
