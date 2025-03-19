import { useState } from 'react'

const ChatMessage = ({ 
  message, 
  showModeration,
  showAIResponses,
  addToFriendsList,
  addToUndesirablesList 
}) => {
  const [showActions, setShowActions] = useState(false)
  const [showReasonModal, setShowReasonModal] = useState(false)
  const [reasonText, setReasonText] = useState('')
  
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
  
  // Handle the reason submission
  const handleReasonSubmit = () => {
    addToUndesirablesList(message, reasonText)
    setShowReasonModal(false)
    setReasonText('')
  }

  // Open the reason modal
  const openReasonModal = () => {
    setShowReasonModal(true)
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
            
          <span><span className="text-xs text-gray-500">{formatTimestamp(message.timestamp)}</span> à rejoint le chat</span>
        </div>
        
        {/* User Actions */}
        <div className={`absolute -right-1 -top-1 transition-opacity duration-200 ${showActions ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
            <button 
              onClick={() => addToFriendsList(message)}
              className="p-1.5 text-xs hover:bg-emerald-500/20 transition-colors focus:outline-none"
              title="Add to friends"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
            </button>
            <button 
              onClick={openReasonModal}
              className="p-1.5 text-xs hover:bg-rose-500/20 transition-colors focus:outline-none"
              title="Add to undesirables"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-rose-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Reason Modal */}
        {showReasonModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-5 w-full max-w-md">
              <h3 className="text-xl font-bold text-white mb-4">Add to Undesirables</h3>
              <p className="text-gray-300 mb-4">Please provide a reason for adding <span className="font-bold text-rose-400">{message.nickname}</span> to the undesirables list:</p>
              
              <textarea
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 focus:outline-none resize-none"
                rows="3"
                placeholder="Enter reason here..."
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
              ></textarea>
              
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowReasonModal(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReasonSubmit}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!reasonText.trim()}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
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
          className={`w-8 h-8 rounded-full mr-3 object-cover border-2 ${
            message?.userStatus?.isFriend
              ? "border-emerald-500/30"
              : message?.userStatus?.isUndesirable
              ? "border-rose-500/30"
              : "border-gray-700/50"
          }`}
          src={message.profilePictureUrl}
          alt=""
          onError={(e) => {
            e.target.src = "https://placehold.co/32x32?text=?";
          }}
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
            <span className="text-xs text-gray-500">
              {formatTimestamp(message.timestamp)}
            </span>
          </div>

          <p className="text-white/90 bg-black/50 p-2 rounded-lg break-words mt-1">
            <p>{message.comment}</p>
            {showModeration && message.moderation == undefined && (
            //spinning wheel
            <div className="absolute bottom-2 right-2">
              <div className="w-4 h-4 border-t-2 border-b-2 border-red-900 rounded-full animate-spin"></div>
            </div>
          )}

          {showModeration && message.moderation && (
            <>
              {/* Status indicator circle in lower-right corner */}
              <div className="absolute bottom-2 right-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    message.moderation.flagged
                      ? "bg-rose-500"
                      : "bg-emerald-500"
                  }`}
                  title={
                    message.moderation.flagged
                      ? "Flagged Content"
                      : "Safe Content"
                  }
                ></div>
              </div>

            </>
          )}

          </p>

          {/* Moderation Results */}

          

          {showModeration && message.moderation && (
            <>
              {message.moderation.flagged && message.moderation.categories && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {Object.entries(message.moderation.categories).map(
                    ([category, isFlagged]) =>
                      isFlagged && (
                        <span
                          key={category}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-900/70 text-rose-300 border border-rose-500/30"
                        >
                          {translateCategory(category)}
                        </span>
                      )
                  )}
                </div>
              )}
            </>
          )}

          {/* AI Response */}
          {showAIResponses && 
          message.comment.startsWith("Bot") && 
          (
            <div className="mt-2">
              {message.pendingResponse ? (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm animate-pulse">
                  <div className="h-3 w-3 rounded-full border-2 border-blue-400 border-t-transparent animate-spin"></div>
                  <span>AI is generating a response...</span>
                </div>
              ) : message.suggestedResponse ? (
                <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  <p className="text-xs font-medium text-indigo-400 mb-1 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5 mr-1"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                    AI RESPONSE
                  </p>
                  <p className="text-sm text-white/80 italic">
                    {message.suggestedResponse}
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* User Actions */}
      <div
        className={`absolute -right-1 -top-1 transition-opacity duration-200 ${
          showActions ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
          <button
            onClick={() => addToFriendsList(message)}
            className="p-1.5 text-xs hover:bg-emerald-500/20 transition-colors focus:outline-none"
            title="Add to friends"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-emerald-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <button
            onClick={openReasonModal}
            className="p-1.5 text-xs hover:bg-rose-500/20 transition-colors focus:outline-none"
            title="Add to undesirables"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-rose-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Reason Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-5 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">
              Add to Undesirables
            </h3>
            <p className="text-gray-300 mb-4">
              Please provide a reason for adding{" "}
              <span className="font-bold text-rose-400">
                {message.nickname}
              </span>{" "}
              to the undesirables list:
            </p>

            <textarea
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 focus:outline-none resize-none"
              rows="3"
              placeholder="Enter reason here..."
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
            ></textarea>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowReasonModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReasonSubmit}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!reasonText.trim()}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
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