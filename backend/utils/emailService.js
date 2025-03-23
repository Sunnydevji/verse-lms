const nodemailer = require('nodemailer');

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Send email
const sendEmail = async (options) => {
  try {
    const message = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html
    };
    
    const info = await transporter.sendMail(message);
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
};

// Send account approval notification
const sendApprovalEmail = async (student) => {
  try {
    return await sendEmail({
      email: student.email,
      subject: 'Account Approval - Learning Management System',
      html: `
        <h1>Account Approved</h1>
        <p>Dear ${student.name},</p>
        <p>Your account has been approved. You can now log in to the Learning Management System and access your class materials.</p>
        <p>Regards,<br>LMS Administration</p>
      `
    });
  } catch (error) {
    console.error('Approval email error:', error);
    return false;
  }
};

// Send new material notification
const sendMaterialNotification = async (students, material, subject) => {
  try {
    const emailPromises = students.map(student => {
      return sendEmail({
        email: student.email,
        subject: `New Material Added - ${subject.name}`,
        html: `
          <h1>New Learning Material Available</h1>
          <p>Dear ${student.name},</p>
          <p>A new ${material.type} titled "${material.title}" has been added to your ${subject.name} course.</p>
          <p>Login to the Learning Management System to access it.</p>
          <p>Regards,<br>LMS Administration</p>
        `
      });
    });
    
    await Promise.all(emailPromises);
    return true;
  } catch (error) {
    console.error('Material notification email error:', error);
    return false;
  }
};

module.exports = {
  sendEmail,
  sendApprovalEmail,
  sendMaterialNotification
};