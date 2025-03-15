const ModerationStats = ({ moderationStats }) => {
  // Calculate percentages for the progress bars
  const totalMessages = moderationStats.total || 1 // Avoid division by zero
  const flaggedPercentage = (moderationStats.flagged / totalMessages) * 100
  const safePercentage = (moderationStats.safe / totalMessages) * 100
  
  // Get category with highest count
  const highestCategoryCount = Math.max(
    ...Object.values(moderationStats.categories || {}),
    1 // Fallback if no categories or all are 0
  )
  
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/70 backdrop-blur-sm shadow-xl overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <h3 className="text-lg font-bold text-white">Moderation Stats</h3>
      </div>
      
      {/* Overview cards */}
      <div className="grid grid-cols-3 gap-2 p-3">
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg p-2 text-center transition-all hover:bg-gray-800/80">
          <div className="text-xs text-gray-400 uppercase tracking-wider">Total</div>
          <div className="text-xl font-bold text-white">{moderationStats.total}</div>
        </div>
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg p-2 text-center transition-all hover:bg-gray-800/80">
          <div className="text-xs text-rose-400 uppercase tracking-wider">Flagged</div>
          <div className="text-xl font-bold text-rose-400">{moderationStats.flagged}</div>
        </div>
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg p-2 text-center transition-all hover:bg-gray-800/80">
          <div className="text-xs text-emerald-400 uppercase tracking-wider">Safe</div>
          <div className="text-xl font-bold text-emerald-400">{moderationStats.safe}</div>
        </div>
      </div>
      
      {/* Progress bars */}
      <div className="px-3 pb-3">
        <div className="flex justify-between mb-1">
          <span className="text-xs text-white font-medium">Safety ratio</span>
          <span className="text-xs text-gray-400">{moderationStats.flagged} / {totalMessages}</span>
        </div>
        <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
          <div className="flex h-full">
            <div 
              style={{ width: `${safePercentage}%` }} 
              className="bg-gradient-to-r from-emerald-500 to-green-500 h-full"
            />
            <div 
              style={{ width: `${flaggedPercentage}%` }} 
              className="bg-gradient-to-r from-rose-500 to-red-500 h-full"
            />
          </div>
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-400">
          <span className="flex items-center">
            <span className="w-2 h-2 bg-emerald-500 rounded-full mr-1"></span>
            Safe ({safePercentage.toFixed(1)}%)
          </span>
          <span className="flex items-center">
            <span className="w-2 h-2 bg-rose-500 rounded-full mr-1"></span>
            Flagged ({flaggedPercentage.toFixed(1)}%)
          </span>
        </div>
      </div>
      
      {/* Categories */}
      <div className="border-t border-gray-700 bg-gray-800/50 px-3 py-2">
        <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
            <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
          </svg>
          Violation Categories
        </h4>
      </div>
      
      <div className="max-h-[200px] overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
        style={{ 
          scrollbarWidth: 'thin',
          scrollbarColor: '#4B5563 #111827'
        }}
      >
        {Object.entries(moderationStats.categories).map(([category, count]) => {
          const percentage = (count / highestCategoryCount) * 100
          const categoryColor = getCategoryColor(category)
          
          return (
            <div key={category} className="flex flex-col">
              <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-300 capitalize">{translateCategory(category)}</span>
                <span className="text-xs font-medium" style={{ color: categoryColor.text }}>{count}</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${categoryColor.bg}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Helper function to translate moderation categories
const translateCategory = (category) => {
  const translations = {
    'harassment': 'Harassment',
    'hate': 'Hate Speech',
    'sexual': 'Sexual Content',
    'violence': 'Violence',
    'self_harm': 'Self Harm',
    'illegal': 'Illegal Activity'
  }
  
  return translations[category] || category
}

// Helper function to get category colors
const getCategoryColor = (category) => {
  const colors = {
    'harassment': { 
      bg: 'bg-gradient-to-r from-orange-500 to-amber-500',
      text: '#f97316' 
    },
    'hate': { 
      bg: 'bg-gradient-to-r from-red-500 to-rose-500',
      text: '#ef4444' 
    },
    'sexual': { 
      bg: 'bg-gradient-to-r from-pink-500 to-fuchsia-500',
      text: '#ec4899' 
    },
    'violence': { 
      bg: 'bg-gradient-to-r from-red-800 to-red-600',
      text: '#991b1b' 
    },
    'self_harm': { 
      bg: 'bg-gradient-to-r from-purple-500 to-violet-500',
      text: '#a855f7' 
    },
    'illegal': { 
      bg: 'bg-gradient-to-r from-blue-500 to-indigo-500',
      text: '#3b82f6' 
    }
  }
  
  return colors[category] || { 
    bg: 'bg-gradient-to-r from-gray-500 to-gray-600',
    text: '#9ca3af' 
  }
}

export default ModerationStats 