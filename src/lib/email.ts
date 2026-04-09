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

function escapeHtml(unsafe: string) {
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
      <p>Hello ${escapeHtml(params.employeeName)},</p>
      <p>
        Your <strong>${escapeHtml(params.leaveType)}</strong> leave request from
        <strong>${escapeHtml(params.startDate)}</strong> to
        <strong>${escapeHtml(params.endDate)}</strong> has been approved.
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
      <p>Hello ${escapeHtml(params.employeeName)},</p>
      <p>
        Your <strong>${escapeHtml(params.leaveType)}</strong> leave request from
        <strong>${escapeHtml(params.startDate)}</strong> to
        <strong>${escapeHtml(params.endDate)}</strong> was not approved.
      </p>
      ${
        params.reason
          ? `<p><strong>Reason:</strong> ${escapeHtml(params.reason)}</p>`
          : ''
      }
      <p>Regards,<br />LMS Team</p>
    </div>
  `
}