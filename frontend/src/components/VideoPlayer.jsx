import { useEffect, useRef, useState } from 'react'
import flvjs from 'flv.js'

const VideoPlayer = ({ username, enableFlvStream, connectionRef,openaiApiKey }) => {
  const videoPlayerRef = useRef(null)
  const flvPlayerRef = useRef(null)
  const audioContextRef = useRef(null)
  const audioSourceRef = useRef(null)
  const audioProcessorRef = useRef(null)
  const [streamError, setStreamError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcript, setTranscript] = useState('');
  const transcriptRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const recordedChunksRef = useRef([]);
  const mediaRecorderRef = useRef(null);


  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);


  useEffect(() => {
    if (enableFlvStream && flvjs.isSupported() && connectionRef && connectionRef.current) {
      setIsLoading(true)
      initializeVideoPlayer()
      
      // Initialize audio context when playback starts
      const handlePlaying = () => {
        if (videoPlayerRef.current && !audioContextRef.current) {
          initializeAudioCapture();
        }
      };
      
      if (videoPlayerRef.current) {
        videoPlayerRef.current.addEventListener('playing', handlePlaying);
      }
      
      return () => {
        if (videoPlayerRef.current) {
          videoPlayerRef.current.removeEventListener('playing', handlePlaying);
        }
      };
    }
    
    return () => {
      destroyPlayer()
      destroyAudioCapture()
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
  
  const initializeAudioCapture = () => {
    try {
      // Create audio context
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
      
      // Create source node from video element
      audioSourceRef.current = audioContextRef.current.createMediaElementSource(videoPlayerRef.current);
      
      // Connect to destination (speakers) so we can still hear it
      audioSourceRef.current.connect(audioContextRef.current.destination);
      
      console.log('Audio capture initialized');
    } catch (error) {
      console.error('Error initializing audio capture:', error);
    }
  };
  
  const destroyAudioCapture = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
      audioSourceRef.current = null;
    }
  };
  
  const startTranscription = async () => {
    if (!audioContextRef.current || !audioSourceRef.current || isTranscribing) return;
    
    setIsTranscribing(true);
    setTranscript('');
    
    try {
      // Create a script processor node to access audio data
      const bufferSize = 4096;
      const processorNode = audioContextRef.current.createScriptProcessor(
        bufferSize, 1, 1
      );
      
      // Buffer to accumulate audio data before sending
      let audioChunks = [];
      
      processorNode.onaudioprocess = (e) => {
        const audioData = e.inputBuffer.getChannelData(0);
        
        // Convert Float32Array to Int16Array for compatibility with most APIs
        const pcmData = convertFloat32ToInt16(audioData);
        audioChunks.push(pcmData);
        
        // If we have enough data, send to OpenAI API
        if (audioChunks.length >= 30) { // ~2 seconds of audio at 44.1kHz
          const audioBlob = createAudioBlob(audioChunks);
          sendToOpenAI(audioBlob);
          audioChunks = [];
        }
      };
      
      // Connect processor node
      audioSourceRef.current.connect(processorNode);
      processorNode.connect(audioContextRef.current.destination);
      
      audioProcessorRef.current = processorNode;
    } catch (error) {
      console.error('Error starting transcription:', error);
      setIsTranscribing(false);
    }
  };
  
  const stopTranscription = () => {
    if (audioProcessorRef.current) {
      audioProcessorRef.current.disconnect();
      audioProcessorRef.current = null;
    }
    setIsTranscribing(false);
  };
  
  const convertFloat32ToInt16 = (buffer) => {
    const l = buffer.length;
    const buf = new Int16Array(l);
    
    for (let i = 0; i < l; i++) {
      buf[i] = Math.min(1, Math.max(-1, buffer[i])) * 0x7FFF;
    }
    
    return buf;
  };
  
  const createAudioBlob = (chunks) => {
    // Combine all chunks into a single array
    const totalLength = chunks.reduce((acc, val) => acc + val.length, 0);
    const combined = new Int16Array(totalLength);
    
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    
    // Create WAV file
    const wavBuffer = createWAVFile(combined);
    return new Blob([wavBuffer], { type: 'audio/wav' });
  };
  
  const createWAVFile = (samples) => {
    const sampleRate = 44100;
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    
    // RIFF identifier
    writeString(view, 0, 'RIFF');
    // File length
    view.setUint32(4, 36 + samples.length * 2, true);
    // RIFF type
    writeString(view, 8, 'WAVE');
    // Format chunk identifier
    writeString(view, 12, 'fmt ');
    // Format chunk length
    view.setUint32(16, 16, true);
    // Sample format (1 = PCM)
    view.setUint16(20, 1, true);
    // Channels (1 = mono)
    view.setUint16(22, 1, true);
    // Sample rate
    view.setUint32(24, sampleRate, true);
    // Byte rate (sample rate * block align)
    view.setUint32(28, sampleRate * 2, true);
    // Block align (channels * bytes per sample)
    view.setUint16(32, 2, true);
    // Bits per sample
    view.setUint16(34, 16, true);
    // Data chunk identifier
    writeString(view, 36, 'data');
    // Data chunk length
    view.setUint32(40, samples.length * 2, true);
    
    // Write the PCM samples
    const offset = 44;
    for (let i = 0; i < samples.length; i++) {
      view.setInt16(offset + i * 2, samples[i], true);
    }
    
    return buffer;
  };
  
  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  const sendToOpenAI = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob);
      formData.append('model', 'whisper-1');
      formData.append('language', 'fr');
      formData.append('prompt', '');
      formData.append('response_format', 'json');
      
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.text) {
        data.text = data.text.replace(".", '.\n');
        data.text = data.text.replace("!", '!\n');
        data.text = data.text.replace("?", '?\n');
        data.text = data.text.replace(",", ',\n');
        data.text = data.text.replace(";", ';\n');
        data.text = data.text.replace(":", ':\n');
        setTranscript(prev => prev + ' ' + data.text);
      }
    } catch (error) {
      console.error('Error sending audio to OpenAI:', error);
    }
  };
  
  const exportTranscript = () => {
    if (!transcript) return;
    
    // Create a blob with the transcript text
    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    
    // Create a temporary URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create a download link
    const link = document.createElement('a');
    link.href = url;
    link.download = `transcript-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.txt`;
    
    // Append to body, click and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL
    URL.revokeObjectURL(url);
  };
  
  const startRecording = () => {
    if (!videoPlayerRef.current || !flvPlayerRef.current || isRecording) return;
    
    try {
      // Create a MediaStream from the video element
      const stream = videoPlayerRef.current.captureStream();
      
      // Determine supported MIME type (try MP4 first, fallback to WebM)
      let mimeType = 'video/mp4';
      let fileExtension = 'mp4';
      
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
        fileExtension = 'webm';
        console.log('MP4 recording not supported by this browser, falling back to WebM');
      }
      
      // Initialize MediaRecorder with the stream
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        videoBitsPerSecond: 2500000 // 2.5 Mbps
      });
      
      // Store file extension for later use
      mediaRecorder.fileExtension = fileExtension;
      
      // Set up event handlers for recording
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      // Start recording
      recordedChunksRef.current = [];
      mediaRecorder.start(1000); // Collect data every second
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      
      console.log(`Recording started using ${mimeType} format`);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };
  
  const stopRecording = () => {
    if (!isRecording || !mediaRecorderRef.current) return;
    
    try {
      // Stop the MediaRecorder
      mediaRecorderRef.current.stop();
      
      // Handle the stop event to download the recording
      mediaRecorderRef.current.onstop = () => {
        // Get the file extension that was determined during start
        const fileExtension = mediaRecorderRef.current.fileExtension || 'mp4';
        
        // Create a blob from the recorded chunks with the appropriate type
        const mimeType = fileExtension === 'mp4' ? 'video/mp4' : 'video/webm';
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        
        // Create a download link for the video
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `tiktok-live-${username}-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.${fileExtension}`;
        
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
        
        recordedChunksRef.current = [];
        setIsRecording(false);
        console.log(`Recording stopped and downloaded as ${fileExtension}`);
      };
    } catch (error) {
      console.error('Error stopping recording:', error);
      setIsRecording(false);
    }
  };
  
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
          
          {/* Recording controls */}
          <div className="absolute top-4 left-4 flex gap-2">
            {!isRecording ? (
              <button 
                onClick={startRecording}
                className="px-3 py-1 bg-red-500/80 text-white rounded-lg text-sm hover:bg-red-500 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle cx="12" cy="12" r="8" fill="currentColor" />
                </svg>
                Record
              </button>
            ) : (
              <button 
                onClick={stopRecording}
                className="px-3 py-1 bg-gray-600/80 text-white rounded-lg text-sm hover:bg-gray-600 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <rect x="6" y="6" width="12" height="12" fill="currentColor" />
                </svg>
                Stop & Download
              </button>
            )}
          </div>
          
          {/* Transcription controls */}
          {openaiApiKey && (
          <div className="absolute top-4 right-4  flex gap-2">
            {!isTranscribing ? (
              <button 
                onClick={startTranscription}
                className="px-3 py-1 bg-pink-500/80 text-white rounded-lg text-sm hover:bg-pink-500"
              >
                Start Transcription
              </button>
            ) : (
              <button 
                onClick={stopTranscription}
                className="px-3 py-1 bg-gray-600/80 text-white rounded-lg text-sm hover:bg-gray-600"
              >
                Stop Transcription
              </button>
            )}
            
            {transcript && (
              <button 
                onClick={exportTranscript}
                className="px-3 py-1 bg-blue-500/80 text-white rounded-lg text-sm hover:bg-blue-500"
              >
                Export Transcript
              </button>
            )}
          </div>
          )}
          
          {/* Transcript display */}
          {transcript && (
            <div ref={transcriptRef} className="absolute bottom-16 left-4 right-4 max-h-32 overflow-y-auto bg-black/70 p-3 rounded-lg text-white text-sm">
              <p className="whitespace-pre-wrap">{transcript}</p>
            </div>
          )}
          
          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute top-16 left-4 flex items-center bg-black/70 px-3 py-1 rounded-lg">
              <span className="h-3 w-3 bg-red-500 rounded-full mr-2 animate-pulse"></span>
              <span className="text-white text-xs">Recording</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default VideoPlayer 