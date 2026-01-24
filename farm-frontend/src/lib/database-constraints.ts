// Database Constraints and Validation System
// PuredgeOS 3.0 Compliant Data Integrity

import { ensureConnection } from './redis'

// Database schema definitions
export interface DatabaseSchema {
  farms: {
    key: string
    uniqueFields: string[]
    requiredFields: string[]
    constraints: Record<string, (value: any) => boolean>
  }
  photos: {
    key: string
    uniqueFields: string[]
    requiredFields: string[]
    constraints: Record<string, (value: any) => boolean>
  }
  submissions: {
    key: string
    uniqueFields: string[]
    requiredFields: string[]
    constraints: Record<string, (value: any) => boolean>
  }
}

// Database schema configuration
export const DB_SCHEMA: DatabaseSchema = {
  farms: {
    key: 'farm',
    uniqueFields: ['slug', 'id'],
    requiredFields: ['name', 'address', 'county', 'postcode'],
    constraints: {
      slug: (value: string) => /^[a-z0-9-]+$/.test(value) && value.length >= 3 && value.length <= 50,
      name: (value: string) => value.length >= 2 && value.length <= 120,
      address: (value: string) => value.length >= 5 && value.length <= 200,
      postcode: (value: string) => /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i.test(value),
      lat: (value: number) => value >= 49 && value <= 61, // UK latitude bounds
      lng: (value: number) => value >= -8 && value <= 2, // UK longitude bounds
    }
  },
  photos: {
    key: 'photo',
    uniqueFields: ['id'],
    requiredFields: ['farmSlug', 'url', 'status'],
    constraints: {
      id: (value: string) => /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value),
      farmSlug: (value: string) => /^[a-z0-9-]+$/.test(value) && value.length >= 3 && value.length <= 50,
      url: (value: string) => /^https?:\/\/.+/.test(value) && value.length <= 500,
      status: (value: string) => ['pending', 'approved', 'rejected', 'removed'].includes(value),
      caption: (value: string) => !value || value.length <= 500,
      authorName: (value: string) => !value || value.length <= 100,
      authorEmail: (value: string) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    }
  },
  submissions: {
    key: 'farm-submission',
    uniqueFields: ['id'],
    requiredFields: ['name', 'address', 'county', 'postcode'],
    constraints: {
      id: (value: string) => /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value),
      name: (value: string) => value.length >= 2 && value.length <= 120,
      address: (value: string) => value.length >= 5 && value.length <= 200,
      postcode: (value: string) => /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i.test(value),
      contactEmail: (value: string) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      website: (value: string) => !value || /^https?:\/\/.+/.test(value),
      status: (value: string) => ['pending', 'approved', 'rejected'].includes(value),
    }
  }
}

// Validation error types
export class ValidationError extends Error {
  constructor(message: string, public field?: string, public value?: any) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class ConstraintViolationError extends Error {
  constructor(message: string, public constraint: string, public value?: any) {
    super(message)
    this.name = 'ConstraintViolationError'
  }
}

// Database validation functions
export async function validateUniqueConstraint(
  schema: keyof DatabaseSchema,
  field: string,
  value: string,
  excludeId?: string
): Promise<boolean> {
  const client = await ensureConnection()
  const config = DB_SCHEMA[schema]
  
  if (!config.uniqueFields.includes(field)) {
    throw new ValidationError(`Field ${field} is not marked as unique in schema ${schema}`)
  }

  // Check for existing records with the same value
  const pattern = `${config.key}:*`
  const keys = await client.keys(pattern)
  
  for (const key of keys) {
    const record = await client.hGetAll(key)
    if (record[field] === value) {
      // If we're updating, exclude the current record
      const recordId = key.split(':')[1]
      if (excludeId && recordId === excludeId) {
        continue
      }
      return false // Constraint violated
    }
  }
  
  return true // Constraint satisfied
}

export async function validateRequiredFields(
  schema: keyof DatabaseSchema,
  data: Record<string, any>
): Promise<void> {
  const config = DB_SCHEMA[schema]
  
  for (const field of config.requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      throw new ValidationError(`Required field ${field} is missing or empty`, field, data[field])
    }
  }
}

export async function validateConstraints(
  schema: keyof DatabaseSchema,
  data: Record<string, any>
): Promise<void> {
  const config = DB_SCHEMA[schema]
  
  for (const [field, constraint] of Object.entries(config.constraints)) {
    if (data[field] !== undefined && data[field] !== null) {
      if (!constraint(data[field])) {
        throw new ConstraintViolationError(
          `Constraint violation for field ${field}`,
          field,
          data[field]
        )
      }
    }
  }
}

// Atomic operations with validation
export async function createRecord(
  schema: keyof DatabaseSchema,
  data: Record<string, any>,
  id?: string
): Promise<string> {
  const client = await ensureConnection()
  const config = DB_SCHEMA[schema]
  
  // Generate ID if not provided
  const recordId = id || crypto.randomUUID()
  const key = `${config.key}:${recordId}`
  
  // Validate required fields
  await validateRequiredFields(schema, data)
  
  // Validate constraints
  await validateConstraints(schema, data)
  
  // Validate unique constraints
  for (const field of config.uniqueFields) {
    if (data[field]) {
      const isUnique = await validateUniqueConstraint(schema, field, data[field])
      if (!isUnique) {
        throw new ConstraintViolationError(
          `Unique constraint violated for field ${field}`,
          field,
          data[field]
        )
      }
    }
  }
  
  // Use transaction for atomic operation
  const pipeline = client.multi()
  
  // Store the record
  pipeline.hSet(key, data)
  
  // Add to indexes
  for (const field of config.uniqueFields) {
    if (data[field]) {
      pipeline.sAdd(`${config.key}:${field}:${data[field]}`, recordId)
    }
  }
  
  // Add to collection index
  pipeline.sAdd(`${config.key}s`, recordId)
  
  await pipeline.exec()
  
  return recordId
}

