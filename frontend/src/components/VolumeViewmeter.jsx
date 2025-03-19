import { useEffect, useRef } from 'react';

const VolumeViewmeter = ({ audioAnalyser, isActive, silenceThreshold = 0.05 }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  
  useEffect(() => {
    if (!audioAnalyser || !isActive) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dataArray = new Uint8Array(audioAnalyser.frequencyBinCount);
    
    const draw = () => {
      // Schedule next animation frame
      animationRef.current = requestAnimationFrame(draw);
      
      // Get audio data
      audioAnalyser.getByteFrequencyData(dataArray);
      
      // Calculate average volume level
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      const normalizedAverage = average / 255; // 0-1 scale
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw volume bars
      const barWidth = 4;
      const barGap = 2;
      const barCount = Math.floor(canvas.width / (barWidth + barGap));
      const barHeightMax = canvas.height - 4;
      
      // Draw bars
      for (let i = 0; i < barCount; i++) {
        // Vary the height based on frequency data for more interesting visualization
        const index = Math.floor(i / barCount * dataArray.length);
        const value = dataArray[index] / 255;  // Normalize to 0-1
        
        const barHeight = value * barHeightMax;
        const x = i * (barWidth + barGap);
        const y = canvas.height - barHeight;
        
        // Gradient color based on volume (green to yellow to red)
        let hue = 120 - (value * 120); // 120 is green, 0 is red
        ctx.fillStyle = `hsl(${hue}, 80%, 50%)`;
        
        ctx.fillRect(x, y, barWidth, barHeight);
      }
      
      // Display numeric value
      ctx.fillStyle = 'white';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${Math.round(normalizedAverage * 100)}%`, canvas.width - 5, 12);
      
      // Draw silence threshold line
      const thresholdY = canvas.height - (silenceThreshold * barHeightMax * 5); // Multiply by 5 to make it more visible
      ctx.beginPath();
      ctx.moveTo(0, thresholdY);
      ctx.lineTo(canvas.width, thresholdY);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 2]);
      ctx.stroke();
      
      // Reset dash
      ctx.setLineDash([]);
      
      // Display "Silence" label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Silence', 5, thresholdY - 3);
    };
    
    // Start animation
    draw();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [audioAnalyser, isActive, silenceThreshold]);
  
  return (
    <div className={`rounded-lg overflow-hidden ${isActive ? 'opacity-100' : 'opacity-40'}`}>
      <canvas 
        ref={canvasRef} 
        width={200} 
        height={30}
        className="w-full h-full"
      />
    </div>
  );
};

export default VolumeViewmeter; 