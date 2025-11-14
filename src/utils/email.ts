import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html: html || text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email error:', error);
    throw error;
  }
};

export const sendSurveyNotification = async (email: string, surveyTitle: string, surveyId: string) => {
  const subject = `New Response: ${surveyTitle}`;
  const text = `A new response has been submitted to your survey "${surveyTitle}". View the analytics at: ${process.env.FRONTEND_URL}/admin/analytics/${surveyId}`;
  const html = `
    <h2>New Survey Response</h2>
    <p>A new response has been submitted to your survey <strong>"${surveyTitle}"</strong>.</p>
    <p><a href="${process.env.FRONTEND_URL}/admin/analytics/${surveyId}">View Analytics</a></p>
  `;
  
  return sendEmail(email, subject, text, html);
};
