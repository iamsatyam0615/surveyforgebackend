import mongoose, { Document, Schema } from 'mongoose';

interface IAnswer {
  questionId: string;
  answer: any;
}

export interface IResponse extends Document {
  surveyId: mongoose.Types.ObjectId;
  answers: IAnswer[];
  timestamp: Date;
  ip?: string;
}

const answerSchema = new Schema<IAnswer>({
  questionId: { 
    type: String, 
    required: true 
  },
  answer: Schema.Types.Mixed
});

const responseSchema = new Schema<IResponse>({
  surveyId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Survey', 
    required: true 
  },
  answers: [answerSchema],
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  ip: String
});

export default mongoose.model<IResponse>('Response', responseSchema);