export async function updateRecord(
  schema: keyof DatabaseSchema,
  id: string,
  data: Record<string, any>
): Promise<void> {
  const client = await ensureConnection()
  const config = DB_SCHEMA[schema]
  const key = `${config.key}:${id}`
  
  // Check if record exists
  const exists = await client.exists(key)
  if (!exists) {
    throw new ValidationError(`Record ${id} not found`, 'id', id)
  }
  
  // Get current data for unique constraint validation
  const currentData = await client.hGetAll(key)
  
  // Validate constraints for updated fields
  await validateConstraints(schema, data)
  
  // Validate unique constraints for updated fields
  for (const field of config.uniqueFields) {
    if (data[field] && data[field] !== currentData[field]) {
      const isUnique = await validateUniqueConstraint(schema, field, data[field], id)
      if (!isUnique) {
        throw new ConstraintViolationError(
          `Unique constraint violated for field ${field}`,
          field,
          data[field]
        )
      }
    }
  }
  
  // Use transaction for atomic operation
  const pipeline = client.multi()
  
  // Update the record
  pipeline.hSet(key, data)
  
  // Update indexes for changed unique fields
  for (const field of config.uniqueFields) {
    if (data[field] && data[field] !== currentData[field]) {
      // Remove old index
      if (currentData[field]) {
        pipeline.sRem(`${config.key}:${field}:${currentData[field]}`, id)
      }
      // Add new index
      pipeline.sAdd(`${config.key}:${field}:${data[field]}`, id)
    }
  }
  
  await pipeline.exec()
}

export async function deleteRecord(
  schema: keyof DatabaseSchema,
  id: string
): Promise<void> {
  const client = await ensureConnection()
  const config = DB_SCHEMA[schema]
  const key = `${config.key}:${id}`
  
  // Get current data for index cleanup
  const currentData = await client.hGetAll(key)
  
  // Use transaction for atomic operation
  const pipeline = client.multi()
  
  // Delete the record
  pipeline.del(key)
  
  // Remove from indexes
  for (const field of config.uniqueFields) {
    if (currentData[field]) {
      pipeline.sRem(`${config.key}:${field}:${currentData[field]}`, id)
    }
  }
  
  // Remove from collection index
  pipeline.sRem(`${config.key}s`, id)
  
  await pipeline.exec()
}

// Data integrity checks
export async function checkDataIntegrity(schema: keyof DatabaseSchema): Promise<{
  valid: boolean
  errors: string[]
  orphanedIndexes: string[]
  totalRecords: number
}> {
  const client = await ensureConnection()
  const config = DB_SCHEMA[schema]
  const errors: string[] = []
  const orphanedIndexes: string[] = []
  
  // Get all records
  const recordKeys = await client.keys(`${config.key}:*`)
  const records = new Set<string>()
  
  for (const key of recordKeys) {
    const recordId = key.split(':')[1]
    records.add(recordId)
    
    const data = await client.hGetAll(key)
    
    // Check required fields
    for (const field of config.requiredFields) {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
        errors.push(`Record ${recordId}: Missing required field ${field}`)
      }
    }
    
    // Check constraints
    for (const [field, constraint] of Object.entries(config.constraints)) {
      if (data[field] !== undefined && data[field] !== null) {
        if (!constraint(data[field])) {
          errors.push(`Record ${recordId}: Constraint violation for field ${field} (value: ${data[field]})`)
        }
      }
    }
  }
  
  // Check indexes for orphaned entries
  for (const field of config.uniqueFields) {
    const indexKeys = await client.keys(`${config.key}:${field}:*`)
    for (const indexKey of indexKeys) {
      const indexMembers = await client.sMembers(indexKey)
      for (const memberId of indexMembers) {
        if (!records.has(memberId)) {
          orphanedIndexes.push(`${indexKey}:${memberId}`)
        }
      }
    }
  }
  
  return {
    valid: errors.length === 0 && orphanedIndexes.length === 0,
    errors,
    orphanedIndexes,
    totalRecords: records.size
  }
}

// Cleanup orphaned indexes
export async function cleanupOrphanedIndexes(schema: keyof DatabaseSchema): Promise<number> {
  const client = await ensureConnection()
  const config = DB_SCHEMA[schema]
  let cleanedCount = 0
  
  // Get all records
  const recordKeys = await client.keys(`${config.key}:*`)
  const records = new Set<string>()
  
  for (const key of recordKeys) {
    const recordId = key.split(':')[1]
    records.add(recordId)
  }
  
  // Clean up orphaned indexes
  for (const field of config.uniqueFields) {
    const indexKeys = await client.keys(`${config.key}:${field}:*`)
    for (const indexKey of indexKeys) {
      const indexMembers = await client.sMembers(indexKey)
      for (const memberId of indexMembers) {
        if (!records.has(memberId)) {
          await client.sRem(indexKey, memberId)
          cleanedCount++
        }
      }
    }
  }
  
  return cleanedCount
}
