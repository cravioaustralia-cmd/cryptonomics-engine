import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Local OFL fonts only (no network at render time).
const faces: [string, string, string][] = [
  ['Space Grotesk', 'fonts/static/SpaceGrotesk-Bold.ttf', '700'],
  ['Space Grotesk', 'fonts/static/SpaceGrotesk-Medium.ttf', '500'],
  ['Space Grotesk', 'fonts/static/SpaceGrotesk-Regular.ttf', '400'],
  ['Inter', 'fonts/static/Inter-Regular.ttf', '400'],
  ['Inter', 'fonts/static/Inter-Medium.ttf', '500'],
  ['Inter', 'fonts/static/Inter-SemiBold.ttf', '600'],
];

export const fontsReady = Promise.all(
  faces.map(([family, file, weight]) => loadFont({family, url: staticFile(file), weight, format: 'truetype'})),
);
