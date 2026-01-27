import { useState, useCallback, useMemo } from 'react'

type ValidationRule<T> = {
  validate: (value: T) => boolean
  message: string
}

type FieldValidation<T> = {
  rules: ValidationRule<T>[]
  required?: boolean
  requiredMessage?: string
}

type ValidationConfig = {
  [field: string]: FieldValidation<unknown>
}

type ValidationState = {
  [field: string]: {
    touched: boolean
    dirty: boolean
    valid: boolean
    errors: string[]
  }
}

/**
 * Real-time form validation hook
 * Provides field-level validation with touched/dirty state tracking
 */
export function useFormValidation<T extends Record<string, unknown>>(
  config: ValidationConfig,
  values: T
) {
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [dirty, setDirty] = useState<Record<string, boolean>>({})

  // Validate a single field
  const validateField = useCallback(
    (field: string, value: unknown): string[] => {
      const fieldConfig = config[field]
      if (!fieldConfig) return []

      const errors: string[] = []

      // Check required
      if (fieldConfig.required) {
        const isEmpty =
          value === undefined ||
          value === null ||
          value === '' ||
          (Array.isArray(value) && value.length === 0)

        if (isEmpty) {
          errors.push(fieldConfig.requiredMessage || `${field} is required`)
          return errors // Return early if required validation fails
        }
      }

      // Run custom rules
      for (const rule of fieldConfig.rules) {
        if (!rule.validate(value)) {
          errors.push(rule.message)
        }
      }

      return errors
    },
    [config]
  )

  // Get validation state for all fields
  const validation = useMemo((): ValidationState => {
    const state: ValidationState = {}

    for (const field of Object.keys(config)) {
      const value = values[field]
      const errors = validateField(field, value)

      state[field] = {
        touched: touched[field] || false,
        dirty: dirty[field] || false,
        valid: errors.length === 0,
        errors,
      }
    }

    return state
  }, [config, values, touched, dirty, validateField])

  // Check if entire form is valid
  const isValid = useMemo(() => {
    return Object.values(validation).every((field) => field.valid)
  }, [validation])

  // Check if form has been touched at all
  const isTouched = useMemo(() => {
    return Object.values(touched).some(Boolean)
  }, [touched])

  // Mark a field as touched (on blur)
  const touchField = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }, [])

  // Mark a field as dirty (on change)
  const dirtyField = useCallback((field: string) => {
    setDirty((prev) => ({ ...prev, [field]: true }))
  }, [])

  // Mark all fields as touched (useful for form submission)
  const touchAll = useCallback(() => {
    const allTouched: Record<string, boolean> = {}
    for (const field of Object.keys(config)) {
      allTouched[field] = true
    }
    setTouched(allTouched)
  }, [config])

  // Reset validation state
  const reset = useCallback(() => {
    setTouched({})
    setDirty({})
  }, [])

  // Get error message for a field (only if touched)
  const getError = useCallback(
    (field: string): string | null => {
      const fieldState = validation[field]
      if (!fieldState) return null

      // Show error if field is touched and has errors
      if (fieldState.touched && fieldState.errors.length > 0) {
        return fieldState.errors[0]
      }

      return null
    },
    [validation]
  )

  // Get visual state for input styling
  const getFieldState = useCallback(
    (field: string): 'default' | 'valid' | 'error' => {
      const fieldState = validation[field]
      if (!fieldState) return 'default'

      // Only show visual state if field has been touched
      if (!fieldState.touched && !fieldState.dirty) return 'default'

      return fieldState.valid ? 'valid' : 'error'
    },
    [validation]
  )

  return {
    validation,
    isValid,
    isTouched,
    touchField,
    dirtyField,
    touchAll,
    reset,
    getError,
    getFieldState,
  }
}

// Common validation rules
export const validationRules = {
  email: {
    validate: (value: unknown) =>
      typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: 'Please enter a valid email address',
  },
  url: {
    validate: (value: unknown) =>
      typeof value === 'string' && /^https?:\/\/.+/.test(value),
    message: 'URL must start with http:// or https://',
  },
  ukPostcode: {
    validate: (value: unknown) =>
      typeof value === 'string' &&
      /^[A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2}$/i.test(value),
    message: 'Please enter a valid UK postcode',
  },
  phone: {
    validate: (value: unknown) =>
      typeof value === 'string' && /^[\d\s+()-]{10,}$/.test(value),
    message: 'Please enter a valid phone number',
  },
  minLength: (min: number) => ({
    validate: (value: unknown) =>
      typeof value === 'string' && value.length >= min,
    message: `Must be at least ${min} characters`,
  }),
  maxLength: (max: number) => ({
    validate: (value: unknown) =>
      typeof value === 'string' && value.length <= max,
    message: `Must be no more than ${max} characters`,
  }),
  noEmpty: {
    validate: (value: unknown) =>
      typeof value === 'string' && value.trim().length > 0,
    message: 'Cannot be empty',
  },
}
