import fetch, { RequestInit } from 'node-fetch';
import {
  RezdyAgentConfig,
  RezdyApiResponse,
  SearchProductsParams,
  SearchAvailabilityParams,
  QuoteBookingParams,
  CreateBookingParams,
  UpdateBookingParams,
  SearchCustomersParams,
  CreateCustomerParams,
} from './types.js';
import { calculateAgentPricing, calculateTotalQuantityPrice } from './utils/pricing.js';
import { validateQuantities, validateBookingDates, validateCustomerData } from './utils/validation.js';

export class RezdyAgentClient {
  private config: RezdyAgentConfig;
  private rateLimitQueue: Array<() => Promise<any>> = [];
  private rateLimitLastReset = Date.now();
  private rateLimitCount = 0;
  private readonly rateLimitMax = 100;
  private readonly rateLimitWindow = 60000; // 1 minute

  constructor(config: RezdyAgentConfig) {
    this.config = config;
  }

  private get baseUrl(): string {
    return this.config.environment === 'staging' ? this.config.stagingUrl : this.config.baseUrl;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<RezdyApiResponse<T>> {
    await this.enforceRateLimit();

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Rezdy-ApiKey': this.config.apiKey,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json() as RezdyApiResponse<T>;
      
      if (!response.ok) {
        throw new Error(`Rezdy API Error: ${data.error?.message || response.statusText}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Failed to make request to ${endpoint}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    
    if (now - this.rateLimitLastReset > this.rateLimitWindow) {
      this.rateLimitCount = 0;
      this.rateLimitLastReset = now;
    }

    if (this.rateLimitCount >= this.rateLimitMax) {
      const waitTime = this.rateLimitWindow - (now - this.rateLimitLastReset);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.rateLimitCount = 0;
      this.rateLimitLastReset = Date.now();
    }

    this.rateLimitCount++;
  }

  // Product Methods
  async searchProducts(params: SearchProductsParams = {}): Promise<RezdyApiResponse> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(item => queryParams.append(key, String(item)));
        } else {
          queryParams.append(key, String(value));
        }
      }
    });

    return this.makeRequest(`/marketplace/products?${queryParams.toString()}`);
  }

  async getProduct(productId: number): Promise<RezdyApiResponse> {
    return this.makeRequest(`/marketplace/products/${productId}`);
  }

  async getProductPickups(productId: number): Promise<RezdyApiResponse> {
    return this.makeRequest(`/marketplace/products/${productId}/pickups`);
  }

  // Availability Methods
  async searchAvailability(params: SearchAvailabilityParams): Promise<RezdyApiResponse> {
    const validationErrors = validateBookingDates(params.startDate, params.endDate);
    if (validationErrors.length > 0) {
      throw new Error(`Validation errors: ${validationErrors.join(', ')}`);
    }

    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          queryParams.append(key, JSON.stringify(value));
        } else {
          queryParams.append(key, String(value));
        }
      }
    });

    return this.makeRequest(`/marketplace/availability?${queryParams.toString()}`);
  }

  // Booking Methods
  async quoteBooking(params: QuoteBookingParams): Promise<RezdyApiResponse> {
    const quantityErrors = validateQuantities(params.quantities);
    if (quantityErrors.length > 0) {
      throw new Error(`Quantity validation errors: ${quantityErrors.join(', ')}`);
    }

    if (params.customer) {
      const customerErrors = validateCustomerData(params.customer);
      if (customerErrors.length > 0) {
        throw new Error(`Customer validation errors: ${customerErrors.join(', ')}`);
      }
    }

    return this.makeRequest('/marketplace/bookings/quote', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async createBooking(params: CreateBookingParams): Promise<RezdyApiResponse> {
    const quantityErrors = validateQuantities(params.quantities);
    if (quantityErrors.length > 0) {
      throw new Error(`Quantity validation errors: ${quantityErrors.join(', ')}`);
    }

    const customerErrors = validateCustomerData(params.customer);
    if (customerErrors.length > 0) {
      throw new Error(`Customer validation errors: ${customerErrors.join(', ')}`);
    }

    if (params.startTime) {
      const dateErrors = validateBookingDates(params.startTime);
      if (dateErrors.length > 0) {
        throw new Error(`Date validation errors: ${dateErrors.join(', ')}`);
      }
    }

    return this.makeRequest('/marketplace/bookings', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getBooking(bookingId: string): Promise<RezdyApiResponse> {
    return this.makeRequest(`/marketplace/bookings/${bookingId}`);
  }

  async updateBooking(bookingId: string, params: UpdateBookingParams): Promise<RezdyApiResponse> {
    if (params.customer) {
      const customerErrors = validateCustomerData(params.customer);
      if (customerErrors.length > 0) {
        throw new Error(`Customer validation errors: ${customerErrors.join(', ')}`);
      }
    }

    return this.makeRequest(`/marketplace/bookings/${bookingId}`, {
      method: 'PUT',
      body: JSON.stringify(params),
    });
  }

  async cancelBooking(bookingId: string, reason?: string): Promise<RezdyApiResponse> {
    const requestOptions: RequestInit = {
      method: 'POST',
    };
    
    if (reason) {
      requestOptions.body = JSON.stringify({ reason });
    }
    
    return this.makeRequest(`/marketplace/bookings/${bookingId}/cancel`, requestOptions);
  }

  // Customer Methods
  async searchCustomers(params: SearchCustomersParams = {}): Promise<RezdyApiResponse> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, String(value));
      }
    });

    return this.makeRequest(`/agent/customers?${queryParams.toString()}`);
  }

  async createCustomer(params: CreateCustomerParams): Promise<RezdyApiResponse> {
    const customerErrors = validateCustomerData(params);
    if (customerErrors.length > 0) {
      throw new Error(`Customer validation errors: ${customerErrors.join(', ')}`);
    }

    return this.makeRequest('/agent/customers', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getCustomer(customerId: string): Promise<RezdyApiResponse> {
    return this.makeRequest(`/agent/customers/${customerId}`);
  }

  async updateCustomer(customerId: string, params: Partial<CreateCustomerParams>): Promise<RezdyApiResponse> {
    if (params.email || params.firstName || params.lastName) {
      const customerErrors = validateCustomerData({ ...params, email: params.email || '', firstName: params.firstName || '', lastName: params.lastName || '' });
      if (customerErrors.length > 0) {
        throw new Error(`Customer validation errors: ${customerErrors.join(', ')}`);
      }
    }

    return this.makeRequest(`/agent/customers/${customerId}`, {
      method: 'PUT',
      body: JSON.stringify(params),
    });
  }

  async deleteCustomer(customerId: string): Promise<RezdyApiResponse> {
    return this.makeRequest(`/agent/customers/${customerId}`, {
      method: 'DELETE',
    });
  }

  // Categories and Locations
  async getCategories(): Promise<RezdyApiResponse> {
    return this.makeRequest('/marketplace/categories');
  }

  async getLocations(): Promise<RezdyApiResponse> {
    return this.makeRequest('/marketplace/locations');
  }

  async getSuppliers(): Promise<RezdyApiResponse> {
    return this.makeRequest('/marketplace/suppliers');
  }

  // Utility method for calculating pricing
  calculatePricing(
    basePrice: number,
    commissionRate: number = 0,
    discountRate: number = 0,
    fees: number = 0,
    taxRate: number = 0,
    currency: string = 'USD'
  ) {
    return calculateAgentPricing(basePrice, commissionRate, discountRate, fees, taxRate, currency);
  }

  // Utility method for calculating total quantity pricing
  calculateQuantityPricing(
    quantities: Array<{ optionId: number; value: number }>,
    pricing: Array<{ optionId: number; price: number; agentPrice?: number }>,
    useAgentPricing: boolean = false
  ): number {
    return calculateTotalQuantityPrice(quantities, pricing, useAgentPricing);
  }
}