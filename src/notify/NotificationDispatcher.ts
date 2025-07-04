/**
 * Notification Dispatcher
 * Handles routing and delivery of notifications across multiple channels
 */

export interface NotificationChannel {
  id: string;
  name: string;
  type: "email" | "sms" | "slack" | "webhook" | "in-app" | "push" | "teams" | "discord";
  enabled: boolean;
  config: Record<string, any>;
  rateLimits?: {
    maxPerMinute?: number;
    maxPerHour?: number;
    maxPerDay?: number;
  };
}

export interface NotificationTemplate {
  id: string;
  name: string;
  trigger: string;
  channels: string[];
  subject?: string;
  message: string;
  priority: "low" | "medium" | "high" | "critical";
  throttling?: {
    enabled: boolean;
    windowMinutes: number;
    maxPerWindow: number;
  };
  conditions?: NotificationCondition[];
}

export interface NotificationCondition {
  field: string;
  operator: "equals" | "contains" | "greater_than" | "less_than" | "in" | "not_in";
  value: any;
}

export interface NotificationEvent {
  id: string;
  type: string;
  workspace: string;
  user?: string;
  data: Record<string, any>;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface NotificationDelivery {
  id: string;
  eventId: string;
  templateId: string;
  channelId: string;
  recipient: string;
  status: "pending" | "sent" | "delivered" | "failed" | "throttled";
  attempts: number;
  lastAttempt?: Date;
  deliveredAt?: Date;
  error?: string;
}

// Predefined notification templates
export const DEFAULT_TEMPLATES: NotificationTemplate[] = [
  {
    id: "test_failure_critical",
    name: "Critical Test Failure",
    trigger: "test.failed",
    channels: ["email", "slack", "in-app"],
    subject: "🚨 Critical Test Failure - {{testName}}",
    message: "Test suite '{{testName}}' has failed with {{errorCount}} errors. Immediate attention required.\n\nFailure details:\n{{errorDetails}}\n\nView details: {{dashboardUrl}}",
    priority: "critical",
    conditions: [
      { field: "severity", operator: "equals", value: "critical" },
      { field: "errorCount", operator: "greater_than", value: 0 }
    ]
  },
  {
    id: "test_failure_standard",
    name: "Standard Test Failure",
    trigger: "test.failed",
    channels: ["email", "in-app"],
    subject: "⚠️ Test Failure - {{testName}}",
    message: "Test suite '{{testName}}' has failed. Please review the results.\n\nView details: {{dashboardUrl}}",
    priority: "medium",
    throttling: {
      enabled: true,
      windowMinutes: 30,
      maxPerWindow: 3
    }
  },
  {
    id: "test_success_milestone",
    name: "Test Success Milestone",
    trigger: "test.success",
    channels: ["in-app"],
    subject: "✅ Test Milestone Reached",
    message: "Congratulations! {{testName}} has reached {{successRate}}% success rate over the last {{period}}.",
    priority: "low",
    conditions: [
      { field: "successRate", operator: "greater_than", value: 95 },
      { field: "executionCount", operator: "greater_than", value: 100 }
    ]
  },
  {
    id: "performance_degradation",
    name: "Performance Degradation Alert",
    trigger: "performance.degraded",
    channels: ["email", "slack"],
    subject: "📉 Performance Alert - {{serviceName}}",
    message: "Performance degradation detected on {{serviceName}}.\n\nAverage response time: {{responseTime}}ms ({{percentIncrease}}% increase)\nError rate: {{errorRate}}%\n\nView dashboard: {{dashboardUrl}}",
    priority: "high",
    conditions: [
      { field: "responseTimeIncrease", operator: "greater_than", value: 50 }
    ]
  },
  {
    id: "quota_warning",
    name: "Usage Quota Warning",
    trigger: "quota.warning",
    channels: ["email", "in-app"],
    subject: "⚠️ Usage Quota Warning - {{workspaceName}}",
    message: "Your workspace '{{workspaceName}}' has used {{usagePercent}}% of your monthly quota.\n\nCurrent usage: {{currentUsage}} / {{totalQuota}}\nPlan: {{planName}}\n\nUpgrade your plan: {{upgradeUrl}}",
    priority: "medium"
  },
  {
    id: "integration_connected",
    name: "Integration Connected",
    trigger: "integration.connected",
    channels: ["in-app"],
    subject: "🔗 Integration Connected",
    message: "{{integrationType}} integration has been successfully connected to your workspace.",
    priority: "low"
  },
  {
    id: "user_invited",
    name: "User Invited to Workspace",
    trigger: "user.invited",
    channels: ["email"],
    subject: "You've been invited to join {{workspaceName}}",
    message: "{{inviterName}} has invited you to join the '{{workspaceName}}' workspace on APIFlow.\n\nClick here to accept the invitation: {{invitationUrl}}\n\nThis invitation will expire in 7 days.",
    priority: "medium"
  },
  {
    id: "schedule_execution_failed",
    name: "Scheduled Execution Failed",
    trigger: "schedule.failed",
    channels: ["email", "slack"],
    subject: "🕐 Scheduled Test Failed - {{scheduleName}}",
    message: "Scheduled test '{{scheduleName}}' failed to execute.\n\nError: {{errorMessage}}\nNext execution: {{nextExecution}}\n\nView schedule: {{scheduleUrl}}",
    priority: "high"
  }
];

// Default notification channels
export const DEFAULT_CHANNELS: NotificationChannel[] = [
  {
    id: "email",
    name: "Email",
    type: "email",
    enabled: true,
    config: {
      smtpHost: "smtp.apiflow.dev",
      smtpPort: 587,
      fromAddress: "notifications@apiflow.dev",
      fromName: "APIFlow"
    },
    rateLimits: {
      maxPerMinute: 60,
      maxPerHour: 1000
    }
  },
  {
    id: "in-app",
    name: "In-App Notifications",
    type: "in-app",
    enabled: true,
    config: {},
    rateLimits: {
      maxPerMinute: 100
    }
  },
  {
    id: "slack",
    name: "Slack",
    type: "slack",
    enabled: false,
    config: {
      webhookUrl: "",
      defaultChannel: "#api-alerts"
    },
    rateLimits: {
      maxPerMinute: 1
    }
  },
  {
    id: "webhook",
    name: "Webhook",
    type: "webhook",
    enabled: false,
    config: {
      url: "",
      method: "POST",
      headers: {}
    }
  }
];

export class NotificationDispatcher {
  private channels: Map<string, NotificationChannel> = new Map();
  private templates: Map<string, NotificationTemplate> = new Map();
  private deliveryQueue: NotificationDelivery[] = [];
  private deliveryHistory: NotificationDelivery[] = [];
  private throttleCache: Map<string, number[]> = new Map();

