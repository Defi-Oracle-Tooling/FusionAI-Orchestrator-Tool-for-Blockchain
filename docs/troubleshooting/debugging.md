# Debugging Guide

This guide provides instructions for debugging issues with the FusionAI Orchestrator Tool.

## Prerequisites

- Access to the FusionAI Orchestrator Tool deployment
- Basic understanding of the system architecture
- Familiarity with debugging tools

## Debugging Workflow

When debugging issues with the FusionAI Orchestrator Tool, follow this general workflow:

1. **Identify the Issue**: Clearly define the problem you're experiencing
2. **Gather Information**: Collect logs, error messages, and other relevant information
3. **Isolate the Component**: Determine which component is causing the issue
4. **Reproduce the Issue**: Find a reliable way to reproduce the issue
5. **Analyze the Root Cause**: Investigate the underlying cause of the issue
6. **Implement a Fix**: Make changes to resolve the issue
7. **Verify the Fix**: Confirm that the issue is resolved

## Debugging Tools

### Logging

The FusionAI Orchestrator Tool uses a structured logging system that outputs logs to the console and log files. Logs are categorized by severity level:

- **ERROR**: Critical issues that require immediate attention
- **WARN**: Potential issues that might cause problems
- **INFO**: General information about the system operation
- **DEBUG**: Detailed information for debugging purposes

To view logs:

```bash
# View logs for all services
docker-compose logs

# View logs for a specific service
docker-compose logs backend

# View logs for a specific service with timestamps
docker-compose logs --timestamps backend

# Follow logs for a specific service
docker-compose logs -f backend
```

### Debugging Backend Issues

#### Enable Debug Logging

To enable debug logging for the backend service, set the `LOG_LEVEL` environment variable to `debug`:

```bash
# In the backend .env file
LOG_LEVEL=debug
```

#### Use the Debug Endpoint

The backend service provides a debug endpoint that returns information about the current state of the system:

```bash
curl http://localhost:4000/debug
```

#### Use Node.js Debugging

You can use the Node.js debugger to debug the backend service:

1. Start the backend service with the `--inspect` flag:
   ```bash
   node --inspect packages/backend/dist/index.js
   ```

2. Connect to the debugger using Chrome DevTools:
   - Open Chrome
   - Navigate to `chrome://inspect`
   - Click on "Open dedicated DevTools for Node"

#### Use Visual Studio Code Debugging

You can use Visual Studio Code to debug the backend service:

1. Create a `.vscode/launch.json` file:
   ```json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "type": "node",
         "request": "launch",
         "name": "Debug Backend",
         "program": "${workspaceFolder}/packages/backend/src/index.ts",
         "preLaunchTask": "tsc: build - packages/backend/tsconfig.json",
         "outFiles": ["${workspaceFolder}/packages/backend/dist/**/*.js"],
         "env": {
           "NODE_ENV": "development",
           "LOG_LEVEL": "debug"
         }
       }
     ]
   }
   ```

2. Start the debugger by pressing F5 or clicking the "Run and Debug" button

### Debugging Frontend Issues

#### Enable Debug Logging

To enable debug logging for the frontend service, set the `NEXT_PUBLIC_LOG_LEVEL` environment variable to `debug`:

```bash
# In the frontend .env file
NEXT_PUBLIC_LOG_LEVEL=debug
```

#### Use Browser DevTools

You can use the browser's DevTools to debug the frontend service:

1. Open the frontend in a browser
2. Open the browser's DevTools (F12 or Ctrl+Shift+I)
3. Navigate to the "Console" tab to view logs
4. Navigate to the "Network" tab to view network requests
5. Navigate to the "Application" tab to view local storage, session storage, and cookies

#### Use React DevTools

You can use React DevTools to debug React components:

1. Install the React DevTools browser extension
2. Open the frontend in a browser
3. Open the browser's DevTools (F12 or Ctrl+Shift+I)
4. Navigate to the "Components" tab to view React components
5. Navigate to the "Profiler" tab to profile React component rendering

### Debugging Blockchain Issues

#### Enable Debug Logging

To enable debug logging for the blockchain service, set the `LOG_LEVEL` environment variable to `debug`:

```bash
# In the blockchain .env file
LOG_LEVEL=debug
```

#### Use Blockchain Explorers

You can use blockchain explorers to verify transactions and smart contract interactions:

