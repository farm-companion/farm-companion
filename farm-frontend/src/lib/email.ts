// Email service for Farm Frontend
// PuredgeOS 3.0 Compliant Email Management

import { Resend } from 'resend'

// Initialize Resend client conditionally to avoid build-time errors
function getResend() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('RESEND_API_KEY not found, email service disabled')
    return null
  }
  return new Resend(apiKey)
}

// Email configuration
const EMAIL_CONFIG = {
  from: 'Farm Companion <hello@farmcompanion.co.uk>',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@farmcompanion.co.uk'
}

// Test email service
export async function testEmailService(): Promise<{ success: boolean; message: string }> {
  try {
    const resend = getResend()
    if (!resend) {
      return { success: false, message: 'Email service not configured' }
    }

    await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: EMAIL_CONFIG.adminEmail,
      subject: '🧪 Farm Companion Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #00C2B2;">Email Service Test</h2>
          <p>This is a test email from the Farm Companion photo system.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            If you received this email, the email service is working correctly.
          </p>
        </div>
      `
    })

    return { success: true, message: 'Test email sent successfully! Check your email and server logs.' }
  } catch (error) {
    console.error('Email test failed:', error)
    return { success: false, message: `Email test failed: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

// Send photo submission confirmation email
export async function sendPhotoSubmissionConfirmation(submission: any): Promise<void> {
  try {
    const resend = getResend()
    if (!resend) return

    await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: submission.submitterEmail,
      subject: '📸 Photo Submission Confirmation - Farm Companion',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Photo Submission Confirmation - Farm Companion</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fa; color: #1E1F23;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #00C2B2 0%, #00A896 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">📸 Photo Submission Received</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Thank you for sharing your farm experience!</p>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 40px 30px; border: 1px solid #e0e0e0; border-radius: 0 0 12px 12px;">
              <p style="font-size: 18px; color: #1E1F23; margin-bottom: 24px; line-height: 1.6;">Hello ${submission.submitterName},</p>
              
              <p style="font-size: 16px; color: #1E1F23; margin-bottom: 24px; line-height: 1.6;">
                Thank you for submitting a photo for <strong style="color: #00C2B2;">${submission.farmName}</strong> to Farm Companion! 
                We're excited to showcase your contribution to our community.
              </p>
              
              <!-- Submission Details Card -->
              <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 24px; border-radius: 12px; margin: 32px 0; border-left: 4px solid #00C2B2; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <h3 style="margin: 0 0 16px 0; color: #00C2B2; font-size: 20px; font-weight: 600;">Submission Details</h3>
                <div style="display: grid; gap: 12px;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 600; color: #1E1F23;">Farm:</span>
                    <span style="color: #1E1F23;">${submission.farmName}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <span style="font-weight: 600; color: #1E1F23;">Description:</span>
                    <span style="color: #1E1F23; text-align: right; max-width: 60%;">${submission.description}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 600; color: #1E1F23;">Submission ID:</span>
                    <code style="background: #e9ecef; padding: 4px 8px; border-radius: 6px; font-family: 'Monaco', 'Menlo', monospace; font-size: 12px; color: #1E1F23;">${submission.id}</code>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 600; color: #1E1F23;">Submitted:</span>
                    <span style="color: #1E1F23;">${new Date(submission.submittedAt).toLocaleDateString('en-GB', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                </div>
              </div>
              
              <!-- Next Steps -->
              <h3 style="color: #00C2B2; font-size: 20px; font-weight: 600; margin: 32px 0 16px 0;">What happens next?</h3>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <ol style="color: #1E1F23; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 8px;">Our team will review your photo for quality and appropriateness</li>
                  <li style="margin-bottom: 8px;">High-quality photos may be automatically approved</li>
                  <li style="margin-bottom: 8px;">Others will be reviewed within 24-48 hours</li>
                  <li style="margin-bottom: 0;">You'll receive an email notification of the decision</li>
                </ol>
              </div>
              
              <p style="font-size: 16px; color: #1E1F23; margin: 24px 0; line-height: 1.6;">
                If approved, your photo will appear on the farm's page for visitors to see and help others discover amazing farm experiences!
              </p>
              
              <!-- Action Card -->
              <div style="background: linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%); padding: 20px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #28a745; box-shadow: 0 2px 8px rgba(40,167,69,0.1);">
                <p style="margin: 0; color: #155724; font-weight: 500;">
                  <strong>Need to make changes?</strong> Reply to this email if you need to update your submission or have any questions.
                </p>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="https://farmcompanion.co.uk" style="background: linear-gradient(135deg, #00C2B2 0%, #00A896 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(0,194,178,0.3); transition: all 0.2s ease;">Visit Farm Companion</a>
              </div>
              
              <!-- Footer -->
              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 40px 0;">
              
              <div style="text-align: center; margin-bottom: 32px;">
                <p style="color: #666; font-size: 14px; margin: 0 0 8px 0;">
                  Best regards,<br>
                  <strong>The Farm Companion Team</strong>
                </p>
                <a href="mailto:hello@farmcompanion.co.uk" style="color: #00C2B2; text-decoration: none; font-weight: 500;">hello@farmcompanion.co.uk</a>
              </div>
              
              <!-- Privacy & Legal Section -->
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 32px; border: 1px solid #e0e0e0;">
                <h4 style="color: #1E1F23; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">Privacy & Legal Information</h4>
                <div style="font-size: 12px; color: #666; line-height: 1.5;">
                  <p style="margin: 0 0 8px 0;">
                    <strong>Data Protection:</strong> Your personal data is processed in accordance with our Privacy Policy and applicable data protection laws. 
                    We use your email address solely to communicate about your photo submission and provide service updates.
                  </p>
                  <p style="margin: 0 0 8px 0;">
                    <strong>Photo Usage:</strong> By submitting this photo, you grant Farm Companion a non-exclusive license to display the image on our platform. 
                    You retain ownership of your photo and can request removal at any time.
                  </p>
                  <p style="margin: 0 0 8px 0;">
                    <strong>Opt-out:</strong> You can unsubscribe from these notifications by replying with "UNSUBSCRIBE" or updating your preferences at 
                    <a href="https://farmcompanion.co.uk/privacy" style="color: #00C2B2;">farmcompanion.co.uk/privacy</a>.
                  </p>
                  <p style="margin: 0;">
                    <strong>Contact:</strong> For privacy concerns, contact our Data Protection Officer at 
                    <a href="mailto:privacy@farmcompanion.co.uk" style="color: #00C2B2;">privacy@farmcompanion.co.uk</a>.
                  </p>
                </div>
              </div>
              
              <!-- Company Footer -->
              <div style="text-align: center; margin-top: 24px; padding-top: 24px; border-top: 1px solid #e0e0e0;">
                <p style="color: #999; font-size: 11px; margin: 0;">
                  © ${new Date().getFullYear()} Farm Companion. All rights reserved.<br>
                  <a href="https://farmcompanion.co.uk/terms" style="color: #999;">Terms of Service</a> | 
                  <a href="https://farmcompanion.co.uk/privacy" style="color: #999;">Privacy Policy</a> | 
                  <a href="https://farmcompanion.co.uk/contact" style="color: #999;">Contact Us</a>
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    })

    console.log(`📧 Confirmation email sent to ${submission.submitterEmail}`)
  } catch (error) {
    console.error('Failed to send confirmation email:', error)
  }
}

// Send admin notification for new photo submission
export async function sendAdminPhotoNotification(submission: any): Promise<void> {
  try {
    const resend = getResend()
    if (!resend) return

    await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: EMAIL_CONFIG.adminEmail,
      subject: '📸 New Photo Submission - Farm Companion',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #00C2B2;">New Photo Submission</h2>
          <p><strong>Farm:</strong> ${submission.farmName}</p>
          <p><strong>Submitted by:</strong> ${submission.submitterName} (${submission.submitterEmail})</p>
          <p><strong>Description:</strong> ${submission.description}</p>
          <p><strong>Submission ID:</strong> ${submission.id}</p>
          <p><strong>Submitted:</strong> ${new Date(submission.submittedAt).toLocaleString()}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            Review this submission at: <a href="https://farmcompanion.co.uk/admin/photos">Admin Panel</a>
          </p>
        </div>
      `
    })

    console.log(`📧 Admin notification sent for submission ${submission.id}`)
  } catch (error) {
    console.error('Failed to send admin notification:', error)
  }
}

// Send approval notification
export async function sendApprovalNotification(submission: any): Promise<void> {
  try {
    const resend = getResend()
    if (!resend) return

    await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: submission.submitterEmail,
      subject: '✅ Photo Approved - Farm Companion',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">Photo Approved! 🎉</h2>
          <p>Hello ${submission.submitterName},</p>
          <p>Great news! Your photo for <strong>${submission.farmName}</strong> has been approved and is now live on our website.</p>
          <p><strong>Photo Details:</strong></p>
          <ul>
            <li>Description: ${submission.description}</li>
            <li>Submission ID: ${submission.id}</li>
            <li>Approved: ${new Date().toLocaleString()}</li>
          </ul>
          <p>Thank you for contributing to our community!</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            View your photo: <a href="https://farmcompanion.co.uk/shop/${submission.farmSlug}">${submission.farmName}</a>
          </p>
        </div>
      `
    })

    console.log(`📧 Approval notification sent to ${submission.submitterEmail}`)
  } catch (error) {
    console.error('Failed to send approval notification:', error)
  }
}