  constructor() {
    // Initialize with default channels and templates
    DEFAULT_CHANNELS.forEach(channel => this.channels.set(channel.id, channel));
    DEFAULT_TEMPLATES.forEach(template => this.templates.set(template.id, template));
  }

  /**
   * Dispatch a notification event
   */
  async dispatch(event: NotificationEvent): Promise<NotificationDelivery[]> {
    const applicableTemplates = this.getApplicableTemplates(event);
    const deliveries: NotificationDelivery[] = [];

    for (const template of applicableTemplates) {
      // Check throttling
      if (this.isThrottled(template, event)) {
        console.log(`Notification throttled: ${template.id} for event ${event.id}`);
        continue;
      }

      // Generate deliveries for each channel
      for (const channelId of template.channels) {
        const channel = this.channels.get(channelId);
        if (!channel || !channel.enabled) continue;

        const recipients = await this.getRecipients(event, channel);
        
        for (const recipient of recipients) {
          const delivery = await this.createDelivery(event, template, channel, recipient);
          deliveries.push(delivery);
          this.deliveryQueue.push(delivery);
        }
      }

      // Update throttle cache
      this.updateThrottleCache(template, event);
    }

    // Process delivery queue
    this.processDeliveryQueue();

    return deliveries;
  }

  /**
   * Add or update a notification channel
   */
  setChannel(channel: NotificationChannel): void {
    this.channels.set(channel.id, channel);
  }

