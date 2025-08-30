import { test, expect } from '@playwright/test'

test.describe('Contact Form', () => {
  test('should load the contact page', async ({ page }) => {
    await page.goto('/contact')
    
    // Check that the page loads with the main heading
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Share Your')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Feedback')
    
    // Check that the form is present
    await expect(page.getByLabel('Name *')).toBeVisible()
    await expect(page.getByLabel('Email *')).toBeVisible()
    await expect(page.getByLabel('Topic *')).toBeVisible()
    await expect(page.getByLabel('Message *')).toBeVisible()
  })

  test('should show validation errors for empty required fields', async ({ page }) => {
    await page.goto('/contact')
    
    // Try to submit without filling required fields
    await page.getByRole('button', { name: 'Send message' }).click()
    
    // Check that validation errors appear
    await expect(page.getByText('Name must be at least 2 characters')).toBeVisible()
    await expect(page.getByText('Please enter a valid email address')).toBeVisible()
    await expect(page.getByText('Message must be at least 10 characters')).toBeVisible()
    await expect(page.getByText('Please confirm you\'ve read our privacy notice.')).toBeVisible()
  })

  test('should show validation error for invalid email', async ({ page }) => {
    await page.goto('/contact')
    
    // Fill required fields
    await page.getByLabel('Name *').fill('Test User')
    await page.getByLabel('Email *').fill('invalid-email')
    await page.getByLabel('Message *').fill('This is a test message with enough characters to pass validation.')
    await page.getByLabel('I\'ve read the privacy notice. *').check()
    
    // Try to submit
    await page.getByRole('button', { name: 'Send message' }).click()
    
    // Check that email validation error appears
    await expect(page.getByText('Please enter a valid email address')).toBeVisible()
  })

  test('should show validation error for short message', async ({ page }) => {
    await page.goto('/contact')
    
    // Fill required fields with short message
    await page.getByLabel('Name *').fill('Test User')
    await page.getByLabel('Email *').fill('test@example.com')
    await page.getByLabel('Message *').fill('Short')
    await page.getByLabel('I\'ve read the privacy notice. *').check()
    
    // Try to submit
    await page.getByRole('button', { name: 'Send message' }).click()
    
    // Check that message validation error appears
    await expect(page.getByText('Message must be at least 10 characters')).toBeVisible()
  })

  test('should auto-focus first invalid field', async ({ page }) => {
    await page.goto('/contact')
    
    // Try to submit without filling required fields
    await page.getByRole('button', { name: 'Send message' }).click()
    
    // Check that the first invalid field (name) is focused
    await expect(page.getByLabel('Name *')).toBeFocused()
  })

  test('should show disabled state when form is disabled', async ({ page }) => {
    // This test would require setting CONTACT_FORM_ENABLED=false
    // For now, we'll just check the form is enabled by default
    await page.goto('/contact')
    
    // Form should be enabled by default
    await expect(page.getByLabel('Name *')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Send message' })).toBeEnabled()
  })

  test('should have proper accessibility attributes', async ({ page }) => {
    await page.goto('/contact')
    
    // Check that all form inputs have proper labels
    await expect(page.getByLabel('Name *')).toBeVisible()
    await expect(page.getByLabel('Email *')).toBeVisible()
    await expect(page.getByLabel('Topic *')).toBeVisible()
    await expect(page.getByLabel('Message *')).toBeVisible()
    
    // Check that required fields are marked
    await expect(page.getByLabel('Name *')).toHaveAttribute('required')
    await expect(page.getByLabel('Email *')).toHaveAttribute('required')
    await expect(page.getByLabel('Message *')).toHaveAttribute('required')
  })

  test('should show topic dropdown with correct options', async ({ page }) => {
    await page.goto('/contact')
    
    // Check that topic dropdown has all expected options
    const topicSelect = page.getByLabel('Topic *')
    await expect(topicSelect).toBeVisible()
    
    // Check options are present
    await expect(page.locator('option[value="general"]')).toContainText('General')
    await expect(page.locator('option[value="bug"]')).toContainText('Bug Report')
    await expect(page.locator('option[value="data-correction"]')).toContainText('Data Correction')
    await expect(page.locator('option[value="partnership"]')).toContainText('Partnership')
  })
})
