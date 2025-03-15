import { useState } from 'react'

const ChatMessage = ({ 
  message, 
  showModeration,
  showAIResponses,
  addToFriendsList,
  addToUndesirablesList 
}) => {
  const [showActions, setShowActions] = useState(false)
  
  // Determine username styles based on user status
  const getUsernameStyles = () => {
    if (message?.userStatus?.isFriend) {
      return {
        textColor: 'text-emerald-400'
      }
    } else if (message?.userStatus?.isUndesirable) {
      return {
        textColor: 'text-rose-400'
      }
    } else {
      return {
        textColor: 'text-blue-400'
      }
    }
  }
  
  // Get message container styles
  const getMessageContainerStyles = () => {
    let baseStyles = 'relative p-3 rounded-xl mb-2 transition-all duration-200 group'
    
    if (message?.userStatus?.isFriend) {
      return `${baseStyles} bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15`
    } else if (message?.userStatus?.isUndesirable) {
      return `${baseStyles} bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/15`
    } else {
      return `${baseStyles} bg-gray-800/60 border border-gray-700/50 hover:bg-gray-800/80`
    }
  }
  
  // Convert timestamp to readable format
  const formatTimestamp = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }
  
  const { textColor } = getUsernameStyles()
  
  // Render different message types
  if (message.type === 'join') {
    return (
      <div 
        className={getMessageContainerStyles()}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div className="px-3 py-1.5 rounded-full bg-gray-800/40 border border-gray-700/30 text-sm text-gray-300 flex items-center">
          <img 
            className="w-5 h-5 rounded-full mr-2 object-cover" 
            src={message.profilePictureUrl} 
            alt="" 
            onError={(e) => { e.target.src = 'https://placehold.co/20x20?text=?' }}
          />
          <a 
              href={`https://www.tiktok.com/@${message.uniqueId}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`font-bold ${textColor} hover:underline transition-colors mr-2`}
            >
              {message.nickname}
            </a>
          {message.isFriend ? <span>(friend) - à rejoint le chat</span> : <span>à rejoint le chat</span>}
        </div>
        
        {/* User Actions */}
        <div className={`absolute -right-1 -top-1 transition-opacity duration-200 ${showActions ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
            <button 
              onClick={() => addToFriendsList(message.uniqueId, message.nickname)}
              className="p-1.5 text-xs hover:bg-emerald-500/20 transition-colors focus:outline-none"
              title="Add to friends"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
            </button>
            <button 
              onClick={() => addToUndesirablesList(message.uniqueId, message.nickname)}
              className="p-1.5 text-xs hover:bg-rose-500/20 transition-colors focus:outline-none"
              title="Add to undesirables"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-rose-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    )
  } 
  
  if (message.type === 'follow') {
    return (
      <div className="flex items-center justify-center py-2 px-4 my-1.5">
        <div className="px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-sm text-blue-200 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className={`font-medium ${textColor} mr-1`}>{message.nickname}</span>
          <span>followed the host</span>
        </div>
      </div>
    )
  }
  
  // Regular chat message
  return (
    <div 
      className={getMessageContainerStyles()}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex">
        <img 
          className={`w-8 h-8 rounded-full mr-3 object-cover border-2 ${message?.userStatus?.isFriend ? 'border-emerald-500/30' : message?.userStatus?.isUndesirable ? 'border-rose-500/30' : 'border-gray-700/50'}`} 
          src={message.profilePictureUrl} 
          alt="" 
          onError={(e) => { e.target.src = 'https://placehold.co/32x32?text=?' }}
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline">
            <a 
              href={`https://www.tiktok.com/@${message.uniqueId}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`font-bold ${textColor} hover:underline transition-colors mr-2`}
            >
              {message.nickname}
            </a>
            <span className="text-xs text-gray-500">{formatTimestamp(message.timestamp)}</span>
          </div>
          
          <p className="text-white/90 bg-black/50 p-2 rounded-lg break-words mt-1">{message.comment}</p>
        
          
          {/* Moderation Results */}
          {showModeration && message.moderation && (
            <div className={`mt-2 p-2 rounded-lg text-sm ${message.moderation.flagged ? 'bg-rose-500/20 border border-rose-500/30' : 'bg-emerald-500/20 border border-emerald-500/30'}`}>
              <div className="flex items-center font-medium mb-1">
                {message.moderation.flagged ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-rose-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                <span className={message.moderation.flagged ? 'text-rose-300' : 'text-emerald-300'}>
                  {message.moderation.flagged ? 'Flagged Content' : 'Safe Content'}
                </span>
              </div>
              
              {message.moderation.flagged && message.moderation.categories && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {Object.entries(message.moderation.categories).map(([category, isFlagged]) => 
                    isFlagged && (
                      <span key={category} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-900/70 text-rose-300 border border-rose-500/30">
                        {translateCategory(category)}
                      </span>
                    )
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* AI Response */}
          {showAIResponses && (
            <div className="mt-2">
              {message.pendingResponse ? (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm animate-pulse">
                  <div className="h-3 w-3 rounded-full border-2 border-blue-400 border-t-transparent animate-spin"></div>
                  <span>AI is generating a response...</span>
                </div>
              ) : message.suggestedResponse ? (
                <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  <p className="text-xs font-medium text-indigo-400 mb-1 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                    </svg>
                    AI RESPONSE
                  </p>
                  <p className="text-sm text-white/80 italic">{message.suggestedResponse}</p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
      
      {/* User Actions */}
      <div className={`absolute -right-1 -top-1 transition-opacity duration-200 ${showActions ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
          <button 
            onClick={() => addToFriendsList(message.uniqueId, message.nickname)}
            className="p-1.5 text-xs hover:bg-emerald-500/20 transition-colors focus:outline-none"
            title="Add to friends"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
          </button>
          <button 
            onClick={() => addToUndesirablesList(message.uniqueId, message.nickname)}
            className="p-1.5 text-xs hover:bg-rose-500/20 transition-colors focus:outline-none"
            title="Add to undesirables"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-rose-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// Helper function to translate moderation categories
const translateCategory = (category) => {
  const translations = {
    'harassment': 'Harassment',
    'hate': 'Hate Speech',
    'sexual': 'Sexual Content',
    'violence': 'Violence',
    'self_harm': 'Self-Harm',
    'illegal': 'Illegal Activity'
  };
  
  return translations[category] || category;
}

export default ChatMessage 