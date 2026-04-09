import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Load .env relative to the lms root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function verifySMTP() {
  console.log('Testing SMTP connection with following config:');
  console.log('Host:', process.env.SMTP_HOST);
  console.log('Port:', process.env.SMTP_PORT);
  console.log('Secure:', process.env.SMTP_SECURE);
  console.log('User:', process.env.SMTP_USER ? '***' : 'Not Set');

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('❌ Missing required SMTP environment variables!');
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    const success = await transporter.verify();
    if (success) {
      console.log('✅ SMTP connection successful and ready to take messages!');
    } else {
      console.error('❌ SMTP connection failed unexpectedly without throwing.');
    }
  } catch (error) {
    console.error('❌ SMTP Connection Error:');
    console.error(error);
  }
}

verifySMTP();
