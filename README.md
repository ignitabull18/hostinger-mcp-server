# Hostinger MCP Server

A Model Context Protocol (MCP) server for Hostinger API integration. This server enables natural language interactions with your Hostinger hosting services through Claude and other AI assistants.

## Features

### VPS Management
- List, start, stop, and restart VPS instances
- Get VPS details and resource usage statistics
- Monitor VPS performance metrics

### Domain Management
- List and manage domains
- Full DNS record management (A, AAAA, CNAME, MX, TXT, NS, SRV)
- Create, update, and delete DNS records

### Hosting Account Management
- List and manage hosting accounts
- Monitor resource usage and quotas
- Account details and statistics

### Email Management
- List, create, and delete email accounts
- Manage email quotas and settings
- Domain-based email administration

### SSL Certificate Management
- List and manage SSL certificates
- Create Let's Encrypt and paid SSL certificates
- Monitor certificate status and expiration

### Backup Management
- List backups for hosting accounts and VPS
- Create manual backups
- Restore from backups

### Account Information
- Get account details and balance
- List invoices and billing information
- Account usage statistics

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and configure your Hostinger API key:
   ```bash
   cp .env.example .env
   ```
4. Edit `.env` with your Hostinger API credentials

## Configuration

Set the following environment variables:

- `HOSTINGER_API_KEY`: Your Hostinger API key (required)
- `HOSTINGER_BASE_URL`: Hostinger API base URL (default: https://api.hostinger.com)
- `PORT`: Health check server port (default: 3000)
- `DEBUG`: Enable debug mode (default: false)

## Usage

### Standalone
```bash
npm start
```

### With Claude Desktop
Add to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "hostinger-api": {
      "command": "node",
      "args": ["/path/to/hostinger-mcp-server/index.js"],
      "env": {
        "HOSTINGER_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### With Docker
```bash
docker build -t hostinger-mcp-server .
docker run -e HOSTINGER_API_KEY=your_api_key_here hostinger-mcp-server
```

## Available Tools

The server provides the following tools for natural language interaction:

### VPS Tools
- `list_vps` - List all VPS instances
- `get_vps` - Get VPS details
- `start_vps` - Start a VPS
- `stop_vps` - Stop a VPS
- `restart_vps` - Restart a VPS
- `get_vps_usage` - Get VPS resource usage

### Domain Tools
- `list_domains` - List all domains
- `get_domain` - Get domain details
- `get_domain_dns` - Get DNS records
- `create_dns_record` - Create DNS record
- `update_dns_record` - Update DNS record
- `delete_dns_record` - Delete DNS record

### Hosting Tools
- `list_hosting_accounts` - List hosting accounts
- `get_hosting_account` - Get hosting account details
- `get_hosting_usage` - Get hosting usage statistics

### Email Tools
- `list_email_accounts` - List email accounts
- `create_email_account` - Create email account
- `delete_email_account` - Delete email account

### SSL Tools
- `list_ssl_certificates` - List SSL certificates
- `get_ssl_certificate` - Get SSL certificate details
- `create_ssl_certificate` - Create/order SSL certificate

### Backup Tools
- `list_backups` - List backups
- `create_backup` - Create manual backup
- `restore_backup` - Restore from backup

### Account Tools
- `get_account_info` - Get account information
- `get_invoices` - List invoices

## Example Usage

Once connected to Claude, you can use natural language commands like:

- "List all my VPS instances"
- "Show me the DNS records for example.com"
- "Create an A record pointing www to 192.168.1.1"
- "What's my hosting account usage?"
- "Create a backup of my VPS"
- "Show me my recent invoices"

## Health Check

The server includes a health check endpoint at `http://localhost:3000/health` for monitoring and container orchestration.

## Development

```bash
# Development mode with debugging
npm run dev
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.