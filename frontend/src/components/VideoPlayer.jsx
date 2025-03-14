import { useEffect, useRef, useState } from 'react'
import flvjs from 'flv.js'

const VideoPlayer = ({ username, enableFlvStream, connectionRef }) => {
  const videoPlayerRef = useRef(null)
  const flvPlayerRef = useRef(null)
  const [streamError, setStreamError] = useState(null)
  
  useEffect(() => {
    if (enableFlvStream && flvjs.isSupported() && connectionRef && connectionRef.current) {
      initializeVideoPlayer()
    }
    
    return () => {
      destroyPlayer()
    }
  }, [username, enableFlvStream, connectionRef])
  
  const destroyPlayer = () => {
    if (flvPlayerRef.current) {
      flvPlayerRef.current.pause()
      flvPlayerRef.current.unload()
      flvPlayerRef.current.detachMediaElement()
      flvPlayerRef.current.destroy()
      flvPlayerRef.current = null
    }
  }
  
  const initializeVideoPlayer = () => {
    // Get stream URL from connection
    const streamUrl = connectionRef.current.getStreamUrl()
    
    if (!streamUrl) {
      console.error('No stream URL available')
      setStreamError('No stream URL available for this LIVE')
      return
    }
    
    console.log('Initializing video player with URL:', streamUrl)
    
    if (flvjs.isSupported() && videoPlayerRef.current) {
      // Destroy existing player if it exists
      destroyPlayer()
      
      // Create new player with the stream URL
      const flvPlayer = flvjs.createPlayer({
        type: 'flv',
        url: streamUrl,
        isLive: true
      })
      
      flvPlayer.attachMediaElement(videoPlayerRef.current)
      flvPlayer.load()
      
      // Try to play - may be blocked by browser autoplay policies
      flvPlayer.play().catch(error => {
        console.warn('Auto-play was prevented by the browser. User interaction required:', error)
      })
      
      flvPlayerRef.current = flvPlayer
      setStreamError(null)
    } else {
      console.error('FLV playback is not supported in this browser')
      setStreamError('FLV playback is not supported in this browser')
    }
  }
  
  if (!enableFlvStream) {
    return null
  }
  
  return (
    <div className="video-container">
      {streamError ? (
        <div className="stream-error-message">
          {streamError}
        </div>
      ) : (
        <video 
          ref={videoPlayerRef} 
          controls 
          autoPlay 
          muted 
          className="video-player"
          poster="/video-loading.jpg"
        />
      )}
    </div>
  )
}

export default VideoPlayer 