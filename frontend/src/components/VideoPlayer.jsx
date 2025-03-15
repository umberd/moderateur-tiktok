import { useEffect, useRef, useState } from 'react'
import flvjs from 'flv.js'

const VideoPlayer = ({ username, enableFlvStream, connectionRef }) => {
  const videoPlayerRef = useRef(null)
  const flvPlayerRef = useRef(null)
  const [streamError, setStreamError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    if (enableFlvStream && flvjs.isSupported() && connectionRef && connectionRef.current) {
      setIsLoading(true)
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
      setIsLoading(false)
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
        isLive: true,
        hasAudio: true,
        hasVideo: true
      })
      
      flvPlayer.attachMediaElement(videoPlayerRef.current)
      flvPlayer.load()
      
      // Handle loading states
      flvPlayer.on('error', (err) => {
        console.error('FLV Player error:', err)
        setStreamError(`Stream error: ${err}`)
        setIsLoading(false)
      })
      
      flvPlayer.on('loading', () => {
        setIsLoading(true)
      })
      
      flvPlayer.on('loaded', () => {
        setIsLoading(false)
      })
      
      // Try to play - may be blocked by browser autoplay policies
      flvPlayer.play().catch(error => {
        console.warn('Auto-play was prevented by the browser. User interaction required:', error)
        setIsLoading(false)
      })
      
      // Handle video loaded event to hide loading indicator
      videoPlayerRef.current.addEventListener('canplay', () => {
        setIsLoading(false)
      })
      
      flvPlayerRef.current = flvPlayer
      setStreamError(null)
    } else {
      console.error('FLV playback is not supported in this browser')
      setStreamError('FLV playback is not supported in this browser')
      setIsLoading(false)
    }
  }
  
  if (!enableFlvStream) {
    return null
  }
  
  return (
    <div className="w-full aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-xl border border-gray-800 relative">
      {streamError ? (
        <div className="flex flex-col items-center justify-center h-full p-6 text-rose-400 font-medium text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-rose-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{streamError}</p>
          <button 
            className="mt-4 px-4 py-2 bg-rose-500/20 border border-rose-500/30 rounded-lg text-rose-300 hover:bg-rose-500/30 transition-colors"
            onClick={initializeVideoPlayer}
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <>
          <video 
            ref={videoPlayerRef} 
            controls 
            autoPlay 
            className="w-full h-full rounded-xl"
            poster="/video-loading.jpg"
          />
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-gray-600 border-t-pink-500 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-300 font-medium">Connecting to stream...</p>
                <p className="text-xs text-gray-400 mt-2">@{username}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default VideoPlayer 