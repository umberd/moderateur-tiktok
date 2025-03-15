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
        <span className={`join-text ${usernameClass}`}>{message.nickname} a rejoint le salon</span>
      </div>
    );
    messageClass += ' join-message';
  } else if (message.type === 'follow') {
    messageContent = (
      <div className="message-content follow-content">
        <span className={`follow-text ${usernameClass}`}>{message.nickname} a suivi l'hôte</span>
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
                  {message.moderation.flagged ? '⚠️ Signalé' : '✅ Sûr'}
                </div>
                
                {message.moderation.flagged && message.moderation.categories && (
                  <div className="moderation-categories">
                    {Object.entries(message.moderation.categories).map(([category, isFlagged]) => 
                      isFlagged && (
                        <span key={category} className="moderation-category">
                          {translateCategory(category)}
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
                  <div className="loading-response">Génération de la réponse IA...</div>
                ) : message.suggestedResponse ? (
                  <div className="suggested-response">
                    <span className="response-label">Réponse IA : </span>
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
          title="Ajouter aux amis"
        >
          👍
        </button>
        <button 
          onClick={() => addToUndesirablesList(message.uniqueId, message.nickname)}
          className="undesirable-button"
          title="Ajouter aux indésirables"
        >
          👎
        </button>
      </div>
    </div>
  )
}

// Helper function to translate moderation categories
const translateCategory = (category) => {
  const translations = {
    'harassment': 'harcèlement',
    'hate': 'haine',
    'sexual': 'sexuel',
    'violence': 'violence',
    'self_harm': 'auto-mutilation',
    'illegal': 'illégal'
  };
  
  return translations[category] || category;
}

export default ChatMessage 