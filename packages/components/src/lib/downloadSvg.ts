function convertImage(
  dataUrl: string,
  desiredMimeType = 'image/png',
  minSize = 1200
): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const scaleFactor = Math.min(minSize / image.width, minSize / image.height);
      const canvas = document.createElement('canvas');
      canvas.width = image.width * scaleFactor;
      canvas.height = image.height * scaleFactor;
      console.log(`scaling by ${scaleFactor}`);
      console.log(`canvas size: ${canvas.width}x${canvas.height}`);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Failed to get canvas context'));
      }

      ctx.drawImage(image, 0, 0);
      ctx.scale(scaleFactor, scaleFactor);

      resolve(canvas.toDataURL(desiredMimeType));
    };
    image.src = dataUrl;
  });
}

export default async function downloadSvg(
  svg: string,
  outputFilename: string,
  desiredMimeType = 'image/png',
  minSize = 1200
) {
  const blob = new Blob([svg], { type: 'image/svg+xml; charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    const png = await convertImage(url, desiredMimeType, minSize);
    console.log(`png: ${png}`);
    const link = document.createElement('a');
    link.href = png;
    link.download = outputFilename;
    link.target = '_blank';
    link.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}
