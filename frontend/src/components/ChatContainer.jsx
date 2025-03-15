import { useEffect, useRef } from 'react'
import ChatMessage from './ChatMessage'

const ChatContainer = ({ 
  chatMessages, 
  showModeration, 
  showAIResponses, 
  addToFriendsList, 
  addToUndesirablesList,
  autoScroll,
  setAutoScroll,
  isGeneratingResponse
}) => {
  const chatContainerRef = useRef(null)
  
  // Auto-scroll chat when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current && autoScroll) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages, autoScroll])
  
  return (
    <div className="chat-container">
      <div className="chat-messages" ref={chatContainerRef}>
        {chatMessages.map((msg, index) => (
          <ChatMessage 
            key={`msg-${index}`}
            message={msg}
            showModeration={showModeration}
            showAIResponses={showAIResponses}
            addToFriendsList={addToFriendsList}
            addToUndesirablesList={addToUndesirablesList}
          />
        ))}
        
        {showAIResponses && isGeneratingResponse && (
          <div className="ai-loading-indicator">
            <span>L'IA génère une réponse...</span>
            <div className="loading-spinner"></div>
          </div>
        )}
      </div>
      
      <div className="chat-controls">
        <div className="auto-scroll-toggle">
          <label>
            <input 
              type="checkbox" 
              checked={autoScroll} 
              onChange={(e) => {
                setAutoScroll(e.target.checked);
                localStorage.setItem('autoScroll', e.target.checked);
                
                // If auto-scroll was just re-enabled, scroll to bottom
                if (e.target.checked && chatContainerRef.current) {
                  chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
                }
              }} 
            />
            <span>Défilement automatique</span>
          </label>
        </div>
        
        {!autoScroll && (
          <button 
            className="jump-to-latest-button"
            onClick={() => {
              if (chatContainerRef.current) {
                chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
              }
            }}
          >
            <i className="bi bi-arrow-down-circle"></i> Aller aux derniers messages
          </button>
        )}
      </div>
    </div>
  )
}

export default ChatContainer 