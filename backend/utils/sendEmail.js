import nodemailer from 'nodemailer';
import User from '../models/User.js';


// Create transporter
const createTransporter = () => {
 return nodemailer.createTransport({
  service: 'gmail',
  auth: {
   user: process.env.EMAIL_USER,
   pass: process.env.EMAIL_PASS,
  },
 });
};

// Email templates
const emailTemplates = {
 welcome: (name) => ({
  subject: 'Welcome to NutriDeliver - Your Healthy Food Delivery Partner!',
  html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2E8B57;">Welcome to NutriDeliver, ${name}! 🎉</h2>
        <p>We're excited to have you on board. Get ready to discover delicious and healthy food options delivered right to your doorstep.</p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2E8B57;">What you can do:</h3>
          <ul>
            <li>Browse healthy restaurants and menus</li>
            <li>Track your orders in real-time</li>
            <li>Set dietary preferences and calorie goals</li>
            <li>Earn loyalty points with every order</li>
          </ul>
        </div>
        <p>Start exploring healthy food options now!</p>
        <a href="${process.env.CLIENT_URL}" style="background: #2E8B57; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Start Ordering</a>
        <p style="margin-top: 30px; color: #666; font-size: 14px;">
          If you have any questions, feel free to contact our support team.
        </p>
      </div>
    `
 }),

 passwordReset: (name, otp) => ({
  subject: 'NutriDeliver - Password Reset OTP',
  html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2E8B57;">Password Reset OTP</h2>
        <p>Hello ${name},</p>
        <p>We received a request to reset your password for your NutriDeliver account.</p>
        
        <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 25px 0; text-align: center; border: 2px dashed #2E8B57;">
          <h3 style="color: #2E8B57; margin: 0 0 15px 0;">Your OTP Code</h3>
          <div style="font-size: 32px; font-weight: bold; color: #2E8B57; letter-spacing: 8px; background: white; padding: 15px; border-radius: 8px; display: inline-block;">
            ${otp}
          </div>
          <p style="color: #666; margin: 15px 0 0 0; font-size: 14px;">
            This OTP will expire in 10 minutes
          </p>
        </div>

        <p style="color: #ff6b6b; font-weight: bold;">
          ⚠️ Do not share this OTP with anyone.
        </p>
        
        <p>If you didn't request this reset, please ignore this email and ensure your account is secure.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">
            For security reasons, this OTP is valid for a single use only and will expire in 10 minutes.
          </p>
        </div>
      </div>
    `
 }),

 emailVerification: (name, otp) => ({
  subject: 'NutriDeliver - Verify Your Email Address',
  html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2E8B57;">Verify Your Email Address</h2>
        <p>Hello ${name},</p>
        <p>Thank you for registering with NutriDeliver! To complete your registration, please verify your email address using the OTP below.</p>
        
        <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 25px 0; text-align: center; border: 2px dashed #2E8B57;">
          <h3 style="color: #2E8B57; margin: 0 0 15px 0;">Verification OTP</h3>
          <div style="font-size: 32px; font-weight: bold; color: #2E8B57; letter-spacing: 8px; background: white; padding: 15px; border-radius: 8px; display: inline-block;">
            ${otp}
          </div>
          <p style="color: #666; margin: 15px 0 0 0; font-size: 14px;">
            This OTP will expire in 10 minutes
          </p>
        </div>

        <p style="color: #666;">
          Enter this OTP in the verification section of the NutriDeliver app to complete your registration.
        </p>

        <p style="color: #ff6b6b; font-weight: bold;">
          🔒 Keep this OTP confidential and do not share it with anyone.
        </p>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">
            If you didn't create an account with NutriDeliver, please disregard this email.
          </p>
        </div>
      </div>
    `
 }),

 orderConfirmation: (name, order) => ({
  subject: `NutriDeliver - Order Confirmation #${order.orderId}`,
  html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2E8B57;">Order Confirmed! 🎉</h2>
        <p>Hello ${name},</p>
        <p>Your order has been confirmed and is being prepared.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2E8B57;">Order Details:</h3>
          <p><strong>Order ID:</strong> ${order.orderId}</p>
          <p><strong>Restaurant:</strong> ${order.restaurantId.name}</p>
          <p><strong>Estimated Delivery:</strong> ${new Date(order.estimatedDelivery).toLocaleString()}</p>
          <p><strong>Total Amount:</strong> $${order.grandTotal}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/orders/${order._id}" style="background: #2E8B57; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Track Your Order</a>
        </div>

        <p style="color: #666; font-size: 14px;">
          Thank you for choosing NutriDeliver for your healthy food needs!
        </p>
      </div>
    `
 }),

 orderDelivered: (name, order) => ({
  subject: `NutriDeliver - Order Delivered #${order.orderId}`,
  html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2E8B57;">Order Delivered! ✅</h2>
        <p>Hello ${name},</p>
        <p>Your order has been successfully delivered. We hope you enjoy your healthy meal!</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2E8B57;">Order Summary:</h3>
          <p><strong>Order ID:</strong> ${order.orderId}</p>
          <p><strong>Restaurant:</strong> ${order.restaurantId.name}</p>
          <p><strong>Delivered At:</strong> ${new Date(order.deliveryDetails.deliveredAt).toLocaleString()}</p>
          <p><strong>Total Amount:</strong> $${order.grandTotal}</p>
        </div>

        <p>How was your experience? We'd love to hear your feedback!</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/orders/${order._id}/rate" style="background: #2E8B57; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Rate Your Order</a>
        </div>

        <p style="color: #666; font-size: 14px;">
          Thank you for choosing NutriDeliver!
        </p>
      </div>
    `
 }),

 riderAssigned: (name, order) => ({
  subject: `NutriDeliver - Rider Assigned to Your Order #${order.orderId}`,
  html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2E8B57;">Rider On The Way! 🚴</h2>
        <p>Hello ${name},</p>
        <p>A rider has been assigned to your order and is on the way to pick up your food.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2E8B57;">Order Update:</h3>
          <p><strong>Order ID:</strong> ${order.orderId}</p>
          <p><strong>Restaurant:</strong> ${order.restaurantId.name}</p>
          <p><strong>Status:</strong> Order Picked Up</p>
          <p><strong>Estimated Delivery:</strong> ${new Date(order.estimatedDelivery).toLocaleString()}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/orders/${order._id}" style="background: #2E8B57; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Track Delivery</a>
        </div>

        <p style="color: #666; font-size: 14px;">
          Your healthy meal is on its way!
        </p>
      </div>
    `
 })
};

// Send email function
export const sendEmail = async ({ email, subject, message, template, templateData }) => {
 try {
  // If in development, log email instead of sending
  if (process.env.NODE_ENV === 'development') {
   console.log('📧 Email would be sent:');
   console.log('To:', email);
   console.log('Subject:', subject);
   if (template) {
    console.log('Template:', template);
    console.log('Template Data:', templateData);
   } else {
    console.log('Message:', message);
   }
   // return { success: true, message: 'Email logged (development mode)' };
  }

  const transporter = createTransporter();

  let emailContent = { subject, html: message };


  // Use template if provided
  if (template && emailTemplates[template]) {
   emailContent = emailTemplates[template](...templateData);
  }



  const mailOptions = {
   from: `"NutriDeliver" <${process.env.EMAIL_USER}>`,
   to: email,
   subject: emailContent.subject,
   html: emailContent.html
  };


  await transporter.sendMail(mailOptions);


const user = await User.findOne({
 email
});
console.log("user", user);
  if (user) {
   user.passwordResetOTP = templateData[1];
   await user.save();
  }

  return { success: true, message: 'Email sent successfully' };
 } catch (error) {
  console.error('Email sending error:', error);
  throw new Error('Failed to send email');
 }
};

// Send bulk emails
export const sendBulkEmail = async (emails, subject, message) => {
 try {
  const transporter = createTransporter();

  const mailOptions = {
   from: `"NutriDeliver" <${process.env.EMAIL_USER}>`,
   bcc: emails, // Use BCC to protect recipient privacy
   subject,
   html: message
  };

  await transporter.sendMail(mailOptions);

  return { success: true, message: 'Bulk email sent successfully' };
 } catch (error) {
  console.error('Bulk email sending error:', error);
  throw new Error('Failed to send bulk email');
 }
};