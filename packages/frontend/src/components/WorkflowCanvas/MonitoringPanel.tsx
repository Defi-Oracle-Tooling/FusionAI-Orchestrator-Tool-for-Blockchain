import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Typography,
  CircularProgress,
  Grid,
  Alert,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { useBlockchainNodeWebSocket } from '../../hooks/useBlockchainNodeWebSocket';
import { useWorkflowWebSocket } from '../../hooks/useWorkflowWebSocket';

interface MonitoringPanelProps {
  workflowId?: string;
  nodeId?: string;
}

export const MonitoringPanel: React.FC<MonitoringPanelProps> = ({
  workflowId,
  nodeId,
}) => {
  const [metrics, setMetrics] = useState<any>({});
  const [alerts, setAlerts] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const { nodeStatus } = useBlockchainNodeWebSocket(nodeId);
  const { workflowStatus } = useWorkflowWebSocket(workflowId);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/metrics');
        const data = await response.json();
        setMetrics(data);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error fetching metrics:', error);
      }
    };

    const fetchAlerts = async () => {
      try {
        const response = await fetch('/api/alerts');
        const data = await response.json();
        setAlerts(data);
      } catch (error) {
        console.error('Error fetching alerts:', error);
      }
    };

    fetchMetrics();
    fetchAlerts();

    const metricsInterval = setInterval(fetchMetrics, 15000);
    const alertsInterval = setInterval(fetchAlerts, 30000);

    return () => {
      clearInterval(metricsInterval);
      clearInterval(alertsInterval);
    };
  }, []);

  const getHealthStatus = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon color="success" />;
      case 'degraded':
        return <WarningIcon color="warning" />;
      case 'unhealthy':
        return <ErrorIcon color="error" />;
      default:
        return <CircularProgress size={20} />;
    }
  };

  const handleRefresh = () => {
    setLastUpdated(new Date());
    // Trigger immediate metrics update
    fetch('/api/metrics')
      .then(response => response.json())
      .then(data => setMetrics(data))
      .catch(error => console.error('Error refreshing metrics:', error));
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Monitoring Dashboard</Typography>
        <Box>
          <Tooltip title="Last updated">
            <Typography variant="caption" sx={{ mr: 2 }}>
              {lastUpdated.toLocaleTimeString()}
            </Typography>
          </Tooltip>
          <IconButton onClick={handleRefresh} size="small">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {/* Blockchain Metrics */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Blockchain Status
              {nodeStatus && (
                <Chip
                  size="small"
                  label={nodeStatus.status}
                  color={nodeStatus.status === 'healthy' ? 'success' : 'warning'}
                  sx={{ ml: 1 }}
                />
              )}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Gas Price</Typography>
                <Typography>{metrics.gasPrice || 'N/A'} Gwei</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Block Time</Typography>
                <Typography>{metrics.blockTime || 'N/A'} seconds</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Peer Count</Typography>
                <Typography>{metrics.peerCount || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Transaction Load</Typography>
                <Typography>{metrics.transactionStatus || 'N/A'}</Typography>
              </Grid>
            </Grid>
          </Card>
        </Grid>

        {/* Workflow Metrics */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Workflow Status
              {workflowStatus && (
                <Chip
                  size="small"
                  label={`${workflowStatus.progress}%`}
                  color="primary"
                  sx={{ ml: 1 }}
                />
              )}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Active Steps</Typography>
                <Typography>{workflowStatus?.activeSteps || 0}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Completed Steps</Typography>
                <Typography>{workflowStatus?.completedSteps || 0}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Time Remaining</Typography>
                <Typography>
                  {workflowStatus?.timeRemaining
                    ? `${Math.round(workflowStatus.timeRemaining / 60)} min`
                    : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Status</Typography>
                <Typography>{workflowStatus?.status || 'N/A'}</Typography>
              </Grid>
            </Grid>
          </Card>
        </Grid>

        {/* Alerts Timeline */}
        <Grid item xs={12}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Alerts
            </Typography>
            {alerts.length > 0 ? (
              <Timeline>
                {alerts.map((alert, index) => (
                  <TimelineItem key={index}>
                    <TimelineSeparator>
                      <TimelineDot
                        color={
                          alert.severity === 'critical'
                            ? 'error'
                            : alert.severity === 'warning'
                            ? 'warning'
                            : 'info'
                        }
                      />
                      {index < alerts.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent>
                      <Typography variant="subtitle2">{alert.summary}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {new Date(alert.timestamp).toLocaleString()}
                      </Typography>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            ) : (
              <Alert severity="info">No active alerts</Alert>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};