import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use true for port 465, false for port 587
  auth: {
    user: process.env.APP_USER,
    pass: process.env.APP_PASS,
  },
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins: [process.env.APP_URL!],
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "USER",
        required: false,
      },
      phone: {
        type: "string",
        required: false,
      },
      status: {
        type: "string",
        defaultValue: "ACTIVE",
        required: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url, token }, request) => {
      try {
        const verificationUrl = `${process.env.APP_URL}/verify-email?token=${token}`;
        const info = await transporter.sendMail({
          from: `"Prisma Blog" <${process.env.APP_USER}>`,
          to: user.email,
          subject: "Please verify your email",
          html: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Email Verification</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
        font-family: Arial, Helvetica, sans-serif;
      }
      .container {
        max-width: 600px;
        margin: 40px auto;
        background: #ffffff;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      }
      .header {
        background: linear-gradient(135deg, #4f46e5, #6366f1);
        padding: 24px;
        text-align: center;
        color: #ffffff;
      }
      .header h1 {
        margin: 0;
        font-size: 24px;
      }
      .content {
        padding: 32px;
        color: #333333;
        line-height: 1.6;
      }
      .content h2 {
        margin-top: 0;
        font-size: 22px;
      }
      .button-wrapper {
        text-align: center;
        margin: 32px 0;
      }
      .verify-button {
        display: inline-block;
        padding: 14px 32px;
        background-color: #4f46e5;
        color: #ffffff !important;
        text-decoration: none;
        border-radius: 9999px;
        font-size: 16px;
        font-weight: bold;
      }
      .verify-button:hover {
        background-color: #4338ca;
      }
      .footer {
        padding: 20px;
        text-align: center;
        font-size: 13px;
        color: #777777;
        background-color: #fafafa;
      }
      .link {
        word-break: break-all;
        color: #4f46e5;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Prisma Blog</h1>
      </div>

      <div class="content">
        <h2>Verify your email address</h2>
        <p>
          Thanks for signing up for <strong>Prisma Blog</strong>!  
          Please confirm your email address by clicking the button below.
        </p>

        <div class="button-wrapper">
          <a
            href="${verificationUrl}"
            target="_blank"
            class="verify-button"
          >
            Verify Email
          </a>
        </div>

        <p>
          If the button doesnt work, copy and paste the following link into your browser:
        </p>
        <p class="link">"${verificationUrl}"</p>

        <p>
          This link will expire for security reasons.  
          If you didn’t create an account, you can safely ignore this email.
        </p>
      </div>

      <div class="footer">
        © 2026 Prisma Blog. All rights reserved.
      </div>
    </div>
  </body>
</html>
`,
        });

        console.log("Message sent:", info.messageId);
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
  },

  socialProviders: {
    google: {
      accessType: "offline",
      prompt: "select_account consent",
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});
