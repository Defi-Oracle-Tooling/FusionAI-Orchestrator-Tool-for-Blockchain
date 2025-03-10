# Docker Deployment

This guide provides instructions for deploying the FusionAI Orchestrator Tool using Docker.

## Prerequisites

- Docker 20.10.x or later
- Docker Compose 2.x or later
- Git

## Deployment Steps

### 1. Clone the Repository

```bash
git clone https://github.com/Defi-Oracle-Tooling/FusionAI-Orchestrator-Tool-for-Blockchain.git
cd FusionAI-Orchestrator-Tool-for-Blockchain
```

### 2. Configure Environment Variables

Create environment files for each service:

```bash
# Create backend environment file
cp packages/backend/.env.example packages/backend/.env

# Create frontend environment file
cp packages/frontend/.env.example packages/frontend/.env

# Create blockchain environment file
cp packages/blockchain/.env.example packages/blockchain/.env

# Create AI agents environment file
cp packages/ai-agents/.env.example packages/ai-agents/.env

# Create monitoring environment file
cp packages/monitoring/.env.example packages/monitoring/.env
```

Edit the environment files to configure the services:

```bash
# Edit backend environment file
nano packages/backend/.env

# Edit frontend environment file
nano packages/frontend/.env

# Edit blockchain environment file
nano packages/blockchain/.env

# Edit AI agents environment file
nano packages/ai-agents/.env

# Edit monitoring environment file
nano packages/monitoring/.env
```

### 3. Build and Start the Services

```bash
docker-compose up -d
```

This will build and start all the services defined in the `docker-compose.yml` file:

- Backend API
- Frontend
- Blockchain Service
- AI Agents Service
- Monitoring Service
- Redis
- PostgreSQL

### 4. Verify the Deployment

Check that all services are running:

```bash
docker-compose ps
```

You should see all services in the "Up" state.

Access the frontend at:

```
http://localhost:3000
```

Access the backend API at:

```
http://localhost:4000
```

Access the monitoring dashboard at:

```
http://localhost:3000/analytics
```

### 5. View Logs

To view the logs of a specific service:

```bash
docker-compose logs -f <service-name>
```

For example, to view the backend logs:

```bash
docker-compose logs -f backend
```

### 6. Scale Services

To scale a service, use the `docker-compose up` command with the `--scale` option:

```bash
docker-compose up -d --scale <service-name>=<number-of-instances>
```

For example, to scale the AI agents service to 3 instances:

```bash
docker-compose up -d --scale ai-agents=3
```

### 7. Update the Deployment

To update the deployment with the latest code:

```bash
# Pull the latest code
git pull

# Rebuild and restart the services
docker-compose up -d --build
```

### 8. Stop the Deployment

To stop the deployment:

```bash
docker-compose down
```

To stop the deployment and remove all data volumes:

```bash
docker-compose down -v
```

## Docker Compose Configuration

The `docker-compose.yml` file defines the services, networks, and volumes for the deployment:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: packages/backend/Dockerfile
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://postgres:postgres@postgres:5432/fusion_ai
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    networks:
      - fusion-network

  frontend:
    build:
      context: .
      dockerfile: packages/frontend/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=http://localhost:4000
      - NEXT_PUBLIC_WS_URL=ws://localhost:4000
    depends_on:
      - backend
    networks:
      - fusion-network

  blockchain:
    build:
      context: .
      dockerfile: packages/blockchain/Dockerfile
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    networks:
      - fusion-network

  ai-agents:
    build:
      context: .
      dockerfile: packages/ai-agents/Dockerfile
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    networks:
      - fusion-network

  monitoring:
    build:
      context: .
      dockerfile: packages/monitoring/Dockerfile
    ports:
      - "9090:9090"
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    networks:
      - fusion-network

  postgres:
    image: postgres:14
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=fusion_ai
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - fusion-network

  redis:
    image: redis:7
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - fusion-network

  redis-commander:
    image: rediscommander/redis-commander
    ports:
      - "8081:8081"
    environment:
      - REDIS_HOSTS=redis
    depends_on:
      - redis
    networks:
      - fusion-network

networks:
  fusion-network:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
```

## Dockerfile Examples

### Backend Dockerfile

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/common/package.json ./packages/common/
COPY packages/backend/package.json ./packages/backend/

RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY packages/common ./packages/common
COPY packages/backend ./packages/backend

RUN pnpm --filter @fusion-ai/backend build

EXPOSE 4000

CMD ["pnpm", "--filter", "@fusion-ai/backend", "start"]
```

### Frontend Dockerfile

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/common/package.json ./packages/common/
COPY packages/frontend/package.json ./packages/frontend/

RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY packages/common ./packages/common
COPY packages/frontend ./packages/frontend

RUN pnpm --filter @fusion-ai/frontend build

EXPOSE 3000

CMD ["pnpm", "--filter", "@fusion-ai/frontend", "start"]
```

## Production Considerations

### Security

- Use a reverse proxy (e.g., Nginx) to handle SSL termination
- Set up proper firewall rules to restrict access to the services
- Use environment variables for sensitive information
- Implement proper authentication and authorization

### Monitoring

- Set up monitoring for the Docker containers
- Configure alerts for container health
- Monitor resource usage (CPU, memory, disk)

### Backup

- Set up regular backups of the PostgreSQL database
- Set up regular backups of the Redis data

### High Availability

- Deploy multiple instances of each service
- Use a load balancer to distribute traffic
- Set up database replication

## Troubleshooting

### Container Fails to Start

If a container fails to start, check the logs:

```bash
docker-compose logs <service-name>
```

Common issues include:

- Missing environment variables
- Database connection issues
- Port conflicts

### Database Connection Issues

If the backend service cannot connect to the database:

1. Check that the PostgreSQL container is running:
```bash
docker-compose ps postgres
```

2. Check the database connection string in the backend environment file:
```bash
cat packages/backend/.env
```

3. Try connecting to the database manually:
```bash
docker-compose exec postgres psql -U postgres -d fusion_ai
```

### Redis Connection Issues

If a service cannot connect to Redis:

1. Check that the Redis container is running:
```bash
docker-compose ps redis
```

2. Check the Redis connection string in the service environment file:
```bash
cat packages/<service>/.env
```

3. Try connecting to Redis manually:
```bash
docker-compose exec redis redis-cli ping
```

## Conclusion

By following this guide, you can deploy the FusionAI Orchestrator Tool using Docker. The Docker deployment provides a consistent and reproducible environment for running the tool.
