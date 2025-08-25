# 🧪 Manual Testing Guide for Farm Submission System

## **Phase 1: User Submission Testing**

### **Step 1: Access the Add Farm Page**
1. Open browser to `http://localhost:3001/add`
2. Verify the form loads with all fields:
   - Farm name
   - Address fields
   - Contact information
   - Offerings selection
   - Story text area
   - Image upload section

### **Step 2: Test Form Validation**
1. Try submitting empty form → Should show validation errors
2. Test invalid email format → Should show email validation error
3. Test invalid website format → Should show website validation error
4. Test invalid postcode → Should show postcode validation error

### **Step 3: Submit Valid Farm**
1. Fill out all required fields with valid data
2. Upload test images (if available)
3. Submit the form
4. Verify redirect to success page with submission details

### **Step 4: Test Success Page**
1. Verify submission ID is displayed
2. Check all farm details are shown correctly
3. Test download submission button
4. Verify navigation links work

## **Phase 2: Admin Review Testing**

### **Step 1: Access Admin Dashboard**
1. Navigate to `http://localhost:3001/admin`
2. Verify "Farm Submissions" card is visible
3. Click "Review Submissions"

### **Step 2: Test Review Interface**
1. Verify farm submissions list loads
2. Test filtering by status (pending, approved, rejected)
3. Test search functionality
4. Click on a submission to view details

### **Step 3: Test Review Actions**
1. For pending submissions, test:
   - Approve button
   - Reject button
   - Request Changes button
2. For approved submissions, test:
   - Move to Live Directory button

## **Phase 3: Status Tracking Testing**

### **Step 1: Test Status API**
1. Get a farm ID from a submission
2. Visit `http://localhost:3001/api/farms/status/{farmId}`
3. Verify status information is returned

### **Step 2: Test File Creation**
1. Check `data/farms/` directory for JSON files
2. Verify farm data is saved correctly
3. Check `data/live-farms/` directory after moving to live

## **Expected Results**

### **✅ Success Indicators:**
- Form validation works correctly
- Farm submissions are saved to files
- Admin interface shows submissions
- Review actions update status
- Status tracking API returns correct data
- No hydration errors in browser console

### **❌ Issues to Watch For:**
- Form submission errors
- Missing validation messages
- Admin interface not loading
- File creation failures
- API endpoint errors
- Hydration mismatches

## **Test Data Examples**

### **Valid Farm Submission:**
```json
{
  "name": "Test Farm Shop",
  "slug": "test-farm-shop",
  "location": {
    "address": "123 Test Lane",
    "county": "Devon",
    "postcode": "EX1 1AA",
    "lat": 50.7,
    "lng": -3.5
  },
  "contact": {
    "email": "test@farmcompanion.co.uk",
    "phone": "01392 123456",
    "website": "https://testfarm.co.uk"
  },
  "offerings": ["vegetables", "fruits", "eggs"],
  "story": "A wonderful test farm with fresh produce"
}
```

### **Invalid Test Cases:**
- Missing required fields
- Invalid email format
- Invalid website format
- Invalid postcode format
- Duplicate farm names/addresses
