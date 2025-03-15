const ModerationStats = ({ moderationStats }) => {
  return (
    <div className="moderation-stats">
      <h3>Statistiques de modération</h3>
      <div className="stats-row">
        <div className="stat">
          <span className="stat-label">Total :</span>
          <span className="stat-value">{moderationStats.total}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Signalés :</span>
          <span className="stat-value">{moderationStats.flagged}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Sûrs :</span>
          <span className="stat-value">{moderationStats.safe}</span>
        </div>
      </div>
      
      <h4>Catégories</h4>
      <div className="categories-stats">
        {Object.entries(moderationStats.categories).map(([category, count]) => (
          <div key={category} className="category-stat">
            <span className="category-label">{translateCategory(category)} :</span>
            <span className="category-value">{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Helper function to translate moderation categories
const translateCategory = (category) => {
  const translations = {
    'harassment': 'harcèlement',
    'hate': 'haine',
    'sexual': 'sexuel',
    'violence': 'violence',
    'self_harm': 'auto-mutilation',
    'illegal': 'illégal'
  };
  
  return translations[category] || category;
}

export default ModerationStats 