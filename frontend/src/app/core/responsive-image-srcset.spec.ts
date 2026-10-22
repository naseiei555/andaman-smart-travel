import { applyImageFallback, responsiveImageSrcset } from '../../../../shared/data/images.data';

describe('responsiveImageSrcset utility', () => {
  it('creates smaller Wikimedia thumbnail candidates without changing attribution URLs', () => {
    expect(
      responsiveImageSrcset(
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Andaman.jpg/960px-Andaman.jpg',
      ),
    ).toBe(
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Andaman.jpg/250px-Andaman.jpg 250w, https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Andaman.jpg/330px-Andaman.jpg 330w, https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Andaman.jpg/500px-Andaman.jpg 500w, https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Andaman.jpg/960px-Andaman.jpg 960w',
    );
  });

  it('leaves non-Wikimedia thumbnails and unsupported sizes unchanged', () => {
    expect(responsiveImageSrcset('https://img.youtube.com/vi/example/0.jpg')).toBe('');
    expect(
      responsiveImageSrcset(
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Andaman.jpg/Andaman.jpg',
      ),
    ).toBe('');
  });

  it('clears responsive candidates before applying the local image fallback', () => {
    const image = document.createElement('img');
    image.srcset = responsiveImageSrcset(
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Andaman.jpg/960px-Andaman.jpg',
    );
    const error = new Event('error');
    Object.defineProperty(error, 'currentTarget', { value: image });

    applyImageFallback(error, '/assets/image-fallbacks/krabi.svg');

    expect(image.srcset).toBe('');
    expect(image.getAttribute('src')).toBe('/assets/image-fallbacks/krabi.svg');
  });
});
