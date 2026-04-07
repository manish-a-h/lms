import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

type SendEmailInput = {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailInput) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[email] SMTP is not configured. Skipping email send.')
    return
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? 'LMS <no-reply@lms.local>',
    to,
    subject,
    html,
  })
}

export function leaveApprovedEmailTemplate(params: {
  employeeName: string
  leaveType: string
  startDate: string
  endDate: string
}) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
      <h2 style="color: #01696f;">Leave Approved</h2>
      <p>Hello ${params.employeeName},</p>
      <p>
        Your <strong>${params.leaveType}</strong> leave request from
        <strong>${params.startDate}</strong> to
        <strong>${params.endDate}</strong> has been approved.
      </p>
      <p>Regards,<br />LMS Team</p>
    </div>
  `
}

export function leaveRejectedEmailTemplate(params: {
  employeeName: string
  leaveType: string
  startDate: string
  endDate: string
  reason?: string
}) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
      <h2 style="color: #a12c7b;">Leave Request Update</h2>
      <p>Hello ${params.employeeName},</p>
      <p>
        Your <strong>${params.leaveType}</strong> leave request from
        <strong>${params.startDate}</strong> to
        <strong>${params.endDate}</strong> was not approved.
      </p>
      ${
        params.reason
          ? `<p><strong>Reason:</strong> ${params.reason}</p>`
          : ''
      }
      <p>Regards,<br />LMS Team</p>
    </div>
  `
}