- Ethereum: [Etherscan](https://etherscan.io/)
- Polygon: [PolygonScan](https://polygonscan.com/)
- Solana: [Solana Explorer](https://explorer.solana.com/)
- Avalanche: [Avalanche Explorer](https://explorer.avax.network/)
- Polkadot: [Polkadot Explorer](https://polkadot.js.org/apps/#/explorer)

#### Use Web3 Console

You can use the Web3 console to interact with blockchain networks:

```javascript
// Connect to an Ethereum node
const Web3 = require('web3');
const web3 = new Web3('https://mainnet.infura.io/v3/your-api-key');

// Get the current block number
web3.eth.getBlockNumber().then(console.log);

// Get the balance of an address
web3.eth.getBalance('0x1234...').then(console.log);

// Get transaction details
web3.eth.getTransaction('0x1234...').then(console.log);
```

### Debugging AI Agent Issues

#### Enable Debug Logging

To enable debug logging for the AI agents service, set the `LOG_LEVEL` environment variable to `debug`:

```bash
# In the AI agents .env file
LOG_LEVEL=debug
```

#### Use Agent Debugging Endpoints

The AI agents service provides debugging endpoints that return information about the current state of the agents:

```bash
curl http://localhost:8080/debug/agents
```

#### Use Agent Tracing

You can enable agent tracing to get detailed information about agent execution:

```bash
# In the AI agents .env file
AGENT_TRACING=true
```

### Debugging Monitoring Issues

#### Check Prometheus Targets

You can check the status of Prometheus targets to ensure that metrics are being collected:

```bash
curl http://localhost:9090/api/v1/targets
```

#### Check Prometheus Metrics

You can check the available metrics in Prometheus:

```bash
curl http://localhost:9090/api/v1/label/__name__/values
```

#### Check Alertmanager Status

You can check the status of Alertmanager:

```bash
curl http://localhost:9093/api/v1/status
```

## Common Debugging Scenarios

### Debugging API Errors

If you're experiencing API errors:

1. Check the backend logs for error messages:
   ```bash
   docker-compose logs backend
   ```

2. Verify that the API endpoint is correct:
   ```bash
   curl -v http://localhost:4000/api/endpoint
   ```

3. Check the request payload:
   ```bash
   curl -v -X POST -H "Content-Type: application/json" -d '{"key": "value"}' http://localhost:4000/api/endpoint
   ```

4. Check the API documentation to ensure you're using the correct endpoint and payload format.

### Debugging Database Connection Issues

If you're experiencing database connection issues:

1. Check the backend logs for database connection errors:
   ```bash
   docker-compose logs backend
   ```

2. Verify that the PostgreSQL service is running:
   ```bash
   docker-compose ps postgres
   ```

3. Check the PostgreSQL logs for errors:
   ```bash
   docker-compose logs postgres
   ```

4. Verify that the database connection string is correct:
   ```bash
   # In the backend .env file
   DATABASE_URL=postgres://postgres:postgres@postgres:5432/fusion_ai
   ```

5. Try connecting to the database manually:
   ```bash
   docker-compose exec postgres psql -U postgres -d fusion_ai
   ```

### Debugging Workflow Execution Issues

If you're experiencing workflow execution issues:

1. Check the backend logs for workflow execution errors:
   ```bash
   docker-compose logs backend
   ```

2. Verify that all services required by the workflow are running:
   ```bash
   docker-compose ps
   ```

3. Check the workflow configuration to ensure it's valid:
   ```bash
   curl http://localhost:4000/api/workflows/{workflowId}
   ```

4. Check the workflow execution logs:
   ```bash
   curl http://localhost:4000/api/workflows/{workflowId}/logs
   ```

5. Try executing the workflow with debug logging enabled:
   ```bash
   curl -X POST http://localhost:4000/api/workflows/{workflowId}/execute?debug=true
   ```

### Debugging Blockchain Connection Issues

If you're experiencing blockchain connection issues:

1. Check the blockchain service logs for connection errors:
   ```bash
   docker-compose logs blockchain
   ```

2. Verify that the blockchain node endpoints are correct:
   ```bash
   # In the blockchain .env file
   ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/your-api-key
   ```

3. Check the blockchain node status:
   ```bash
   curl -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' https://mainnet.infura.io/v3/your-api-key
   ```

4. Try connecting to the blockchain node using Web3:
   ```javascript
   const Web3 = require('web3');
   const web3 = new Web3('https://mainnet.infura.io/v3/your-api-key');
   web3.eth.getBlockNumber().then(console.log);
   ```

### Debugging AI Agent Execution Issues

If you're experiencing AI agent execution issues:

1. Check the AI agents service logs for execution errors:
   ```bash
   docker-compose logs ai-agents
   ```

2. Verify that the AI model endpoints are correct:
   ```bash
   # In the AI agents .env file
   GPT4_ENDPOINT=https://api.openai.com/v1/chat/completions
   ```

3. Check the AI agent configuration to ensure it's valid:
   ```bash
   curl http://localhost:8080/api/agents/{agentId}
   ```

4. Try executing the AI agent with debug logging enabled:
   ```bash
   curl -X POST http://localhost:8080/api/agents/{agentId}/execute?debug=true -H "Content-Type: application/json" -d '{"input": "value"}'
   ```

## Advanced Debugging Techniques

### Memory Profiling

You can use memory profiling to identify memory leaks and optimize memory usage:

```bash
# Start the backend service with memory profiling enabled
NODE_OPTIONS="--max-old-space-size=4096 --expose-gc" node packages/backend/dist/index.js
```

### CPU Profiling

You can use CPU profiling to identify performance bottlenecks:

```bash
# Start the backend service with CPU profiling enabled
NODE_OPTIONS="--prof" node packages/backend/dist/index.js
```

### Network Debugging

You can use network debugging tools to analyze network traffic:

```bash
# Capture network traffic
tcpdump -i any -w capture.pcap

# Analyze network traffic
wireshark capture.pcap
```

### Container Debugging

You can use container debugging tools to analyze container behavior:

```bash
# View container resource usage
docker stats

# Execute a command in a container
docker-compose exec backend bash

# View container logs
docker-compose logs -f backend
```

## Conclusion

By following this guide, you can effectively debug issues with the FusionAI Orchestrator Tool. Remember to start with the basics (logs, error messages) and gradually move to more advanced techniques as needed.

If you encounter an issue that you cannot resolve, please open an issue on the GitHub repository with a detailed description of the problem, steps to reproduce, and relevant logs.
