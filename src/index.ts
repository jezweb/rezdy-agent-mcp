#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { RezdyAgentClient } from './agent-client.js';
import { RezdyAgentConfigSchema } from './types.js';
import {
  SearchProductsSchema,
  SearchAvailabilitySchema,
  QuoteBookingSchema,
  CreateBookingSchema,
  UpdateBookingSchema,
  SearchCustomersSchema,
  CreateCustomerSchema,
} from './types.js';

class RezdyAgentServer {
  private server: Server;
  private rezdyClient: RezdyAgentClient | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'rezdy-agent-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'rezdy_agent_configure',
            description: 'Configure Rezdy Agent API connection with API key and environment',
            inputSchema: {
              type: 'object',
              properties: {
                apiKey: {
                  type: 'string',
                  description: 'Rezdy Agent API key',
                },
                environment: {
                  type: 'string',
                  enum: ['production', 'staging'],
                  description: 'API environment (production or staging)',
                  default: 'production',
                },
              },
              required: ['apiKey'],
            },
          },
          {
            name: 'rezdy_agent_search_products',
            description: 'Search marketplace products from all suppliers',
            inputSchema: {
              type: 'object',
              properties: {
                limit: { type: 'number', description: 'Maximum number of results' },
                offset: { type: 'number', description: 'Offset for pagination' },
                productCode: { type: 'string', description: 'Product code to filter by' },
                name: { type: 'string', description: 'Product name to search for' },
                categoryId: { type: 'number', description: 'Category ID to filter by' },
                supplierId: { type: 'number', description: 'Supplier ID to filter by' },
                location: { type: 'string', description: 'Location to filter by' },
                region: { type: 'string', description: 'Region to filter by' },
                country: { type: 'string', description: 'Country to filter by' },
                minPrice: { type: 'number', description: 'Minimum price filter' },
                maxPrice: { type: 'number', description: 'Maximum price filter' },
                duration: { type: 'number', description: 'Duration in minutes' },
                tags: { 
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Tags to filter by'
                },
              },
            },
          },
          {
            name: 'rezdy_agent_get_product',
            description: 'Get detailed information about a specific marketplace product',
            inputSchema: {
              type: 'object',
              properties: {
                productId: { type: 'number', description: 'Product ID' },
              },
              required: ['productId'],
            },
          },
          {
            name: 'rezdy_agent_get_product_pickups',
            description: 'Get pickup locations for a specific product',
            inputSchema: {
              type: 'object',
              properties: {
                productId: { type: 'number', description: 'Product ID' },
              },
              required: ['productId'],
            },
          },
          {
            name: 'rezdy_agent_search_availability',
            description: 'Search availability sessions for a product with pricing',
            inputSchema: {
              type: 'object',
              properties: {
                productId: { type: 'number', description: 'Product ID' },
                startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                endDate: { type: 'string', description: 'End date (YYYY-MM-DD)' },
                quantities: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      optionId: { type: 'number' },
                      value: { type: 'number' },
                    },
                    required: ['optionId', 'value'],
                  },
                  description: 'Quantities for pricing calculation',
                },
                limit: { type: 'number', description: 'Maximum number of results' },
                offset: { type: 'number', description: 'Offset for pagination' },
              },
              required: ['productId', 'startDate', 'endDate'],
            },
          },
          {
            name: 'rezdy_agent_quote_booking',
            description: 'Get a quote for a booking with pricing details',
            inputSchema: {
              type: 'object',
              properties: {
                productId: { type: 'number', description: 'Product ID' },
                sessionId: { type: 'string', description: 'Session ID (optional for some booking modes)' },
                startTime: { type: 'string', description: 'Start time (ISO format, optional)' },
                quantities: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      optionId: { type: 'number' },
                      value: { type: 'number' },
                    },
                    required: ['optionId', 'value'],
                  },
                  description: 'Booking quantities',
                },
                customer: {
                  type: 'object',
                  properties: {
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    email: { type: 'string' },
                    phone: { type: 'string' },
                    dateOfBirth: { type: 'string' },
                    nationality: { type: 'string' },
                  },
                  required: ['firstName', 'lastName', 'email'],
                  description: 'Customer information (optional for quote)',
                },
                agentReference: { type: 'string', description: 'Agent reference number' },
                paymentType: {
                  type: 'string',
                  enum: ['MANUAL', 'AUTOMATED'],
                  description: 'Payment processing type',
                  default: 'MANUAL'
                },
                promoCode: { type: 'string', description: 'Promotional code' },
              },
              required: ['productId', 'quantities'],
            },
          },
          {
            name: 'rezdy_agent_create_booking',
            description: 'Create a confirmed booking',
            inputSchema: {
              type: 'object',
              properties: {
                productId: { type: 'number', description: 'Product ID' },
                sessionId: { type: 'string', description: 'Session ID (optional for some booking modes)' },
                startTime: { type: 'string', description: 'Start time (ISO format, optional)' },
                quantities: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      optionId: { type: 'number' },
                      value: { type: 'number' },
                    },
                    required: ['optionId', 'value'],
                  },
                  description: 'Booking quantities',
                },
                customer: {
                  type: 'object',
                  properties: {
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    email: { type: 'string' },
                    phone: { type: 'string' },
                    dateOfBirth: { type: 'string' },
                    nationality: { type: 'string' },
                    address: {
                      type: 'object',
                      properties: {
                        street: { type: 'string' },
                        city: { type: 'string' },
                        state: { type: 'string' },
                        postalCode: { type: 'string' },
                        country: { type: 'string' },
                      },
                    },
                  },
                  required: ['firstName', 'lastName', 'email'],
                  description: 'Customer information',
                },
                participants: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      firstName: { type: 'string' },
                      lastName: { type: 'string' },
                      email: { type: 'string' },
                      phone: { type: 'string' },
                      dateOfBirth: { type: 'string' },
                      nationality: { type: 'string' },
                    },
                    required: ['firstName', 'lastName'],
                  },
                  description: 'Additional participants',
                },
                fields: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      fieldId: { type: 'number' },
                      value: { type: 'string' },
                    },
                    required: ['fieldId', 'value'],
                  },
                  description: 'Custom booking fields',
                },
                agentReference: { type: 'string', description: 'Agent reference number' },
                paymentType: {
                  type: 'string',
                  enum: ['MANUAL', 'AUTOMATED'],
                  description: 'Payment processing type',
                  default: 'MANUAL'
                },
                promoCode: { type: 'string', description: 'Promotional code' },
                notes: { type: 'string', description: 'Booking notes' },
              },
              required: ['productId', 'quantities', 'customer'],
            },
          },
          {
            name: 'rezdy_agent_get_booking',
            description: 'Get details of a specific booking',
            inputSchema: {
              type: 'object',
              properties: {
                bookingId: { type: 'string', description: 'Booking ID' },
              },
              required: ['bookingId'],
            },
          },
          {
            name: 'rezdy_agent_update_booking',
            description: 'Update an existing booking',
            inputSchema: {
              type: 'object',
              properties: {
                bookingId: { type: 'string', description: 'Booking ID' },
                customer: {
                  type: 'object',
                  properties: {
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    email: { type: 'string' },
                    phone: { type: 'string' },
                  },
                  required: ['firstName', 'lastName', 'email'],
                  description: 'Updated customer information',
                },
                participants: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      firstName: { type: 'string' },
                      lastName: { type: 'string' },
                      email: { type: 'string' },
                      phone: { type: 'string' },
                    },
                    required: ['firstName', 'lastName'],
                  },
                  description: 'Updated participants',
                },
                fields: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      fieldId: { type: 'number' },
                      value: { type: 'string' },
                    },
                    required: ['fieldId', 'value'],
                  },
                  description: 'Updated custom fields',
                },
                agentReference: { type: 'string', description: 'Updated agent reference' },
                notes: { type: 'string', description: 'Updated booking notes' },
              },
              required: ['bookingId'],
            },
          },
          {
            name: 'rezdy_agent_cancel_booking',
            description: 'Cancel an existing booking',
            inputSchema: {
              type: 'object',
              properties: {
                bookingId: { type: 'string', description: 'Booking ID' },
                reason: { type: 'string', description: 'Cancellation reason' },
              },
              required: ['bookingId'],
            },
          },
          {
            name: 'rezdy_agent_search_customers',
            description: 'Search agent customer database',
            inputSchema: {
              type: 'object',
              properties: {
                limit: { type: 'number', description: 'Maximum number of results' },
                offset: { type: 'number', description: 'Offset for pagination' },
                email: { type: 'string', description: 'Customer email to search for' },
                firstName: { type: 'string', description: 'Customer first name' },
                lastName: { type: 'string', description: 'Customer last name' },
                phone: { type: 'string', description: 'Customer phone number' },
              },
            },
          },
          {
            name: 'rezdy_agent_create_customer',
            description: 'Create a new customer profile',
            inputSchema: {
              type: 'object',
              properties: {
                firstName: { type: 'string', description: 'Customer first name' },
                lastName: { type: 'string', description: 'Customer last name' },
                email: { type: 'string', description: 'Customer email address' },
                phone: { type: 'string', description: 'Customer phone number' },
                dateOfBirth: { type: 'string', description: 'Date of birth (YYYY-MM-DD)' },
                nationality: { type: 'string', description: 'Customer nationality' },
                address: {
                  type: 'object',
                  properties: {
                    street: { type: 'string' },
                    city: { type: 'string' },
                    state: { type: 'string' },
                    postalCode: { type: 'string' },
                    country: { type: 'string' },
                  },
                  description: 'Customer address',
                },
                notes: { type: 'string', description: 'Customer notes' },
              },
              required: ['firstName', 'lastName', 'email'],
            },
          },
          {
            name: 'rezdy_agent_get_customer',
            description: 'Get details of a specific customer',
            inputSchema: {
              type: 'object',
              properties: {
                customerId: { type: 'string', description: 'Customer ID' },
              },
              required: ['customerId'],
            },
          },
          {
            name: 'rezdy_agent_get_categories',
            description: 'Get all marketplace product categories',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'rezdy_agent_get_locations',
            description: 'Get all marketplace locations',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'rezdy_agent_get_suppliers',
            description: 'Get all marketplace suppliers',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'rezdy_agent_configure':
            return await this.handleConfigure(args);
          case 'rezdy_agent_search_products':
            return await this.handleSearchProducts(args);
          case 'rezdy_agent_get_product':
            return await this.handleGetProduct(args);
          case 'rezdy_agent_get_product_pickups':
            return await this.handleGetProductPickups(args);
          case 'rezdy_agent_search_availability':
            return await this.handleSearchAvailability(args);
          case 'rezdy_agent_quote_booking':
            return await this.handleQuoteBooking(args);
          case 'rezdy_agent_create_booking':
            return await this.handleCreateBooking(args);
          case 'rezdy_agent_get_booking':
            return await this.handleGetBooking(args);
          case 'rezdy_agent_update_booking':
            return await this.handleUpdateBooking(args);
          case 'rezdy_agent_cancel_booking':
            return await this.handleCancelBooking(args);
          case 'rezdy_agent_search_customers':
            return await this.handleSearchCustomers(args);
          case 'rezdy_agent_create_customer':
            return await this.handleCreateCustomer(args);
          case 'rezdy_agent_get_customer':
            return await this.handleGetCustomer(args);
          case 'rezdy_agent_get_categories':
            return await this.handleGetCategories(args);
          case 'rezdy_agent_get_locations':
            return await this.handleGetLocations(args);
          case 'rezdy_agent_get_suppliers':
            return await this.handleGetSuppliers(args);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });
  }

  private async handleConfigure(args: any) {
    const config = RezdyAgentConfigSchema.parse(args);
    this.rezdyClient = new RezdyAgentClient(config);
    
    return {
      content: [
        {
          type: 'text',
          text: `Rezdy Agent API configured successfully for ${config.environment} environment`,
        },
      ],
    };
  }

  private ensureClient(): RezdyAgentClient {
    if (!this.rezdyClient) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'Rezdy Agent client not configured. Please run rezdy_agent_configure first.'
      );
    }
    return this.rezdyClient;
  }

  private async handleSearchProducts(args: any) {
    const client = this.ensureClient();
    const params = SearchProductsSchema.parse(args);
    const response = await client.searchProducts(params);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  private async handleGetProduct(args: any) {
    const client = this.ensureClient();
    const { productId } = args;
    const response = await client.getProduct(productId);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  private async handleGetProductPickups(args: any) {
    const client = this.ensureClient();
    const { productId } = args;
    const response = await client.getProductPickups(productId);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  private async handleSearchAvailability(args: any) {
    const client = this.ensureClient();
    const params = SearchAvailabilitySchema.parse(args);
    const response = await client.searchAvailability(params);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  private async handleQuoteBooking(args: any) {
    const client = this.ensureClient();
    const params = QuoteBookingSchema.parse(args);
    const response = await client.quoteBooking(params);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  private async handleCreateBooking(args: any) {
    const client = this.ensureClient();
    const params = CreateBookingSchema.parse(args);
    const response = await client.createBooking(params);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  private async handleGetBooking(args: any) {
    const client = this.ensureClient();
    const { bookingId } = args;
    const response = await client.getBooking(bookingId);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  private async handleUpdateBooking(args: any) {
    const client = this.ensureClient();
    const { bookingId, ...params } = args;
    const updateParams = UpdateBookingSchema.parse(params);
    const response = await client.updateBooking(bookingId, updateParams);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  private async handleCancelBooking(args: any) {
    const client = this.ensureClient();
    const { bookingId, reason } = args;
    const response = await client.cancelBooking(bookingId, reason);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  private async handleSearchCustomers(args: any) {
    const client = this.ensureClient();
    const params = SearchCustomersSchema.parse(args);
    const response = await client.searchCustomers(params);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  private async handleCreateCustomer(args: any) {
    const client = this.ensureClient();
    const params = CreateCustomerSchema.parse(args);
    const response = await client.createCustomer(params);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  private async handleGetCustomer(args: any) {
    const client = this.ensureClient();
    const { customerId } = args;
    const response = await client.getCustomer(customerId);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  private async handleGetCategories(args: any) {
    const client = this.ensureClient();
    const response = await client.getCategories();
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  private async handleGetLocations(args: any) {
    const client = this.ensureClient();
    const response = await client.getLocations();
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  private async handleGetSuppliers(args: any) {
    const client = this.ensureClient();
    const response = await client.getSuppliers();
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Rezdy Agent MCP server running on stdio');
  }
}

const server = new RezdyAgentServer();
server.run().catch(console.error);