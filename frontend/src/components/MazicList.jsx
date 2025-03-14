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
    <div className="mazic-container">
      <div className="mazic-header">
        <div className="mazic-title-container">
          <h4>Filtered Messages</h4>
          <div className="mazic-prefix-display">
            {isEditingPrefix ? (
              <div className="mazic-prefix-editor">
                <input
                  type="text"
                  className="mazic-prefix-input"
                  value={mazicPrefix}
                  onChange={handlePrefixChange}
                  onBlur={savePrefixChanges}
                  onKeyDown={handlePrefixKeyDown}
                  autoFocus
                />
                <button
                  className="mazic-save-btn"
                  onClick={savePrefixChanges}
                  title="Save prefix"
                >
                  <i className="bi bi-check"></i>
                </button>
              </div>
            ) : (
              <div className="mazic-current-prefix" onClick={handlePrefixEdit}>
                <span className="mazic-prefix-label">Prefix:</span>
                <span className="mazic-prefix-value">{mazicPrefix}</span>
                <i className="bi bi-pencil-fill mazic-edit-icon"></i>
              </div>
            )}
          </div>
          {prefixSaved && (
            <div className="mazic-prefix-saved">
              <span>New messages starting with "{mazicPrefix}" will be added here</span>
            </div>
          )}
        </div>
        <div className="mazic-actions">
          <span className="mazic-count">{mazicList.length}</span>
          {mazicList.length > 0 && (
            <button 
              className="mazic-clear-btn" 
              onClick={clearMazicList}
              title="Clear all mazic messages"
            >
              <i className="bi bi-trash"></i>
            </button>
          )}
        </div>
      </div>
      
      <div className="mazic-list">
        {mazicList.length === 0 ? (
          <p className="mazic-empty">No filtered messages yet. Messages starting with "{mazicPrefix}" will appear here.</p>
        ) : (
          <ul className="mazic-items">
            {mazicList.map((message, index) => (
              <li key={index} className="mazic-item">
                <div className="mazic-item-content">
                  <span className="mazic-message-text">{message}</span>
                  <div className="mazic-item-actions">
                    <button 
                      className="mazic-action-btn mazic-copy-btn"
                      onClick={() => copyToClipboard(message.includes(": ") ? message.split(": ")[1] : message, index)}
                      title="Copy to clipboard"
                    >
                      {copiedIndex === index ? (
                        <i className="bi bi-check2"></i>
                      ) : (
                        <i className="bi bi-clipboard"></i>
                      )}
                    </button>
                    <button 
                      className="mazic-action-btn mazic-delete-btn"
                      onClick={() => removeFromMazicList(index)}
                      title="Delete message"
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        
      </div>
    </div>
  );
};

export default MazicList; 