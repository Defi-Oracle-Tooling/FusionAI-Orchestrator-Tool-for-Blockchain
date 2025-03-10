# Alert Configuration

This guide provides instructions for configuring alerts for the FusionAI Orchestrator Tool.

## Prerequisites

- Prometheus set up and configured (see [Prometheus Setup](./prometheus.md))
- Alertmanager installed and configured
- Docker and Docker Compose (for local setup)
- Kubernetes (for Kubernetes setup)

## Local Setup with Docker Compose

### 1. Create Alertmanager Configuration

Create an `alertmanager.yml` file in the `monitoring` directory:

```yaml
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname', 'job']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 1h
  receiver: 'email-notifications'

receivers:
  - name: 'email-notifications'
    email_configs:
      - to: 'alerts@example.com'
        from: 'alertmanager@example.com'
        smarthost: 'smtp.example.com:587'
        auth_username: 'alertmanager'
        auth_password: 'password'
        send_resolved: true
```

### 2. Update Docker Compose Configuration

Add Alertmanager to the `docker-compose.yml` file:

```yaml
services:
  # Existing services...

  alertmanager:
    image: prom/alertmanager:v0.24.0
    ports:
      - "9093:9093"
    volumes:
      - ./monitoring/alertmanager.yml:/etc/alertmanager/alertmanager.yml
      - alertmanager-data:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
    networks:
      - fusion-network

volumes:
  # Existing volumes...
  alertmanager-data:
```

### 3. Create Alert Rules

Create a `prometheus-rules.yml` file in the `monitoring` directory:

```yaml
groups:
  - name: fusion-ai-alerts
    rules:
      # Backend alerts
      - alert: HighRequestLatency
        expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route)) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High request latency on {{ $labels.route }}"
          description: "95th percentile of request latency on {{ $labels.route }} is above 1s (current value: {{ $value }}s)"

      - alert: HighErrorRate
        expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate"
          description: "Error rate is above 5% (current value: {{ $value | humanizePercentage }})"

      # Blockchain alerts
      - alert: BlockchainNodeDisconnected
        expr: blockchain_peers == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Blockchain node disconnected"
          description: "{{ $labels.network }} node has no connected peers"

      - alert: BlockchainSyncLag
        expr: blockchain_sync_lag > 10
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Blockchain sync lag"
          description: "{{ $labels.network }} node is {{ $value }} blocks behind"

      # AI agent alerts
      - alert: AgentHighErrorRate
        expr: sum(rate(agent_executions_total{status="error"}[5m])) / sum(rate(agent_executions_total[5m])) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "AI agent high error rate"
          description: "AI agent error rate is above 10% (current value: {{ $value | humanizePercentage }})"

      - alert: AgentLowConfidence
        expr: agent_confidence_score < 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "AI agent low confidence"
          description: "{{ $labels.agent }} has low confidence score (current value: {{ $value }})"

      # System alerts
      - alert: HighCPUUsage
        expr: sum(rate(process_cpu_seconds_total[5m])) > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage"
          description: "CPU usage is above 80% (current value: {{ $value | humanizePercentage }})"

      - alert: HighMemoryUsage
        expr: process_resident_memory_bytes / process_virtual_memory_bytes > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is above 80% (current value: {{ $value | humanizePercentage }})"
```

### 4. Update Prometheus Configuration

Update the `prometheus.yml` file to include the alert rules:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - /etc/prometheus/prometheus-rules.yml

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

scrape_configs:
  # Existing scrape configs...
```

### 5. Update Docker Compose Configuration for Prometheus

Update the Prometheus configuration in the `docker-compose.yml` file:

```yaml
services:
  # Existing services...

  prometheus:
    image: prom/prometheus:v2.40.0
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./monitoring/prometheus-rules.yml:/etc/prometheus/prometheus-rules.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
    networks:
      - fusion-network
```

### 6. Start Alertmanager and Prometheus

```bash
docker-compose up -d alertmanager prometheus
```

### 7. Access Alertmanager

Open a web browser and navigate to:

```
http://localhost:9093
```

## Kubernetes Setup

### 1. Create Alertmanager ConfigMap

```yaml
# alertmanager-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: alertmanager-config
  namespace: monitoring
data:
  alertmanager.yml: |
    global:
      resolve_timeout: 5m

    route:
      group_by: ['alertname', 'job']
      group_wait: 30s
      group_interval: 5m
      repeat_interval: 1h
      receiver: 'email-notifications'

    receivers:
      - name: 'email-notifications'
        email_configs:
          - to: 'alerts@example.com'
            from: 'alertmanager@example.com'
            smarthost: 'smtp.example.com:587'
            auth_username: 'alertmanager'
            auth_password: 'password'
            send_resolved: true
```

Apply the ConfigMap:

```bash
kubectl apply -f alertmanager-configmap.yaml
```

### 2. Create Prometheus Rules ConfigMap

```yaml
# prometheus-rules-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-rules
  namespace: monitoring