// Send rejection notification
export async function sendRejectionNotification(submission: any, reason: string): Promise<void> {
  try {
    const resend = getResend()
    if (!resend) return

    await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: submission.submitterEmail,
      subject: '❌ Photo Not Approved - Farm Companion',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc3545;">Photo Not Approved</h2>
          <p>Hello ${submission.submitterName},</p>
          <p>We regret to inform you that your photo for <strong>${submission.farmName}</strong> could not be approved at this time.</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p><strong>Photo Details:</strong></p>
          <ul>
            <li>Description: ${submission.description}</li>
            <li>Submission ID: ${submission.id}</li>
          </ul>
          <p>Please feel free to submit a new photo that meets our guidelines.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            Submit a new photo: <a href="https://farmcompanion.co.uk/shop/${submission.farmSlug}">${submission.farmName}</a>
          </p>
        </div>
      `
    })

    console.log(`📧 Rejection notification sent to ${submission.submitterEmail}`)
  } catch (error) {
    console.error('Failed to send rejection notification:', error)
  }
}

// Send deletion request notification to admin
export async function sendDeletionRequestNotification(submission: any, request: any): Promise<void> {
  try {
    const resend = getResend()
    if (!resend) return

    await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: EMAIL_CONFIG.adminEmail,
      subject: '🗑️ Photo Deletion Request - Farm Companion',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc3545;">Photo Deletion Request</h2>
          <p><strong>Photo Details:</strong></p>
          <ul>
            <li>Farm: ${submission.farmName}</li>
            <li>Photo ID: ${submission.id}</li>
            <li>Description: ${submission.description}</li>
            <li>Submitted by: ${submission.submitterName}</li>
          </ul>
          <p><strong>Deletion Request:</strong></p>
          <ul>
            <li>Requested by: ${request.requestedBy}</li>
            <li>Requester role: ${request.requesterRole}</li>
            <li>Reason: ${request.reason}</li>
            <li>Requested: ${new Date(request.requestedAt).toLocaleString()}</li>
          </ul>
          <hr>
          <p style="color: #666; font-size: 12px;">
            Review this request at: <a href="https://farmcompanion.co.uk/admin/photos">Admin Panel</a>
          </p>
        </div>
      `
    })

    console.log(`📧 Deletion request notification sent to admin`)
  } catch (error) {
    console.error('Failed to send deletion request notification:', error)
  }
}

