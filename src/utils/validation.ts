import { z } from 'zod';

export function validateEmail(email: string): boolean {
  const emailSchema = z.string().email();
  return emailSchema.safeParse(email).success;
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

export function validateDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString === date.toISOString().split('T')[0];
}

export function validateDateTime(dateTimeString: string): boolean {
  const dateTime = new Date(dateTimeString);
  return !isNaN(dateTime.getTime());
}

export function sanitizeString(input: string, maxLength: number = 255): string {
  return input.trim().substring(0, maxLength);
}

export function validateQuantities(quantities: Array<{ optionId: number; value: number }>): string[] {
  const errors: string[] = [];
  
  if (!quantities || quantities.length === 0) {
    errors.push('At least one quantity must be specified');
    return errors;
  }

  quantities.forEach((quantity, index) => {
    if (!Number.isInteger(quantity.optionId) || quantity.optionId <= 0) {
      errors.push(`Invalid optionId at index ${index}: must be a positive integer`);
    }
    if (!Number.isInteger(quantity.value) || quantity.value <= 0) {
      errors.push(`Invalid quantity value at index ${index}: must be a positive integer`);
    }
  });

  return errors;
}

export function validateBookingDates(startDate: string, endDate?: string): string[] {
  const errors: string[] = [];
  
  if (!validateDateTime(startDate)) {
    errors.push('Invalid start date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)');
  }

  if (endDate && !validateDateTime(endDate)) {
    errors.push('Invalid end date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)');
  }

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      errors.push('End date must be after start date');
    }
  }

  // Check if start date is in the past
  const start = new Date(startDate);
  const now = new Date();
  if (start < now) {
    errors.push('Start date cannot be in the past');
  }

  return errors;
}

export function validateCustomerData(customer: any): string[] {
  const errors: string[] = [];

  if (!customer.firstName || typeof customer.firstName !== 'string') {
    errors.push('Customer first name is required');
  }

  if (!customer.lastName || typeof customer.lastName !== 'string') {
    errors.push('Customer last name is required');
  }

  if (!customer.email || !validateEmail(customer.email)) {
    errors.push('Valid customer email is required');
  }

  if (customer.phone && !validatePhone(customer.phone)) {
    errors.push('Invalid customer phone number format');
  }

  if (customer.dateOfBirth && !validateDate(customer.dateOfBirth)) {
    errors.push('Invalid customer date of birth format. Use YYYY-MM-DD');
  }

  return errors;
}