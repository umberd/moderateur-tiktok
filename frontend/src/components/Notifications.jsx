const Notifications = ({ notifications, removeNotification }) => {
  // Function to determine which icon to show based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'mention':
        return <i className="bi bi-at"></i>;
      case 'moderation':
        return <i className="bi bi-exclamation-triangle-fill"></i>;
      case 'friend-join':
        return <i className="bi bi-person-fill-check"></i>;
      case 'undesirable-join':
        return <i className="bi bi-person-fill-exclamation"></i>;
      case 'info':
        return <i className="bi bi-info-circle-fill"></i>;
      default:
        return <i className="bi bi-bell-fill"></i>;
    }
  };

  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <div key={notification.id} className={`notification ${notification.type}`}>
          <button 
            className="notification-close" 
            onClick={() => removeNotification(notification.id)}
          >
            ✕
          </button>
          <div className="notification-title">
            {getNotificationIcon(notification.type)} {notification.title}
          </div>
          <div className="notification-message">{notification.message}</div>
          {notification.reason && (
            <div className="notification-reason">Reason: {notification.reason}</div>
          )}
        </div>
      ))}
    </div>
  )
}

export default Notifications 