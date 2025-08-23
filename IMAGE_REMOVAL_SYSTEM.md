# Image Removal System - Farm Companion

## Overview

The Farm Companion Image Removal System provides a comprehensive, GDPR-compliant solution for managing photo deletions with proper audit trails, user permissions, and recovery mechanisms. This system follows PuredgeOS 3.0 standards for clarity, security, and user experience.

## System Architecture

### User Roles & Permissions

1. **Admins** - Full rights
   - Can immediately delete photos
   - Can approve/reject deletion requests
   - Can recover deleted photos within 4-hour window
   - Access to all deletion management features

2. **Shop Owners** - Limited rights
   - Can request deletion of photos on their claimed shops
   - Cannot immediately delete photos
   - Must provide reason for deletion

3. **Photo Submitters** - Limited rights
   - Can only request deletion of their own photos
   - Must provide reason for deletion
   - Cannot delete photos submitted by others

### Deletion Process Flow

```
1. User requests deletion → 2. Admin reviews → 3. Soft delete → 4. 4-hour recovery window → 5. Permanent deletion
```

## Technical Implementation

### Core Components

#### 1. Photo Storage (`src/lib/photo-storage.ts`)
- **Soft Delete**: Photos are marked as `deleted` status, not immediately removed
- **Recovery Window**: 4-hour grace period for photo recovery
- **Audit Trail**: Complete logging of all deletion activities
- **Status Tracking**: Multiple statuses (`pending`, `approved`, `rejected`, `deleted`, `deletion_requested`)

#### 2. API Endpoints

**Individual Photo Management** (`/api/photos/[id]`)
- `GET`: Retrieve photo details
- `PATCH`: Update status, request deletion, review deletion, recover photo
- `DELETE`: Immediate deletion (admin only)
- `OPTIONS`: CORS support

**Deletion Requests** (`/api/photos/deletion-requests`)
- `GET`: List pending requests, recoverable photos, cleanup expired
- `OPTIONS`: CORS support

#### 3. Email Notifications (`src/lib/email.ts`)
- Deletion request notifications to admins
- Approval/rejection notifications to requesters
- Comprehensive email templates following PuredgeOS standards

#### 4. Admin Interface (`/admin/photos`)
- Dashboard with statistics
- Deletion request management
- Photo recovery interface
- Bulk operations support

#### 5. User Components
- **PhotoDeletionRequest**: Form component for requesting deletions
- **PhotoViewer**: Enhanced with deletion request functionality

### Data Models

#### PhotoSubmission Interface
```typescript
interface PhotoSubmission {
  id: string
  farmSlug: string
  farmName: string
  submitterName: string
  submitterEmail: string
  photoUrl: string
  thumbnailUrl: string
  description: string
  status: 'pending' | 'approved' | 'rejected' | 'deleted' | 'deletion_requested'
  qualityScore: number
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  rejectionReason?: string
  // Deletion tracking
  deletionRequestedAt?: string
  deletionRequestedBy?: string
  deletionReason?: string
  deletedAt?: string
  deletedBy?: string
  canRecoverUntil?: string // 4-hour recovery window
}
```

#### DeletionRequest Interface
```typescript
interface DeletionRequest {
  photoId: string
  requestedBy: string
  requesterEmail: string
  requesterRole: 'admin' | 'shop_owner' | 'submitter'
  reason: string
  requestedAt: string
  status: 'pending' | 'approved' | 'rejected'
  reviewedAt?: string
  reviewedBy?: string
  rejectionReason?: string
}
```

## User Experience

### For Photo Submitters
1. **Request Deletion**: Click "Request Deletion" in photo viewer
2. **Provide Reason**: Fill out form with detailed reason (minimum 10 characters)
3. **Confirmation**: Receive confirmation email
4. **Status Updates**: Email notifications for approval/rejection

### For Shop Owners
1. **Same as Submitters**: Plus ability to request deletion of any photo on their shop
2. **Shop Management**: Access to deletion requests for their claimed shops

### For Admins
1. **Dashboard**: Overview of all pending requests and recoverable photos
2. **Review Process**: Approve/reject deletion requests with reasons
3. **Recovery**: Recover deleted photos within 4-hour window
4. **Immediate Deletion**: Direct deletion capability for urgent cases

