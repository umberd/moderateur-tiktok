const ConnectionForm = ({ 
  username, 
  setUsername, 
  connect, 
  isConnecting, 
  error 
}) => {
  return (
    <div className="connection-form">
      <input
        type="text"
        placeholder="TikTok Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="username-input"
      />
      <button 
        onClick={connect} 
        disabled={isConnecting || !username}
        className="connect-button"
      >
        {isConnecting ? 'Connecting...' : 'Connect'}
      </button>
      
      {error && <div className="error-message">{error}</div>}
    </div>
  )
}

export default ConnectionForm 