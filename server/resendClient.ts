// Resend email client integration
import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return { apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email };
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
export async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

export async function sendOwnerAuthorizationEmail(
  ownerEmail: string,
  ownerName: string,
  tenantName: string,
  propertyAddress: string,
  authorizationToken: string
): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : process.env.REPLIT_DOMAINS
        ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
        : 'http://localhost:5000';
    
    const authorizationLink = `${baseUrl}/authorize/${authorizationToken}`;
    
    const { data, error } = await client.emails.send({
      from: fromEmail || 'Novy <noreply@resend.dev>',
      to: ownerEmail,
      subject: `Lease Transfer Authorization Request - ${propertyAddress}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3b82f6; margin: 0;">Novy</h1>
            <p style="color: #64748b; margin: 5px 0 0 0;">Lease Transfer Marketplace</p>
          </div>
          
          <div style="background-color: #f8fafc; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
            <h2 style="margin-top: 0; color: #1e293b;">Hello ${ownerName || 'Property Owner'},</h2>
            
            <p>Your tenant, <strong>${tenantName}</strong>, has requested to list the following property for lease transfer on Novy:</p>
            
            <div style="background-color: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0; font-weight: 600; color: #1e293b;">${propertyAddress}</p>
            </div>
            
            <p>As the property owner/manager, your authorization is required before this listing can go live on our platform.</p>
            
            <p><strong>Important:</strong> This authorization link can only be used once and expires in 7 days.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${authorizationLink}" style="display: inline-block; background-color: #3b82f6; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600;">Review & Authorize Listing</a>
            </div>
            
            <p style="font-size: 14px; color: #64748b;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="font-size: 12px; color: #3b82f6; word-break: break-all;">${authorizationLink}</p>
          </div>
          
          <div style="text-align: center; font-size: 12px; color: #94a3b8;">
            <p>Novy is a lease-transfer marketplace. We are not a real estate broker and do not negotiate rent.</p>
            <p>&copy; ${new Date().getFullYear()} Novy. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Failed to send owner authorization email:', error);
      return false;
    }

    console.log('Owner authorization email sent successfully:', data?.id);
    return true;
  } catch (error) {
    console.error('Error sending owner authorization email:', error);
    return false;
  }
}
