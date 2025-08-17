import React, { useState } from 'react'

const Rating = ({ 
  defaultRating = 0, 
  maxRating = 5, 
  onRate = () => {}, 
  icon = 'star',
  disabled = false 
}) => {
  const [rating, setRating] = useState(defaultRating)
  const [hoveredRating, setHoveredRating] = useState(0)

  const handleClick = (value) => {
    if (disabled) return
    setRating(value)
    onRate(null, { rating: value })
  }

  const handleMouseEnter = (value) => {
    if (disabled) return
    setHoveredRating(value)
  }

  const handleMouseLeave = () => {
    if (disabled) return
    setHoveredRating(0)
  }

  const getStarIcon = () => {
    switch (icon) {
      case 'star':
        return '★'
      case 'heart':
        return '♥'
      default:
        return '★'
    }
  }

  return (
    <div className="rating">
      {Array.from({ length: maxRating }, (_, index) => {
        const value = index + 1
        const isActive = value <= (hoveredRating || rating)
        
        return (
          <span
            key={value}
            className={`rating-star ${isActive ? 'active' : ''}`}
            onClick={() => handleClick(value)}
            onMouseEnter={() => handleMouseEnter(value)}
            onMouseLeave={handleMouseLeave}
            style={{ 
              cursor: disabled ? 'default' : 'pointer',
              opacity: disabled ? 0.5 : 1
            }}
          >
            {getStarIcon()}
          </span>
        )
      })}
    </div>
  )
}

export default Rating
