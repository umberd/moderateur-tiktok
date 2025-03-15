const StatsBar = ({ viewerCount, likeCount, diamondsCount }) => {
  const statStyles = {
    container: {
      display: 'flex',
      justifyContent: 'space-around',
      padding: '12px',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(5px)',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      margin: '10px 0'
    },
    stat: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '6px'
    },
    iconContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      transition: 'transform 0.2s, box-shadow 0.2s'
    },
    icon: {
      fontSize: '1.8rem'
    },
    value: {
      fontSize: '1rem',
      fontWeight: 'bold'
    }
  };

  return (
    <div style={statStyles.container} className="stats-container">
      <div style={statStyles.stat} className="stat">
        <div style={statStyles.iconContainer}>
          <span style={statStyles.icon}>👁️</span>
        </div>
        <span style={statStyles.value}>{viewerCount}</span>
      </div>
      <div style={statStyles.stat} className="stat">
        <div style={statStyles.iconContainer}>
          <span style={statStyles.icon}>❤️</span>
        </div>
        <span style={statStyles.value}>{likeCount}</span>
      </div>
      <div style={statStyles.stat} className="stat">
        <div style={statStyles.iconContainer}>
          <span style={statStyles.icon}>💎</span>
        </div>
        <span style={statStyles.value}>{diamondsCount}</span>
      </div>
    </div>
  )
}

export default StatsBar 