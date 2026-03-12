const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/**
 * Check if a URL is a Dynamic Media Video delivery URL.
 * @param {string} url The URL to check
 * @returns {boolean}
 */
function isDMVideoUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.endsWith('.adobeaemcloud.com')
      && parsed.pathname.includes('/play');
  } catch {
    return false;
  }
}

/**
 * Check if a URL points to an MP4 video file.
 * @param {string} url The URL to check
 * @returns {boolean}
 */
function isMp4Url(url) {
  try {
    const parsed = new URL(url);
    return parsed.pathname.endsWith('.mp4');
  } catch {
    return false;
  }
}

/**
 * Create a background video element for the hero.
 * @param {string} src Video source URL
 * @param {string} posterSrc Optional poster image URL
 * @returns {HTMLVideoElement}
 */
function createHeroVideo(src, posterSrc) {
  const videoEl = document.createElement('video');
  videoEl.classList.add('hero-video');
  videoEl.muted = true;
  videoEl.playsInline = true;
  videoEl.loop = true;

  if (posterSrc) {
    videoEl.setAttribute('poster', posterSrc);
  }

  const sourceEl = document.createElement('source');
  sourceEl.setAttribute('src', src);
  sourceEl.setAttribute('type', 'video/mp4');
  videoEl.append(sourceEl);

  return videoEl;
}

/**
 * Autoplay video when visible in the viewport, pause when not.
 * Respects prefers-reduced-motion.
 * @param {HTMLVideoElement} videoEl
 */
function observeAutoplay(videoEl) {
  if (prefersReducedMotion.matches) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        videoEl.play().catch(() => {});
      } else {
        videoEl.pause();
      }
    });
  }, { threshold: 0.25 });

  observer.observe(videoEl);
}

/**
 * Find the first video link (MP4 or DM Video) in the block.
 * @param {Element} block The hero block element
 * @returns {HTMLAnchorElement|null}
 */
function findVideoLink(block) {
  const links = block.querySelectorAll('a[href]');
  return [...links].find((a) => isMp4Url(a.href) || isDMVideoUrl(a.href)) || null;
}

/**
 * Decorates the hero block, adding video background support.
 * Auto-detects video links (MP4 or Dynamic Media Video) in the content.
 * @param {Element} block The hero block element
 */
export default function decorate(block) {
  const link = findVideoLink(block);
  if (!link) return;

  const videoSrc = link.href;

  // Grab poster image if authored
  const posterPicture = block.querySelector('picture');
  const posterImg = posterPicture?.querySelector('img');
  const posterSrc = posterImg?.src || '';

  // Collect all text/heading/button elements for the overlay
  const overlay = document.createElement('div');
  overlay.className = 'hero-text-overlay';

  block.querySelectorAll(':scope > div').forEach((row) => {
    // Skip the row that only contains media (picture / video link)
    const hasHeadingOrText = row.querySelector('h1, h2, h3, h4, h5, h6, p');
    const rowLink = row.querySelector('a[href]');
    const isMediaOnlyRow = !hasHeadingOrText
      || (rowLink && (isMp4Url(rowLink.href) || isDMVideoUrl(rowLink.href))
        && !row.querySelector('h1, h2, h3, h4, h5, h6'));

    if (isMediaOnlyRow) return;

    // Move text content into the overlay
    [...row.querySelectorAll('h1, h2, h3, h4, h5, h6, p')].forEach((el) => {
      // Skip paragraphs that only contain the video link
      if (el.tagName === 'P' && el.querySelector('a[href]')) {
        const innerLink = el.querySelector('a[href]');
        if (isMp4Url(innerLink.href) || isDMVideoUrl(innerLink.href)) return;
      }
      overlay.append(el);
    });
  });

  // Clear block and rebuild
  block.textContent = '';

  const videoEl = createHeroVideo(videoSrc, posterSrc);
  block.append(videoEl);

  if (overlay.children.length > 0) {
    block.append(overlay);
  }

  observeAutoplay(videoEl);
}
