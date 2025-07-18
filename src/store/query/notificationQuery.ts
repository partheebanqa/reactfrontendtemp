import { useQuery } from "@tanstack/react-query"
import { notificationActions } from "../notificationStore";

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
            notificationActions.loadNotifications();
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
    });
};