## GDPR Compliance

### Data Protection Features
- **Right to be Forgotten**: Permanent deletion after 4-hour recovery window
- **Audit Trail**: Complete logging of all deletion activities (12-month retention)
- **User Consent**: Clear communication about deletion process
- **Data Minimization**: Only necessary data is retained

### Retention Policy
- **Deletion Logs**: 12 months (GDPR requirement)
- **Recovery Window**: 4 hours
- **Permanent Deletion**: After recovery window expires

### Privacy Notifications
- Clear communication about deletion process
- User consent for data processing
- Opt-out mechanisms for notifications
- Contact information for privacy concerns

## Security Features

### Access Control
- Role-based permissions
- Email verification for deletion requests
- Admin-only immediate deletion
- Audit logging of all actions

### Data Protection
- Soft delete prevents accidental data loss
- Recovery window provides safety net
- Complete audit trail for compliance
- Secure API endpoints with CORS

## Performance Considerations

### Storage Optimization
- Soft delete reduces storage overhead
- Automatic cleanup of expired deletions
- Efficient querying with status filters
- Minimal impact on photo retrieval performance

### User Experience
- Fast response times for deletion requests
- Real-time status updates
- Intuitive interface design
- Clear feedback and error handling

## Monitoring & Maintenance

### Automated Tasks
- **Cleanup Job**: Removes expired deleted photos
- **Audit Logging**: Tracks all deletion activities
- **Email Notifications**: Automated status updates

### Manual Tasks
- **Admin Review**: Manual approval of deletion requests
- **Recovery Operations**: Manual photo recovery if needed
- **System Monitoring**: Track deletion patterns and abuse

## Error Handling

### Common Scenarios
1. **Invalid Permissions**: Clear error messages for unauthorized actions
2. **Expired Recovery**: Informative messages about recovery window
3. **Network Errors**: Graceful handling of API failures
4. **Validation Errors**: Clear feedback for form validation

### Recovery Procedures
1. **Photo Recovery**: 4-hour window for admin recovery
2. **Request Cancellation**: Users can cancel pending requests
3. **System Rollback**: Emergency procedures for system issues

## Future Enhancements

### Planned Features
1. **Bulk Operations**: Delete multiple photos at once
2. **Advanced Analytics**: Deletion pattern analysis
3. **Automated Review**: AI-powered deletion request screening
4. **Enhanced Notifications**: Real-time status updates

### Scalability Considerations
1. **Database Optimization**: Indexing for large photo collections
2. **Caching Strategy**: Efficient photo retrieval
3. **API Rate Limiting**: Prevent abuse of deletion requests
4. **Storage Management**: Efficient handling of deleted photos

## Testing & Quality Assurance

### Test Scenarios
1. **Permission Testing**: Verify role-based access control
2. **Recovery Testing**: Test 4-hour recovery window
3. **Email Testing**: Verify notification delivery
4. **UI Testing**: Test all user interfaces
5. **API Testing**: Verify all endpoints work correctly

### Quality Gates
1. **Performance**: Response times under 2 seconds
2. **Security**: All endpoints properly secured
3. **Accessibility**: WCAG 2.2 AA compliance
4. **User Experience**: Clear and intuitive interfaces

## Deployment & Configuration

### Environment Variables
```bash
RESEND_API_KEY=your_resend_api_key
ADMIN_EMAIL=admin@farmcompanion.co.uk
```

### Vercel Configuration
- CORS headers for API endpoints
- Environment variable management
- Function timeout settings for deletion operations

## Support & Documentation

### User Guides
- How to request photo deletion
- Understanding the deletion process
- Recovery procedures for admins

### Technical Documentation
- API endpoint documentation
- Database schema documentation
- Email template customization

### Contact Information
- Technical support: tech@farmcompanion.co.uk
- Privacy concerns: privacy@farmcompanion.co.uk
- General inquiries: hello@farmcompanion.co.uk

---

*This system is designed and implemented following PuredgeOS 3.0 standards for clarity, security, and user experience. All components prioritize user privacy, data protection, and regulatory compliance.*
