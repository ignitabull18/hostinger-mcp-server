#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import express from 'express';
import http from 'http';

class HostingerMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "hostinger-api",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.apiKey = process.env.HOSTINGER_API_KEY;
    this.baseUrl = process.env.HOSTINGER_BASE_URL || "https://api.hostinger.com";
    
    if (!this.apiKey) {
      throw new Error("HOSTINGER_API_KEY environment variable is required");
    }

    this.setupToolHandlers();
    this.setupExpressServer();
  }

  setupExpressServer() {
    this.app = express();
    this.app.use(express.json());

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'hostinger-mcp-server',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });

    // Root endpoint for basic info
    this.app.get('/', (req, res) => {
      res.json({
        name: 'hostinger-mcp-server',
        version: '1.0.0',
        description: 'Hostinger MCP Server for API integration',
        endpoints: {
          health: '/health',
          mcp: '/mcp'
        }
      });
    });

    // SSE endpoint for MCP communication
    this.app.get('/sse', async (req, res) => {
      const transport = new SSEServerTransport('/sse', res);
      await this.server.connect(transport);
    });

    // MCP endpoint for JSON-RPC communication
    this.app.post('/mcp', async (req, res) => {
      try {
        const request = req.body;
        
        // Validate JSON-RPC format
        if (!request.jsonrpc || request.jsonrpc !== "2.0") {
          return res.status(400).json({
            jsonrpc: "2.0",
            error: {
              code: -32600,
              message: "Invalid Request"
            },
            id: request.id || null
          });
        }

        let response;
        
        if (request.method === "tools/list") {
          response = await this.handleListTools();
        } else if (request.method === "tools/call") {
          response = await this.handleCallTool(request.params);
        } else {
          return res.status(400).json({
            jsonrpc: "2.0",
            error: {
              code: -32601,
              message: "Method not found"
            },
            id: request.id
          });
        }

        res.json({
          jsonrpc: "2.0",
          result: response,
          id: request.id
        });

      } catch (error) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal error",
            data: error.message
          },
          id: req.body.id || null
        });
      }
    });

    const port = process.env.PORT || 3000;
    this.httpServer = this.app.listen(port, () => {
      console.error(`Hostinger MCP server listening on port ${port}`);
      console.error(`Health check: http://localhost:${port}/health`);
      console.error(`MCP endpoint: http://localhost:${port}/mcp`);
    });
  }

  async handleListTools() {
    return {
      tools: [
        // VPS Management
        {
          name: "list_vps",
          description: "List all VPS instances",
          inputSchema: {
            type: "object",
            properties: {},
          }
        },
        {
          name: "get_vps",
          description: "Get details of a specific VPS instance",
          inputSchema: {
            type: "object",
            properties: {
              vps_id: { type: "string", description: "VPS ID" }
            },
            required: ["vps_id"]
          }
        },
        {
          name: "start_vps",
          description: "Start a VPS instance",
          inputSchema: {
            type: "object",
            properties: {
              vps_id: { type: "string", description: "VPS ID" }
            },
            required: ["vps_id"]
          }
        },
        {
          name: "stop_vps",
          description: "Stop a VPS instance",
          inputSchema: {
            type: "object",
            properties: {
              vps_id: { type: "string", description: "VPS ID" }
            },
            required: ["vps_id"]
          }
        },
        {
          name: "restart_vps",
          description: "Restart a VPS instance",
          inputSchema: {
            type: "object",
            properties: {
              vps_id: { type: "string", description: "VPS ID" }
            },
            required: ["vps_id"]
          }
        },
        {
          name: "get_vps_usage",
          description: "Get resource usage statistics for a VPS",
          inputSchema: {
            type: "object",
            properties: {
              vps_id: { type: "string", description: "VPS ID" },
              period: { 
                type: "string", 
                description: "Time period for statistics",
                enum: ["1h", "24h", "7d", "30d"]
              }
            },
            required: ["vps_id"]
          }
        },

        // Domain Management
        {
          name: "list_domains",
          description: "List all domains",
          inputSchema: {
            type: "object",
            properties: {},
          }
        },
        {
          name: "get_domain",
          description: "Get details of a specific domain",
          inputSchema: {
            type: "object",
            properties: {
              domain_id: { type: "string", description: "Domain ID" }
            },
            required: ["domain_id"]
          }
        },
        {
          name: "get_domain_dns",
          description: "Get DNS records for a domain",
          inputSchema: {
            type: "object",
            properties: {
              domain_id: { type: "string", description: "Domain ID" }
            },
            required: ["domain_id"]
          }
        },
        {
          name: "create_dns_record",
          description: "Create a new DNS record",
          inputSchema: {
            type: "object",
            properties: {
              domain_id: { type: "string", description: "Domain ID" },
              type: { 
                type: "string", 
                description: "DNS record type",
                enum: ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV"]
              },
              name: { type: "string", description: "Record name" },
              content: { type: "string", description: "Record content/value" },
              ttl: { type: "number", description: "Time to live (seconds)" },
              priority: { type: "number", description: "Priority (for MX records)" }
            },
            required: ["domain_id", "type", "name", "content"]
          }
        },
        {
          name: "update_dns_record",
          description: "Update an existing DNS record",
          inputSchema: {
            type: "object",
            properties: {
              domain_id: { type: "string", description: "Domain ID" },
              record_id: { type: "string", description: "DNS record ID" },
              type: { 
                type: "string", 
                description: "DNS record type",
                enum: ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV"]
              },
              name: { type: "string", description: "Record name" },
              content: { type: "string", description: "Record content/value" },
              ttl: { type: "number", description: "Time to live (seconds)" },
              priority: { type: "number", description: "Priority (for MX records)" }
            },
            required: ["domain_id", "record_id"]
          }
        },
        {
          name: "delete_dns_record",
          description: "Delete a DNS record",
          inputSchema: {
            type: "object",
            properties: {
              domain_id: { type: "string", description: "Domain ID" },
              record_id: { type: "string", description: "DNS record ID" }
            },
            required: ["domain_id", "record_id"]
          }
        },

        // Hosting Account Management
        {
          name: "list_hosting_accounts",
          description: "List all hosting accounts",
          inputSchema: {
            type: "object",
            properties: {},
          }
        },
        {
          name: "get_hosting_account",
          description: "Get details of a specific hosting account",
          inputSchema: {
            type: "object",
            properties: {
              account_id: { type: "string", description: "Hosting account ID" }
            },
            required: ["account_id"]
          }
        },
        {
          name: "get_hosting_usage",
          description: "Get resource usage for a hosting account",
          inputSchema: {
            type: "object",
            properties: {
              account_id: { type: "string", description: "Hosting account ID" }
            },
            required: ["account_id"]
          }
        },

        // Email Management
        {
          name: "list_email_accounts",
          description: "List email accounts for a domain",
          inputSchema: {
            type: "object",
            properties: {
              domain_id: { type: "string", description: "Domain ID" }
            },
            required: ["domain_id"]
          }
        },
        {
          name: "create_email_account",
          description: "Create a new email account",
          inputSchema: {
            type: "object",
            properties: {
              domain_id: { type: "string", description: "Domain ID" },
              email: { type: "string", description: "Email address" },
              password: { type: "string", description: "Password" },
              quota: { type: "number", description: "Quota in MB" }
            },
            required: ["domain_id", "email", "password"]
          }
        },
        {
          name: "delete_email_account",
          description: "Delete an email account",
          inputSchema: {
            type: "object",
            properties: {
              domain_id: { type: "string", description: "Domain ID" },
              email: { type: "string", description: "Email address" }
            },
            required: ["domain_id", "email"]
          }
        },

        // Account Information
        {
          name: "get_account_info",
          description: "Get account information and balance",
          inputSchema: {
            type: "object",
            properties: {},
          }
        }
      ]
    };
  }

  async handleCallTool(params) {
    const { name, arguments: args } = params;

    try {
      switch (name) {
        // VPS operations
        case "list_vps":
          return await this.listVPS();
        case "get_vps":
          return await this.getVPS(args.vps_id);
        case "start_vps":
          return await this.startVPS(args.vps_id);
        case "stop_vps":
          return await this.stopVPS(args.vps_id);
        case "restart_vps":
          return await this.restartVPS(args.vps_id);
        case "get_vps_usage":
          return await this.getVPSUsage(args.vps_id, args.period);

        // Domain operations
        case "list_domains":
          return await this.listDomains();
        case "get_domain":
          return await this.getDomain(args.domain_id);
        case "get_domain_dns":
          return await this.getDomainDNS(args.domain_id);
        case "create_dns_record":
          return await this.createDNSRecord(args);
        case "update_dns_record":
          return await this.updateDNSRecord(args);
        case "delete_dns_record":
          return await this.deleteDNSRecord(args.domain_id, args.record_id);

        // Hosting operations
        case "list_hosting_accounts":
          return await this.listHostingAccounts();
        case "get_hosting_account":
          return await this.getHostingAccount(args.account_id);
        case "get_hosting_usage":
          return await this.getHostingUsage(args.account_id);

        // Email operations
        case "list_email_accounts":
          return await this.listEmailAccounts(args.domain_id);
        case "create_email_account":
          return await this.createEmailAccount(args);
        case "delete_email_account":
          return await this.deleteEmailAccount(args.domain_id, args.email);

        // Account operations
        case "get_account_info":
          return await this.getAccountInfo();

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`
          }
        ]
      };
    }
  }

  async makeRequest(endpoint, method = "GET", data = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const options = {
      method,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    };

    if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw new Error(`API request failed: ${error.message}`);
    }
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return await this.handleListTools();
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      return await this.handleCallTool(request.params);
    });
  }

  // VPS methods
  async listVPS() {
    const result = await this.makeRequest("/v1/vps");
    return {
      content: [
        {
          type: "text",
          text: `VPS instances: ${JSON.stringify(result, null, 2)}`
        }
      ]
    };
  }

  async getVPS(vpsId) {
    const result = await this.makeRequest(`/v1/vps/${vpsId}`);
    return {
      content: [
        {
          type: "text",
          text: `VPS details: ${JSON.stringify(result, null, 2)}`
        }
      ]
    };
  }

  async startVPS(vpsId) {
    const result = await this.makeRequest(`/v1/vps/${vpsId}/start`, "POST");
    return {
      content: [
        {
          type: "text",
          text: `VPS start result: ${JSON.stringify(result, null, 2)}`
        }
      ]
    };
  }

  async stopVPS(vpsId) {
    const result = await this.makeRequest(`/v1/vps/${vpsId}/stop`, "POST");
    return {
      content: [
        {
          type: "text",
          text: `VPS stop result: ${JSON.stringify(result, null, 2)}`
        }
      ]
    };
  }

  async restartVPS(vpsId) {
    const result = await this.makeRequest(`/v1/vps/${vpsId}/restart`, "POST");
    return {
      content: [
        {
          type: "text",
          text: `VPS restart result: ${JSON.stringify(result, null, 2)}`
        }
      ]
    };
  }

  async getVPSUsage(vpsId, period = "24h") {
    const result = await this.makeRequest(`/v1/vps/${vpsId}/usage?period=${period}`);
    return {
      content: [
        {
          type: "text",
          text: `VPS usage statistics: ${JSON.stringify(result, null, 2)}`
        }
      ]
    };
  }

  // Domain methods
  async listDomains() {
    const result = await this.makeRequest("/v1/domains");
    return {
      content: [
        {
          type: "text",
          text: `Domains: ${JSON.stringify(result, null, 2)}`
        }
      ]
    };
  }

  async getDomain(domainId) {
    const result = await this.makeRequest(`/v1/domains/${domainId}`);
    return {
      content: [
        {
          type: "text",
          text: `Domain details: ${JSON.stringify(result, null, 2)}`
        }
      ]
    };
  }

  async getDomainDNS(domainId) {
    const result = await this.makeRequest(`/v1/domains/${domainId}/dns`);
    return {
      content: [
        {
          type: "text",
          text: `DNS records: ${JSON.stringify(result, null, 2)}`
        }
      ]
    };
  }

  async createDNSRecord(data) {
    const { domain_id, ...recordData } = data;
    const result = await this.makeRequest(`/v1/domains/${domain_id}/dns`, "POST", recordData);
    return {
      content: [
        {
          type: "text",
          text: `Created DNS record: ${JSON.stringify(result, null, 2)}`
        }
      ]
    };
  }

  async updateDNSRecord(data) {
    const { domain_id, record_id, ...recordData } = data;
    const result = await this.makeRequest(`/v1/domains/${domain_id}/dns/${record_id}`, "PUT", recordData);
    return {
      content: [
        {
          type: "text",
          text: `Updated DNS record: ${JSON.stringify(result, null, 2)}`
        }
      ]
    };
  }

  async deleteDNSRecord(domainId, recordId) {
    await this.makeRequest(`/v1/domains/${domainId}/dns/${recordId}`, "DELETE");
    return {
      content: [
        {
          type: "text",
          text: `Successfully deleted DNS record ${recordId}`
        }
      ]
    };
  }

  // Hosting methods
  async listHostingAccounts() {
    const result = await this.makeRequest("/v1/hosting");
    return {
      content: [
        {
          type: "text",
          text: `Hosting accounts: ${JSON.stringify(result, null, 2)}`
        }
      ]
    };
  }

  async getHostingAccount(accountId) {
    const result = await this.makeRequest(`/v1/hosting/${accountId}`);
    return {
      content: [
        {
          type: "text",
          text: `Hosting account details: ${JSON.stringify(result, null, 2)}`
        }
      ]
    };
  }

  async getHostingUsage(accountId) {
    const result = await this.makeRequest(`/v1/hosting/${accountId}/usage`);
    return {
      content: [
        {
          type: "text",
          text: `Hosting usage: ${JSON.stringify(result, null, 2)}`
        }
      ]
    };
  }

  // Email methods
  async listEmailAccounts(domainId) {
    const result = await this.makeRequest(`/v1/domains/${domainId}/email`);
    return {
      content: [
        {
          type: "text",
          text: `Email accounts: ${JSON.stringify(result, null, 2)}`
        }
      ]
    };
  }

  async createEmailAccount(data) {
    const { domain_id, ...emailData } = data;
    const result = await this.makeRequest(`/v1/domains/${domain_id}/email`, "POST", emailData);
    return {
      content: [
        {
          type: "text",
          text: `Created email account: ${JSON.stringify(result, null, 2)}`
        }
      ]
    };
  }

  async deleteEmailAccount(domainId, email) {
    await this.makeRequest(`/v1/domains/${domainId}/email/${email}`, "DELETE");
    return {
      content: [
        {
          type: "text",
          text: `Successfully deleted email account ${email}`
        }
      ]
    };
  }

  // Account methods
  async getAccountInfo() {
    const result = await this.makeRequest("/v1/account");
    return {
      content: [
        {
          type: "text",
          text: `Account information: ${JSON.stringify(result, null, 2)}`
        }
      ]
    };
  }

  async run() {
    // Start HTTP server for web-based MCP communication
    console.error("Hostinger MCP server starting...");
    
    // If running in stdio mode (for local development)
    if (process.env.MCP_MODE === 'stdio') {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error("Hostinger MCP server running on stdio");
    } else {
      // HTTP mode is handled by Express server setup
      console.error("Hostinger MCP server running in HTTP mode");
    }
  }
}

const server = new HostingerMCPServer();
server.run().catch(console.error);