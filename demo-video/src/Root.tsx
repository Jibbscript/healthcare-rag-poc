import { Composition } from 'remotion';
import { DemoVideo } from './DemoVideo';
import { durationInFrames, fps, height, width } from './storyboard';

export const RemotionRoot = () => {
  return (
    <Composition
      id="HealthcareRagDemo"
      component={DemoVideo}
      durationInFrames={durationInFrames}
      fps={fps}
      width={width}
      height={height}
    />
  );
};
