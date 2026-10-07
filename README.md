const sliderIds = ['brightness', 'contrast', 'saturation', 'exposure', 'temperature', 'blur', 'sepia', 'grayscale', 'hue'];
const state = {
  image: null,
  originalImageData: null,
  history: [],
  current: {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    exposure: 100,
    temperature: 0,
    blur: 0,
    sepia: 0,
    grayscale: 0,
    hue: 0
  }
};

const editorCanvas = document.getElementById('editorCanvas');
const beforeCanvas = document.getElementById('beforeCanvas');
const afterCanvas = document.getElementById('afterCanvas');
const emptyState = document.getElementById('emptyState');
const fileInput = document.getElementById('fileInput');
const liveToggle = document.getElementById('liveToggle');
const promptInput = document.getElementById('promptInput');

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function pushHistory() {
  if (!state.image) return;
  state.history.push({...state.current});
  if (state.history.length > 12) state.history.shift();
}

function getProcessedPixels(image, settings) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = image.width;
  canvas.height = image.height;

  ctx.filter = [
    `brightness(${settings.brightness}%)`,
    `contrast(${settings.contrast}%)`,
    `saturate(${settings.saturation}%)`,
    `sepia(${settings.sepia}%)`,
    `grayscale(${settings.grayscale}%)`,
    `blur(${settings.blur}px)`,
    `hue-rotate(${settings.hue}deg)`
  ].join(' ');

  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    const brightnessScale = settings.exposure / 100;
    r *= brightnessScale;
    g *= brightnessScale;
    b *= brightnessScale;

    if (settings.temperature > 0) {
      r *= 1 + settings.temperature / 150;
      b *= 1 - settings.temperature / 250;
    } else if (settings.temperature < 0) {
      r *= 1 + settings.temperature / 250;
      b *= 1 - settings.temperature / 150;
    }

    if (settings.grayscale > 0) {
      const gray = (r + g + b) / 3;
      const mix = settings.grayscale / 100;
      r = r * (1 - mix) + gray * mix;
      g = g * (1 - mix) + gray * mix;
      b = b * (1 - mix) + gray * mix;
    }

    data[i] = clamp(r, 0, 255);
    data[i + 1] = clamp(g, 0, 255);
    data[i + 2] = clamp(b, 0, 255);
  }

  return imageData;
}

function renderEditorImage() {
  if (!state.image) {
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  const maxDimension = 1200;
  const scale = Math.min(1, maxDimension / Math.max(state.image.width, state.image.height));
  const renderWidth = Math.max(320, Math.round(state.image.width * scale));
  const renderHeight = Math.max(220, Math.round(state.image.height * scale));

  editorCanvas.width = renderWidth;
  editorCanvas.height = renderHeight;
  beforeCanvas.width = 400;
  afterCanvas.width = 400;
  beforeCanvas.height = 220;
  afterCanvas.height = 220;

  const ctx = editorCanvas.getContext('2d');
  const beforeCtx = beforeCanvas.getContext('2d');
  const afterCtx = afterCanvas.getContext('2d');

  const processed = getProcessedPixels(state.image, state.current);
  const targetCanvas = document.createElement('canvas');
  targetCanvas.width = state.image.width;
  targetCanvas.height = state.image.height;

  const targetCtx = targetCanvas.getContext('2d');
  targetCtx.putImageData(processed, 0, 0);

  ctx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);
  ctx.drawImage(targetCanvas, 0, 0, editorCanvas.width, editorCanvas.height);

  beforeCtx.clearRect(0, 0, beforeCanvas.width, beforeCanvas.height);
  beforeCtx.drawImage(state.image, 0, 0, beforeCanvas.width, beforeCanvas.height);

  afterCtx.clearRect(0, 0, afterCanvas.width, afterCanvas.height);
  afterCtx.drawImage(targetCanvas, 0, 0, afterCanvas.width, afterCanvas.height);
}

function resetControls() {
  sliderIds.forEach((id) => {
    const slider = document.getElementById(id);
    const defaultValue = slider.defaultValue || '100';
    slider.value = defaultValue;
    state.current[id] = Number(defaultValue);
  });
  renderEditorImage();
}

function setSliderValues() {
  sliderIds.forEach((id) => {
    const slider = document.getElementById(id);
    slider.addEventListener('input', (event) => {
      const value = Number(event.target.value);
      state.current[id] = value;
      if (liveToggle.checked) {
        renderEditorImage();
      }
    });
  });
}