  /**
   * Add or update a notification template
   */
  setTemplate(template: NotificationTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Get all channels
   */
  getChannels(): NotificationChannel[] {
    return Array.from(this.channels.values());
  }

  /**
   * Get all templates
   */
  getTemplates(): NotificationTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get delivery history
   */
  getDeliveryHistory(limit: number = 100): NotificationDelivery[] {
    return this.deliveryHistory.slice(-limit);
  }

  /**
   * Get applicable templates for an event
   */
  private getApplicableTemplates(event: NotificationEvent): NotificationTemplate[] {
    return Array.from(this.templates.values()).filter(template => {
      // Check if template trigger matches event type
      if (template.trigger !== event.type) return false;

      // Check conditions
      if (template.conditions) {
        return template.conditions.every(condition => 
          this.evaluateCondition(condition, event.data)
        );
      }

      return true;
    });
  }

  /**
   * Evaluate a condition against event data
   */
  private evaluateCondition(condition: NotificationCondition, data: Record<string, any>): boolean {
    const value = data[condition.field];

    switch (condition.operator) {
      case "equals":
        return value === condition.value;
      case "contains":
        return String(value).includes(String(condition.value));
      case "greater_than":
        return Number(value) > Number(condition.value);
      case "less_than":
        return Number(value) < Number(condition.value);
      case "in":
        return Array.isArray(condition.value) && condition.value.includes(value);
      case "not_in":
        return Array.isArray(condition.value) && !condition.value.includes(value);
      default:
        return false;
    }
  }

  /**
   * Check if template is throttled for the event
   */
  private isThrottled(template: NotificationTemplate, event: NotificationEvent): boolean {
    if (!template.throttling?.enabled) return false;

    const throttleKey = `${template.id}:${event.workspace}:${event.user || 'global'}`;
    const timestamps = this.throttleCache.get(throttleKey) || [];
    const windowStart = Date.now() - (template.throttling.windowMinutes * 60 * 1000);
    
    // Count notifications in the current window
    const recentNotifications = timestamps.filter(ts => ts > windowStart);
    
    return recentNotifications.length >= template.throttling.maxPerWindow;
  }

  /**
   * Update throttle cache
   */
  private updateThrottleCache(template: NotificationTemplate, event: NotificationEvent): void {
    if (!template.throttling?.enabled) return;

    const throttleKey = `${template.id}:${event.workspace}:${event.user || 'global'}`;
    const timestamps = this.throttleCache.get(throttleKey) || [];
    const windowStart = Date.now() - (template.throttling.windowMinutes * 60 * 1000);
    
    // Clean old timestamps and add new one
    const updatedTimestamps = [...timestamps.filter(ts => ts > windowStart), Date.now()];
    this.throttleCache.set(throttleKey, updatedTimestamps);
  }

  /**
   * Get recipients for a channel
   */
  private async getRecipients(event: NotificationEvent, channel: NotificationChannel): Promise<string[]> {
    // This would typically query your user/notification preferences database
    // For now, return mock recipients based on channel type
    
    switch (channel.type) {
      case "email":
        return event.user ? [`user-${event.user}@example.com`] : ["admin@example.com"];
      case "slack":
        return [channel.config.defaultChannel || "#general"];
      case "in-app":
        return event.user ? [event.user] : [];
      case "webhook":
        return [channel.config.url];
      default:
        return [];
    }
  }

  /**
   * Create a delivery record
   */
  private async createDelivery(
    event: NotificationEvent,
    template: NotificationTemplate,
    channel: NotificationChannel,
    recipient: string
  ): Promise<NotificationDelivery> {
    return {
      id: `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventId: event.id,
      templateId: template.id,
      channelId: channel.id,
      recipient,
      status: "pending",
      attempts: 0
    };
  }

  /**
   * Process the delivery queue
   */
  private async processDeliveryQueue(): Promise<void> {
    const pending = this.deliveryQueue.filter(d => d.status === "pending");
    
    for (const delivery of pending) {
      try {
        await this.deliverNotification(delivery);
        delivery.status = "sent";
        delivery.deliveredAt = new Date();
      } catch (error) {
        delivery.status = "failed";
        delivery.error = error instanceof Error ? error.message : "Unknown error";
        delivery.attempts += 1;
      }
      
      delivery.lastAttempt = new Date();
      
      // Move to history
      this.deliveryHistory.push(delivery);
    }
    
    // Clear processed items from queue
    this.deliveryQueue = this.deliveryQueue.filter(d => d.status === "pending");
  }

  /**
   * Deliver a single notification
   */
  private async deliverNotification(delivery: NotificationDelivery): Promise<void> {
    const channel = this.channels.get(delivery.channelId);
    const template = this.templates.get(delivery.templateId);
    
    if (!channel || !template) {
      throw new Error("Channel or template not found");
    }

    // Simulate delivery based on channel type
    switch (channel.type) {
      case "email":
        await this.deliverEmail(delivery, channel, template);
        break;
      case "slack":
        await this.deliverSlack(delivery, channel, template);
        break;
      case "webhook":
        await this.deliverWebhook(delivery, channel, template);
        break;
      case "in-app":
        await this.deliverInApp(delivery, channel, template);
        break;
      default:
        throw new Error(`Unsupported channel type: ${channel.type}`);
    }
  }

  /**
   * Deliver email notification
   */
  private async deliverEmail(delivery: NotificationDelivery, channel: NotificationChannel, template: NotificationTemplate): Promise<void> {
    // In a real implementation, this would use an email service
    console.log(`Sending email to ${delivery.recipient}:`, {
      subject: template.subject,
      message: template.message,
      from: channel.config.fromAddress
    });
    
    // Simulate async email delivery
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Deliver Slack notification
   */
  private async deliverSlack(delivery: NotificationDelivery, channel: NotificationChannel, template: NotificationTemplate): Promise<void> {
    // In a real implementation, this would call Slack API
    console.log(`Sending Slack message to ${delivery.recipient}:`, {
      text: template.message,
      webhook: channel.config.webhookUrl
    });
    
    // Simulate async Slack delivery
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  /**
   * Deliver webhook notification
   */
  private async deliverWebhook(delivery: NotificationDelivery, channel: NotificationChannel, template: NotificationTemplate): Promise<void> {
    // In a real implementation, this would make HTTP request
    console.log(`Sending webhook to ${delivery.recipient}:`, {
      url: channel.config.url,
      method: channel.config.method,
      payload: {
        template: template.name,
        message: template.message,
        priority: template.priority
      }
    });
    
    // Simulate async webhook delivery
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  /**
   * Deliver in-app notification
   */
  private async deliverInApp(delivery: NotificationDelivery, channel: NotificationChannel, template: NotificationTemplate): Promise<void> {
    // In a real implementation, this would store in database and push via WebSocket
    console.log(`Storing in-app notification for user ${delivery.recipient}:`, {
      title: template.subject,
      message: template.message,
      priority: template.priority
    });
    
    // Simulate async in-app delivery
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

// Global notification dispatcher instance
export const notificationDispatcher = new NotificationDispatcher();