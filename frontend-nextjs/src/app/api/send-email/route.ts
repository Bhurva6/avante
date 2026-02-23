import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Email configuration
const SENDER_EMAIL = 'bhurvaxsharma.india@gmail.com';

// Create email transporter
const createTransporter = () => {
  // Note: In production, use environment variables for credentials
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || SENDER_EMAIL,
      pass: process.env.EMAIL_PASSWORD || '' // Set in environment variables
    }
  });
};

// Email templates
const createApprovalEmail = (email: string, states: string[], password?: string) => {
  const statesFormatted = states.length > 0 ? states.join(', ') : 'All States';
  
  return {
    from: SENDER_EMAIL,
    to: email,
    subject: '✅ Access Request Approved - Orthopedic Implant Analytics Dashboard',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .success-icon { font-size: 48px; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="success-icon">🎉</div>
            <h1>Access Request Approved!</h1>
          </div>
          <div class="content">
            <p>Dear User,</p>
            <p>Great news! Your access request to the <strong>Orthopedic Implant Analytics Dashboard</strong> has been approved.</p>
            
            <div class="credentials">
              <h3 style="color: #10b981; margin-top: 0;">📧 Your Access Details</h3>
              <p><strong>Email:</strong> ${email}</p>
              ${password ? `<p><strong>Password:</strong> ${password}</p>` : ''}
              <p><strong>State Access:</strong> ${statesFormatted}</p>
            </div>
            
            <p>You can now log in to the dashboard and view data for your assigned states.</p>
            
            <center>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" class="button">
                Login to Dashboard
              </a>
            </center>
            
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <strong>Need Help?</strong><br>
              If you have any questions or need assistance, please contact your administrator.
            </p>
          </div>
          <div class="footer">
            <p>This is an automated message from Orthopedic Implant Analytics Dashboard.</p>
            <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
};

const createRejectionEmail = (email: string, reason?: string) => {
  return {
    from: SENDER_EMAIL,
    to: email,
    subject: '❌ Access Request Update - Orthopedic Implant Analytics Dashboard',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .notice { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .icon { font-size: 48px; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon">📋</div>
            <h1>Access Request Update</h1>
          </div>
          <div class="content">
            <p>Dear User,</p>
            <p>Thank you for your interest in accessing the <strong>Orthopedic Implant Analytics Dashboard</strong>.</p>
            
            <div class="notice">
              <h3 style="color: #ef4444; margin-top: 0;">Request Status</h3>
              <p>Unfortunately, your access request has not been approved at this time.</p>
              ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            </div>
            
            <p>If you believe this is an error or would like to discuss your access requirements, please contact your administrator.</p>
            
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <strong>Need Assistance?</strong><br>
              Feel free to reach out to the dashboard administrator for more information.
            </p>
          </div>
          <div class="footer">
            <p>This is an automated message from Orthopedic Implant Analytics Dashboard.</p>
            <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, email, states, password, reason } = body;

    if (!type || !email) {
      return NextResponse.json(
        { message: 'Missing required fields: type and email' },
        { status: 400 }
      );
    }

    // Check if email password is configured
    if (!process.env.EMAIL_PASSWORD) {
      console.warn('Email password not configured. Email will not be sent.');
      return NextResponse.json(
        { 
          message: 'Email service not configured', 
          success: false,
          details: { email, type }
        },
        { status: 200 }
      );
    }

    const transporter = createTransporter();
    
    let mailOptions;
    if (type === 'approval') {
      mailOptions = createApprovalEmail(email, states || [], password);
    } else if (type === 'rejection') {
      mailOptions = createRejectionEmail(email, reason);
    } else {
      return NextResponse.json(
        { message: 'Invalid email type. Must be "approval" or "rejection"' },
        { status: 400 }
      );
    }

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      message: `${type === 'approval' ? 'Approval' : 'Rejection'} email sent successfully`,
      success: true,
      recipient: email
    });

  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { 
        message: 'Failed to send email', 
        error: error.message,
        success: false
      },
      { status: 500 }
    );
  }
}
