import React from 'react';

const TopLikers = ({ likers }) => {
  // Sort likers by likeCount in descending order
  const sortedLikers = [...likers].sort((a, b) => b.likeCount - a.likeCount);
  
  return (
    <div className="top-likers-container">
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Meilleurs fans</h5>
          <span className="badge bg-primary">
            {likers.length}
          </span>
        </div>
        <div className="card-body p-0">
          <ul className="list-group list-group-flush">
            {sortedLikers.length === 0 ? (
              <li className="list-group-item text-center">Pas encore de likes</li>
            ) : (
              sortedLikers.slice(0, 10).map((liker, index) => (
                <li 
                  key={liker.uniqueId} 
                  className={`list-group-item d-flex justify-content-between align-items-center ${
                    liker.userStatus?.isFriend ? 'list-group-item-success' : 
                    liker.userStatus?.isUndesirable ? 'list-group-item-danger' : ''
                  }`}
                >
                  <div>
                    <span className="me-2">{index + 1}.</span>
                    <span>{liker.nickname}</span>
                    {liker.userStatus?.isFriend && (
                      <span className="badge bg-success ms-2">Ami</span>
                    )}
                    {liker.userStatus?.isUndesirable && (
                      <span className="badge bg-danger ms-2">Indésirable</span>
                    )}
                  </div>
                  <span className="badge bg-primary rounded-pill">
                    <i className="bi bi-heart-fill me-1"></i>
                    {liker.likeCount}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TopLikers; 