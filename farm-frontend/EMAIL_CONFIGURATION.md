# Email Configuration Guide

## Required Environment Variables

Add these to your `.env.local` file:

```bash
# Email Configuration
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM=hello@farmcompanion.co.uk
RESEND_BCC_ADMIN=admin@farmcompanion.co.uk
ADMIN_EMAIL=admin@farmcompanion.co.uk

# Site Configuration
SITE_URL=https://www.farmcompanion.co.uk
```

## Email Address Usage

| Email Address | Purpose | Usage |
|---------------|---------|-------|
| `hello@farmcompanion.co.uk` | Main sender | All outgoing emails (RESEND_FROM) |
| `admin@farmcompanion.co.uk` | Admin notifications | Login, BCC on submissions |
| `support@farmcompanion.co.uk` | User support | Reply-to address for inquiries |
| `claims@farmcompanion.co.uk` | Farm claims | Verification emails for farm owners |
| `no-reply@farmcompanion.co.uk` | System notifications | Automated system emails (if needed) |

## Email Functions

### 1. Farm Submission Acknowledgment
- **Function**: `sendSubmissionAckEmail()`
- **Triggered**: When user submits farm via `/add` form
- **From**: `hello@farmcompanion.co.uk`
- **Reply-to**: `support@farmcompanion.co.uk`
- **BCC**: `admin@farmcompanion.co.uk`

### 2. Photo Submission Receipt
- **Function**: `sendPhotoSubmissionReceipt()`
- **Triggered**: When user submits photos
- **From**: `hello@farmcompanion.co.uk`
- **Reply-to**: `support@farmcompanion.co.uk`
- **BCC**: `admin@farmcompanion.co.uk`

### 3. Admin Notifications
- **Function**: `sendAdminNotification()`
- **Triggered**: New farm submissions
- **To**: `admin@farmcompanion.co.uk`
- **From**: `hello@farmcompanion.co.uk`

## Testing Email Configuration

Use the self-test endpoint to verify your email setup:

```bash
curl http://localhost:3000/api/add/selftest
```

Expected response:
```json
{
  "ok": true,
  "checks": [
    {"name": "kv", "ok": true},
    {"name": "resend_env", "ok": true},
    {"name": "captcha_env", "ok": false},
    {"name": "add_form_enabled", "ok": true}
  ]
}
```

## Email Templates

### Current Templates
- ✅ `PhotoSubmissionReceipt.tsx` - Photo submission confirmations
- ✅ `PhotoApproved.tsx` - Photo approval notifications  
- ✅ `PhotoRejected.tsx` - Photo rejection notifications

### Future Templates (to be created)
- `FarmSubmissionAck.tsx` - Farm submission acknowledgment
- `FarmApproved.tsx` - Farm approval notification
- `FarmRejected.tsx` - Farm rejection notification
- `ClaimVerification.tsx` - Farm claim verification

## Email Flow for /add Form

1. **User submits farm** via `/add` form
2. **System validates** input and stores in Redis
3. **Email sent** to user (if contactEmail provided)
4. **Admin BCC'd** on all submissions
5. **User sees success** message immediately
6. **Email arrives** within minutes

## Error Handling

- **Email failures don't break submissions** - form still succeeds
- **Invalid emails are logged** but don't crash the system
- **Missing config is detected** by self-test endpoint
- **All email attempts are logged** for debugging

## Production Deployment

1. Set environment variables in Vercel
2. Verify Resend API key is valid
3. Test email sending via self-test endpoint
4. Monitor email delivery in Resend dashboard
5. Check logs for any email failures

## Security Notes

- All emails use proper SPF/DKIM setup via Resend
- Reply-to addresses are configured for user support
- BCC admin on important emails for oversight
- No sensitive data in email subjects or previews
