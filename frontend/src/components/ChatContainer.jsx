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
    <div className="flex flex-col h-full rounded-2xl overflow-hidden border border-gray-800 bg-gray-900/70 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
        <h3 className="text-lg font-bold text-white flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-pink-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
          Live Chat
        </h3>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
            <span className="w-2 h-2 mr-1.5 rounded-full bg-green-500 animate-pulse"></span>
            Live
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
            {chatMessages.length} messages
          </span>
        </div>
      </div>
      
      <div 
        className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900" 
        ref={chatContainerRef}
        style={{ 
          scrollbarWidth: 'thin',
          scrollbarColor: '#4B5563 #111827'
        }}
      >
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>No messages yet</p>
            <p className="text-xs mt-1">Messages will appear here when users chat</p>
          </div>
        ) : (
          chatMessages.map((msg, index) => (
            <ChatMessage 
              key={`msg-${index}-${msg.msgId || index}`}
              message={msg}
              showModeration={showModeration}
              showAIResponses={showAIResponses}
              addToFriendsList={addToFriendsList}
              addToUndesirablesList={addToUndesirablesList}
            />
          ))
        )}
        
        {showAIResponses && isGeneratingResponse && (
          <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl my-2 animate-pulse">
            <div className="h-5 w-5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin"></div>
            <span className="text-blue-300">AI is generating a response...</span>
          </div>
        )}
      </div>
      
      <div className="border-t border-gray-700 p-3 bg-gray-800/80">
        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2 cursor-pointer group">
            <div className="relative">
              <input 
                type="checkbox" 
                className="sr-only"
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
              <div className={`block w-10 h-6 rounded-full transition-colors duration-200 ease-in-out ${autoScroll ? 'bg-pink-500' : 'bg-gray-600'}`}></div>
              <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${autoScroll ? 'transform translate-x-4' : ''}`}></div>
            </div>
            <span className={`text-sm ${autoScroll ? 'text-pink-400' : 'text-gray-400'} group-hover:text-white transition-colors`}>Auto-scroll</span>
          </label>
          
          {!autoScroll && (
            <button 
              className="flex items-center bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 focus:ring-offset-gray-800"
              onClick={() => {
                if (chatContainerRef.current) {
                  chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
                }
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              Jump to latest
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatContainer 