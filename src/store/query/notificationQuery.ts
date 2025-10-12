import { useQuery } from '@tanstack/react-query';
import { notificationActions } from '../notificationStore';

export const useNotificationQuery = () => {
  return useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      // Fetch notifications from the API
      // const response = await fetch('/api/notifications');
      // if (!response.ok) {
      //     throw new Error('Failed to fetch notifications');
      // }
      // return response.json();
      const now = new Date();

      notificationActions.setNotifications([
        {
          id: '1',
          title: 'System Update',
          message:
            'The system will be undergoing maintenance tonight at 10PM UTC.',
          timestamp: new Date(now.getTime() - 3600000), // 1 hour ago
          read: false,
          type: 'info',
        },
        {
          id: '2',
          title: 'Test Run Completed',
          message:
            'Your test suite "API Integration Tests" has completed successfully.',
          timestamp: new Date(now.getTime() - 86400000), // 1 day ago
          read: true,
          type: 'success',
          link: '/reports/latest',
        },
        {
          id: '3',
          title: 'New Feature Available',
          message:
            'Check out our new reporting dashboard with enhanced visualizations.',
          timestamp: new Date(now.getTime() - 172800000), // 2 days ago
          read: false,
          type: 'info',
        },
        {
          id: '4',
          title: 'API Rate Limit Warning',
          message:
            'You are approaching your API rate limit. Consider upgrading your plan.',
          timestamp: new Date(now.getTime() - 129600000), // 1.5 days ago
          read: false,
          type: 'warning',
        },
        {
          id: '5',
          title: 'Error in Test Execution',
          message:
            'Test suite "Authentication Tests" failed due to connection timeout.',
          timestamp: new Date(now.getTime() - 43200000), // 12 hours ago
          read: false,
          type: 'error',
        },
        {
          id: '6',
          title: 'Collaboration Invite',
          message:
            'John Smith has invited you to collaborate on project "E-commerce API".',
          timestamp: new Date(now.getTime() - 7200000), // 2 hours ago
          read: false,
          type: 'info',
          link: '/projects/123',
        },
        {
          id: '7',
          title: 'Security Alert',
          message:
            'We detected a login from a new device. Please verify this was you.',
          timestamp: new Date(now.getTime() - 1800000), // 30 mins ago
          read: false,
          type: 'warning',
          link: '/security/devices',
        },
        {
          id: '8',
          title: 'Subscription Renewed',
          message: 'Your premium subscription has been automatically renewed.',
          timestamp: new Date(now.getTime() - 259200000), // 3 days ago
          read: true,
          type: 'success',
          link: '/billing',
        },
        {
          id: '9',
          title: 'Database Connection Issue',
          message:
            'One of your database connections is experiencing latency issues.',
          timestamp: new Date(now.getTime() - 21600000), // 6 hours ago
          read: false,
          type: 'error',
        },
        {
          id: '10',
          title: 'Weekly Report Available',
          message: 'Your weekly performance report is now ready to view.',
          timestamp: new Date(now.getTime() - 345600000), // 4 days ago
          read: true,
          type: 'info',
          link: '/reports/weekly',
        },
      ]);

      notificationActions.setPreferences([
        {
          type: 'system',
          enabled: true,
          description: 'System notifications about maintenance and updates',
        },
        {
          type: 'activity',
          enabled: true,
          description: 'Activity on your tests and collections',
        },
        {
          type: 'mentions',
          enabled: true,
          description: 'When someone mentions you in comments',
        },
        {
          type: 'marketing',
          enabled: false,
          description: 'Marketing and promotional messages',
        },
      ]);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};