function loadImageFromFile(file) {
  if (!file || !file.type.startsWith('image/')) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      state.image = img;
      state.originalImageData = img;
      state.history = [];
      renderEditorImage();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

function applyPreset(name) {
  if (!state.image) return;

  const presets = {
    vivid: { brightness: 108, contrast: 120, saturation: 145, exposure: 110, temperature: 12, blur: 0, sepia: 0, grayscale: 0, hue: 0 },
    cinematic: { brightness: 96, contrast: 130, saturation: 110, exposure: 105, temperature: -20, blur: 0, sepia: 8, grayscale: 0, hue: 18 },
    mono: { brightness: 100, contrast: 110, saturation: 20, exposure: 100, temperature: 0, blur: 0, sepia: 0, grayscale: 75, hue: 0 },
    warm: { brightness: 110, contrast: 115, saturation: 130, exposure: 120, temperature: 35, blur: 0, sepia: 10, grayscale: 0, hue: 0 },
    cool: { brightness: 100, contrast: 108, saturation: 85, exposure: 100, temperature: -35, blur: 0, sepia: 0, grayscale: 0, hue: 15 }
  };

  const preset = presets[name];
  if (!preset) return;

  Object.keys(preset).forEach((key) => {
    state.current[key] = preset[key];
    const slider = document.getElementById(key);
    if (slider) slider.value = preset[key];
  });

  renderEditorImage();
}

function exportImage() {
  if (!state.image) return;

  const exportCanvas = document.createElement('canvas');
  const exportCtx = exportCanvas.getContext('2d');
  exportCanvas.width = state.image.width;
  exportCanvas.height = state.image.height;

  const data = getProcessedPixels(state.image, state.current);
  exportCtx.putImageData(data, 0, 0);

  const link = document.createElement('a');
  link.download = 'edited-image.png';
  link.href = exportCanvas.toDataURL('image/png');
  link.click();
}

function generateAiEdit() {
  if (!state.image) return;
  const prompt = promptInput.value || 'Enhance portrait with cinematic lighting';
  const boost = { brightness: 105, contrast: 125, saturation: 120, exposure: 110, temperature: 8 };

  Object.entries(boost).forEach(([key, value]) => {
    state.current[key] = value;
    const slider = document.getElementById(key);
    if (slider) slider.value = value;
  });

  if (prompt.toLowerCase().includes('remove') || prompt.toLowerCase().includes('background')) {
    state.current.grayscale = 0;
    state.current.saturation = 95;
    document.getElementById('grayscale').value = 0;
    document.getElementById('saturation').value = 95;
  }

  if (prompt.toLowerCase().includes('anime') || prompt.toLowerCase().includes('art')) {
    state.current.hue = 35;
    state.current.sepia = 18;
    document.getElementById('hue').value = 35;
    document.getElementById('sepia').value = 18;
  }

  renderEditorImage();
}

function openSampleImage() {
  const sample = new Image();
  sample.onload = () => {
    state.image = sample;
    renderEditorImage();
  };
  sample.src = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
      <defs>
        <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#8ad1ff"/>
          <stop offset="50%" stop-color="#6b86ff"/>
          <stop offset="100%" stop-color="#312c71"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="800" fill="#0c1222"/>
      <circle cx="420" cy="250" r="180" fill="url(#g1)"/>
      <rect x="180" y="420" width="800" height="320" rx="32" fill="#94c2ff" opacity="0.8"/>
      <text x="600" y="540" text-anchor="middle" font-family="Arial" font-size="80" fill="#f4f9ff" font-weight="700">AI Studio</text>
      <text x="600" y="620" text-anchor="middle" font-family="Arial" font-size="34" fill="#dbeaff">Sample Portrait</text>
    </svg>
  `);
}

function applyQuickTool(tool) {
  if (!state.image) return;

  switch (tool) {
    case 'crop':
      state.current.contrast = 115;
      state.current.brightness = 110;
      break;
    case 'reset':
      resetControls();
      return;
    case 'upscale':
      state.current.brightness = 108;
      state.current.contrast = 120;
      state.current.exposure = 115;
      break;
    case 'background':
      state.current.saturation = 88;
      state.current.contrast = 118;
      break;
    case 'enhance':
      state.current.brightness = 112;
      state.current.contrast = 125;
      state.current.saturation = 125;
      break;
    case 'prompt':
      generateAiEdit();
      return;
    default:
      break;
  }

  sliderIds.forEach((id) => {
    const slider = document.getElementById(id);
    if (slider) slider.value = state.current[id];
  });
  renderEditorImage();
}

function initEvents() {
  fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    loadImageFromFile(file);
  });

  document.getElementById('openGalleryBtn').addEventListener('click', openSampleImage);
  document.getElementById('resetControlsBtn').addEventListener('click', resetControls);
  document.getElementById('exportBtn').addEventListener('click', exportImage);
  document.getElementById('generateAiBtn').addEventListener('click', generateAiEdit);
  document.getElementById('undoBtn').addEventListener('click', () => {
    const previous = state.history.pop();
    if (!previous) return;
    Object.assign(state.current, previous);
    sliderIds.forEach((id) => {
      const slider = document.getElementById(id);
      if (slider) slider.value = previous[id];
    });
    renderEditorImage();
  });

  document.querySelectorAll('[data-tool]').forEach((button) => {
    button.addEventListener('click', () => applyQuickTool(button.dataset.tool));
  });

  document.querySelectorAll('[data-preset]').forEach((button) => {
    button.addEventListener('click', () => applyPreset(button.dataset.preset));
  });

  liveToggle.addEventListener('change', () => {
    if (liveToggle.checked && state.image) {
      renderEditorImage();
    }
  });

  setSliderValues();
}

initEvents();
resetControls();
