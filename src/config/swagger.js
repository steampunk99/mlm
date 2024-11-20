const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Zillionaire MLM API',
      version: '1.0.0',
      description: `
## Overview
Professional API for the Zillionaire Network Marketing Platform. This API provides comprehensive functionality for managing multi-level marketing operations, including user management, network structures, financial operations, and administrative tasks.

## Authentication
The API uses JWT (JSON Web Token) for authentication. Include the JWT token in the Authorization header:
\`\`\`
Authorization: Bearer <your_token>
\`\`\`

## Rate Limiting
- 100 requests per 15 minutes per IP address
- Rate limit headers are included in responses

## Response Formats
All responses are in JSON format and include:
- \`success\`: Boolean indicating if the request was successful
- \`data\`: Response data (if any)
- \`message\`: Human-readable message
- \`error\`: Error details (if any)

## Error Handling
Standard HTTP status codes are used:
- 2xx: Success
- 4xx: Client errors
- 5xx: Server errors
      `,
      contact: {
        name: 'Zillionaire Support',
        url: 'https://zillionaire.com/support',
        email: 'support@zillionaire.com'
      },
      license: {
        name: 'Proprietary',
        url: 'https://zillionaire.com/terms'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Development server'
      },
      {
        url: 'https://api.zillionaire.com/v1',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              default: false
            },
            message: {
              type: 'string'
            },
            error: {
              type: 'object'
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              minimum: 1
            },
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: 100
            },
            totalPages: {
              type: 'integer'
            },
            totalItems: {
              type: 'integer'
            }
          }
        }
      },
      parameters: {
        PageParam: {
          in: 'query',
          name: 'page',
          schema: {
            type: 'integer',
            default: 1,
            minimum: 1
          },
          description: 'Page number for pagination'
        },
        LimitParam: {
          in: 'query',
          name: 'limit',
          schema: {
            type: 'integer',
            default: 10,
            minimum: 1,
            maximum: 100
          },
          description: 'Number of items per page'
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication information is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Unauthorized access',
                error: {
                  code: 'AUTH_ERROR',
                  details: 'Invalid or expired token'
                }
              }
            }
          }
        },
        ValidationError: {
          description: 'Invalid input data',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Validation failed',
                error: {
                  code: 'VALIDATION_ERROR',
                  details: {
                    field: ['Validation error message']
                  }
                }
              }
            }
          }
        },
        NotFoundError: {
          description: 'The requested resource was not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Resource not found',
                error: {
                  code: 'NOT_FOUND',
                  details: 'The requested resource does not exist'
                }
              }
            }
          }
        }
      }
    },
    security: [{
      bearerAuth: []
    }],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints'
      },
      {
        name: 'Network',
        description: 'MLM network structure and relationships'
      },
      {
        name: 'Packages',
        description: 'Investment package management'
      },
      {
        name: 'Finance',
        description: 'Financial operations including commissions and withdrawals'
      },
      {
        name: 'Admin',
        description: 'Administrative operations and system management'
      },
      {
        name: 'Reports',
        description: 'Statistical reports and analytics'
      },
      {
        name: 'Notifications',
        description: 'User notifications and announcements'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/models/*.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
