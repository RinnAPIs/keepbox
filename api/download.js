const axios = require('axios');

const tools = [
  'apple-music-downloader', 'douyin-downloader', 'facebook-video-downloader',
  'instagram-reels-downloader', 'instagram-story-downloader', 'instagram-video-downloader',
  'likee-downloader', 'linkedin-video-downloader', 'pinterest-video-downloader',
  'soundcloud-downloader', 'spotify-downloader', 'tiktok-photo-downloader',
  'tiktok-story-downloader', 'tiktok-video-downloader', 'twitter-gif-downloader',
  'twitter-video-downloader', 'youtube-video-downloader'
];

function detectTool(url) {
  const u = url.toLowerCase();
  if (u.includes('tiktok.com')) {
    if (u.includes('/photo/')) return 'tiktok-photo-downloader';
    if (u.includes('/story/')) return 'tiktok-story-downloader';
    return 'tiktok-video-downloader';
  }
  if (u.includes('douyin.com')) return 'douyin-downloader';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube-video-downloader';
  if (u.includes('instagram.com')) {
    if (u.includes('/reel')) return 'instagram-reels-downloader';
    if (u.includes('/stories/')) return 'instagram-story-downloader';
    return 'instagram-video-downloader';
  }
  if (u.includes('facebook.com') || u.includes('fb.watch')) return 'facebook-video-downloader';
  if (u.includes('twitter.com') || u.includes('x.com')) {
    if (u.includes('/photo/') || u.includes('gif')) return 'twitter-gif-downloader';
    return 'twitter-video-downloader';
  }
  if (u.includes('pinterest.com') || u.includes('pin.it')) return 'pinterest-video-downloader';
  if (u.includes('linkedin.com')) return 'linkedin-video-downloader';
  if (u.includes('likee.video')) return 'likee-downloader';
  if (u.includes('soundcloud.com')) return 'soundcloud-downloader';
  if (u.includes('open.spotify.com')) return 'spotify-downloader';
  if (u.includes('music.apple.com')) return 'apple-music-downloader';
  return null;
}

async function wowdownloader(url, tool) {
  if (!url.includes('https://')) throw new Error('Invalid url.');
  if (!tools.includes(tool)) throw new Error('Invalid tool.');

  const { data: html, headers } = await axios.get(`https://wowdownloader.com/tool/${tool}`, {
    headers: { 'user-agent': 'Mozilla/5.0 KeepBox/1.0' }
  });

  const csrfToken = html.match(/<meta name="csrf-token" content="([^"]+)">/)?.[1];
  if (!csrfToken) throw new Error('Failed to get token.');

  const { data } = await axios.post('https://wowdownloader.com/api/download', {
    url, tool
  }, {
    headers: {
      origin: 'https://wowdownloader.com',
      referer: `https://wowdownloader.com/tool/${tool}`,
      'x-csrf-token': csrfToken,
      cookie: headers['set-cookie']?.map(c => c.split(';')[0]).join('; '),
      'content-type': 'application/json',
      'user-agent': 'Mozilla/5.0 KeepBox/1.0'
    }
  });

  return data;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  try {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'A URL is required.' });
      return;
    }

    const tool = detectTool(url);
    if (!tool) {
      res.status(400).json({ error: 'This platform is not supported yet.' });
      return;
    }

    const result = await wowdownloader(url, tool);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Something went wrong.' });
  }
};
