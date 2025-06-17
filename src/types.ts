import { z } from 'zod';

export const RezdyAgentConfigSchema = z.object({
  apiKey: z.string(),
  baseUrl: z.string().default('https://api.rezdy.com/v1'),
  stagingUrl: z.string().default('https://api-staging.rezdy.com/v1'),
  environment: z.enum(['production', 'staging']).default('production'),
});

export type RezdyAgentConfig = z.infer<typeof RezdyAgentConfigSchema>;

export const SearchProductsSchema = z.object({
  limit: z.number().optional(),
  offset: z.number().optional(),
  productCode: z.string().optional(),
  name: z.string().optional(),
  categoryId: z.number().optional(),
  supplierId: z.number().optional(),
  location: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  duration: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

export type SearchProductsParams = z.infer<typeof SearchProductsSchema>;

export const SearchAvailabilitySchema = z.object({
  productId: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  quantities: z.array(z.object({
    optionId: z.number(),
    value: z.number(),
  })).optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

export type SearchAvailabilityParams = z.infer<typeof SearchAvailabilitySchema>;

export const QuoteBookingSchema = z.object({
  productId: z.number(),
  sessionId: z.string().optional(),
  startTime: z.string().optional(),
  quantities: z.array(z.object({
    optionId: z.number(),
    value: z.number(),
  })),
  customer: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    dateOfBirth: z.string().optional(),
    nationality: z.string().optional(),
  }).optional(),
  agentReference: z.string().optional(),
  paymentType: z.enum(['MANUAL', 'AUTOMATED']).default('MANUAL'),
  promoCode: z.string().optional(),
});

export type QuoteBookingParams = z.infer<typeof QuoteBookingSchema>;

export const CreateBookingSchema = z.object({
  productId: z.number(),
  sessionId: z.string().optional(),
  startTime: z.string().optional(),
  quantities: z.array(z.object({
    optionId: z.number(),
    value: z.number(),
  })),
  customer: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    dateOfBirth: z.string().optional(),
    nationality: z.string().optional(),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional(),
    }).optional(),
  }),
  participants: z.array(z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    dateOfBirth: z.string().optional(),
    nationality: z.string().optional(),
  })).optional(),
  fields: z.array(z.object({
    fieldId: z.number(),
    value: z.string(),
  })).optional(),
  agentReference: z.string().optional(),
  paymentType: z.enum(['MANUAL', 'AUTOMATED']).default('MANUAL'),
  promoCode: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateBookingParams = z.infer<typeof CreateBookingSchema>;

export const UpdateBookingSchema = z.object({
  customer: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
  }).optional(),
  participants: z.array(z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  })).optional(),
  fields: z.array(z.object({
    fieldId: z.number(),
    value: z.string(),
  })).optional(),
  agentReference: z.string().optional(),
  notes: z.string().optional(),
});

export type UpdateBookingParams = z.infer<typeof UpdateBookingSchema>;

export const SearchCustomersSchema = z.object({
  limit: z.number().optional(),
  offset: z.number().optional(),
  email: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
});

export type SearchCustomersParams = z.infer<typeof SearchCustomersSchema>;

export const CreateCustomerSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  notes: z.string().optional(),
});

export type CreateCustomerParams = z.infer<typeof CreateCustomerSchema>;

export interface RezdyApiResponse<T = any> {
  requestId: string;
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface Product {
  id: number;
  name: string;
  productCode: string;
  supplierId: number;
  supplierName: string;
  categoryId: number;
  categoryName: string;
  shortDescription?: string;
  description?: string;
  duration?: number;
  location?: string;
  region?: string;
  country?: string;
  images?: Array<{
    url: string;
    caption?: string;
  }>;
  pricing: {
    from: number;
    currency: string;
  };
  rating?: {
    average: number;
    count: number;
  };
  tags?: string[];
}

export interface AvailabilitySession {
  sessionId: string;
  startTime: string;
  endTime: string;
  capacity: number;
  seatsAvailable: number;
  pricing: Array<{
    optionId: number;
    optionName: string;
    price: number;
    currency: string;
    agentPrice?: number;
    commission?: number;
  }>;
}

export interface BookingQuote {
  quoteId: string;
  productId: number;
  sessionId?: string;
  pricing: {
    subtotal: number;
    fees: number;
    taxes: number;
    total: number;
    currency: string;
    agentCommission?: number;
    agentDiscount?: number;
  };
  expiresAt: string;
}