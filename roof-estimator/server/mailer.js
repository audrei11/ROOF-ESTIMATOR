require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Gmail App Password
      },
    });
  }
  return transporter;
}

/* ══════════════════════════════════════════════════════════════════
   Send proposal email to customer
   ══════════════════════════════════════════════════════════════════ */
async function sendProposalEmail(proposal) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email not configured. Add EMAIL_USER and EMAIL_PASS to server/.env');
  }
  if (!proposal.customer_email) {
    throw new Error('Customer has no email address on this proposal.');
  }

  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const proposalLink = `${appUrl}/p/${proposal.id}`;

  // Calculate total from options
  let grandTotal = 0;
  const options = Array.isArray(proposal.options) ? proposal.options : [];
  options.forEach(opt => {
    opt.lineItems?.forEach(item => { grandTotal += item.total || 0; });
  });
  const formattedTotal = grandTotal > 0
    ? `$${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : null;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin: 0; padding: 0; background: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrap { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); padding: 36px 40px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }
    .header p { color: #94a3b8; margin: 6px 0 0; font-size: 14px; }
    .body { padding: 40px; }
    .greeting { font-size: 18px; font-weight: 600; color: #0f172a; margin: 0 0 16px; }
    .text { font-size: 15px; color: #475569; line-height: 1.7; margin: 0 0 24px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px; margin: 24px 0; }
    .card-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .card-row:last-child { border-bottom: none; }
    .card-label { color: #64748b; }
    .card-value { color: #0f172a; font-weight: 500; }
    .total-row { margin-top: 12px; padding-top: 12px; border-top: 2px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 16px; font-weight: 700; color: #0f172a; }
    .btn-wrap { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff !important; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; letter-spacing: 0.3px; }
    .note { font-size: 13px; color: #94a3b8; text-align: center; margin-top: 8px; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 40px; text-align: center; }
    .footer p { font-size: 13px; color: #94a3b8; margin: 4px 0; }
    .footer a { color: #2563eb; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>Ahjin Roofing System</h1>
      <p>Your Roofing Proposal is Ready</p>
    </div>
    <div class="body">
      <p class="greeting">Hello, ${proposal.customer_name || 'Valued Customer'}!</p>
      <p class="text">
        Thank you for considering Ahjin Roofing System. We have prepared a detailed roofing proposal for your property.
        Please review the details below and click the button to view and sign your proposal online.
      </p>

      <div class="card">
        <div class="card-row">
          <span class="card-label">Property</span>
          <span class="card-value">${proposal.address || '-'}</span>
        </div>
        ${proposal.pitch ? `<div class="card-row">
          <span class="card-label">Roof Pitch</span>
          <span class="card-value">${proposal.pitch}</span>
        </div>` : ''}
        ${proposal.total_area ? `<div class="card-row">
          <span class="card-label">Total Area</span>
          <span class="card-value">${proposal.total_area.toLocaleString()} sq ft</span>
        </div>` : ''}
        ${options.length > 0 ? options.map(opt => `<div class="card-row">
          <span class="card-label">Option: ${opt.name || 'Package'}</span>
          <span class="card-value">${opt.lineItems?.length || 0} items</span>
        </div>`).join('') : ''}
        ${formattedTotal ? `<div class="total-row">
          <span>Estimated Total</span>
          <span>${formattedTotal}</span>
        </div>` : ''}
      </div>

      <div class="btn-wrap">
        <a href="${proposalLink}" class="btn">View & Sign Proposal</a>
        <p class="note">Or copy this link: <a href="${proposalLink}" style="color:#2563eb;">${proposalLink}</a></p>
      </div>

      <p class="text">
        If you have any questions, feel free to reply to this email or call us directly.
        We look forward to working with you!
      </p>
    </div>
    <div class="footer">
      <p><strong>Ahjin Roofing System</strong></p>
      <p>This proposal was sent via <a href="${appUrl}">Ahjin Roofing System</a></p>
    </div>
  </div>
</body>
</html>`;

  await getTransporter().sendMail({
    from: `"Ahjin Roofing System" <${process.env.EMAIL_USER}>`,
    to: proposal.customer_email,
    subject: `Your Roofing Proposal — ${proposal.address || 'Ahjin Roofing System'}`,
    html,
  });
}

module.exports = { sendProposalEmail };