data:
  prometheus-rules.yml: |
    groups:
      - name: fusion-ai-alerts
        rules:
          # Backend alerts
          - alert: HighRequestLatency
            expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route)) > 1
            for: 5m
            labels:
              severity: warning
            annotations:
              summary: "High request latency on {{ $labels.route }}"
              description: "95th percentile of request latency on {{ $labels.route }} is above 1s (current value: {{ $value }}s)"

          # Add other alert rules from the local setup
```

Apply the ConfigMap:

```bash
kubectl apply -f prometheus-rules-configmap.yaml
```

### 3. Update Prometheus ConfigMap

Update the Prometheus ConfigMap to include the alert rules:

```yaml
# prometheus-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s

    rule_files:
      - /etc/prometheus/prometheus-rules.yml

    alerting:
      alertmanagers:
        - static_configs:
            - targets:
                - alertmanager:9093

    scrape_configs:
      # Existing scrape configs...
```

Apply the ConfigMap:

```bash
kubectl apply -f prometheus-configmap.yaml
```

### 4. Create Alertmanager Deployment and Service

```yaml
# alertmanager-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: alertmanager
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: alertmanager
  template:
    metadata:
      labels:
        app: alertmanager
    spec:
      containers:
        - name: alertmanager
          image: prom/alertmanager:v0.24.0
          ports:
            - containerPort: 9093
          volumeMounts:
            - name: alertmanager-config
              mountPath: /etc/alertmanager
            - name: alertmanager-data
              mountPath: /alertmanager
          args:
            - '--config.file=/etc/alertmanager/alertmanager.yml'
            - '--storage.path=/alertmanager'
          resources:
            requests:
              cpu: "0.1"
              memory: "128Mi"
            limits:
              cpu: "0.5"
              memory: "256Mi"
      volumes:
        - name: alertmanager-config
          configMap:
            name: alertmanager-config
        - name: alertmanager-data
          persistentVolumeClaim:
            claimName: alertmanager-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: alertmanager
  namespace: monitoring
spec:
  selector:
    app: alertmanager
  ports:
    - port: 9093
      targetPort: 9093
  type: ClusterIP
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: alertmanager-pvc
  namespace: monitoring
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
```

Apply the deployment and service:

```bash
kubectl apply -f alertmanager-deployment.yaml
```

### 5. Create Ingress for Alertmanager

```yaml
# alertmanager-ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: alertmanager-ingress
  namespace: monitoring
  annotations:
    kubernetes.io/ingress.class: nginx
spec:
  rules:
    - host: alertmanager.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: alertmanager
                port:
                  number: 9093
```

Apply the ingress:

```bash
kubectl apply -f alertmanager-ingress.yaml
```

### 6. Access Alertmanager

Open a web browser and navigate to:

```
http://alertmanager.example.com
```

## Alert Notification Channels

Alertmanager supports various notification channels:

### Email

```yaml
receivers:
  - name: 'email-notifications'
    email_configs:
      - to: 'alerts@example.com'
        from: 'alertmanager@example.com'
        smarthost: 'smtp.example.com:587'
        auth_username: 'alertmanager'
        auth_password: 'password'
        send_resolved: true
```

### Slack

```yaml
receivers:
  - name: 'slack-notifications'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX'
        channel: '#alerts'
        send_resolved: true
```

### PagerDuty

```yaml
receivers:
  - name: 'pagerduty-notifications'
    pagerduty_configs:
      - service_key: '<pagerduty-service-key>'
        send_resolved: true
```

### Webhook

```yaml
receivers:
  - name: 'webhook-notifications'
    webhook_configs:
      - url: 'http://webhook.example.com/alert'
        send_resolved: true
```

## Alert Routing

Alertmanager supports routing alerts to different receivers based on labels:

```yaml
route:
  group_by: ['alertname', 'job']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 1h
  receiver: 'default-receiver'
  routes:
    - match:
        severity: critical
      receiver: 'critical-receiver'
    - match:
        severity: warning
      receiver: 'warning-receiver'
```

## Alert Silencing

Alertmanager allows silencing alerts for a specified duration:

1. Access the Alertmanager UI
2. Click on "Silences"
3. Click on "New Silence"
4. Configure the silence:
   - Matchers: Define which alerts to silence
   - Starts at: Define when the silence starts
   - Ends at: Define when the silence ends
   - Creator: Your name
   - Comment: Reason for the silence
5. Click on "Create"

## Alert Inhibition

Alertmanager supports inhibiting alerts based on other alerts:

```yaml
inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'job']
```

This inhibits warning alerts if there is a critical alert with the same alertname and job.

## Custom Alert Rules

You can create custom alert rules for specific metrics:

```yaml
groups:
  - name: custom-alerts
    rules:
      - alert: CustomAlert
        expr: custom_metric > threshold
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Custom alert"
          description: "Custom metric is above threshold (current value: {{ $value }})"
```

## Conclusion

By following this guide, you can configure alerts for the FusionAI Orchestrator Tool. Alertmanager provides a powerful platform for managing and routing alerts, which can be used to notify the appropriate teams when issues occur.
