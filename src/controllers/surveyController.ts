import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Survey from '../models/Survey';
import ResponseModel from '../models/Response';

interface AuthRequest extends Request {
  userId?: string;
}

export const createSurvey = async (req: Request, res: Response) => {
  try {
    console.log('Creating survey with data:', JSON.stringify(req.body, null, 2));
    console.log('User ID:', (req as AuthRequest).userId);
    
    // If no expiration date, ensure both fields are null/false
    if (req.body.expirationDate === null) {
      req.body.isExpired = false;
      req.body.expiresAt = null;
    }
    
    const survey = new Survey({ 
      ...req.body, 
      userId: (req as AuthRequest).userId 
    });
    await survey.save();
    
    console.log('Survey created successfully:', survey._id);
    res.status(201).json(survey);
  } catch (err: any) {
    console.error('Create survey error:', err);
    console.error('Error details:', err.message);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        msg: 'Validation error', 
        errors: err.errors 
      });
    }
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

export const getSurveys = async (req: Request, res: Response) => {
  try {
    const surveys = await Survey.find({ 
      userId: (req as AuthRequest).userId 
    }).sort({ createdAt: -1 });
    
    // Get response counts for each survey
    const surveysWithCounts = await Promise.all(
      surveys.map(async (survey) => {
        const responseCount = await ResponseModel.countDocuments({ 
          surveyId: survey._id 
        });
        return {
          ...survey.toObject(),
          responseCount
        };
      })
    );
    
    res.json(surveysWithCounts);
  } catch (err) {
    console.error('Get surveys error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const getSurvey = async (req: Request, res: Response) => {
  try {
    const survey = await Survey.findOne({
      _id: req.params.id,
      userId: (req as AuthRequest).userId
    });
    
    if (!survey) {
      return res.status(404).json({ msg: 'Survey not found' });
    }
    
    res.json(survey);
  } catch (err) {
    console.error('Get survey error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const getPublicSurvey = async (req: Request, res: Response) => {
  try {
    // Set cache control headers to prevent browser caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Validate if the ID is a valid MongoDB ObjectID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: 'Invalid survey ID' });
    }

    const survey = await Survey.findById(req.params.id);
    
    if (!survey) {
      return res.status(404).json({ msg: 'Survey not found' });
    }

    if (!survey.active) {
      return res.status(400).json({ msg: 'Survey is not active' });
    }

    // Check if survey has expired (server-side enforcement)
    const now = new Date();
    
    // Check expiresAt field first (newer field)
    if (survey.expiresAt && now > new Date(survey.expiresAt)) {
      // Auto-mark as expired
      if (!survey.isExpired) {
        survey.isExpired = true;
        await survey.save();
      }

      return res.status(410).json({ 
        msg: 'Survey has expired',
        expired: true,
        expirationAction: survey.expirationAction,
        expirationMessage: survey.expirationMessage,
        redirectUrl: survey.redirectUrl,
        expiresAt: survey.expiresAt
      });
    }

    // Fallback check for old expirationDate field
    if (survey.expirationDate && new Date() > new Date(survey.expirationDate)) {
      return res.status(410).json({ 
        msg: 'Survey has expired',
        expired: true,
        expirationDate: survey.expirationDate
      });
    }
    
    // If survey was previously marked expired but expiration date is now null, unmark it
    if (survey.isExpired && !survey.expiresAt && !survey.expirationDate) {
      survey.isExpired = false;
      await survey.save();
    }
    
    // If survey requires authentication, ensure user is authenticated (optionalAuth middleware sets userId)
    const userId = (req as AuthRequest).userId;
    if (survey.requireAuth && !userId) {
      return res.status(401).json({ msg: 'Authentication required to access this survey' });
    }
    
    res.json(survey);
  } catch (err) {
    console.error('Get public survey error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const updateSurvey = async (req: Request, res: Response) => {
  try {
    // If expirationDate is explicitly set to null, also clear isExpired flag
    if (req.body.expirationDate === null) {
      req.body.isExpired = false;
      req.body.expiresAt = null;
    }
    
    const survey = await Survey.findOneAndUpdate(
      { _id: req.params.id, userId: (req as AuthRequest).userId },
      req.body,
      { new: true }
    );
    
    if (!survey) {
      return res.status(404).json({ msg: 'Survey not found' });
    }
    
    res.json(survey);
  } catch (err) {
    console.error('Update survey error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const deleteSurvey = async (req: Request, res: Response) => {
  try {
    const survey = await Survey.findOneAndDelete({
      _id: req.params.id,
      userId: (req as AuthRequest).userId
    });
    
    if (!survey) {
      return res.status(404).json({ msg: 'Survey not found' });
    }
    
    res.json({ msg: 'Survey deleted successfully' });
  } catch (err) {
    console.error('Delete survey error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};
