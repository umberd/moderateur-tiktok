const ModerationStats = ({ moderationStats }) => {
  return (
    <div className="moderation-stats">
      <h3>Moderation Stats</h3>
      <div className="stats-row">
        <div className="stat">
          <span className="stat-label">Total:</span>
          <span className="stat-value">{moderationStats.total}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Flagged:</span>
          <span className="stat-value">{moderationStats.flagged}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Safe:</span>
          <span className="stat-value">{moderationStats.safe}</span>
        </div>
      </div>
      
      <h4>Categories</h4>
      <div className="categories-stats">
        {Object.entries(moderationStats.categories).map(([category, count]) => (
          <div key={category} className="category-stat">
            <span className="category-label">{category}:</span>
            <span className="category-value">{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ModerationStats 