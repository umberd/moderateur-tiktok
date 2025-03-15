const GiftsContainer = ({ gifts }) => {
  return (
    <div className="gifts-container">
      <h3>Cadeaux</h3>
      {gifts.map((gift, index) => (
        <div key={`gift-${index}`} className="gift-item">
          <p>
            <span className="username">{gift.nickname}</span> a envoyé {gift.repeatCount}x {gift.giftName}
            {gift.diamondCount > 0 && <span className="diamond-count"> ({gift.diamondCount} 💎)</span>}
          </p>
        </div>
      ))}
    </div>
  )
}

export default GiftsContainer 