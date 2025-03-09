# FusionAI Orchestration Tool for Blockchain

A powerful orchestration tool that combines AI agents with blockchain networks for automated management and monitoring.

## Features

- Real-time blockchain network monitoring
- AI agent orchestration with multiple capabilities
- Interactive workflow canvas
- Performance monitoring and alerting
- Multi-network blockchain support (Ethereum, Polygon, Hyperledger)

## Prerequisites

- Node.js 16.x or later
- Docker and Docker Compose
- Git

## Quick Start

1. Clone the repository:
```bash
git clone https://github.com/yourusername/FusionAI-Orchestrator-Tool-for-Blockchain.git
cd FusionAI-Orchestrator-Tool-for-Blockchain
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
- Copy `.env.example` files in each package to `.env`
- Configure the necessary API keys and endpoints

4. Start the development environment:
```bash
docker-compose up -d
```

5. Start the development servers:
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Monitoring Tools:
  - Grafana: http://localhost:3000
  - Prometheus: http://localhost:9090
  - Redis Commander: http://localhost:8081

## Project Structure

```
packages/
  ├── ai-agents/          # AI agent implementation
  ├── backend/            # API and business logic
  ├── blockchain/         # Blockchain network integration
  ├── common/             # Shared utilities and types
  ├── frontend/          # React-based UI
  ├── monitoring/        # Monitoring and alerting system
  └── infrastructure/    # Infrastructure management
```

## Monitoring System

The monitoring system provides real-time insights into:

### Blockchain Metrics
- Block time
- Gas prices
- Transaction counts
- Network peer counts

### AI Agent Metrics
- Execution time
- Confidence scores
- Error rates
- Resource usage

### System Metrics
- CPU usage
- Memory usage
- API latency

Access the monitoring dashboard at http://localhost:3000 (Grafana) with:
- Username: admin
- Password: admin

## Development Workflow

1. Create a new workflow in the UI
2. Add blockchain nodes and AI agents
3. Configure node properties and connections
4. Deploy smart contracts using the blockchain nodes
5. Monitor performance in real-time

## API Documentation

API documentation is available at http://localhost:4000/docs when running in development mode.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Monitoring Setup

### Redis
- Used for caching and real-time metrics
- Data persistence enabled
- Monitor using Redis Commander at http://localhost:8081

### Prometheus
- Collects metrics from all services
- Configured for blockchain, AI agents, and system metrics
- Access at http://localhost:9090

### Grafana
- Pre-configured dashboards for monitoring
- Customizable alerts
- Access at http://localhost:3000

## Troubleshooting

### Common Issues

1. Redis Connection Issues
```bash
# Check Redis status
docker-compose ps redis
# View Redis logs
docker-compose logs redis
```

2. Blockchain Node Sync
```bash
# Check Besu logs
docker-compose logs besu
```

3. Monitoring System
```bash
# Restart monitoring stack
docker-compose restart prometheus grafana
```

## License

MIT License - see LICENSE file for details