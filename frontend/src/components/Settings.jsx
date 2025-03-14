const Settings = ({ 
  darkTheme, setDarkTheme,
  showModeration, setShowModeration,
  showAIResponses, setShowAIResponses,
  enableSoundNotifications, setEnableSoundNotifications,
  enableFlvStream, setEnableFlvStream,
  enableMentionNotifications, setEnableMentionNotifications,
  yourUsername, setYourUsername,
  aiProvider, setAiProvider,
  aiModel, setAiModel,
  openaiApiKey, setOpenaiApiKey,
  requestNotificationPermission
}) => {
  return (
    <div className="settings-container">
      <h3>Settings</h3>
      
      <div className="setting-row">
        <label>
          <input 
            type="checkbox" 
            checked={darkTheme} 
            onChange={(e) => {
              setDarkTheme(e.target.checked);
            }} 
          />
          Dark Theme
        </label>
      </div>
      
      <div className="setting-row">
        <label>
          <input 
            type="checkbox" 
            checked={showModeration} 
            onChange={(e) => {
              setShowModeration(e.target.checked);
              localStorage.setItem('showModeration', e.target.checked);
            }} 
          />
          Show Moderation
        </label>
      </div>
      
      <div className="setting-row">
        <label>
          <input 
            type="checkbox" 
            checked={showAIResponses} 
            onChange={(e) => {
              setShowAIResponses(e.target.checked);
              localStorage.setItem('showAIResponses', e.target.checked);
            }} 
          />
          Show AI Responses
        </label>
      </div>
      
      <div className="setting-row">
        <label>
          <input 
            type="checkbox" 
            checked={enableSoundNotifications} 
            onChange={(e) => {
              setEnableSoundNotifications(e.target.checked);
              localStorage.setItem('enableSoundNotifications', e.target.checked);
            }} 
          />
          Enable Sound Notifications
        </label>
      </div>
      
      <div className="setting-row">
        <label>
          <input 
            type="checkbox" 
            checked={enableFlvStream} 
            onChange={(e) => {
              setEnableFlvStream(e.target.checked);
              localStorage.setItem('enableFlvStream', e.target.checked);
            }} 
          />
          Enable Video Stream
        </label>
      </div>
      
      <div className="setting-row">
        <label>
          <input 
            type="checkbox" 
            checked={enableMentionNotifications} 
            onChange={(e) => {
              setEnableMentionNotifications(e.target.checked);
              localStorage.setItem('enableMentionNotifications', e.target.checked);
            }} 
          />
          Enable Mention Notifications
        </label>
      </div>
      
      <div className="setting-row">
        <label>Your Username:</label>
        <input 
          type="text" 
          value={yourUsername} 
          onChange={(e) => {
            let username = e.target.value.trim();
            // Remove @ symbol if present
            if (username.startsWith('@')) {
              username = username.substring(1);
            }
            setYourUsername(username);
            if (username) {
              localStorage.setItem('tiktokUsername', username);
            } else {
              localStorage.removeItem('tiktokUsername');
            }
          }} 
          className="settings-input"
          placeholder="For mention notifications"
        />
      </div>
      
      <div className="setting-row">
        <label>AI Provider:</label>
        <div className="radio-group">
          <label>
            <input 
              type="radio" 
              name="aiProvider" 
              value="openai" 
              checked={aiProvider === 'openai'} 
              onChange={() => {
                setAiProvider('openai');
                localStorage.setItem('aiProvider', 'openai');
              }} 
            />
            OpenAI
          </label>
          <label>
            <input 
              type="radio" 
              name="aiProvider" 
              value="ollama" 
              checked={aiProvider === 'ollama'} 
              onChange={() => {
                setAiProvider('ollama');
                localStorage.setItem('aiProvider', 'ollama');
              }} 
            />
            Ollama
          </label>
        </div>
      </div>
      
      {aiProvider === 'ollama' && (
        <div className="setting-row">
          <label>Ollama Model:</label>
          <select 
            value={aiModel} 
            onChange={(e) => {
              setAiModel(e.target.value);
              localStorage.setItem('aiModel', e.target.value);
            }} 
            className="settings-select"
          >
            <option value="">Select Model</option>
            <option value="llama2">Llama 2</option>
            <option value="mistral">Mistral</option>
            <option value="gemma">Gemma</option>
          </select>
        </div>
      )}
      
      {aiProvider === 'openai' && (
        <div className="setting-row">
          <label>OpenAI API Key:</label>
          <input 
            type="password" 
            value={openaiApiKey} 
            onChange={(e) => {
              setOpenaiApiKey(e.target.value);
              localStorage.setItem('openaiApiKey', e.target.value);
            }} 
            className="settings-input"
            placeholder="sk-..."
          />
        </div>
      )}
      
      {enableMentionNotifications && (
        <div className="setting-row">
          <button 
            onClick={requestNotificationPermission}
            className="settings-button"
          >
            Enable Browser Notifications
          </button>
        </div>
      )}
    </div>
  )
}

export default Settings 