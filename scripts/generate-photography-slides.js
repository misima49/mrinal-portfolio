const fs = require('fs');
const path = require('path');

const photographyDir = path.join(__dirname, '..', 'images', 'photography');
const outputPath = path.join(photographyDir, 'photography-slides.js');
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif']);

function formatCaptionTextFromSlug(slug, mode) {
  const words = slug.split('-').filter(Boolean);

  if (words.length === 0) {
    return '';
  }

  if (mode === 'title') {
    return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  const sentence = words.join(' ');
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

const files = fs.readdirSync(photographyDir)
  .filter((file) => imageExtensions.has(path.extname(file).toLowerCase()))
  .sort((a, b) => a.localeCompare(b));

const slides = files.map((file, index) => {
  const basename = file.replace(/\.[^.]+$/, '');
  const [titleSlug, subtitleSlug = ''] = basename.split('__');
  const title = formatCaptionTextFromSlug(titleSlug, 'title') || `Photo ${index + 1}`;
  const description = formatCaptionTextFromSlug(subtitleSlug, 'subtitle');

  return {
    src: `./images/photography/${file}`,
    alt: title,
    title,
    description
  };
});

const output = `window.photographySlidesData = ${JSON.stringify(slides, null, 2)};\n`;
fs.writeFileSync(outputPath, output);

console.log(`Generated ${slides.length} photography slide entries in ${path.relative(process.cwd(), outputPath)}.`);
