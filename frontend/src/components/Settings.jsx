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
  availableOllamaModels,
}) => {
  // Function to toggle dark theme and update localStorage
  const toggleDarkTheme = (checked) => {
    setDarkTheme(checked);
    localStorage.setItem('darkTheme', checked);
    
    // Apply or remove dark class on document element
    if (checked) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  
  return (
    <div className="p-4 bg-lightBg dark:bg-darkBg rounded-lg shadow-md transition-colors duration-300 text-left">
      <h3 className="text-xl font-semibold mb-6 text-darkText dark:text-lightText text-left">Settings</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        {/* Column 1 - Basic Settings */}
        <div className="space-y-4 text-left">
          <div>
            <label className="flex items-center cursor-pointer text-left">
              <input 
                type="checkbox" 
                checked={darkTheme} 
                onChange={(e) => {
                  toggleDarkTheme(e.target.checked);
                }} 
                className="mr-2 h-5 w-5 rounded border-gray-300 text-primary focus:ring-secondary dark:border-gray-600 dark:bg-gray-700"
              />
              <span className="text-darkText dark:text-lightText text-left">Dark Theme</span>
            </label>
          </div>
          
          <div>
            <label className="flex items-center cursor-pointer text-left">
              <input 
                type="checkbox" 
                checked={showModeration} 
                onChange={(e) => {
                  setShowModeration(e.target.checked);
                  localStorage.setItem('showModeration', e.target.checked);
                }} 
                className="mr-2 h-5 w-5 rounded border-gray-300 text-primary focus:ring-secondary dark:border-gray-600 dark:bg-gray-700"
              />
              <span className="text-darkText dark:text-lightText text-left">Show Moderation</span>
            </label>
          </div>
          
          <div>
            <label className="flex items-center cursor-pointer text-left">
              <input 
                type="checkbox" 
                checked={showAIResponses} 
                onChange={(e) => {
                  setShowAIResponses(e.target.checked);
                  localStorage.setItem('showAIResponses', e.target.checked);
                }} 
                className="mr-2 h-5 w-5 rounded border-gray-300 text-primary focus:ring-secondary dark:border-gray-600 dark:bg-gray-700"
              />
              <span className="text-darkText dark:text-lightText text-left">Show AI Responses</span>
            </label>
          </div>
          
          <div>
            <label className="flex items-center cursor-pointer text-left">
              <input 
                type="checkbox" 
                checked={enableSoundNotifications} 
                onChange={(e) => {
                  setEnableSoundNotifications(e.target.checked);
                  localStorage.setItem('enableSoundNotifications', e.target.checked);
                }} 
                className="mr-2 h-5 w-5 rounded border-gray-300 text-primary focus:ring-secondary dark:border-gray-600 dark:bg-gray-700"
              />
              <span className="text-darkText dark:text-lightText text-left">Enable Sound Notifications</span>
            </label>
          </div>
          
          <div>
            <label className="flex items-center cursor-pointer text-left">
              <input 
                type="checkbox" 
                checked={enableFlvStream} 
                onChange={(e) => {
                  setEnableFlvStream(e.target.checked);
                  localStorage.setItem('enableFlvStream', e.target.checked);
                }} 
                className="mr-2 h-5 w-5 rounded border-gray-300 text-primary focus:ring-secondary dark:border-gray-600 dark:bg-gray-700"
              />
              <span className="text-darkText dark:text-lightText text-left">Enable Video Stream</span>
            </label>
          </div>
          
          <div>
            <label className="flex items-center cursor-pointer text-left">
              <input 
                type="checkbox" 
                checked={enableMentionNotifications} 
                onChange={(e) => {
                  setEnableMentionNotifications(e.target.checked);
                  localStorage.setItem('enableMentionNotifications', e.target.checked);
                }} 
                className="mr-2 h-5 w-5 rounded border-gray-300 text-primary focus:ring-secondary dark:border-gray-600 dark:bg-gray-700"
              />
              <span className="text-darkText dark:text-lightText text-left">Enable Mention Notifications</span>
            </label>
          </div>

          
        </div>
        
        {/* Column 2 - Advanced Settings */}
        <div className="space-y-4 text-left">
          <div>
            <label className="block mb-2 font-medium text-darkText dark:text-lightText text-left">Your Username:</label>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary dark:bg-gray-700 dark:border-gray-600 dark:text-lightText placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-200 text-left"
              placeholder="For mention notifications"
            />
          </div>
          
          <div>
            <label className="block mb-2 font-medium text-darkText dark:text-lightText text-left">AI Provider:</label>
            <div className="flex space-x-6 text-left">
              <label className="flex items-center cursor-pointer text-left">
                <input 
                  type="radio" 
                  name="aiProvider" 
                  value="openai" 
                  checked={aiProvider === 'openai'} 
                  onChange={() => {
                    setAiProvider('openai');
                    localStorage.setItem('aiProvider', 'openai');
                  }} 
                  className="mr-2 h-5 w-5 border-gray-300 text-primary focus:ring-secondary dark:border-gray-600 dark:bg-gray-700"
                />
                <span className="text-darkText dark:text-lightText text-left">OpenAI</span>
              </label>
              <label className="flex items-center cursor-pointer text-left">
                <input 
                  type="radio" 
                  name="aiProvider" 
                  value="ollama" 
                  checked={aiProvider === 'ollama'} 
                  onChange={() => {
                    setAiProvider('ollama');
                    localStorage.setItem('aiProvider', 'ollama');
                  }} 
                  className="mr-2 h-5 w-5 border-gray-300 text-primary focus:ring-secondary dark:border-gray-600 dark:bg-gray-700"
                />
                <span className="text-darkText dark:text-lightText text-left">Ollama</span>
              </label>
            </div>
          </div>
          
          {aiProvider === 'ollama' && (
            <div>
              <label className="block mb-2 font-medium text-darkText dark:text-lightText text-left">Ollama Model:</label>
              <select 
                value={aiModel} 
                onChange={(e) => {
                  setAiModel(e.target.value);
                  localStorage.setItem('aiModel', e.target.value);
                }} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary dark:bg-gray-700 dark:border-gray-600 dark:text-lightText transition-colors duration-200 text-left"
              >
                {availableOllamaModels.map((model) => (
                  <option key={model.name} value={model.name}>{model.name}</option>
                ))}
              </select>
            </div>
          )}
          
          {aiProvider === 'openai' && (
            <div>
              <label className="block mb-2 font-medium text-darkText dark:text-lightText text-left">OpenAI API Key:</label>
              <input 
                type="password" 
                value={openaiApiKey} 
                onChange={(e) => {
                  setOpenaiApiKey(e.target.value);
                  localStorage.setItem('openaiApiKey', e.target.value);
                }} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary dark:bg-gray-700 dark:border-gray-600 dark:text-lightText placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-200 text-left"
                placeholder="sk-..."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings 