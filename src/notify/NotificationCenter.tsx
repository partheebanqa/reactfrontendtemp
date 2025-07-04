import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, CheckCircle, XCircle, AlertTriangle, Info, Trash2, Mail } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  category: "test-failure" | "system" | "integration" | "security" | "maintenance";
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export default function NotificationCenter() {
  const [activeTab, setActiveTab] = useState("all");
  
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Test Suite Failed",
      message: "User Authentication Suite failed with 3 errors. Immediate attention required.",
      type: "error",
      category: "test-failure",
      timestamp: "2024-01-19 14:30:00",
      read: false,
      actionUrl: "/executions/123"
    },
    {
      id: "2",
      title: "New Integration Added",
      message: "GitHub Actions integration has been successfully configured.",
      type: "success",
      category: "integration",
      timestamp: "2024-01-19 13:15:00",
      read: false,
      actionUrl: "/cicd"
    },
    {
      id: "3",
      title: "Scheduled Maintenance",
      message: "System maintenance is scheduled for tonight at 2:00 AM UTC.",
      type: "info",
      category: "maintenance",
      timestamp: "2024-01-19 12:00:00",
      read: true
    },
    {
      id: "4",
      title: "High API Response Time",
      message: "API response time has exceeded 2000ms threshold for the past 15 minutes.",
      type: "warning",
      category: "test-failure",
      timestamp: "2024-01-19 11:45:00",
      read: true,
      actionUrl: "/reports"
    },
    {
      id: "5",
      title: "Security Alert",
      message: "Unusual login activity detected from a new location.",
      type: "warning",
      category: "security",
      timestamp: "2024-01-19 10:30:00",
      read: false
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success": return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error": return <XCircle className="h-5 w-5 text-red-500" />;
      case "warning": return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTypeColor = (type: Notification["type"]) => {
    switch (type) {
      case "success": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "error": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "warning": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default: return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    }
  };

  const getCategoryColor = (category: Notification["category"]) => {
    switch (category) {
      case "test-failure": return "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800";
      case "security": return "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800";
      case "integration": return "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800";
      case "maintenance": return "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800";
      default: return "bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800";
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAsUnread = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: false } : n)
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !notification.read;
    return notification.category === activeTab;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold">Notification Center</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {unreadCount} unread notifications
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={markAllAsRead}>
            Mark All Read
          </Button>
          <Button>
            <Bell className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">
            All ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="test-failure">Test Failures</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="integration">Integrations</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`${getCategoryColor(notification.category)} ${
                    !notification.read ? 'border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {getNotificationIcon(notification.type)}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                            {notification.title}
                          </h4>
                          <Badge className={getTypeColor(notification.type)} variant="outline">
                            {notification.type}
                          </Badge>
                          <Badge variant="outline" className="text-xs capitalize">
                            {notification.category.replace("-", " ")}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {new Date(notification.timestamp).toLocaleString()}
                          </span>
                          
                          <div className="flex gap-2">
                            {notification.actionUrl && (
                              <Button size="sm" variant="outline">
                                View Details
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => notification.read ? markAsUnread(notification.id) : markAsRead(notification.id)}
                            >
                              {notification.read ? (
                                <Mail className="h-4 w-4" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteNotification(notification.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredNotifications.length === 0 && (
                <div className="text-center py-12">
                  <Bell className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    No notifications
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {activeTab === "unread" 
                      ? "All caught up! No unread notifications."
                      : "No notifications in this category."
                    }
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}