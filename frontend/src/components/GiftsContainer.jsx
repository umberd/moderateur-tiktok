const GiftsContainer = ({ gifts }) => {
  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden border border-gray-800 bg-gray-900/70 backdrop-blur-sm shadow-xl">
      <div className="px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
        <h3 className="text-lg font-bold text-white flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-pink-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17A3 3 0 015 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" clipRule="evenodd" />
            <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
          </svg>
          Gifts
        </h3>
      </div>
      
      <div className="flex-1 p-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
        style={{ 
          scrollbarWidth: 'thin',
          scrollbarColor: '#4B5563 #111827'
        }}
      >
        {gifts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a4 4 0 00-4-4H5.45a4 4 0 00-3.973 3.326A11.955 11.955 0 016 18v-7m6 0v7m0-7V4a4 4 0 014-4h2.55a4 4 0 013.973 3.326A11.955 11.955 0 0118 18v-7" />
            </svg>
            <p>No gifts yet</p>
            <p className="text-xs mt-1">Gifts will appear here when received</p>
          </div>
        ) : (
          <div className="space-y-2">
            {gifts.map((gift, index) => (
              <div 
                key={`gift-${index}`} 
                className="p-3 bg-gray-800/60 border border-gray-700/50 rounded-xl transition-all hover:bg-gray-800/80 hover:border-pink-500/20 group"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 flex items-center justify-center mr-3">
                    <span className="text-xl group-hover:animate-bounce transition-all duration-300">
                      {gift.giftName.includes('Rose') ? '🌹' : 
                       gift.giftName.includes('Heart') ? '❤️' : 
                       gift.giftName.includes('Crown') ? '👑' : 
                       gift.giftName.includes('Diamond') ? '💎' : '🎁'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      <span className="font-bold text-pink-400">{gift.nickname}</span>
                    </p>
                    <p className="text-xs text-gray-400">
                      Sent {gift.repeatCount}x {gift.giftName}
                    </p>
                  </div>
                  {gift.diamondCount > 0 && (
                    <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 group-hover:bg-blue-500/30 transition-colors">
                      <span className="mr-1 group-hover:animate-pulse">{gift.diamondCount}</span>
                      <span className="text-xs">💎</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default GiftsContainer 