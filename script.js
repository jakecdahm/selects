(function () {
  'use strict';

  // DOM Elements
  const gallery = document.getElementById('gallery');
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightbox-image');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');
  const loading = document.getElementById('loading');

  // State
  let photos = [];
  let currentIndex = -1;
  let touchStartX = 0;
  let touchEndX = 0;

  // Format date for display (MM/DD/YYYY)
  function formatDate(dateString) {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }

  // Create a gallery item
  function createGalleryItem(photo, index) {
    const item = document.createElement('div');
    item.className = 'gallery-item';

    // Set aspect ratio for justified layout
    const aspect = photo.width / photo.height;
    item.style.setProperty('--aspect', aspect.toFixed(4));

    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', `Photo from ${formatDate(photo.dateCaptured)}`);
    item.dataset.index = index;

    const img = document.createElement('img');
    img.src = `images/thumbs/${photo.filename}`;
    img.alt = `Photo from ${formatDate(photo.dateCaptured)}`;
    img.loading = 'lazy';

    img.onload = function () {
      img.classList.add('loaded');
    };

    item.appendChild(img);

    // Click handler
    item.addEventListener('click', function () {
      openLightbox(index);
    });

    // Keyboard handler
    item.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(index);
      }
    });

    return item;
  }

  // Render the gallery
  function renderGallery() {
    gallery.innerHTML = '';

    if (photos.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = '<p>No photos yet</p>';
      gallery.appendChild(empty);
      return;
    }

    photos.forEach(function (photo, index) {
      const item = createGalleryItem(photo, index);
      gallery.appendChild(item);
    });
  }

  // Open lightbox
  function openLightbox(index) {
    currentIndex = index;
    updateLightboxContent();
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';

    // Preload adjacent images
    preloadAdjacent();
  }

  // Close lightbox
  function closeLightbox() {
    lightbox.hidden = true;
    document.body.style.overflow = '';
    currentIndex = -1;
    lightboxImage.classList.remove('loaded');
  }

  // Update lightbox content
  function updateLightboxContent() {
    const photo = photos[currentIndex];
    if (!photo) return;

    lightboxImage.classList.remove('loaded');
    lightboxImage.src = `images/full/${photo.filename}`;
    lightboxImage.alt = `Photo from ${formatDate(photo.dateCaptured)}`;
    lightboxCaption.textContent = formatDate(photo.dateCaptured);

    lightboxImage.onload = function () {
      lightboxImage.classList.add('loaded');
    };

    // Update navigation visibility
    lightboxPrev.style.visibility = currentIndex > 0 ? 'visible' : 'hidden';
    lightboxNext.style.visibility = currentIndex < photos.length - 1 ? 'visible' : 'hidden';
  }

  // Navigate to previous photo
  function prevPhoto() {
    if (currentIndex > 0) {
      currentIndex--;
      updateLightboxContent();
      preloadAdjacent();
    }
  }

  // Navigate to next photo
  function nextPhoto() {
    if (currentIndex < photos.length - 1) {
      currentIndex++;
      updateLightboxContent();
      preloadAdjacent();
    }
  }

  // Preload adjacent images
  function preloadAdjacent() {
    const preloadIndexes = [currentIndex - 1, currentIndex + 1];

    preloadIndexes.forEach(function (index) {
      if (index >= 0 && index < photos.length) {
        const img = new Image();
        img.src = `images/full/${photos[index].filename}`;
      }
    });
  }

  // Handle touch events for swipe
  function handleTouchStart(e) {
    touchStartX = e.changedTouches[0].screenX;
  }

  function handleTouchEnd(e) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }

  function handleSwipe() {
    const threshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        nextPhoto();
      } else {
        prevPhoto();
      }
    }
  }

  // Event listeners
  lightboxClose.addEventListener('click', closeLightbox);

  lightboxPrev.addEventListener('click', function (e) {
    e.stopPropagation();
    prevPhoto();
  });

  lightboxNext.addEventListener('click', function (e) {
    e.stopPropagation();
    nextPhoto();
  });

  // Close on background click
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  // Keyboard navigation
  document.addEventListener('keydown', function (e) {
    if (lightbox.hidden) return;

    switch (e.key) {
      case 'Escape':
        closeLightbox();
        break;
      case 'ArrowLeft':
        prevPhoto();
        break;
      case 'ArrowRight':
        nextPhoto();
        break;
    }
  });

  // Touch events for swipe
  lightbox.addEventListener('touchstart', handleTouchStart, { passive: true });
  lightbox.addEventListener('touchend', handleTouchEnd, { passive: true });

  // Load manifest and initialize
  async function init() {
    try {
      const response = await fetch('manifest.json');

      if (!response.ok) {
        throw new Error('Failed to load manifest');
      }

      const manifest = await response.json();
      photos = manifest.photos || [];

      // Sort by date captured (newest first)
      photos.sort((a, b) => new Date(b.dateCaptured) - new Date(a.dateCaptured));

      renderGallery();
    } catch (error) {
      console.error('Error loading photos:', error);
      gallery.innerHTML = '<div class="empty-state"><p>Failed to load photos</p></div>';
    } finally {
      loading.hidden = true;
    }
  }

  // Start
  init();
})();