// Send deletion approval notification
export async function sendDeletionApprovalNotification(submission: any, request: any): Promise<void> {
  try {
    const resend = getResend()
    if (!resend) return

    await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: request.requesterEmail,
      subject: '✅ Photo Deletion Approved - Farm Companion',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">Photo Deletion Approved</h2>
          <p>Hello ${request.requestedBy},</p>
          <p>Your request to delete a photo has been approved.</p>
          <p><strong>Photo Details:</strong></p>
          <ul>
            <li>Farm: ${submission.farmName}</li>
            <li>Photo ID: ${submission.id}</li>
            <li>Description: ${submission.description}</li>
          </ul>
          <p><strong>Important:</strong> The photo has been removed from public view. It can be recovered within 4 hours if needed.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            Thank you for using Farm Companion.
          </p>
        </div>
      `
    })

    console.log(`📧 Deletion approval notification sent to ${request.requesterEmail}`)
  } catch (error) {
    console.error('Failed to send deletion approval notification:', error)
  }
}

// Send deletion rejection notification
export async function sendDeletionRejectionNotification(submission: any, request: any, reason: string): Promise<void> {
  try {
    const resend = getResend()
    if (!resend) return

    await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: request.requesterEmail,
      subject: '❌ Photo Deletion Request Rejected - Farm Companion',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc3545;">Photo Deletion Request Rejected</h2>
          <p>Hello ${request.requestedBy},</p>
          <p>Your request to delete a photo has been rejected.</p>
          <p><strong>Photo Details:</strong></p>
          <ul>
            <li>Farm: ${submission.farmName}</li>
            <li>Photo ID: ${submission.id}</li>
            <li>Description: ${submission.description}</li>
          </ul>
          <p><strong>Reason for rejection:</strong> ${reason}</p>
          <p>The photo remains visible on our website.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            If you have questions, please contact us at hello@farmcompanion.co.uk
          </p>
        </div>
      `
    })

    console.log(`📧 Deletion rejection notification sent to ${request.requesterEmail}`)
  } catch (error) {
    console.error('Failed to send deletion rejection notification:', error)
  }
}
