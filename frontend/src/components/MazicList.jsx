import React, { useState } from 'react';

/**
 * MazicList Component
 * 
 * Displays a list of mazic messages that start with a configurable prefix in chat
 * 
 * @param {Array} mazicList - Array of mazic messages
 * @param {Function} clearMazicList - Function to clear the mazic list
 * @param {Function} removeFromMazicList - Function to remove a single message from the list
 * @param {String} mazicPrefix - The prefix used to identify mazic messages
 * @param {Function} setMazicPrefix - Function to update the mazic prefix
 */
const MazicList = ({ 
  mazicList, 
  clearMazicList, 
  removeFromMazicList, 
  mazicPrefix,
  setMazicPrefix 
}) => {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [isEditingPrefix, setIsEditingPrefix] = useState(false);
  const [prefixSaved, setPrefixSaved] = useState(false);
  
  // Function to copy text to clipboard
  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        // Show copied feedback
        setCopiedIndex(index);
        // Reset after 2 seconds
        setTimeout(() => {
          setCopiedIndex(null);
        }, 2000);
      })
      .catch((error) => {
        console.error('Error copying to clipboard:', error);
      });
  };

  // Handle prefix edit
  const handlePrefixEdit = () => {
    setIsEditingPrefix(true);
  };

  // Handle prefix input change
  const handlePrefixChange = (e) => {
    const newValue = e.target.value;
    
    // Update mazicPrefix in real-time if the prefix is not empty
    if (newValue.trim() !== '') {
      setMazicPrefix(newValue.trim());
    }
  };

  // Save prefix changes
  const savePrefixChanges = () => {
    if (mazicPrefix.trim() !== '') {
      setPrefixSaved(true);
      // Reset the saved flag after 3 seconds
      setTimeout(() => {
        setPrefixSaved(false);
      }, 3000);
    }
    setIsEditingPrefix(false);
  };

  // Handle prefix input keydown
  const handlePrefixKeyDown = (e) => {
    if (e.key === 'Enter') {
      savePrefixChanges();
    } else if (e.key === 'Escape') {
      setIsEditingPrefix(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden border border-gray-800 bg-gray-900/70 backdrop-blur-sm shadow-xl">
      <div className="px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            <h3 className="text-lg font-bold text-white">Filtered Messages</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {mazicList.length} messages
            </span>
            {mazicList.length > 0 && (
              <button 
                className="p-1.5 rounded-lg bg-gray-800 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition-colors border border-gray-700 hover:border-rose-500/30 focus:outline-none"
                onClick={clearMazicList}
                title="Clear all filtered messages"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        <div className="mt-3">
          {isEditingPrefix ? (
            <div className="flex items-center bg-gray-800/80 rounded-lg border border-indigo-500/30 focus-within:ring-2 focus-within:ring-indigo-500/40 focus-within:border-transparent p-0.5">
              <input
                type="text"
                value={mazicPrefix}
                onChange={handlePrefixChange}
                onBlur={savePrefixChanges}
                onKeyDown={handlePrefixKeyDown}
                autoFocus
                className="flex-1 bg-transparent text-white px-2 py-1.5 text-sm focus:outline-none placeholder-gray-500"
                placeholder="Enter filter prefix..."
              />
              <button
                onClick={savePrefixChanges}
                className="p-1.5 text-indigo-400 hover:text-indigo-300 focus:outline-none"
                title="Save prefix"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ) : (
            <div 
              onClick={handlePrefixEdit}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800/60 rounded-lg border border-gray-700/60 hover:border-indigo-500/30 transition-colors cursor-pointer text-sm group"
            >
              <span className="text-gray-400">Prefix:</span>
              <span className="font-medium text-indigo-400">{mazicPrefix}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-500 group-hover:text-indigo-400 ml-auto transition-colors" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </div>
          )}
          
          {prefixSaved && (
            <div className="mt-2 animate-fade-in-down px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-sm text-indigo-300">
              <span>New messages starting with "{mazicPrefix}" will be added here</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-1 p-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
        style={{ 
          scrollbarWidth: 'thin',
          scrollbarColor: '#4B5563 #111827'
        }}
      >
        {mazicList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p>No filtered messages yet</p>
            <p className="text-xs mt-1">Messages starting with "{mazicPrefix}" will appear here</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {mazicList.map((message, index) => (
              <li 
                key={index} 
                className="relative p-3 bg-gray-800/50 hover:bg-gray-800/70 border border-gray-700/50 rounded-lg transition-all group"
              >
                <div className="pr-16">
                  <p className="text-white/90 break-words">{message}</p>
                </div>
                <div className="absolute top-2 right-2 flex gap-1">
                  <button 
                    className={`p-1.5 rounded-md transition-colors focus:outline-none ${
                      copiedIndex === index 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-gray-700/70 text-gray-400 hover:text-indigo-400 border border-gray-600/50 hover:bg-indigo-500/20 hover:border-indigo-500/30'
                    }`}
                    onClick={() => copyToClipboard(message.includes(": ") ? message.split(": ")[1] : message, index)}
                    title="Copy to clipboard"
                  >
                    {copiedIndex === index ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                      </svg>
                    )}
                  </button>
                  <button 
                    className="p-1.5 rounded-md bg-gray-700/70 text-gray-400 hover:text-rose-400 border border-gray-600/50 hover:bg-rose-500/20 hover:border-rose-500/30 transition-colors focus:outline-none"
                    onClick={() => removeFromMazicList(index)}
                    title="Remove message"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// Add a fade-in-down animation for the saved prefix notification
const styles = document.createElement('style');
styles.innerHTML = `
  @keyframes fade-in-down {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-in-down {
    animation: fade-in-down 0.3s ease-out forwards;
  }
`;
document.head.appendChild(styles);

export default MazicList; 