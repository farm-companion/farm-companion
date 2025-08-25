# 📧 Farm Companion Email Newsletter System

## 🎯 **Overview**

A comprehensive, GDPR-compliant newsletter subscription system with bot protection, rate limiting, and automated welcome emails using Resend.

---

## 🏗️ **Architecture**

### **Components**
- **Frontend**: React component with form validation and loading states
- **Backend**: Next.js API routes with comprehensive security
- **Email Service**: Resend integration for transactional emails
- **Bot Protection**: Multi-layered security system

---

## 🔧 **Setup & Configuration**

### **Environment Variables**

Add these to your `.env.local` file:

```bash
# Email Service
RESEND_API_KEY=your_resend_api_key_here

# Bot Protection (Optional)
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key_here
RECAPTCHA_SITE_KEY=your_recaptcha_site_key_here

# Admin Configuration
ADMIN_EMAIL=admin@farmcompanion.co.uk
```

### **Resend Setup**

1. **Create Resend Account**: Sign up at [resend.com](https://resend.com)
2. **Verify Domain**: Add `farmcompanion.co.uk` to your verified domains
3. **Get API Key**: Copy your API key from the dashboard
4. **Test Email**: Use the `/api/test-email` endpoint to verify setup

---

## 🚀 **Features**

### **✅ Implemented**

#### **Frontend Features**
- [x] **Responsive Design**: Mobile-first newsletter signup form
- [x] **Form Validation**: Real-time client-side validation
- [x] **Loading States**: Visual feedback during submission
- [x] **Error Handling**: User-friendly error messages
- [x] **Success Feedback**: Confirmation messages
- [x] **Accessibility**: WCAG 2.2 AA compliant

#### **Backend Features**
- [x] **Email Validation**: Comprehensive email format checking
- [x] **Rate Limiting**: 3 attempts per hour per IP
- [x] **Bot Protection**: Honeypot fields and pattern detection
- [x] **Input Sanitization**: XSS and injection protection
- [x] **Welcome Emails**: Automated welcome message with PuredgeOS styling
- [x] **GDPR Compliance**: Consent management and unsubscribe

#### **Security Features**
- [x] **Honeypot Fields**: Hidden fields to catch bots
- [x] **Rate Limiting**: Prevents abuse and spam
- [x] **Input Validation**: Zod schema validation
- [x] **Suspicious Pattern Detection**: Logs suspicious email patterns
- [x] **reCAPTCHA Ready**: Infrastructure for reCAPTCHA v3

---

## 📋 **API Endpoints**

### **POST /api/newsletter/subscribe**

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "honeypot": "",
  "source": "homepage",
  "consent": true,
  "recaptchaToken": "optional_token"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully subscribed to Farm Companion newsletter!",
  "emailSent": true
}
```

### **GET /api/newsletter/unsubscribe?email=user@example.com**

**Response:**
```json
{
  "success": true,
  "message": "Successfully unsubscribed from Farm Companion newsletter."
}
```

---

## 🛡️ **Security Measures**

### **Bot Protection**

1. **Honeypot Fields**: Hidden form fields invisible to users but visible to bots
2. **Rate Limiting**: Maximum 3 subscription attempts per hour per IP
3. **Pattern Detection**: Logs suspicious email patterns (test@, admin@, etc.)
4. **Input Validation**: Comprehensive validation using Zod schemas
5. **reCAPTCHA Integration**: Ready for reCAPTCHA v3 implementation

### **Data Protection**

1. **GDPR Compliance**: Explicit consent required
2. **Data Minimization**: Only collect necessary information
3. **Unsubscribe Links**: Easy one-click unsubscribe
4. **Privacy Policy**: Clear data usage information

---

## 📧 **Email Templates**

### **Welcome Email**

- **Subject**: 🎉 Welcome to Farm Companion!
- **Features**:
  - PuredgeOS 3.0 compliant design
  - Responsive HTML layout
  - Brand colors and typography
  - Feature highlights
  - Call-to-action buttons
  - Unsubscribe link

### **Template Structure**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- PuredgeOS styling -->
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to Farm Companion!</h1>
    </div>
    <div class="content">
      <!-- Personalized welcome message -->
      <!-- Feature highlights -->
      <!-- CTA buttons -->
    </div>
    <div class="footer">
      <!-- Unsubscribe link -->
    </div>
  </div>
</body>
</html>
```

---

## 🧪 **Testing**

### **Manual Testing**

1. **Test Email Service**:
   ```bash
   curl -X POST http://localhost:3000/api/test-email
   ```

2. **Test Newsletter Subscription**:
   ```bash
   curl -X POST http://localhost:3000/api/newsletter/subscribe \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "name": "Test User",
       "honeypot": "",
       "consent": true
     }'
   ```

3. **Test Unsubscribe**:
   ```bash
   curl "http://localhost:3000/api/newsletter/unsubscribe?email=test@example.com"
   ```

### **Automated Testing**

Run the test suite:
```bash
npm run test
```

---

## 📊 **Monitoring & Analytics**

### **Logs to Monitor**

1. **New Subscriptions**: `New subscription: { email, name, source, timestamp }`
2. **Bot Detection**: `Suspicious email pattern detected: { email }`
3. **Rate Limit Hits**: `Rate limit exceeded for IP: { ip }`
4. **Email Failures**: `Failed to send welcome email: { error }`

### **Metrics to Track**

- Subscription conversion rate
- Email delivery success rate
- Unsubscribe rate
- Bot detection rate
- Rate limit violations

---

## 🔄 **Future Enhancements**

### **Planned Features**

- [ ] **Database Integration**: Store subscriptions in PostgreSQL/Redis
- [ ] **Email Campaigns**: Bulk email sending capabilities
- [ ] **Analytics Dashboard**: Subscription metrics and insights
- [ ] **A/B Testing**: Test different email templates
- [ ] **Segmentation**: Target emails based on user preferences
- [ ] **Double Opt-in**: Email verification before subscription

### **Advanced Bot Protection**

- [ ] **reCAPTCHA v3**: Invisible bot detection
- [ ] **IP Reputation**: Check IP against blacklists
- [ ] **Behavioral Analysis**: Track user interaction patterns
- [ ] **Machine Learning**: AI-powered bot detection

---

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Email Not Sending**:
   - Check `RESEND_API_KEY` environment variable
   - Verify domain is verified in Resend
   - Check Resend dashboard for delivery status

2. **Rate Limiting**:
   - Wait 1 hour before retrying
   - Check IP address in logs
   - Consider using VPN for testing

3. **Bot Detection**:
   - Ensure honeypot field is empty
   - Check for suspicious email patterns
   - Verify form submission timing

### **Debug Mode**

Enable debug logging:
```bash
DEBUG=newsletter:* npm run dev
```

---

## 📚 **Resources**

- [Resend Documentation](https://resend.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Zod Validation](https://zod.dev/)
- [GDPR Compliance Guide](https://gdpr.eu/)

---

## 🤝 **Support**

For issues or questions:
1. Check the troubleshooting section
2. Review the logs for error messages
3. Test with the provided curl commands
4. Contact the development team

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Status**: Production Ready ✅
