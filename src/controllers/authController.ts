import { Request, Response } from 'express';
import User from '../models/User';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';

interface AuthRequest extends Request {
  userId?: string;
}

export const signup = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({ email, password });
    await user.save();

    const token = jwt.sign(
      { userId: user.id }, 
      process.env.JWT_SECRET as string, 
      { expiresIn: '7d' }
    );
    
    res.cookie('token', token, { 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    // Return token in body as well so frontend can store it if desired
    res.status(201).json({ 
      msg: 'User created successfully',
      token,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id }, 
      process.env.JWT_SECRET as string, 
      { expiresIn: '7d' }
    );
    
    res.cookie('token', token, { 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    // Return token in body for client-side usage
    res.json({ 
      msg: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ msg: 'Logged out successfully' });
};

export const checkAuth = async (req: Request, res: Response) => {
  try {
    // Accept token from cookie OR Authorization header (Bearer token)
    let token = req.cookies?.token;
    if (!token) {
      const authHeader = req.header('Authorization') || req.header('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.replace('Bearer ', '');
      }
    }

    if (!token) {
      return res.status(401).json({ authenticated: false });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ authenticated: false });
    }

    res.json({ 
      authenticated: true,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (err) {
    res.status(401).json({ authenticated: false });
  }
};
