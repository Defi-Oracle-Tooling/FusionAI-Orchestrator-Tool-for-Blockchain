import fastify, { FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyWebsocket from '@fastify/websocket';
import { config } from 'dotenv';
import { WorkflowController } from './controllers/WorkflowController';
import { BlockchainController } from './controllers/BlockchainController';

config(); // Load environment variables

const server: FastifyInstance = fastify({
  logger: true
});

// Register plugins
server.register(fastifyCors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
});

server.register(fastifyWebsocket);

// Initialize controllers
const workflowController = new WorkflowController();
const blockchainController = new BlockchainController();

// Register workflow routes
server.post('/api/workflows', (request, reply) => 
  workflowController.createWorkflow(request, reply)
);

server.post('/api/workflows/:workflowId/execute', (request, reply) =>
  workflowController.executeWorkflow(request, reply)
);

server.get('/api/workflows/:workflowId/status', (request, reply) =>
  workflowController.getWorkflowStatus(request, reply)
);

server.post('/api/workflows/:workflowId/stop', (request, reply) =>
  workflowController.stopWorkflow(request, reply)
);

// Register blockchain routes
server.post('/api/blockchain/nodes', (request, reply) =>
  blockchainController.initializeNode(request, reply)
);

server.get('/api/blockchain/nodes/:nodeId/status', (request, reply) =>
  blockchainController.getNodeStatus(request, reply)
);

server.post('/api/blockchain/nodes/:nodeId/contracts', (request, reply) =>
  blockchainController.deployContract(request, reply)
);

// WebSocket endpoints
server.register(async function (fastify) {
  // Workflow WebSocket endpoint
  fastify.get('/ws/workflows/:workflowId', { websocket: true }, (connection, req) => {
    const { workflowId } = req.params as { workflowId: string };
    
    connection.socket.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'subscribe') {
          const status = await workflowController.getWorkflowStatus(
            { params: { workflowId } } as any,
            { send: (data: any) => connection.socket.send(JSON.stringify(data)) } as any
          );
        }
      } catch (error) {
        connection.socket.send(JSON.stringify({
          type: 'error',
          error: (error as Error).message
        }));
      }
    });
  });

  // Blockchain node WebSocket endpoint
  fastify.get('/ws/blockchain/nodes/:nodeId', { websocket: true }, (connection, req) => {
    blockchainController.handleWebSocket(connection, req);
  });
});

// Start the server
const start = async () => {
  try {
    await server.listen({
      port: parseInt(process.env.PORT || '4000'),
      host: process.env.HOST || '0.0.0.0'
    });
    console.log(`Server is running on ${server.server.address()}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM signal. Performing graceful shutdown...');
  await server.close();
  process.exit(0);
});

start();