import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, Audio, interpolate, spring } from 'remotion';

export const NewsTemplate = ({ topic, newsItems }) => {
  const { fps, width, height } = useVideoConfig();
  const frame = useCurrentFrame();

  // We assign a fixed duration per slide, e.g., 5 seconds (150 frames)
  const framesPerSlide = 150;
  
  return (
    <AbsoluteFill style={{ 
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      color: 'white',
      fontFamily: 'sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        height: '250px',
        width: '100%',
        background: 'rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 80px',
        borderBottom: '2px solid rgba(255,255,255,0.1)'
      }}>
        <h1 style={{ fontSize: '80px', fontWeight: 'bold' }}>{topic}</h1>
      </div>

      {/* Sequences for each news headline */}
      {newsItems.map((item, index) => {
        const startFrame = index * framesPerSlide;
        const animationIn = spring({ frame: frame - startFrame, fps, config: { damping: 12 } });
        const yOffset = interpolate(animationIn, [0, 1], [100, 0]);
        const opacity = interpolate(animationIn, [0, 1], [0, 1]);

        return (
          <Sequence key={index} from={startFrame} durationInFrames={framesPerSlide}>
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '100px',
              opacity,
              transform: `translateY(${yOffset}px)`
            }}>
              <p style={{
                fontSize: '40px',
                color: '#60a5fa',
                marginBottom: '30px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '2px'
              }}>
                {item.source}
              </p>
              <h2 style={{
                fontSize: '85px',
                lineHeight: '1.2',
                fontWeight: '800'
              }}>
                {item.headline}
              </h2>
            </div>
            
            {/* Audio Track for this slide */}
            {item.audioUrl && <Audio src={item.audioUrl} />}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
