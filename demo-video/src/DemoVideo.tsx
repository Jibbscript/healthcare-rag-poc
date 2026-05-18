import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig
} from 'remotion';
import { type DemoScene, durationInFrames, scenes } from './storyboard';

const accentColor: Record<DemoScene['accent'], string> = {
  green: '#0a7d55',
  blue: '#245f91',
  amber: '#a76212',
  red: '#a03b2f'
};

export const DemoVideo = () => {
  const { fps } = useVideoConfig();
  let from = 0;

  return (
    <AbsoluteFill style={styles.root}>
      <Background />
      {scenes.map((scene, index) => {
        const duration = scene.durationSeconds * fps;
        const start = from;
        from += duration;
        return (
          <Sequence key={scene.id} from={start} durationInFrames={duration} premountFor={fps}>
            <Scene scene={scene} index={index} total={scenes.length} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const Scene = ({ scene, index, total }: { scene: DemoScene; index: number; total: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sceneDurationFrames = scene.durationSeconds * fps;
  const accent = accentColor[scene.accent];
  const enter = interpolate(frame, [0, 0.7 * fps], [24, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });
  const opacity = interpolate(frame, [0, 0.6 * fps, sceneDurationFrames - 0.5 * fps, sceneDurationFrames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  return (
    <AbsoluteFill style={{ ...styles.scene, opacity, transform: `translateY(${enter}px)` }}>
      <div style={styles.copy}>
        <div style={{ ...styles.kicker, color: accent, borderColor: `${accent}55`, backgroundColor: `${accent}12` }}>
          {scene.kicker}
        </div>
        <h1 style={styles.title}>{scene.title}</h1>
        <p style={styles.body}>{scene.body}</p>
        <div style={styles.footer}>
          <span style={{ ...styles.progress, backgroundColor: accent }} />
          <span>{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
        </div>
      </div>
      <div style={styles.visualWrap}>
        {scene.image ? (
          <div style={styles.browserFrame}>
            <div style={styles.browserTop}>
              <span style={{ backgroundColor: '#cf564c' }} />
              <span style={{ backgroundColor: '#d9a321' }} />
              <span style={{ backgroundColor: '#2f9f68' }} />
            </div>
            <Img
              src={staticFile(scene.image)}
              style={styles.image}
            />
          </div>
        ) : (
          <StatementPanel scene={scene} accent={accent} />
        )}
      </div>
    </AbsoluteFill>
  );
};

const StatementPanel = ({ scene, accent }: { scene: DemoScene; accent: string }) => {
  const items = scene.id === 'intro'
    ? ['Fixture playback label', 'Cited answer proof', 'Guardrail screenshots', 'Pages verification', 'aws-smoke summary-only']
    : ['No smoke keys', 'No AWS account ids', 'No request bodies', 'No raw prompts or answers'];

  return (
    <div style={{ ...styles.statement, borderColor: `${accent}55` }}>
      <span style={{ ...styles.statementRule, backgroundColor: accent }} />
      <strong style={styles.statementTitle}>{scene.id === 'intro' ? 'Two evidence lanes' : 'Sanitized by construction'}</strong>
      <p style={styles.statementBody}>{scene.id === 'intro' ? 'GitHub Pages shows fixture playback. aws-smoke appears only as separate summary evidence.' : 'The final scene list and generated text assets are scanned before the MP4 check runs.'}</p>
      <div style={styles.statementGrid}>
        {items.map((item) => (
          <div key={item} style={styles.statementItem}>
            <span style={{ backgroundColor: accent }} />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
};

const Background = () => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, durationInFrames], [0, 44], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={styles.background}>
      <div style={{ ...styles.band, transform: `translateX(${drift}px)` }} />
    </AbsoluteFill>
  );
};

const styles: Record<string, React.CSSProperties> = {
  root: {
    backgroundColor: '#f8faf7',
    color: '#17221d',
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  },
  background: {
    background: 'linear-gradient(135deg, #eef7f2 0%, #f7f1e7 48%, #edf4fb 100%)',
    overflow: 'hidden'
  },
  band: {
    position: 'absolute',
    left: -160,
    right: -160,
    top: 700,
    height: 260,
    background: 'linear-gradient(90deg, rgba(13, 109, 77, 0.12), rgba(31, 93, 143, 0.12), rgba(162, 98, 18, 0.12))',
    transform: 'skewY(-6deg)'
  },
  scene: {
    display: 'grid',
    gridTemplateColumns: '560px 1fr',
    gap: 58,
    padding: '72px 84px',
    alignItems: 'center'
  },
  copy: {
    alignSelf: 'stretch',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  },
  kicker: {
    width: 'fit-content',
    maxWidth: 500,
    border: '1px solid',
    padding: '10px 13px',
    fontSize: 23,
    lineHeight: 1.1,
    fontWeight: 800,
    marginBottom: 24
  },
  title: {
    margin: 0,
    fontSize: 68,
    lineHeight: 0.96,
    letterSpacing: 0,
    maxWidth: 540
  },
  body: {
    margin: '28px 0 0',
    fontSize: 31,
    lineHeight: 1.25,
    color: '#4d5b53',
    maxWidth: 540
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginTop: 54,
    color: '#536158',
    fontSize: 22,
    fontWeight: 800
  },
  progress: {
    display: 'block',
    width: 92,
    height: 6
  },
  visualWrap: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  browserFrame: {
    width: 1180,
    height: 820,
    background: '#ffffff',
    border: '1px solid rgba(25, 42, 35, 0.18)',
    boxShadow: '0 28px 70px rgba(18, 33, 28, 0.22)',
    overflow: 'hidden'
  },
  browserTop: {
    height: 42,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '0 18px',
    background: '#e9eee9',
    borderBottom: '1px solid rgba(25, 42, 35, 0.12)'
  },
  image: {
    width: '100%',
    height: 778,
    objectFit: 'contain',
    transformOrigin: 'center center'
  },
  statement: {
    width: 960,
    minHeight: 520,
    padding: 64,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.82)',
    border: '1px solid',
    boxShadow: '0 22px 58px rgba(18, 33, 28, 0.16)'
  },
  statementGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 14,
    marginTop: 34
  },
  statementTitle: {
    display: 'block',
    fontSize: 44,
    lineHeight: 1.05
  },
  statementBody: {
    margin: '20px 0 0',
    color: '#536158',
    fontSize: 30,
    lineHeight: 1.25
  },
  statementItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    minHeight: 58,
    padding: '0 16px',
    border: '1px solid rgba(25, 42, 35, 0.15)',
    backgroundColor: '#fbfdf9',
    color: '#23362e',
    fontSize: 24,
    fontWeight: 800
  },
  statementRule: {
    width: 120,
    height: 8,
    marginBottom: 32
  }
};
