import React from 'react';
import { Composition } from 'remotion';
import { NewsTemplate } from './NewsTemplate';

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="NewsTemplate"
        component={NewsTemplate}
        durationInFrames={1800} // max 1 minute at 30fps = 1800, we'll calculate dynamically or use CalculateMetadata
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          topic: 'Latest Market News',
          newsItems: [
            {
              headline: 'Loading latest updates...',
              source: 'System',
              audioUrl: ''
            }
          ]
        }}
      />
    </>
  );
};
