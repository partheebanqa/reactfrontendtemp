import React from 'react';

interface BadgeProps {
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange' | 'gray';
  text: string;
  icon?: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({ color, text, icon }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    purple: 'bg-purple-100 text-purple-800',
    orange: 'bg-orange-100 text-orange-800',
    gray: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[color]}`}>
      {icon && <span className="mr-1">{icon}</span>}
      {text}
    </span>
  );
};

export default Badge;