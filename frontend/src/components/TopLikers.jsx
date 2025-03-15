import React from 'react';

const TopLikers = ({ likers }) => {
  // Sort likers by likeCount in descending order
  const sortedLikers = [...likers].sort((a, b) => b.likeCount - a.likeCount);
  
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/70 backdrop-blur-sm shadow-xl overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
          <h3 className="text-lg font-bold text-white">Top Fans</h3>
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
          {likers.length} fans
        </span>
      </div>
      
      <div className="divide-y divide-gray-800">
        {sortedLikers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <p>No likes yet</p>
            <p className="text-xs mt-1">Users who like the stream will appear here</p>
          </div>
        ) : (
          sortedLikers.slice(0, 10).map((liker, index) => (
            <div 
              key={liker.uniqueId} 
              className={`flex items-center justify-between px-4 py-3 transition-colors ${
                liker.userStatus?.isFriend ? 'bg-emerald-500/10 hover:bg-emerald-500/15' : 
                liker.userStatus?.isUndesirable ? 'bg-rose-500/10 hover:bg-rose-500/15' : 
                'hover:bg-gray-800/70'
              }`}
            >
              <div className="flex items-center">
                <div className={`flex items-center justify-center w-7 h-7 rounded-full mr-3 text-xs font-bold ${
                  index < 3 ? 
                    index === 0 ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' : 
                    index === 1 ? 'bg-gray-300/20 text-gray-300 border border-gray-300/30' : 
                    'bg-amber-600/20 text-amber-400 border border-amber-600/30' : 
                    'bg-gray-700 text-gray-400 border border-gray-600/30'
                }`}>
                  {index + 1}
                </div>
                
                <div>
                  <span className={`font-medium ${
                    liker.userStatus?.isFriend ? 'text-emerald-400' : 
                    liker.userStatus?.isUndesirable ? 'text-rose-400' : 
                    'text-white'
                  }`}>
                    {liker.nickname}
                  </span>
                  
                  {(liker.userStatus?.isFriend || liker.userStatus?.isUndesirable) && (
                    <span className={`ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                      liker.userStatus?.isFriend ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 
                      'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {liker.userStatus?.isFriend ? 'Friend' : 'Undesirable'}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center bg-red-500/20 px-2 py-1 rounded-full border border-red-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-medium text-red-300">{liker.likeCount.toLocaleString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TopLikers; 