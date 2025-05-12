import React, { useState } from 'react';
import styled from 'styled-components';
import { FaSlidersH, FaCheck } from 'react-icons/fa';
import { useNotification } from '../../context/NotificationContext';
import './NotificationDropdown.css';
import NotificationItem from './NotificationItem';
import NotificationPreferences from './NotificationPreferences';

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #6c757d;
  text-align: center;
`;

const EmptyStateIcon = styled.div`
  font-size: 48px;
  margin-bottom: 20px;
  color: #dee2e6;
`;

const NotificationDropdown = ({ onClose, onMarkAllAsRead }:any) => {
  const { notifications, loading, error } = useNotification();
  const [showPreferences, setShowPreferences] = useState(false);
  
  const { createTestNotification } = useNotification();
  
  const handleTestNotification = () => {
    createTestNotification();
  };
  
  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const dropdown = document.querySelector('.notification-dropdown');
      const modal = document.querySelector('.ReactModal__Content');
    
      if (
        dropdown &&
        !dropdown.contains(event.target as Node) &&
        modal &&
        !modal.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    
    
    document.addEventListener('mousedown', handleOutsideClick);
    
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [onClose]);

  return (
    <>
      <div className="notification-dropdown">
        <div className="notification-dropdown-header">
          <h3>Notifications</h3>
          <div className="notification-header-actions">
            <button 
              className="mark-all-read-button" 
              onClick={onMarkAllAsRead}
            >
              <FaCheck size={12} />
              <span>Mark all as read</span>
            </button>
            <button 
              className="notification-settings-button"
              onClick={() => setShowPreferences(true)}
              title="Notification settings"
            >
              <FaSlidersH size={16} />
            </button>
          </div>
        </div>
        
        <div className="notification-dropdown-content">
          {loading ? (
            <div className="notification-loading">
              <div className="spinner"></div>
              <p>Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="notification-error">
              <p>Could not load notifications</p>
              <button onClick={() => window.location.reload()}>Try again</button>
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState>
              <EmptyStateIcon>🔔</EmptyStateIcon>
              <p>No notifications yet</p>
              <small>You'll see notifications here when there's activity on your account</small>
            </EmptyState>
          ) : (
            notifications.map((notification:any) => (
              <NotificationItem 
                key={notification.id} 
                notification={notification} 
              />
            ))
          )}
        </div>
        
        <div className="notification-dropdown-footer">
          <button 
            className="test-notification-button"
            onClick={handleTestNotification}
          >
            Send Test Notification
          </button>
        </div>
      </div>
      
      <NotificationPreferences
        show={showPreferences}
        handleClose={() => setShowPreferences(false)}
      />
    </>
  );
};

export default NotificationDropdown;