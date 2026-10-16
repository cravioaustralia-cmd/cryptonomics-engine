import {Config} from '@remotion/cli/config';

// Brand assets live one level up; serve them directly instead of copying.
Config.setPublicDir('../assets');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setConcurrency(4);
Config.setChromiumOpenGlRenderer('swangle');
