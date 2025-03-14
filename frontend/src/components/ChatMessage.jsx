const ChatMessage = ({ 
  message, 
  showModeration,
  showAIResponses,
  addToFriendsList,
  addToUndesirablesList 
}) => {
  let messageContent;
  let messageClass = 'chat-message';
  
  // Determine username class based on user status - moved outside message type conditional
  let usernameClass = "username";
  if (message.userStatus) {
    if (message.userStatus.isFriend) usernameClass += " friend-username";
    else if (message.userStatus.isUndesirable) usernameClass += " undesirable-username";
    else usernameClass += " regular-username";
  } else {
    usernameClass += " regular-username";
  }
  
  if (message.type === 'join') {
    messageContent = (
      <div className="message-content join-content">
        <img className="miniprofilepicture" src={message.profilePictureUrl} alt="" />
        <span className={`join-text ${usernameClass}`}>{message.nickname} joined the room</span>
      </div>
    );
    messageClass += ' join-message';
  } else if (message.type === 'follow') {
    messageContent = (
      <div className="message-content follow-content">
        <span className={`follow-text ${usernameClass}`}>{message.nickname} followed the host</span>
      </div>
    );
    messageClass += ' follow-message';
  } else {
    messageContent = (
      <>
        <div className="message-content">
          <img className="miniprofilepicture" src={message.profilePictureUrl} alt="" />
          <div className="message-body">
            <div className="message-header">
              <a 
                href={`https://www.tiktok.com/@${message.uniqueId}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="username-link"
              >
                <span className={usernameClass}>{message.nickname}</span>
              </a>
              <span className="message-text">{message.comment}</span>
              
             
            </div>
            
            {showModeration && message.moderation && (
              <div className={`moderation-result ${message.moderation.flagged ? 'flagged' : 'safe'}`}>
                <div className="moderation-badge">
                  {message.moderation.flagged ? '⚠️ Flagged' : '✅ Safe'}
                </div>
                
                {message.moderation.flagged && message.moderation.categories && (
                  <div className="moderation-categories">
                    {Object.entries(message.moderation.categories).map(([category, isFlagged]) => 
                      isFlagged && (
                        <span key={category} className="moderation-category">
                          {category}
                        </span>
                      )
                    )}
                  </div>
                )}
              </div>
            )}
            
            {showAIResponses && (
              <div className="ai-response">
                {message.pendingResponse ? (
                  <div className="loading-response">Generating AI response...</div>
                ) : message.suggestedResponse ? (
                  <div className="suggested-response">
                    <span className="response-label">AI Response: </span>
                    <span className="response-text">{message.suggestedResponse}</span>
                  </div>
                ) : null}
              </div>
            )}
             <span className="message-timestamp">{new Date(message.timestamp).toLocaleTimeString()}</span>
          </div>
        </div>
      </>
    );
  }
  
  // Add user status classes
  if (message.userStatus) {
    if (message.userStatus.isFriend) messageClass += ' friend-message';
    if (message.userStatus.isUndesirable) messageClass += ' undesirable-message';
  }
  
  return (
    <div className={messageClass}>
      {messageContent}
      
      <div className="user-actions">
        <button 
          onClick={() => addToFriendsList(message.uniqueId, message.nickname)}
          className="friend-button"
          title="Add to Friends"
        >
          👍
        </button>
        <button 
          onClick={() => addToUndesirablesList(message.uniqueId, message.nickname)}
          className="undesirable-button"
          title="Add to Undesirables"
        >
          👎
        </button>
      </div>
    </div>
  )
}

export default ChatMessage 