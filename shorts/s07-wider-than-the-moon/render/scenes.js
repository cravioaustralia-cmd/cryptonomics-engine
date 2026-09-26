/* s07-wider-than-the-moon — photo underlay + SVG motion graphics (no Remotion).
 *
 * One master scene composites nine beats with real crossfades; the shared engine draws captions.
 * Every beat time is anchored to a word in ../transcript.json (see cue()).
 */
(function () {
  const W = 1080;
  const H = 1920;
  const XF = 0.4; // crossfade length at beat seams

  // Palette (Skylab bar: dark photo underlay, amber + cyan instrument graphics).
  const AMBER = '#FFC53D';
  const CREAM = '#FFF3DA';
  const CYAN = '#7FD8FF';
  const RED = '#FF5A4E';
  const INK = '#050814';

  const F_DISPLAY = "Anton, 'Archivo Black', sans-serif";
  const F_HEAD = "'Archivo Black', sans-serif";
  const F_MONO = "'Plex Mono', 'DejaVu Sans Mono', monospace";

  // Stills (natural pixel sizes + measured anchor points).
  const IMG = {
    moon1: { url: '/img/s07_01_full_moon.jpg', w: 4036, h: 4096 },
    bm: { url: '/img/s07_02_australia_satellite.jpg', w: 1635, h: 1287 },
    outline: { url: '/img/s07_03_australia_blank.png', w: 7874, h: 7370 },
    plates: { url: '/img/s07_04_tectonic_plates.png', w: 6740, h: 4600 },
    gps: { url: '/img/s07_05_gps_constellation.jpg', w: 1700, h: 1450 },
    utm: { url: '/img/s07_06_utm_zones.jpg', w: 2048, h: 1024 },
    indo: { url: '/img/s07_07_indo_australian_plate.png', w: 1810, h: 1647 },
    moon2: { url: '/img/s07_08_moon_galileo.jpg', w: 1986, h: 1986 },
  };
  const MOON1 = { u: 1960, v: 2030, r: 1725 }; // Apollo 13 lunar limb (fitted)
  const MOON2 = { u: 999, v: 999, r: 985 }; // Galileo full-disk limb (fitted)
  const BM = { W: [423, 695], E: [1242, 718], cx: 833, cy: 690 }; // Blue Marble mainland extremes
  const OUT = { bx: 106, by: 154, bw: 7739, bh: 6090 }; // s07_03 mainland bbox
  const INDO_AU = { bx: 781, by: 652, bw: 544 }; // s07_07 mainland bbox
  const GPS_EARTH = { u: 846.6, v: 721.6, r: 190.6 };
  const UTM_PX_PER_DEG = 2048 / 360;
  const MOON_KM = 3474;
  const AUS_KM = 4000;

  // Mainland (+ Tasmania) coastline traced from s07_03 (CC0). x: 0..1 across mainland W–E, y in the same units.
  const AUS_MAIN = 'M0.7624,0.0021 L0.7558,0.0000 L0.7506,0.0056 L0.7451,0.0066 L0.7430,0.0193 L0.7374,0.0341 L0.7272,0.0510 L0.7272,0.0535 L0.7321,0.0561 L0.7323,0.0575 L0.7257,0.0623 L0.7267,0.0734 L0.7215,0.0811 L0.7195,0.0928 L0.7226,0.0965 L0.7210,0.1078 L0.7210,0.1168 L0.7226,0.1229 L0.7175,0.1353 L0.7150,0.1476 L0.7155,0.1500 L0.7087,0.1663 L0.7022,0.1737 L0.6991,0.1836 L0.6882,0.1910 L0.6772,0.1915 L0.6724,0.1874 L0.6594,0.1808 L0.6572,0.1731 L0.6525,0.1675 L0.6413,0.1633 L0.6324,0.1619 L0.6235,0.1545 L0.6209,0.1491 L0.6103,0.1450 L0.6010,0.1389 L0.5930,0.1389 L0.5918,0.1348 L0.5822,0.1292 L0.5800,0.1246 L0.5596,0.1111 L0.5591,0.1072 L0.5617,0.1052 L0.5673,0.0956 L0.5719,0.0924 L0.5719,0.0879 L0.5750,0.0821 L0.5750,0.0792 L0.5719,0.0765 L0.5729,0.0680 L0.5810,0.0647 L0.5826,0.0673 L0.5878,0.0653 L0.5908,0.0612 L0.5903,0.0547 L0.5928,0.0535 L0.5987,0.0443 L0.6030,0.0423 L0.6030,0.0393 L0.5985,0.0332 L0.5935,0.0337 L0.5923,0.0296 L0.5908,0.0286 L0.5812,0.0301 L0.5781,0.0317 L0.5786,0.0346 L0.5811,0.0368 L0.5807,0.0397 L0.5762,0.0403 L0.5729,0.0342 L0.5674,0.0351 L0.5643,0.0317 L0.5541,0.0311 L0.5519,0.0348 L0.5490,0.0348 L0.5397,0.0270 L0.5338,0.0275 L0.5184,0.0240 L0.5162,0.0199 L0.5041,0.0214 L0.4964,0.0194 L0.4908,0.0097 L0.4882,0.0097 L0.4846,0.0123 L0.4826,0.0123 L0.4749,0.0040 L0.4570,0.0066 L0.4570,0.0096 L0.4605,0.0116 L0.4657,0.0173 L0.4733,0.0168 L0.4780,0.0220 L0.4785,0.0295 L0.4773,0.0306 L0.4719,0.0311 L0.4656,0.0351 L0.4596,0.0337 L0.4470,0.0348 L0.4361,0.0317 L0.4340,0.0332 L0.4315,0.0382 L0.4238,0.0388 L0.4228,0.0398 L0.4228,0.0452 L0.4157,0.0485 L0.4157,0.0530 L0.4116,0.0536 L0.4101,0.0552 L0.4096,0.0637 L0.4116,0.0672 L0.4079,0.0704 L0.4034,0.0709 L0.3994,0.0852 L0.3932,0.0879 L0.3901,0.0988 L0.3989,0.1062 L0.3988,0.1102 L0.3831,0.1102 L0.3612,0.1062 L0.3544,0.1021 L0.3477,0.0924 L0.3420,0.0883 L0.3385,0.0868 L0.3326,0.0868 L0.3268,0.0817 L0.3186,0.0832 L0.3186,0.0892 L0.3159,0.0924 L0.3100,0.0898 L0.3003,0.0965 L0.2971,0.1047 L0.2901,0.1031 L0.2819,0.1067 L0.2763,0.1138 L0.2763,0.1168 L0.2814,0.1211 L0.2814,0.1224 L0.2743,0.1220 L0.2732,0.1244 L0.2746,0.1302 L0.2692,0.1292 L0.2639,0.1337 L0.2600,0.1343 L0.2579,0.1363 L0.2584,0.1470 L0.2610,0.1509 L0.2584,0.1536 L0.2578,0.1583 L0.2487,0.1567 L0.2446,0.1536 L0.2422,0.1536 L0.2359,0.1573 L0.2359,0.1607 L0.2385,0.1629 L0.2370,0.1699 L0.2446,0.1773 L0.2445,0.1792 L0.2390,0.1787 L0.2384,0.1879 L0.2370,0.1878 L0.2266,0.1699 L0.2241,0.1623 L0.2217,0.1623 L0.2150,0.1695 L0.2038,0.1853 L0.2022,0.1894 L0.2012,0.1971 L0.2033,0.2057 L0.2069,0.2100 L0.2074,0.2139 L0.1946,0.2247 L0.1915,0.2308 L0.1875,0.2450 L0.1761,0.2569 L0.1613,0.2655 L0.1456,0.2690 L0.1434,0.2711 L0.1287,0.2706 L0.1225,0.2813 L0.1047,0.2844 L0.0990,0.2931 L0.0914,0.2962 L0.0813,0.2946 L0.0690,0.2972 L0.0567,0.3064 L0.0402,0.3263 L0.0220,0.3370 L0.0172,0.3559 L0.0142,0.3552 L0.0123,0.3391 L0.0112,0.3380 L0.0081,0.3385 L0.0041,0.3441 L0.0000,0.3631 L0.0005,0.3671 L0.0062,0.3733 L0.0052,0.3879 L0.0005,0.3993 L0.0005,0.4140 L0.0102,0.4259 L0.0128,0.4330 L0.0296,0.4515 L0.0296,0.4594 L0.0282,0.4595 L0.0112,0.4422 L0.0087,0.4422 L0.0076,0.4523 L0.0178,0.4638 L0.0177,0.4652 L0.0107,0.4647 L0.0097,0.4681 L0.0301,0.4913 L0.0337,0.4999 L0.0342,0.5060 L0.0583,0.5378 L0.0618,0.5475 L0.0628,0.5595 L0.0685,0.5759 L0.0884,0.6042 L0.0915,0.6312 L0.0919,0.6453 L0.0888,0.6541 L0.0854,0.6541 L0.0817,0.6515 L0.0787,0.6520 L0.0817,0.6764 L0.0917,0.6766 L0.1000,0.6801 L0.1078,0.6878 L0.1190,0.6908 L0.1470,0.6898 L0.1649,0.6821 L0.1685,0.6762 L0.1752,0.6688 L0.1813,0.6688 L0.1868,0.6658 L0.1884,0.6582 L0.1951,0.6525 L0.2083,0.6510 L0.2288,0.6454 L0.2496,0.6484 L0.2636,0.6444 L0.2670,0.6444 L0.2693,0.6465 L0.2721,0.6465 L0.2783,0.6434 L0.2875,0.6332 L0.2905,0.6205 L0.2927,0.6173 L0.3038,0.6143 L0.3342,0.5937 L0.3437,0.5948 L0.3626,0.5937 L0.4004,0.5738 L0.4432,0.5714 L0.4508,0.5688 L0.4631,0.5744 L0.4740,0.5832 L0.4820,0.5835 L0.4837,0.5811 L0.4870,0.5811 L0.4964,0.5877 L0.5074,0.5861 L0.5127,0.5909 L0.5127,0.5963 L0.5188,0.5980 L0.5173,0.6011 L0.5178,0.6080 L0.5219,0.6133 L0.5300,0.6153 L0.5342,0.6259 L0.5423,0.6343 L0.5428,0.6408 L0.5475,0.6572 L0.5530,0.6617 L0.5556,0.6617 L0.5617,0.6581 L0.5678,0.6471 L0.5781,0.6347 L0.5853,0.6306 L0.5913,0.6295 L0.5990,0.6129 L0.6036,0.6096 L0.6046,0.6042 L0.6060,0.6041 L0.6087,0.6136 L0.6036,0.6158 L0.6046,0.6259 L0.5954,0.6342 L0.5918,0.6596 L0.5892,0.6608 L0.5826,0.6608 L0.5816,0.6624 L0.5832,0.6699 L0.5842,0.6714 L0.6030,0.6709 L0.6093,0.6496 L0.6112,0.6484 L0.6164,0.6577 L0.6164,0.6652 L0.6129,0.6728 L0.6077,0.6802 L0.6077,0.6837 L0.6087,0.6847 L0.6209,0.6847 L0.6249,0.6826 L0.6383,0.6940 L0.6430,0.7150 L0.6409,0.7190 L0.6409,0.7224 L0.6470,0.7378 L0.6578,0.7527 L0.6704,0.7551 L0.6817,0.7648 L0.6842,0.7648 L0.6879,0.7613 L0.6898,0.7613 L0.7051,0.7684 L0.7210,0.7787 L0.7236,0.7787 L0.7394,0.7726 L0.7475,0.7679 L0.7511,0.7648 L0.7547,0.7584 L0.7567,0.7582 L0.7573,0.7612 L0.7527,0.7681 L0.7522,0.7714 L0.7690,0.7792 L0.7752,0.7868 L0.7788,0.7868 L0.7976,0.7818 L0.8116,0.7695 L0.8258,0.7634 L0.8599,0.7638 L0.8670,0.7582 L0.8722,0.7470 L0.8743,0.7308 L0.8809,0.7118 L0.8900,0.6997 L0.8977,0.6929 L0.9013,0.6772 L0.9099,0.6669 L0.9161,0.6527 L0.9263,0.6399 L0.9462,0.6254 L0.9478,0.6195 L0.9570,0.6096 L0.9667,0.5897 L0.9677,0.5740 L0.9784,0.5490 L0.9876,0.5330 L0.9876,0.4994 L0.9824,0.4886 L0.9824,0.4868 L0.9850,0.4851 L0.9850,0.4607 L0.9891,0.4538 L0.9855,0.4467 L0.9855,0.4402 L0.9871,0.4402 L0.9888,0.4437 L0.9926,0.4437 L0.9957,0.4396 L0.9999,0.4264 L0.9973,0.4207 L0.9933,0.4197 L0.9902,0.4238 L0.9864,0.4351 L0.9851,0.4351 L0.9805,0.4303 L0.9774,0.4192 L0.9687,0.4125 L0.9646,0.3988 L0.9596,0.3948 L0.9535,0.3937 L0.9431,0.3787 L0.9426,0.3543 L0.9315,0.3457 L0.9238,0.3360 L0.9218,0.3360 L0.9208,0.3375 L0.9207,0.3457 L0.9146,0.3450 L0.9125,0.3186 L0.9075,0.3024 L0.9002,0.2914 L0.9002,0.2901 L0.9033,0.2879 L0.9023,0.2844 L0.8942,0.2763 L0.8896,0.2778 L0.8844,0.2701 L0.8744,0.2671 L0.8712,0.2553 L0.8696,0.2533 L0.8580,0.2527 L0.8488,0.2462 L0.8421,0.2378 L0.8431,0.2202 L0.8416,0.2185 L0.8374,0.2173 L0.8374,0.2150 L0.8400,0.2108 L0.8400,0.1971 L0.8262,0.1684 L0.8267,0.1562 L0.8247,0.1423 L0.8257,0.1261 L0.8089,0.1122 L0.8058,0.1031 L0.7951,0.1052 L0.7899,0.1088 L0.7859,0.1071 L0.7838,0.0955 L0.7807,0.0881 L0.7812,0.0638 L0.7793,0.0611 L0.7793,0.0552 L0.7721,0.0478 L0.7746,0.0372 L0.7670,0.0331 L0.7670,0.0107 L0.7624,0.0065 Z';
  const AUS_TAS = 'M0.7430,0.8298 L0.7390,0.8435 L0.7451,0.8619 L0.7497,0.8698 L0.7527,0.8779 L0.7507,0.8854 L0.7516,0.8899 L0.7634,0.9165 L0.7735,0.9170 L0.7798,0.9207 L0.7818,0.9207 L0.7864,0.9116 L0.7914,0.9105 L0.7962,0.8997 L0.8033,0.9017 L0.8063,0.9002 L0.8119,0.8819 L0.8186,0.8747 L0.8191,0.8590 L0.8222,0.8462 L0.8165,0.8395 L0.8130,0.8395 L0.8037,0.8435 L0.7895,0.8435 L0.7807,0.8471 L0.7779,0.8471 L0.7485,0.8307 Z';
  const AUS_ASPECT = 0.7869;
  // Mainland coastline traced from s07_06 (UTM still, equirectangular) as [lon, lat] pairs.
  const AUS_LL = [[152.97,-25.14],[152.75,-25.06],[152.36,-24.68],[151.86,-24.13],[151.50,-23.84],[151.26,-23.73],[151.11,-23.53],[151.01,-23.29],[150.86,-23.14],[150.71,-23.02],[150.64,-22.76],[150.61,-22.42],[150.45,-22.13],[150.16,-21.88],[149.79,-21.73],[149.40,-21.62],[149.24,-21.42],[149.22,-21.17],[149.11,-20.96],[148.94,-20.76],[148.82,-20.48],[148.70,-20.17],[148.45,-20.04],[148.11,-20.00],[147.81,-19.78],[147.55,-19.47],[147.28,-19.34],[147.04,-19.31],[146.89,-19.20],[146.78,-19.04],[146.58,-18.92],[146.34,-18.74],[146.18,-18.22],[146.07,-17.49],[145.88,-17.03],[145.62,-16.73],[145.41,-16.30],[145.26,-15.79],[145.20,-15.31],[145.17,-14.93],[145.06,-14.77],[144.88,-14.71],[144.65,-14.44],[144.38,-14.06],[144.12,-13.95],[143.88,-14.02],[143.72,-14.00],[143.64,-13.84],[143.55,-13.43],[143.42,-12.79],[143.11,-12.06],[142.72,-11.34],[142.56,-10.88],[142.53,-10.65],[142.36,-10.55],[142.13,-10.60],[142.03,-10.88],[141.99,-11.34],[141.77,-11.89],[141.46,-12.61],[141.33,-13.78],[141.31,-15.10],[141.20,-15.71],[141.03,-15.85],[140.91,-16.22],[140.80,-16.72],[140.60,-17.14],[140.32,-17.41],[139.94,-17.38],[139.57,-17.11],[139.46,-16.79],[139.46,-16.49],[139.11,-16.41],[138.56,-16.46],[138.27,-16.33],[138.14,-16.09],[137.83,-16.00],[137.43,-15.96],[137.15,-15.80],[136.97,-15.57],[136.74,-15.47],[136.49,-15.44],[136.34,-15.27],[136.23,-15.02],[136.03,-14.81],[135.82,-14.61],[135.83,-14.33],[136.01,-14.04],[136.19,-14.02],[136.36,-14.17],[136.54,-14.24],[136.69,-14.21],[136.76,-14.04],[136.72,-13.80],[136.56,-13.64],[136.35,-13.52],[136.36,-13.27],[136.52,-12.89],[136.58,-12.37],[136.53,-11.83],[136.25,-11.60],[135.86,-11.62],[135.64,-11.73],[135.47,-11.89],[135.00,-11.95],[134.37,-11.93],[134.06,-11.82],[133.92,-11.66],[133.62,-11.54],[133.20,-11.44],[132.87,-11.29],[132.48,-11.15],[131.62,-11.14],[130.54,-11.25],[130.08,-11.45],[130.11,-11.68],[130.28,-11.78],[130.52,-11.80],[130.67,-11.91],[130.70,-12.10],[130.52,-12.33],[130.15,-12.67],[129.75,-13.32],[129.29,-14.08],[128.74,-14.41],[128.16,-14.37],[127.71,-14.15],[127.32,-13.84],[126.80,-13.71],[126.27,-13.74],[126.04,-13.91],[125.98,-14.15],[125.71,-14.30],[125.32,-14.41],[125.16,-14.61],[125.11,-14.85],[124.89,-15.01],[124.57,-15.13],[124.39,-15.38],[124.28,-15.70],[124.08,-15.89],[123.78,-15.95],[123.35,-15.93],[122.88,-15.91],[122.63,-16.15],[122.52,-16.56],[122.32,-16.83],[122.09,-17.05],[121.99,-17.45],[121.92,-18.01],[121.53,-18.70],[120.94,-19.39],[120.43,-19.69],[120.04,-19.71],[119.82,-19.82],[119.72,-19.95],[119.58,-19.91],[119.39,-19.75],[119.16,-19.69],[118.90,-19.73],[118.70,-19.95],[118.49,-20.26],[118.15,-20.39],[117.75,-20.41],[117.53,-20.52],[117.43,-20.65],[117.29,-20.61],[117.11,-20.46],[116.94,-20.39],[116.77,-20.41],[116.65,-20.52],[116.54,-20.68],[116.35,-20.74],[116.10,-20.76],[115.95,-20.87],[115.84,-21.03],[115.64,-21.09],[115.38,-21.14],[115.11,-21.36],[114.83,-21.67],[114.46,-21.80],[114.05,-21.83],[113.77,-21.99],[113.63,-22.28],[113.62,-22.65],[113.69,-23.07],[113.66,-23.40],[113.57,-23.64],[113.42,-23.80],[113.27,-23.91],[113.20,-24.10],[113.23,-24.35],[113.33,-24.50],[113.49,-24.63],[113.55,-24.94],[113.53,-25.33],[113.42,-25.55],[113.27,-25.69],[113.20,-25.99],[113.25,-26.41],[113.47,-26.74],[113.79,-27.05],[113.97,-27.53],[114.07,-28.07],[114.21,-28.30],[114.38,-28.34],[114.50,-28.56],[114.60,-28.88],[114.74,-29.07],[114.89,-29.23],[114.96,-29.71],[115.00,-30.39],[115.22,-30.98],[115.53,-31.54],[115.66,-32.23],[115.62,-32.96],[115.40,-33.42],[115.09,-33.68],[114.96,-33.95],[114.99,-34.18],[115.16,-34.28],[115.40,-34.30],[115.55,-34.41],[115.66,-34.56],[115.86,-34.63],[116.10,-34.65],[116.26,-34.76],[116.44,-34.91],[117.03,-34.98],[117.81,-34.96],[118.19,-34.85],[118.29,-34.69],[118.43,-34.63],[118.60,-34.61],[118.72,-34.50],[118.83,-34.34],[119.03,-34.28],[119.27,-34.26],[119.42,-34.15],[119.56,-33.99],[119.93,-33.93],[120.43,-33.90],[120.85,-33.79],[121.18,-33.66],[121.42,-33.71],[121.70,-33.86],[122.37,-33.93],[123.23,-33.90],[123.71,-33.79],[123.87,-33.60],[123.99,-33.31],[124.16,-32.98],[124.63,-32.74],[125.26,-32.56],[125.57,-32.39],[125.85,-32.22],[126.87,-32.10],[128.27,-31.99],[128.91,-31.79],[129.16,-31.56],[130.01,-31.46],[131.18,-31.50],[131.73,-31.66],[131.92,-31.90],[132.56,-32.06],[133.42,-32.18],[133.84,-32.43],[133.98,-32.79],[134.34,-33.20],[134.81,-33.64],[135.07,-34.08],[135.19,-34.46],[135.44,-34.63],[135.80,-34.56],[136.21,-34.23],[136.63,-33.77],[136.96,-33.57],[137.20,-33.59],[137.35,-33.64],[137.42,-33.79],[137.39,-34.21],[137.34,-34.75],[137.42,-34.98],[137.58,-34.96],[137.70,-34.85],[137.80,-34.73],[137.94,-34.83],[138.10,-35.09],[138.16,-35.35],[138.22,-35.58],[138.49,-35.68],[138.90,-35.73],[139.17,-35.95],[139.35,-36.27],[139.53,-36.45],[139.67,-36.56],[139.68,-36.76],[139.65,-37.03],[139.83,-37.35],[140.16,-37.66],[140.41,-37.79],[140.57,-37.81],[140.69,-37.92],[140.86,-38.08],[141.33,-38.14],[141.95,-38.17],[142.27,-38.28],[142.46,-38.43],[143.04,-38.50],[143.82,-38.47],[144.21,-38.36],[144.31,-38.21],[144.45,-38.14],[144.61,-38.17],[144.73,-38.28],[144.87,-38.43],[145.17,-38.50],[145.57,-38.52],[145.79,-38.63],[145.90,-38.78],[146.10,-38.85],[146.37,-38.80],[146.69,-38.58],[147.02,-38.28],[147.26,-38.14],[147.43,-38.12],[147.55,-38.01],[147.69,-37.86],[148.05,-37.79],[148.52,-37.78],[148.78,-37.73],[148.89,-37.66],[149.08,-37.68],[149.33,-37.74],[149.48,-37.66],[149.59,-37.51],[149.79,-37.44],[150.03,-37.30],[150.18,-36.58],[150.28,-35.57],[150.42,-35.09],[150.58,-34.98],[150.64,-34.78],[150.68,-34.52],[150.84,-34.26],[151.11,-33.95],[151.37,-33.46],[151.63,-32.92],[151.90,-32.63],[152.16,-32.52],[152.42,-32.32],[152.65,-32.03],[152.75,-31.60],[152.78,-31.05],[152.89,-30.41],[153.06,-29.76],[153.24,-29.33],[153.38,-28.98],[153.39,-28.28],[153.29,-27.37],[153.15,-26.67],[153.01,-26.16],[153.00,-25.69],[153.05,-25.30]];

  // ---------- fonts + preload ----------
  const style = document.createElement('style');
  style.textContent = `
    @font-face { font-family: 'Anton'; src: url(/fonts/Anton-Regular.ttf); }
    @font-face { font-family: 'Archivo Black'; src: url(/fonts/ArchivoBlack-Regular.ttf); }
    @font-face { font-family: 'Arial Black'; src: url(/fonts/ArchivoBlack-Regular.ttf); }
    @font-face { font-family: 'Plex Mono'; src: url(/fonts/IBMPlexMono-SemiBold.ttf); }
  `;
  document.head.appendChild(style);
  const keep = [];
  const ready = Promise.all([
    ...['Anton', 'Archivo Black', 'Arial Black', 'Plex Mono'].map((f) => document.fonts.load(`40px '${f}'`)),
    ...Object.values(IMG).map((im) => {
      const el = new Image();
      keep.push(el);
      el.src = im.url;
      return el.decode().catch(() => {});
    }),
  ]);

  // ---------- math ----------
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const eOut = (t) => 1 - Math.pow(1 - t, 3);
  const eIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const eBack = (t) => {
    const c1 = 2.0;
    return 1 + (c1 + 1) * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  };
  const eExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
  const fmt = (n) => Math.round(n).toLocaleString('en-AU');
  const f1 = (n) => n.toFixed(1);
  // deterministic noise
  const hash = (n) => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

  // ---------- transcript cues ----------
  const norm = (w) => w.toLowerCase().replace(/[^a-z0-9,']/g, '').replace(/,$/, '');
  let cueCache = null;
  function cue(word, n = 0, fallback = 0) {
    const words = (window.EPISODE && window.EPISODE.words) || [];
    if (!cueCache && words.length) {
      cueCache = {};
      for (const w of words) {
        const k = norm(w.word);
        (cueCache[k] = cueCache[k] || []).push(w);
      }
    }
    const hit = cueCache && cueCache[norm(word)] && cueCache[norm(word)][n];
    return hit ? hit.start : fallback;
  }
  const cueEnd = (word, n = 0, fallback = 0) => {
    cue(word, n);
    const hit = cueCache && cueCache[norm(word)] && cueCache[norm(word)][n];
    return hit ? hit.end : fallback;
  };

  // ---------- svg primitives ----------
  let uid = 0;
  const id = (p) => `${p}${++uid}`;

  /** Place image so its pixel (u,v) lands on screen (X,Y) at s screen-px per image-px. */
  function place(key, u, v, s, X, Y, attrs = '') {
    const im = IMG[key];
    return `<image href="${im.url}" x="${f1(X - u * s)}" y="${f1(Y - v * s)}" width="${f1(im.w * s)}" height="${f1(
      im.h * s
    )}" preserveAspectRatio="none" ${attrs}/>`;
  }
  const dim = (a) => `<rect width="${W}" height="${H}" fill="#000" opacity="${a}"/>`;
  const fill = (c) => `<rect width="${W}" height="${H}" fill="${c}"/>`;

  function text(str, x, y, o = {}) {
    const size = o.size || 40;
    const ff = o.font || F_HEAD;
    const col = o.fill || CREAM;
    const anchor = o.anchor || 'middle';
    const ls = o.ls != null ? o.ls : 0;
    const stroke = o.stroke === false ? '' : `stroke="${o.stroke || 'rgba(0,0,0,0.75)'}" stroke-width="${o.sw || size * 0.08}" paint-order="stroke" stroke-linejoin="round"`;
    return `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}" font-family="${ff}" font-size="${size}" fill="${col}" letter-spacing="${ls}" ${stroke} ${o.attrs || ''}>${str}</text>`;
  }

  /** Small mono label with rule lines: ── LABEL ── */
  function rubric(label, y, a, o = {}) {
    if (a <= 0) return '';
    const w = label.length * 17 + 30;
    const x = o.x || 540;
    const line = 70 * eOut(a);
    const col = o.color || CYAN;
    return `<g opacity="${a}">
      <line x1="${x - w / 2 - 12 - line}" y1="${y - 9}" x2="${x - w / 2 - 12}" y2="${y - 9}" stroke="${col}" stroke-width="3"/>
      <line x1="${x + w / 2 + 12}" y1="${y - 9}" x2="${x + w / 2 + 12 + line}" y2="${y - 9}" stroke="${col}" stroke-width="3"/>
      ${text(label, x, y, { font: F_MONO, size: 28, fill: col, ls: 5, sw: 5 })}
    </g>`;
  }

  /** Rubber-stamp slam; k = seconds since hit. */
  function stamp(label, x, y, k, o = {}) {
    if (k < 0) return '';
    const size = o.size || 96;
    const col = o.color || AMBER;
    const rot = o.rot != null ? o.rot : -4;
    const p = clamp(k / 0.32);
    const sc = lerp(1.9, 1, eBack(p));
    const a = clamp(k / 0.08) * (o.alpha != null ? o.alpha : 1);
    const w = o.w || label.length * size * 0.5 + 70;
    const h = size * 1.3;
    const ring = k < 0.6 ? `<rect x="${-w / 2 - 20 - k * 60}" y="${-h / 2 - 20 - k * 60}" width="${w + 40 + k * 120}" height="${h + 40 + k * 120}" rx="18" fill="none" stroke="${col}" stroke-width="3" opacity="${1 - k / 0.6}"/>` : '';
    return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${rot}) scale(${sc.toFixed(3)})" opacity="${a}">
      ${ring}
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="10" fill="rgba(8,10,20,0.55)" stroke="${col}" stroke-width="7"/>
      <rect x="${-w / 2 + 12}" y="${-h / 2 + 12}" width="${w - 24}" height="${h - 24}" rx="6" fill="none" stroke="${col}" stroke-width="2" opacity="0.7"/>
      ${text(label, 0, size * 0.36, { font: F_DISPLAY, size, fill: col, ls: 3, stroke: 'rgba(0,0,0,0.5)', sw: 6 })}
    </g>`;
  }

  /** Pill chip with mono text, types on. */
  function chip(label, x, y, a, o = {}) {
    if (a <= 0) return '';
    const size = o.size || 34;
    const col = o.color || AMBER;
    const n = Math.ceil(label.length * clamp(a * 1.6));
    const w = label.length * size * 0.62 + 56;
    const h = size + 30;
    const wipe = eOut(clamp(a * 2.2));
    return `<g opacity="${clamp(a * 3)}" transform="translate(${f1(x)} ${f1(y)})">
      <rect x="${-w / 2}" y="${-h / 2}" width="${f1(w * wipe)}" height="${h}" rx="${h / 2}" fill="rgba(6,10,22,0.78)" stroke="${col}" stroke-width="3"/>
      ${o.dot ? `<circle cx="${-w / 2 + 30}" cy="0" r="8" fill="${col}"/>` : ''}
      ${text(label.slice(0, n), o.dot ? 14 : 0, size * 0.36, { font: F_MONO, size, fill: col, ls: 3, stroke: false })}
    </g>`;
  }

  /** Big display number/label with soft glow. */
  function hero(str, x, y, size, col, a = 1, o = {}) {
    if (a <= 0) return '';
    return `<g opacity="${a}">
      ${text(str, x, y, { font: F_DISPLAY, size, fill: col, ls: o.ls || 2, stroke: 'rgba(0,0,0,0.55)', sw: size * 0.06, attrs: 'filter="url(#softglow)"' })}
    </g>`;
  }

  function pin(x, y, k, col = AMBER, o = {}) {
    if (k < 0) return '';
    const drop = eBack(clamp(k / 0.4));
    const yy = y - (1 - drop) * 140;
    const rip = clamp(k / 0.9);
    const r = o.r || 16;
    return `<g opacity="${clamp(k / 0.12)}">
      <circle cx="${x}" cy="${y}" r="${f1(r + rip * 70)}" fill="none" stroke="${col}" stroke-width="3" opacity="${f1(1 - rip)}"/>
      <circle cx="${x}" cy="${f1(yy)}" r="${r}" fill="${col}" stroke="${INK}" stroke-width="4"/>
      <circle cx="${x}" cy="${f1(yy)}" r="${r * 0.35}" fill="${INK}"/>
    </g>`;
  }

  /** Horizontal dimension line with end ticks, drawn left→right by p. */
  function measure(x1, x2, y, p, col = CYAN, o = {}) {
    if (p <= 0) return '';
    const xe = lerp(x1, x2, eIO(p));
    const tk = o.tick || 34;
    const dash = o.dash ? `stroke-dasharray="${o.dash}"` : '';
    return `<g filter="url(#softglow)">
      <line x1="${x1}" y1="${y - tk}" x2="${x1}" y2="${y + tk}" stroke="${col}" stroke-width="5"/>
      <line x1="${x1}" y1="${y}" x2="${f1(xe)}" y2="${y}" stroke="${col}" stroke-width="5" ${dash}/>
      ${p >= 1 ? `<line x1="${x2}" y1="${y - tk}" x2="${x2}" y2="${y + tk}" stroke="${col}" stroke-width="5"/>` : `<circle cx="${f1(xe)}" cy="${y}" r="9" fill="${col}"/>`}
      ${p >= 1 ? `<path d="M${x1 + 4},${y} l22,-14 v28 z M${x2 - 4},${y} l-22,-14 v28 z" fill="${col}"/>` : ''}
    </g>`;
  }

  function arrowUp(x, y, len, a, col = AMBER, o = {}) {
    if (a <= 0) return '';
    const w = o.w || 14;
    const head = o.head || 44;
    const flow = o.flow || 0;
    return `<g opacity="${a}" filter="url(#softglow)" transform="rotate(${o.rot || 0} ${x} ${y})">
      <line x1="${x}" y1="${y}" x2="${x}" y2="${y - len + head * 0.6}" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-dasharray="${o.dashed ? '26 18' : 'none'}" stroke-dashoffset="${-flow}"/>
      <path d="M${x - head * 0.75},${y - len + head} L${x},${y - len} L${x + head * 0.75},${y - len + head} Z" fill="${col}"/>
    </g>`;
  }

  function reticle(x, y, r, a, col = AMBER) {
    if (a <= 0) return '';
    const g = r * 0.45;
    return `<g opacity="${a}" stroke="${col}" stroke-width="4" fill="none">
      <path d="M${x - r},${y - r + g} v${-g} h${g} M${x + r - g},${y - r} h${g} v${g} M${x + r},${y + r - g} v${g} h${-g} M${x - r + g},${y + r} h${-g} v${-g}"/>
    </g>`;
  }

  /** Australia outline (s07_03 trace) with its mainland bbox top-left at (x,y), mainland width wpx. */
  function ausOutline(x, y, wpx, o = {}) {
    const sw = o.sw || 4;
    const attrs = `fill="${o.fill || 'none'}" stroke="${o.stroke || AMBER}" stroke-width="${sw}" vector-effect="non-scaling-stroke" stroke-linejoin="round" ${o.dash ? `stroke-dasharray="${o.dash}"` : ''}`;
    return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${wpx.toFixed(3)})" opacity="${o.a != null ? o.a : 1}" ${o.filter ? `filter="${o.filter}"` : ''}>
      <path d="${AUS_MAIN}" ${attrs}/>${o.tas === false ? '' : `<path d="${AUS_TAS}" ${attrs}/>`}
    </g>`;
  }

  /** Moon photo cut to its disk. */
  function moonDisk(key, cx, cy, r, o = {}) {
    const m = key === 'moon1' ? MOON1 : MOON2;
    const cid = id('mc');
    return `<clipPath id="${cid}"><circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r)}"/></clipPath>
      <g clip-path="url(#${cid})" opacity="${o.a != null ? o.a : 1}">${place(key, m.u, m.v, r / m.r, cx, cy)}</g>`;
  }

  /** Top scrim so MG type sits on darkness. */
  const topScrim = (a = 0.7, h = 720) =>
    `<rect width="${W}" height="${h}" fill="url(#scrimTop)" opacity="${a}"/>`;

  // ---------- global defs ----------
  function defs() {
    return `<defs>
      <linearGradient id="scrimTop" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#000" stop-opacity="0.85"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="scrimBot" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stop-color="#000" stop-opacity="0.8"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <radialGradient id="vig" cx="0.5" cy="0.45" r="0.75">
        <stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.72"/>
      </radialGradient>
      <radialGradient id="space" cx="0.5" cy="0.4" r="0.8">
        <stop offset="0" stop-color="#0d1a3a"/><stop offset="1" stop-color="#02040b"/>
      </radialGradient>
      <filter id="softglow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="bigglow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="16" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <!-- s07_03 recolour: blue sea → night navy, white land → outback ochre, borders stay dark -->
      <filter id="chart" x="0%" y="0%" width="100%" height="100%" color-interpolation-filters="sRGB">
        <feColorMatrix type="matrix" values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0"/>
        <feComponentTransfer>
          <feFuncR type="table" tableValues="0.02 0.035 0.60"/>
          <feFuncG type="table" tableValues="0.02 0.055 0.43"/>
          <feFuncB type="table" tableValues="0.03 0.15 0.26"/>
        </feComponentTransfer>
      </filter>
      <!-- GPS.gov schematic re-inked for a dark background: darkness → cyan ink alpha -->
      <filter id="ink" x="0%" y="0%" width="100%" height="100%" color-interpolation-filters="sRGB">
        <feColorMatrix type="matrix" values="0 0 0 0 0.62  0 0 0 0 0.86  0 0 0 0 1  -0.55 -1.05 -0.2 0 1.8"/>
      </filter>
    </defs>`;
  }

  /** Frame-1 hook (unspoken): fully legible on frame 1, then settles. */
  function hookTitle(t, a, dy = 0, underline = 0) {
    if (a <= 0) return '';
    const settle = 1 + 0.05 * (1 - eOut(clamp(t / 1.4)));
    const ls = lerp(14, 4, eOut(clamp(t / 1.4)));
    const ul = underline > 0
      ? `<rect x="${-300}" y="215" width="${f1(600 * eOut(underline))}" height="12" rx="6" fill="${AMBER}" filter="url(#softglow)"/>`
      : '';
    return `<g opacity="${a}" transform="translate(540 ${f1(250 + dy)}) scale(${settle.toFixed(4)})">
      ${text('WIDER THAN', 0, 0, { font: F_DISPLAY, size: 132, fill: CREAM, ls, stroke: 'rgba(0,0,0,0.6)', sw: 8 })}
      ${text('THE MOON', 0, 190, { font: F_DISPLAY, size: 196, fill: AMBER, ls, stroke: 'rgba(0,0,0,0.6)', sw: 10, attrs: 'filter="url(#softglow)"' })}
      ${ul}
    </g>`;
  }

  function credit(label, a = 1) {
    return `<g opacity="${0.75 * a}">${text(label, 60, 150, { font: F_MONO, size: 22, fill: CREAM, anchor: 'start', ls: 2, stroke: 'rgba(0,0,0,0.8)', sw: 4 })}</g>`;
  }

  function stars(t, k = 0.6) {
    let o = '';
    for (let i = 0; i < 70; i++) {
      const tw = 0.35 + 0.35 * Math.sin(t * 2 + i);
      o += `<circle cx="${f1(hash(i) * W)}" cy="${f1(hash(i + 99) * H)}" r="${f1(0.8 + hash(i + 7) * 1.6)}" fill="#fff" opacity="${f1(tw * k)}"/>`;
    }
    return o;
  }

  // =====================================================================
  // BEAT 1 — Apollo 13 Moon: hook slam → diameter measure (3,500 KM)
  // =====================================================================
  function bMoon(t) {
    const tLit = cue('literally', 0, 2.2);
    const tThe = cue('the', 1, 3.08);
    const t35 = cue('3,500', 0, 3.88);
    const tKm = cueEnd('kilometres', 0, 5.84);
    const push = eIO(seg(t, tThe - 0.3, tThe + 1.1));
    const R = lerp(392, 440, push) + t * 2;
    const cy = lerp(890, 800, push);
    const cx = 540 + Math.sin(t * 0.6) * 4;
    // impact bump on "Literally."
    const kLit = t - tLit;
    const bump = kLit > 0 ? 1 + 0.035 * Math.exp(-kLit * 6) * Math.cos(kLit * 22) : 1;
    let o = fill('#000');
    o += `<g transform="translate(540 960) scale(${bump.toFixed(4)}) translate(-540 -960)">`;
    o += stars(t);
    o += place('moon1', MOON1.u, MOON1.v, R / MOON1.r, cx, cy);
    o += dim(0.08 + 0.3 * push);
    o += topScrim(0.9, 760);
    o += `</g>`;
    // flash on "Literally."
    if (kLit > 0 && kLit < 0.4) o += `<rect width="${W}" height="${H}" fill="#fff" opacity="${f1(0.28 * (1 - kLit / 0.4))}"/>`;
    // hook
    const hookOut = eIO(seg(t, tThe - 0.35, tThe + 0.25));
    o += hookTitle(t, 1 - hookOut, -hookOut * 160, seg(t, tLit, tLit + 0.35));
    // diameter measure
    const mp = seg(t, t35 - 0.6, t35 + 0.35);
    if (mp > 0) {
      const rot = t * 12;
      o += `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(R + 14)}" fill="none" stroke="${CYAN}" stroke-width="3" stroke-dasharray="4 14" opacity="${f1(0.8 * mp)}" transform="rotate(${f1(rot)} ${f1(cx)} ${f1(cy)})"/>`;
      o += measure(cx - R, cx + R, cy, mp, CYAN);
      o += `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="7" fill="${CYAN}" opacity="${mp}"/>`;
    }
    const lab = eOut(seg(t, tThe + 0.1, tThe + 0.6));
    o += rubric('THE MOON', 250, lab);
    const cnt = eOut(seg(t, t35, t35 + 0.9));
    if (t > t35 - 0.05) {
      const v = Math.round((3500 * cnt) / 10) * 10;
      const pop = 1 + 0.08 * Math.exp(-Math.max(0, t - t35 - 0.9) * 8) * (cnt >= 1 ? 1 : 0);
      o += `<g transform="translate(540 420) scale(${pop.toFixed(3)}) translate(-540 -420)">${hero(`${fmt(v)} KM`, 540, 420, 170, CREAM, clamp((t - t35 + 0.05) / 0.15))}</g>`;
    }
    o += credit('APOLLO 13 · NASA', seg(t, tThe, tThe + 0.5) * (1 - seg(t, tKm + 0.6, tKm + 0.9)));
    return o;
  }

  // =====================================================================
  // BEAT 2 — Blue Marble Australia: W→E measure (4,000 KM) + Moon to scale
  // =====================================================================
  function bAustralia(t, lt) {
    const tWest = cue('west', 0, 8.72);
    const tEast = cueEnd('east?', 0, 9.54);
    const t4k = cue('4,000', 0, 10.3);
    const tBut = cue('but', 0, 11.5);
    const tPart = cueEnd('part', 0, 12.7);
    const s = lerp(1.08, 1.0, eOut(clamp(lt / 1.2))) + lt * 0.005;
    const CX = 540;
    const CY = 870;
    const X = (u) => CX + (u - BM.cx) * s;
    const Y = (v) => CY + (v - BM.cy) * s;
    let o = fill('#0b0a32');
    o += place('bm', BM.cx, BM.cy, s, CX, CY);
    // melt the still's top/bottom edges into the ocean colour
    const top = Y(0);
    const bot = Y(IMG.bm.h);
    o += `<defs><linearGradient id="bmT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0a32"/><stop offset="1" stop-color="#0b0a32" stop-opacity="0"/></linearGradient>
      <linearGradient id="bmB" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#0b0a32"/><stop offset="1" stop-color="#0b0a32" stop-opacity="0"/></linearGradient></defs>
      <rect x="0" y="${f1(top - 2)}" width="${W}" height="180" fill="url(#bmT)"/>
      <rect x="0" y="${f1(bot - 180)}" width="${W}" height="182" fill="url(#bmB)"/>`;
    o += dim(0.22);
    o += topScrim(0.85, 700);
    // W→E measure along the mainland's widest line
    const yM = Y((BM.W[1] + BM.E[1]) / 2);
    const xW = X(BM.W[0]);
    const xE = X(BM.E[0]);
    const mp = seg(t, tWest - 0.1, tEast + 0.1);
    o += pin(xW, yM, t - (tWest - 0.25), AMBER);
    o += measure(xW, xE, yM, mp, AMBER);
    o += pin(xE, yM, t - tEast, AMBER);
    const wl = seg(t, tWest - 0.2, tWest + 0.2);
    const el = seg(t, tEast - 0.1, tEast + 0.3);
    o += `<g opacity="${wl}">${text('W', xW, yM - 70, { font: F_DISPLAY, size: 56, fill: AMBER })}</g>`;
    o += `<g opacity="${el}">${text('E', xE, yM - 70, { font: F_DISPLAY, size: 56, fill: AMBER })}</g>`;
    // counter
    o += rubric('AUSTRALIA', 250, eOut(seg(lt, 0.15, 0.6)), { color: AMBER });
    const cnt = eOut(seg(t, t4k, t4k + 0.8));
    if (t > t4k - 0.05) {
      const v = Math.round((4000 * cnt) / 10) * 10;
      o += hero(`${fmt(v)} KM`, 540, 420, 170, AMBER, clamp((t - t4k + 0.05) / 0.15));
    }
    // the Moon, to scale, dropped onto the continent
    const tDrop = t4k + 0.75;
    const kd = t - tDrop;
    if (kd > 0) {
      const lift = eIO(seg(t, tPart - 0.1, tPart + 0.45));
      const D = ((xE - xW) * MOON_KM) / AUS_KM;
      const mx = (xW + xE) / 2;
      const drop = eBack(clamp(kd / 0.55));
      const my = lerp(-D, yM, drop) - lift * 900;
      const a = clamp(kd / 0.15) * (1 - lift);
      o += `<g opacity="${f1(a)}">${moonDisk('moon1', mx, my, D / 2, { a: 0.92 })}
        <circle cx="${f1(mx)}" cy="${f1(my)}" r="${f1(D / 2)}" fill="none" stroke="${CYAN}" stroke-width="4" stroke-dasharray="10 8"/></g>`;
      // overhang brackets: Australia sticks out both sides
      const g = clamp((kd - 0.45) / 0.3) * (1 - lift);
      if (g > 0) {
        const pulse = 0.75 + 0.25 * Math.sin(kd * 9);
        const l = mx - D / 2;
        const r = mx + D / 2;
        o += `<g opacity="${f1(g * pulse)}" filter="url(#softglow)">
          <rect x="${f1(xW)}" y="${f1(yM - 26)}" width="${f1(l - xW)}" height="52" fill="${AMBER}" opacity="0.35"/>
          <rect x="${f1(r)}" y="${f1(yM - 26)}" width="${f1(xE - r)}" height="52" fill="${AMBER}" opacity="0.35"/>
        </g>`;
      }
      // compare row under the counter
      const c = eOut(clamp((kd - 0.1) / 0.4)) * (1 - lift);
      if (c > 0) {
        o += `<g opacity="${f1(c)}">
          ${text('MOON', 400, 496, { font: F_MONO, size: 28, fill: CYAN, anchor: 'end', ls: 4, stroke: false })}
          ${text('3,500 KM', 418, 504, { font: F_DISPLAY, size: 58, fill: CYAN, anchor: 'start', ls: 2 })}
        </g>`;
      }
    }
    o += credit('NASA BLUE MARBLE', seg(lt, 0.3, 0.8));
    return o;
  }

  // =====================================================================
  // BEAT 3 — CC0 outline: the continent lurches, then drifts north through a fixed graticule
  // =====================================================================
  function bMoving(t, lt) {
    const tMove = cue('moving', 0, 13.96);
    const tDrift = cue('drifting', 0, 15.9);
    const tNorth = cue('north', 0, 16.24);
    const s = 900 / OUT.bw;
    const jolt = eBack(clamp((t - tMove) / 0.45));
    const glide = Math.max(0, t - tDrift) * 38;
    const dy = -(jolt * 36 + glide);
    const CX = 540;
    const CY = 800 + dy;
    const ox = OUT.bx + OUT.bw / 2;
    const oy = OUT.by + OUT.bh / 2;
    const zoom = 1 + lt * 0.01;
    let o = fill('#090e26');
    o += `<g transform="translate(540 900) scale(${zoom.toFixed(4)}) translate(-540 -900)">`;
    o += place('outline', ox, oy, s, CX, CY, 'filter="url(#chart)"');
    // fixed graticule — the map grid stays, the land moves
    let grid = '';
    for (let y = 40; y < H; y += 110) grid += `<line x1="0" y1="${y}" x2="${W}" y2="${y}"/>`;
    for (let x = 100; x < W; x += 110) grid += `<line x1="${x}" y1="0" x2="${x}" y2="${H}"/>`;
    o += `<g stroke="${CYAN}" stroke-width="1.5" opacity="${f1(0.28 * seg(lt, 0, 0.6))}">${grid}</g>`;
    // outline + onion-skin trails while moving
    const x0 = CX - 450;
    const y0 = CY - (oy - OUT.by) * s;
    const motion = clamp(jolt * (1 - seg(t, tMove + 0.5, tMove + 1.2)) + seg(t, tDrift, tDrift + 0.3));
    for (let i = 3; i >= 1; i--) {
      o += ausOutline(x0, y0 + i * 26 * motion, 900, { stroke: AMBER, sw: 3, a: 0.5 * motion * (1 - i / 4) });
    }
    o += ausOutline(x0, y0, 900, { stroke: AMBER, sw: 5, filter: 'url(#softglow)', a: seg(lt, 0.1, 0.6) });
    o += `</g>`;
    o += topScrim(0.8, 560);
    // compass
    const ca = seg(lt, 0.3, 0.8);
    o += `<g opacity="${ca}" transform="translate(890 330)">
      <circle r="62" fill="rgba(5,8,20,0.6)" stroke="${CYAN}" stroke-width="3"/>
      <path d="M0,-50 L16,8 L0,0 L-16,8 Z" fill="${AMBER}"/><path d="M0,50 L16,-8 L0,0 L-16,-8 Z" fill="${CYAN}" opacity="0.5"/>
      ${text('N', 0, -76, { font: F_DISPLAY, size: 40, fill: AMBER })}
    </g>`;
    // chevrons on "drifting north"
    const cv = seg(t, tDrift - 0.1, tNorth + 0.2);
    if (cv > 0) {
      for (let i = 0; i < 3; i++) {
        const ph = (t * 1.6 + i / 3) % 1;
        const y = 470 - ph * 170;
        const a = cv * Math.sin(ph * Math.PI);
        o += `<path d="M430,${f1(y + 40)} L540,${f1(y)} L650,${f1(y + 40)}" fill="none" stroke="${AMBER}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" opacity="${f1(a)}" filter="url(#softglow)"/>`;
      }
    }
    o += credit('MAP: SULFIRE2 · CC0', seg(lt, 0.3, 0.8));
    return o;
  }

  // =====================================================================
  // BEAT 4 — USGS plates: push into the Australian Plate; 7 CM / YEAR; fingernails; it adds up
  // =====================================================================
  /** Fingertip seen from above; the nail's free edge grows with g (0..1). */
  function fingernail(x, y, g, a) {
    if (a <= 0) return '';
    const tip = 4 + g * 30;
    return `<g opacity="${a}" transform="translate(${x} ${y}) scale(0.62)" stroke-linecap="round" stroke-linejoin="round">
      <path d="M-44,120 L-44,-20 C-44,-72 44,-72 44,-20 L44,120" fill="rgba(255,243,218,0.14)" stroke="${CREAM}" stroke-width="6"/>
      <path d="M-29,52 L-29,-18 C-29,-45 29,-45 29,-18 L29,52 C14,58 -14,58 -29,52 Z" fill="rgba(255,243,218,0.3)" stroke="${CREAM}" stroke-width="4"/>
      <path d="M-15,52 C-15,38 15,38 15,52" fill="none" stroke="${CREAM}" stroke-width="3" opacity="0.7"/>
      <path d="M-29,-18 C-29,${f1(-45 - tip)} 29,${f1(-45 - tip)} 29,-18 C29,-45 -29,-45 -29,-18 Z" fill="${AMBER}" stroke="${AMBER}" stroke-width="3" filter="url(#softglow)"/>
    </g>`;
  }

  function bPlates(t, lt) {
    const t7 = cue('seven', 0, 17.1);
    const tFn = cue('fingernails', 0, 20.52);
    const tGrow = cueEnd('grow', 0, 21.36);
    const tAdds = cue('adds', 0, 23.72);
    const tDoes = cue("doesn't", 0, 21.9);
    const p = eIO(seg(lt, 0.1, 1.5));
    const s = lerp(0.43, 0.74, p) + Math.max(0, lt - 1.5) * 0.008;
    const u = lerp(1256, 770, p);
    const v = lerp(2300, 2990, p) - Math.max(0, lt - 1.5) * 8;
    let o = fill('#1a2436');
    o += place('plates', u, v, s, 540, 960);
    o += dim(0.45);
    const X = (uu) => 540 + (uu - u) * s;
    const Y = (vv) => 960 + (vv - v) * s;
    // pulse ring around the Australian landmass
    const ring = seg(lt, 1.2, 1.8);
    if (ring > 0) {
      const pr = 1 + 0.04 * Math.sin(lt * 4);
      o += `<ellipse cx="${f1(X(712))}" cy="${f1(Y(2995))}" rx="${f1(470 * s * pr)}" ry="${f1(380 * s * pr)}" fill="none" stroke="${AMBER}" stroke-width="5" stroke-dasharray="18 12" stroke-dashoffset="${f1(-lt * 40)}" opacity="${f1(ring * 0.9)}" filter="url(#softglow)"/>`;
    }
    // northward vector out of the plate
    const ar = seg(t, t7 - 0.3, t7 + 0.4);
    o += arrowUp(X(712), Y(2900), 250 * eOut(ar) + 1, ar, AMBER, { w: 16, head: 56, dashed: true, flow: lt * 60 });
    o += topScrim(0.9, 760);
    o += stamp('7 CM / YEAR', 540, 330, t - (t7 + 0.25), { size: 104, rot: -3 });
    // fingernails
    const fa = eOut(seg(t, tFn - 0.15, tFn + 0.3));
    const fg = seg(t, tFn, tGrow + 0.3);
    o += fingernail(352, 512, fg, fa);
    o += `<g opacity="${fa}">${text('≈ FINGERNAILS', 400, 525, { font: F_HEAD, size: 48, fill: CREAM, anchor: 'start', ls: 2 })}</g>`;
    // "it adds up": 7 cm blocks stacking into a tall column on the left
    const acc = seg(t, tDoes + 0.2, tAdds + 0.6);
    if (acc > 0) {
      const n = 14;
      const bh = 40;
      const base = 1180;
      const shown = Math.floor(eOut(acc) * n + 0.0001);
      let col = `<rect x="62" y="${base - n * bh - 8}" width="96" height="${n * bh + 16}" rx="10" fill="rgba(5,8,20,0.55)" stroke="${CYAN}" stroke-width="2" opacity="0.8"/>`;
      for (let i = 0; i < shown; i++) {
        const k = clamp((eOut(acc) * n - i) * 1.5);
        col += `<rect x="72" y="${base - (i + 1) * bh + 3}" width="${f1(76 * k)}" height="${bh - 6}" rx="4" fill="${i === shown - 1 ? CREAM : AMBER}" opacity="${f1(0.55 + 0.45 * k)}"/>`;
      }
      for (let i = 0; i <= n; i++) col += `<line x1="158" y1="${base - i * bh}" x2="${i % 5 === 0 ? 184 : 172}" y2="${base - i * bh}" stroke="${CYAN}" stroke-width="3"/>`;
      o += `<g opacity="${f1(clamp(acc * 4))}">${col}</g>`;
    }
    o += credit('USGS · TECTONIC PLATES', seg(lt, 0.3, 0.8));
    return o;
  }

  // =====================================================================
  // BEAT 5 — GPS.gov constellation re-inked: signal beams, 2010s, map pin off by 1.5 M
  // =====================================================================
  const SATS = [
    [862, 346], [728, 467], [1275, 510], [291, 643], [461, 1008], [971, 1232], [1602, 570], [480, 120],
  ];
  function bGps(t, lt) {
    const t2010 = cue('2010s', 0, 25.06);
    const tGps = cue('gps', 0, 28.1);
    const tAbout = cue('about', 2, 29.7);
    const tHalf = cueEnd('half', 0, 31.02);
    const s = lerp(1.3, 1.16, eOut(clamp(lt / 1.4))) + lt * 0.004;
    const EX = 540;
    const EY = 780;
    const rot = lt * 1.6;
    const ER = GPS_EARTH.r * s;
    let o = `<rect width="${W}" height="${H}" fill="url(#space)"/>`;
    const tr = `rotate(${f1(rot)} ${EX} ${EY})`;
    o += `<g transform="${tr}">${place('gps', GPS_EARTH.u, GPS_EARTH.v, s, EX, EY, 'filter="url(#ink)"')}</g>`;
    const cid = id('earth');
    o += `<clipPath id="${cid}"><circle cx="${EX}" cy="${EY}" r="${f1(ER - 1)}"/></clipPath>`;
    o += `<g clip-path="url(#${cid})"><g transform="${tr}">${place('gps', GPS_EARTH.u, GPS_EARTH.v, s, EX, EY)}</g></g>`;
    o += `<circle cx="${EX}" cy="${EY}" r="${f1(ER + 10)}" fill="none" stroke="${CYAN}" stroke-width="6" opacity="0.35" filter="url(#bigglow)"/>`;
    // signal beams satellite → Earth
    const ba = seg(lt, 0.4, 1.0) * (1 - 0.6 * seg(t, tAbout - 0.4, tAbout));
    let beams = '';
    SATS.forEach(([u, v], i) => {
      const a = (rot * Math.PI) / 180;
      const dx = (u - GPS_EARTH.u) * s;
      const dy = (v - GPS_EARTH.v) * s;
      const x = EX + dx * Math.cos(a) - dy * Math.sin(a);
      const y = EY + dx * Math.sin(a) + dy * Math.cos(a);
      const ph = (lt * 0.9 + hash(i) * 3) % 1;
      beams += `<line x1="${f1(x)}" y1="${f1(y)}" x2="${EX}" y2="${EY}" stroke="${AMBER}" stroke-width="2.5" stroke-dasharray="6 16" stroke-dashoffset="${f1(-lt * 90)}" opacity="${f1(0.5 * ba)}"/>
        <circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(10 + ph * 40)}" fill="none" stroke="${AMBER}" stroke-width="3" opacity="${f1(ba * (1 - ph))}"/>
        <circle cx="${f1(x)}" cy="${f1(y)}" r="7" fill="${AMBER}" opacity="${f1(ba)}"/>`;
    });
    o += `<g>${beams}</g>`;
    o += topScrim(1, 720);
    // 2010s + GPS lock-up
    const d = t - t2010;
    if (d > -0.1) o += hero('2010s', 540, 400, 170, CREAM, clamp((d + 0.1) / 0.2) * (1 - 0.35 * seg(t, tAbout - 0.3, tAbout)));
    o += chip('GPS', 540, 190, seg(t, tGps - 0.1, tGps + 0.5), { color: CYAN, size: 40, dot: true });
    // map-pin card: where the map says vs where the ground is
    const ca = eOut(seg(t, tAbout - 0.45, tAbout + 0.05));
    if (ca > 0) {
      const cx = 540;
      const cy = 880;
      const cw = 760;
      const chh = 560;
      const card = id('card');
      o += `<g opacity="${f1(ca)}" transform="translate(${cx} ${cy}) scale(${f1(lerp(0.9, 1, ca))}) translate(${-cx} ${-cy})">
        <clipPath id="${card}"><rect x="${cx - cw / 2}" y="${cy - chh / 2}" width="${cw}" height="${chh}" rx="26"/></clipPath>
        <g clip-path="url(#${card})">
          ${place('bm', 1196, 902, 3.2, cx, cy)}
          <rect x="${cx - cw / 2}" y="${cy - chh / 2}" width="${cw}" height="${chh}" fill="#000" opacity="0.35"/>
          ${Array.from({ length: 9 }, (_, i) => `<line x1="${cx - cw / 2 + i * 95}" y1="${cy - chh / 2}" x2="${cx - cw / 2 + i * 95}" y2="${cy + chh / 2}" stroke="${CYAN}" stroke-width="1.5" opacity="0.35"/>`).join('')}
          ${Array.from({ length: 7 }, (_, i) => `<line x1="${cx - cw / 2}" y1="${cy - chh / 2 + i * 95}" x2="${cx + cw / 2}" y2="${cy - chh / 2 + i * 95}" stroke="${CYAN}" stroke-width="1.5" opacity="0.35"/>`).join('')}
        </g>
        <rect x="${cx - cw / 2}" y="${cy - chh / 2}" width="${cw}" height="${chh}" rx="26" fill="none" stroke="${CYAN}" stroke-width="4"/>
      </g>`;
      const sep = 150 * eIO(seg(t, tAbout + 0.1, tAbout + 0.7));
      const px = cx - 40;
      const pyReal = cy - 40 - sep / 2;
      const pyMap = cy - 40 + sep / 2;
      const mapPin = (x, y, col, hollow) =>
        `<g transform="translate(${f1(x)} ${f1(y)})"><path d="M0,0 C-8,-22 -34,-40 -34,-66 A34,34 0 1 1 34,-66 C34,-40 8,-22 0,0 Z" fill="${hollow ? 'rgba(0,0,0,0.35)' : col}" stroke="${col}" stroke-width="5" ${hollow ? 'stroke-dasharray="9 7"' : ''}/><circle cx="0" cy="-66" r="12" fill="${hollow ? col : INK}"/></g>`;
      o += `<g opacity="${f1(ca)}">
        <ellipse cx="${px}" cy="${f1(pyReal)}" rx="22" ry="8" fill="#000" opacity="0.5"/>
        ${sep > 2 ? mapPin(px, pyMap, RED, true) : ''}
        ${mapPin(px, pyReal, AMBER, false)}
      </g>`;
      const dimA = seg(t, tAbout + 0.5, tAbout + 0.8);
      if (dimA > 0) {
        const xx = px + 90;
        o += `<g opacity="${f1(dimA)}" filter="url(#softglow)">
          <line x1="${xx}" y1="${f1(pyReal)}" x2="${xx}" y2="${f1(pyMap)}" stroke="${CREAM}" stroke-width="5"/>
          <line x1="${xx - 18}" y1="${f1(pyReal)}" x2="${xx + 18}" y2="${f1(pyReal)}" stroke="${CREAM}" stroke-width="5"/>
          <line x1="${xx - 18}" y1="${f1(pyMap)}" x2="${xx + 18}" y2="${f1(pyMap)}" stroke="${CREAM}" stroke-width="5"/>
        </g>`;
        o += stamp('1.5 M', xx + 150, cy - 30, t - (tAbout + 0.6), { size: 84, rot: 0, color: CREAM, w: 230 });
      }
    }
    o += credit('GPS.GOV · CONSTELLATION SCHEMATIC', seg(lt, 0.3, 0.8) * (1 - seg(t, tHalf, tHalf + 0.2)));
    return o;
  }

  // =====================================================================
  // BEAT 6 — UTM grid cropped to AU zones 49–56: 2017, GDA2020, coordinates snap north
  // =====================================================================
  function bDatum(t, lt) {
    const t2017 = cue('2017', 0, 31.88);
    const tOff = cue('officially', 0, 33.72);
    const tUpd = cue('updated', 0, 34.14);
    const tEnt = cue('entire', 0, 36.2);
    const tCorr = cue('corrected', 0, 38.0);
    const tWasnt = cue("wasn't", 0, 39.22);
    const tAny = cueEnd('anymore', 0, 41.08);
    const P = lerp(20.5, 18.6, eOut(clamp(lt / 1.5))) + lt * 0.05;
    const LON0 = 133.5;
    const LAT0 = -25;
    const CY = 820;
    const X = (lon) => 540 + (lon - LON0) * P;
    const Y = (lat) => CY - (lat - LAT0) * P;
    const s = P / UTM_PX_PER_DEG;
    let o = fill('#16174d');
    o += place('utm', (LON0 + 180) * UTM_PX_PER_DEG, (90 - LAT0) * UTM_PX_PER_DEG, s, 540, CY);
    o += dim(0.42);
    // crisp zone meridians 49–56 (108°E … 156°E)
    const gl = seg(lt, 0.1, 0.9);
    let g = '';
    for (let z = 49; z <= 57; z++) {
      const lon = (z - 1) * 6 - 180;
      const x = X(lon);
      const y2 = lerp(-20, 1240, eOut(clamp(gl * 1.4 - (z - 49) * 0.05)));
      g += `<line x1="${f1(x)}" y1="-20" x2="${f1(x)}" y2="${f1(y2)}" stroke="${AMBER}" stroke-width="2.5" opacity="0.75"/>`;
    }
    o += `<g>${g}</g>`;
    // zone sweep on "updated": zones light up west → east
    const sw = seg(t, tUpd - 0.2, tUpd + 1.3);
    if (sw > 0) {
      const xs = lerp(X(108), X(156), eIO(sw));
      o += `<rect x="${f1(X(108))}" y="-20" width="${f1(xs - X(108))}" height="1260" fill="${AMBER}" opacity="${f1(0.13 * (1 - seg(t, tEnt, tEnt + 0.6) * 0.6))}"/>`;
      if (sw < 1) o += `<line x1="${f1(xs)}" y1="-20" x2="${f1(xs)}" y2="1240" stroke="${CREAM}" stroke-width="6" filter="url(#softglow)"/>`;
    }
    // zone numbers re-set crisply over the still's own (blurry) zone row, below the caption band
    let zn = '';
    for (let z = 49; z <= 56; z++) {
      const lon = (z - 1) * 6 - 180 + 3;
      const a = seg(lt, 0.4 + (z - 49) * 0.06, 0.7 + (z - 49) * 0.06);
      const zy = Y(-59.6);
      zn += `<g opacity="${f1(a)}"><rect x="${f1(X(lon) - 32)}" y="${f1(zy - 26)}" width="64" height="50" rx="8" fill="rgba(6,10,22,0.9)" stroke="${AMBER}" stroke-width="2"/>${text(String(z), X(lon), zy + 11, { font: F_MONO, size: 30, fill: AMBER, stroke: false })}</g>`;
    }
    o += zn;
    // outlines: where the old map says (south, red dashed) vs where the ground is (gold)
    const toPath = (dLat) =>
      'M' + AUS_LL.map(([lo, la]) => `${f1(X(lo))},${f1(Y(la + dLat))}`).join(' L') + ' Z';
    const oa = seg(t, tEnt - 0.2, tEnt + 0.3);
    if (oa > 0) {
      const snap = eBack(seg(t, tCorr, tCorr + 0.45));
      const off = 1.6 * (1 - snap);
      o += `<path d="${toPath(0)}" fill="rgba(255,197,61,0.10)" stroke="${AMBER}" stroke-width="4" stroke-linejoin="round" opacity="${f1(oa)}" filter="url(#softglow)"/>`;
      o += `<path d="${toPath(-off)}" fill="none" stroke="${RED}" stroke-width="4" stroke-dasharray="14 10" stroke-linejoin="round" opacity="${f1(oa * (1 - seg(t, tCorr + 0.35, tCorr + 0.6)))}"/>`;
      const k = t - tCorr;
      if (k > 0 && k < 0.5) o += `<rect width="${W}" height="${H}" fill="${CREAM}" opacity="${f1(0.22 * (1 - k / 0.5))}"/>`;
      const ra = seg(t, tCorr + 0.1, tCorr + 0.4);
      const bx1 = X(112.2);
      const bx2 = X(154.6);
      const by1 = Y(-9.5);
      const by2 = Y(-39.8);
      const rr = 44;
      o += reticle(bx1 + rr, by1 + rr, rr, ra);
      o += reticle(bx2 - rr, by1 + rr, rr, ra);
      o += reticle(bx1 + rr, by2 - rr, rr, ra);
      o += reticle(bx2 - rr, by2 - rr, rr, ra);
      // the old map position blinks once more on "wasn't where the maps said"
      const bl = seg(t, tWasnt - 0.1, tWasnt + 0.2) * (1 - seg(t, tAny - 0.3, tAny + 0.1));
      if (bl > 0) {
        const flick = 0.55 + 0.45 * Math.sin((t - tWasnt) * 26);
        o += `<path d="${toPath(-1.6)}" fill="rgba(255,90,78,0.08)" stroke="${RED}" stroke-width="4" stroke-dasharray="14 10" opacity="${f1(bl * flick)}"/>`;
      }
    }
    o += topScrim(0.85, 620);
    o += stamp('2017', 540, 330, t - (t2017 + 0.05), { size: 150, rot: -3, w: 400 });
    o += chip('GDA2020', 540, 500, seg(t, tOff - 0.1, tOff + 0.6), { size: 44, color: CYAN, dot: true });
    o += credit('UTM ZONES · NASA VISIBLE EARTH · CC BY-SA', seg(lt, 0.3, 0.8));
    return o;
  }

  // =====================================================================
  // BEAT 7 — Indo-Australian plate: ~7 cm/yr vectors flow north; path to Asia; deep-time; impact
  // =====================================================================
  function bAsia(t, lt) {
    const tHead = cue('heading', 0, 42.08);
    const tAsia = cue('asia', 0, 43.28);
    const tTens = cue('tens', 0, 44.36);
    const tHit = cue('hit', 0, 46.22);
    const p = eIO(seg(lt, 0, 5.4));
    const s = lerp(1.42, 1.5, p);
    const u = lerp(1010, 985, p);
    const v = lerp(965, 880, p);
    const kHit = t - (tHit + 0.05);
    const shake = kHit > 0 ? Math.exp(-kHit * 7) * 16 : 0;
    const sx = shake * Math.sin(kHit * 70);
    const sy = shake * Math.cos(kHit * 55);
    const X = (uu) => 540 + (uu - u) * s + sx;
    const Y = (vv) => 960 + (vv - v) * s + sy;
    let o = fill('#cfeaf8');
    o += place('indo', u, v, s, 540 + sx, 960 + sy);
    o += dim(0.5);
    // plate-motion vectors (68 / 69 / 70 mm/yr on the source map), overdrawn and flowing
    const va = seg(t, tHead - 0.2, tHead + 0.4);
    const vecs = [
      [853, 900, 172],
      [1209, 895, 172],
    ];
    vecs.forEach(([uu, vv, len], i) => {
      const bob = ((lt * 0.8 + i * 0.3) % 1) * 20;
      o += arrowUp(X(uu), Y(vv) - bob, len * s, va, AMBER, { w: 12, head: 40, rot: 12 });
    });
    // route north to Asia
    const ra = seg(t, tAsia - 0.5, tAsia + 0.3);
    if (ra > 0) {
      const x1 = X(1030);
      const y1 = Y(760);
      const x2 = X(880);
      const y2 = Y(470);
      const d = `M${f1(x1)},${f1(y1)} C${f1(x1)},${f1(y1 - 140)} ${f1(x2 + 40)},${f1(y2 + 160)} ${f1(x2)},${f1(y2)}`;
      o += `<path d="${d}" fill="none" stroke="${AMBER}" stroke-width="9" stroke-linecap="round" stroke-dasharray="1400" stroke-dashoffset="${f1(1400 * (1 - eOut(ra)))}" filter="url(#softglow)"/>`;
      o += `<path d="${d}" fill="none" stroke="${INK}" stroke-width="3" stroke-dasharray="12 16" stroke-dashoffset="${f1(-lt * 60)}" opacity="${f1(ra * 0.6)}"/>`;
    }
    // Australia outline glides north and meets the Indonesian arc on "hit"
    const oa = seg(t, tHead, tHead + 0.5);
    if (oa > 0) {
      const travel = eIO(seg(t, tTens - 0.2, tHit + 0.05));
      const du = -30 * travel;
      const dv = -215 * travel;
      o += ausOutline(X(INDO_AU.bx + du), Y(INDO_AU.by + dv), INDO_AU.bw * s, {
        stroke: AMBER,
        sw: 5,
        fill: 'rgba(255,197,61,0.16)',
        a: oa * (1 - 0.4 * seg(t, tHit + 0.6, tHit + 1.0)),
        filter: 'url(#softglow)',
      });
    }
    if (kHit > 0 && kHit < 1.2) {
      const cx = X(1010);
      const cy = Y(455);
      const r = eOut(clamp(kHit / 0.7));
      let parts = '';
      for (let i = 0; i < 26; i++) {
        const ang = (i / 26) * Math.PI * 2 + hash(i) * 0.4;
        const dist = (60 + hash(i + 5) * 220) * r;
        parts += `<circle cx="${f1(cx + Math.cos(ang) * dist)}" cy="${f1(cy + Math.sin(ang) * dist * 0.7)}" r="${f1(3 + hash(i + 9) * 6)}" fill="${i % 3 ? AMBER : CREAM}" opacity="${f1(1 - r)}"/>`;
      }
      o += `<g>
        <circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(40 + r * 320)}" fill="none" stroke="${CREAM}" stroke-width="${f1(14 * (1 - r) + 1)}" opacity="${f1(1 - r)}"/>
        <circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(30 + r * 90)}" fill="${CREAM}" opacity="${f1(0.7 * (1 - r))}" filter="url(#bigglow)"/>
        ${parts}
      </g>`;
      if (kHit < 0.25) o += `<rect width="${W}" height="${H}" fill="#fff" opacity="${f1(0.4 * (1 - kHit / 0.25))}"/>`;
    }
    o += topScrim(0.85, 640);
    o += chip('NORTH → ASIA', 540, 260, seg(t, tAsia - 0.35, tAsia + 0.4), { size: 44, color: AMBER });
    // deep-time dial on "tens of millions of years"
    const da = seg(t, tTens - 0.3, tTens + 0.1) * (1 - seg(t, tHit - 0.1, tHit + 0.2));
    if (da > 0) {
      const spin = Math.pow(Math.max(0, t - tTens + 0.3), 2) * 900;
      let ticks = '';
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        ticks += `<line x1="${f1(Math.cos(a) * 56)}" y1="${f1(Math.sin(a) * 56)}" x2="${f1(Math.cos(a) * 68)}" y2="${f1(Math.sin(a) * 68)}"/>`;
      }
      o += `<g opacity="${f1(da)}" transform="translate(540 440)" stroke="${CREAM}" stroke-width="4" stroke-linecap="round">
        <circle r="80" fill="rgba(6,10,22,0.7)" stroke="${CYAN}"/>
        ${ticks}
        <line x1="0" y1="0" x2="0" y2="-58" transform="rotate(${f1(spin)})" stroke="${AMBER}" stroke-width="6"/>
        <line x1="0" y1="0" x2="0" y2="-38" transform="rotate(${f1(spin / 12)})" stroke="${CREAM}" stroke-width="7"/>
        <circle r="8" fill="${AMBER}" stroke="none"/>
      </g>`;
    }
    o += credit('MAP: XENTU25 · CC BY-SA 4.0', seg(lt, 0.3, 0.8));
    return o;
  }

  // =====================================================================
  // BEAT 8 — Galileo Moon + Australia to scale → loop back to frame 1
  // =====================================================================
  function bLoop(t, lt) {
    const tNot = cue('not', 0, 47.02);
    const tWider = cue('wider', 1, 48.42);
    const end = (window.EPISODE && window.EPISODE.duration) || 49.56;
    const R = 400 + lt * 3;
    const cx = 540;
    const cy = 860;
    let o = fill('#000') + stars(t, 0.5);
    o += moonDisk('moon2', cx, cy, R);
    o += dim(0.3);
    // Australia outline at true scale vs the Moon's diameter
    const wAus = (2 * R * AUS_KM) / MOON_KM;
    const slide = eOut(seg(t, tNot - 0.1, tNot + 0.6));
    const ax = cx - wAus / 2 + (1 - slide) * 700;
    const ay = cy - (wAus * AUS_ASPECT) / 2 - 20;
    const fadeLoop = seg(t, end - 0.55, end - 0.05);
    const oa = slide * (1 - fadeLoop);
    o += ausOutline(ax, ay, wAus, { stroke: AMBER, sw: 5, fill: 'rgba(255,197,61,0.18)', a: oa, filter: 'url(#softglow)' });
    // overhang ticks at the widest line
    const ya = ay + wAus * 0.5 * AUS_ASPECT * 0.72;
    const ta = seg(t, tWider - 0.4, tWider) * (1 - fadeLoop);
    if (ta > 0) {
      o += `<g opacity="${f1(ta)}" stroke="${CYAN}" stroke-width="4">
        <line x1="${f1(cx - R)}" y1="${f1(ya - 60)}" x2="${f1(cx - R)}" y2="${f1(ya + 60)}" stroke-dasharray="8 6"/>
        <line x1="${f1(cx + R)}" y1="${f1(ya - 60)}" x2="${f1(cx + R)}" y2="${f1(ya + 60)}" stroke-dasharray="8 6"/>
      </g>`;
    }
    o += topScrim(0.9, 760);
    // hook returns — lands in the exact frame-1 layout for a seamless loop
    // the hook eases back into its frame-1 state (wide tracking, 1.05 scale) as the loop closes
    const ha = eOut(seg(t, tWider - 0.25, tWider + 0.2));
    const hookT = 1.4 * (1 - eIO(fadeLoop));
    o += hookTitle(hookT, ha, (1 - ha) * -60);
    // final beats: cross into the exact Apollo 13 frame-1 composition
    if (fadeLoop > 0) {
      o += `<g opacity="${f1(fadeLoop)}">${fill('#000')}${stars(0)}${place('moon1', MOON1.u, MOON1.v, 392 / MOON1.r, 540, 890)}${dim(0.08)}${topScrim(0.9, 760)}${hookTitle(hookT, 1)}</g>`;
    }
    o += credit('GALILEO · NASA/JPL/USGS', seg(lt, 0.3, 0.8) * (1 - fadeLoop));
    return o;
  }

  // ---------- beat table (starts anchored to transcript words) ----------
  function beats() {
    return [
      { id: 'moon', start: 0, draw: bMoon },
      { id: 'australia', start: cue('mainland', 0, 7.06) - 0.2, draw: bAustralia },
      { id: 'moving', start: cue('australia', 2, 13.22) - 0.3, draw: bMoving },
      { id: 'plates', start: cue('seven', 0, 17.1) - 0.55, draw: bPlates },
      { id: 'gps', start: cue('by', 0, 24.8) - 0.25, draw: bGps },
      { id: 'datum', start: cue('so', 1, 31.5) - 0.25, draw: bDatum },
      { id: 'asia', start: cue('and', 1, 41.46) - 0.2, draw: bAsia },
      { id: 'loop', start: cue('not', 0, 47.02) - 0.3, draw: bLoop },
    ];
  }

  function grain(t) {
    const seed = Math.floor(t * 15) % 97;
    return `<filter id="grainF" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="${seed}"/><feColorMatrix type="saturate" values="0"/></filter>
      <rect width="${W}" height="${H}" filter="url(#grainF)" opacity="0.06"/>`;
  }

  function master(t) {
    uid = 0;
    const list = beats();
    let body = defs();
    for (let i = 0; i < list.length; i++) {
      const b = list[i];
      const next = list[i + 1];
      const end = next ? next.start + XF : Infinity;
      if (t < b.start || t >= end) continue;
      const lt = t - b.start;
      const a = i === 0 ? 1 : eIO(clamp(lt / XF));
      const zoom = i === 0 ? 1 : lerp(1.04, 1, eOut(clamp(lt / (XF * 1.6))));
      body += `<g opacity="${f1(a)}" transform="translate(540 960) scale(${zoom.toFixed(4)}) translate(-540 -960)">${b.draw(t, lt)}</g>`;
    }
    body += `<rect width="${W}" height="${H}" fill="url(#vig)"/>`;
    body += grain(t);
    return body;
  }

  window.EPISODE = {
    duration: 49.56,
    fps: 30,
    ready,
    images: Object.fromEntries(Object.entries(IMG).map(([k, v]) => [k, v.url])),
    words: [],
    scenes: [{ id: 'master', start: 0, end: 49.56 + 1, draw: (t) => master(t) }],
  };
})();
