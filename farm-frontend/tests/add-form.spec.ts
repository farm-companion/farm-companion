import { test, expect } from '@playwright/test'

test.describe('Add Farm Form', () => {
  test('should load the add form page', async ({ page }) => {
    await page.goto('/add')
    
    // Check that the page loads with the main heading
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Add a')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Farm Shop')
    
    // Check that the form is present
    await expect(page.getByLabel('Farm shop name *')).toBeVisible()
    await expect(page.getByLabel('Address *')).toBeVisible()
    await expect(page.getByLabel('County *')).toBeVisible()
    await expect(page.getByLabel('Postcode *')).toBeVisible()
  })

  test('should show validation errors for empty required fields', async ({ page }) => {
    await page.goto('/add')
    
    // Try to submit without filling required fields
    await page.getByRole('button', { name: 'Submit Farm Shop' }).click()
    
    // Check that validation errors appear
    await expect(page.getByText('Name is required')).toBeVisible()
    await expect(page.getByText('Address is required')).toBeVisible()
    await expect(page.getByText('County is required')).toBeVisible()
    await expect(page.getByText('Postcode is required')).toBeVisible()
  })

  test('should show validation error for invalid email', async ({ page }) => {
    await page.goto('/add')
    
    // Fill required fields
    await page.getByLabel('Farm shop name *').fill('Test Farm')
    await page.getByLabel('Address *').fill('123 Test Lane')
    await page.getByLabel('County *').fill('Test County')
    await page.getByLabel('Postcode *').fill('TE1 1ST')
    
    // Fill invalid email
    await page.getByLabel('Email').fill('invalid-email')
    
    // Try to submit
    await page.getByRole('button', { name: 'Submit Farm Shop' }).click()
    
    // Check that email validation error appears
    await expect(page.getByText('Please enter a valid email address')).toBeVisible()
  })

  test('should show validation error for invalid website', async ({ page }) => {
    await page.goto('/add')
    
    // Fill required fields
    await page.getByLabel('Farm shop name *').fill('Test Farm')
    await page.getByLabel('Address *').fill('123 Test Lane')
    await page.getByLabel('County *').fill('Test County')
    await page.getByLabel('Postcode *').fill('TE1 1ST')
    
    // Fill invalid website
    await page.getByLabel('Website').fill('not-a-url')
    
    // Try to submit
    await page.getByRole('button', { name: 'Submit Farm Shop' }).click()
    
    // Check that website validation error appears
    await expect(page.getByText('Website must start with http:// or https://')).toBeVisible()
  })

  test('should submit valid form successfully', async ({ page }) => {
    await page.goto('/add')
    
    // Fill all required fields with valid data
    await page.getByLabel('Farm shop name *').fill('Test Farm Shop')
    await page.getByLabel('Address *').fill('123 Test Farm Lane')
    await page.getByLabel('County *').fill('Test County')
    await page.getByLabel('Postcode *').fill('TE1 1ST')
    
    // Fill optional fields
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Website').fill('https://testfarm.com')
    await page.getByLabel('Phone').fill('01234567890')
    
    // Wait a bit to simulate realistic form filling time
    await page.waitForTimeout(3000)
    
    // Submit the form
    await page.getByRole('button', { name: 'Submit Farm Shop' }).click()
    
    // Check for success message
    await expect(page.getByText('Submission Successful!')).toBeVisible()
    await expect(page.getByText('Farm shop submitted successfully')).toBeVisible()
  })

  test('should show rate limit error on rapid submissions', async ({ page }) => {
    await page.goto('/add')
    
    // Fill form with valid data
    await page.getByLabel('Farm shop name *').fill('Test Farm 1')
    await page.getByLabel('Address *').fill('123 Test Lane 1')
    await page.getByLabel('County *').fill('Test County')
    await page.getByLabel('Postcode *').fill('TE1 1ST')
    
    await page.waitForTimeout(3000)
    
    // Submit first time
    await page.getByRole('button', { name: 'Submit Farm Shop' }).click()
    
    // Wait for success
    await expect(page.getByText('Submission Successful!')).toBeVisible()
    
    // Try to submit again immediately (should be rate limited)
    await page.getByLabel('Farm shop name *').fill('Test Farm 2')
    await page.getByLabel('Address *').fill('123 Test Lane 2')
    await page.getByRole('button', { name: 'Submit Farm Shop' }).click()
    
    // Should show rate limit error
    await expect(page.getByText('Too many submissions')).toBeVisible()
  })

  test('should auto-focus first invalid field', async ({ page }) => {
    await page.goto('/add')
    
    // Try to submit without filling required fields
    await page.getByRole('button', { name: 'Submit Farm Shop' }).click()
    
    // Check that the first invalid field (name) is focused
    await expect(page.getByLabel('Farm shop name *')).toBeFocused()
  })
})
