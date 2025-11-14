import { Request, Response } from 'express';
import ResponseModel from '../models/Response';
import Survey from '../models/Survey';
import { io } from '../index';
const { Parser } = require('json2csv');
import crypto from 'crypto';

interface AuthRequest extends Request {
  userId?: string;
}

export const submitResponse = async (req: Request, res: Response) => {
  const { surveyId, answers } = req.body;
  
  try {
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({ msg: 'Survey not found' });
    }

    if (!survey.active) {
      return res.status(400).json({ msg: 'Survey is not active' });
    }

    // Check if authentication is required
    if (survey.requireAuth) {
      const userId = (req as AuthRequest).userId;
      if (!userId) {
        return res.status(401).json({ msg: 'Authentication required to submit this survey' });
      }
    }

    if (survey.expirationDate && new Date() > survey.expirationDate) {
      return res.status(400).json({ msg: 'Survey has expired' });
    }

    let ipHash;
    if (survey.preventDuplicates) {
      const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
      ipHash = crypto.createHash('sha256').update(String(ip)).digest('hex');
      
      const existing = await ResponseModel.findOne({ 
        surveyId, 
        ip: ipHash 
      });
      
      if (existing) {
        return res.status(400).json({ msg: 'You have already submitted a response to this survey' });
      }
    }

    const response = new ResponseModel({
      surveyId,
      answers,
      ip: ipHash
    });
    
    await response.save();

    // Real-time update via Socket.IO
    io.to(surveyId).emit('newResponse', { 
      surveyId,
      count: 1,
      timestamp: response.timestamp
    });

    res.status(201).json({ 
      msg: 'Response submitted successfully',
      responseId: response.id
    });
  } catch (err) {
    console.error('Submit response error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const getResponses = async (req: Request, res: Response) => {
  try {
    // Verify the survey belongs to the user
    const survey = await Survey.findOne({
      _id: req.params.surveyId,
      userId: (req as AuthRequest).userId
    });

    if (!survey) {
      return res.status(404).json({ msg: 'Survey not found' });
    }

    const responses = await ResponseModel.find({ 
      surveyId: req.params.surveyId 
    }).sort({ timestamp: -1 });
    
    res.json(responses);
  } catch (err) {
    console.error('Get responses error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const exportCSV = async (req: Request, res: Response) => {
  try {
    // Verify the survey belongs to the user
    const survey = await Survey.findOne({
      _id: req.params.surveyId,
      userId: (req as AuthRequest).userId
    });

    if (!survey) {
      return res.status(404).json({ msg: 'Survey not found' });
    }

    const responses = await ResponseModel.find({ 
      surveyId: req.params.surveyId 
    });

    if (responses.length === 0) {
      return res.status(404).json({ msg: 'No responses found' });
    }

    // Flatten responses for CSV
    const flattenedData = responses.map(response => {
      const row: any = {
        responseId: response.id,
        timestamp: response.timestamp
      };

      response.answers.forEach(answer => {
        const question = survey.questions.find(q => (q as any)._id?.toString() === answer.questionId);
        const questionText = question ? (question.question || (question as any).text || 'Unknown Question') : answer.questionId;
        
        // Format answer based on type
        let formattedAnswer = answer.answer;
        if (Array.isArray(answer.answer)) {
          formattedAnswer = answer.answer.join(', ');
        } else if (typeof answer.answer === 'object' && answer.answer !== null) {
          formattedAnswer = JSON.stringify(answer.answer);
        }
        
        row[questionText] = formattedAnswer || '';
      });

      return row;
    });

    const parser = new Parser();
    const csv = parser.parse(flattenedData);
    
    res.header('Content-Type', 'text/csv');
    res.attachment(`survey-${req.params.surveyId}-responses.csv`);
    res.send(csv);
  } catch (err) {
    console.error('Export CSV error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};
