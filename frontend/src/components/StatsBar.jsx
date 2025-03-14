const StatsBar = ({ viewerCount, likeCount, diamondsCount }) => {
  return (
    <div className="stats-container">
      <div className="stat">
        <span className="stat-icon">👁️</span>
        <span className="stat-value">{viewerCount}</span>
      </div>
      <div className="stat">
        <span className="stat-icon">❤️</span>
        <span className="stat-value">{likeCount}</span>
      </div>
      <div className="stat">
        <span className="stat-icon">💎</span>
        <span className="stat-value">{diamondsCount}</span>
      </div>
    </div>
  )
}

export default StatsBar 