import mongoose, { Document, Schema } from 'mongoose';

interface IQuestion {
  type: 'text' | 'paragraph' | 'multiple' | 'radio' | 'dropdown' | 'rating' | 'scale' | 'date' | 'time';
  question: string;
  text?: string; // Alternative to question
  description?: string;
  options?: string[];
  required: boolean;
  min?: number; // For scale questions
  max?: number; // For scale questions
  conditional?: {
    questionId: string;
    value: string;
  };
}

interface ITheme {
  name: string;
  primary: string;
  background: string;
  accent: string;
  text: string;
  font: string;
  rounded: string;
  buttonStyle: 'filled' | 'outline' | 'soft';
  gradient: boolean;
  gradientFrom?: string;
  gradientTo?: string;
  pattern?: 'dots' | 'waves' | 'none';
}

export interface ISurvey extends Document {
  title: string;
  description?: string;
  questions: IQuestion[];
  expirationDate?: Date;
  logo?: string;
  userId: mongoose.Types.ObjectId;
  active: boolean;
  preventDuplicates: boolean;
  requireAuth: boolean;
  theme?: ITheme;
  expiresAt?: Date;
  isExpired: boolean;
  expirationAction: 'show_message' | 'redirect';
  expirationMessage?: string;
  redirectUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestion>({
  type: { 
    type: String, 
    enum: ['text', 'paragraph', 'multiple', 'radio', 'dropdown', 'rating', 'scale', 'date', 'time'], 
    required: true 
  },
  question: { 
    type: String, 
    required: true 
  },
  text: String, // Alternative to question
  description: String,
  options: [String],
  required: { 
    type: Boolean, 
    default: false 
  },
  min: Number, // For scale questions
  max: Number, // For scale questions
  conditional: {
    questionId: String,
    value: String
  }
});

const themeSchema = new Schema<ITheme>({
  name: String,
  primary: String,
  background: String,
  accent: String,
  text: String,
  font: String,
  rounded: String,
  buttonStyle: { 
    type: String, 
    enum: ['filled', 'outline', 'soft'] 
  },
  gradient: Boolean,
  gradientFrom: String,
  gradientTo: String,
  pattern: { 
    type: String, 
    enum: ['dots', 'waves', 'none'] 
  }
});

const surveySchema = new Schema<ISurvey>({
  title: { 
    type: String, 
    required: true 
  },
  description: String,
  questions: [questionSchema],
  expirationDate: Date,
  logo: String,
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  active: { 
    type: Boolean, 
    default: true 
  },
  preventDuplicates: { 
    type: Boolean, 
    default: false 
  },
  requireAuth: {
    type: Boolean,
    default: false
  },
  theme: themeSchema,
  expiresAt: {
    type: Date,
    default: null
  },
  isExpired: {
    type: Boolean,
    default: false
  },
  expirationAction: {
    type: String,
    enum: ['show_message', 'redirect'],
    default: 'show_message'
  },
  expirationMessage: {
    type: String,
    default: 'This survey is no longer accepting responses.'
  },
  redirectUrl: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

export default mongoose.model<ISurvey>('Survey', surveySchema);
