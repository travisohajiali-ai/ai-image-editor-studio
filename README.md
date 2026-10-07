# AI Image Editor Studio

A powerful, full-featured image editing application with AI capabilities built with Electron, React, and TensorFlow.

## Features

### Image Editing
- **Image Upload**: Drag & drop or file browser support
- **Crop Tool**: Precise image cropping with aspect ratio control
- **Brightness & Contrast**: Real-time adjustment sliders
- **Filters**: Instagram-style filters, color correction, and effects
- **Before/After Preview**: Side-by-side comparison view

### AI-Powered Features
- **Object Detection & Removal**: Remove unwanted objects using AI
- **Background Removal**: One-click background transparency
- **AI Upscaling**: 2x, 4x image upscaling with quality preservation
- **Text-to-Image**: Generate images from text descriptions
- **Style Transfer**: Apply artistic styles to photos
- **Face Enhancement**: Smart face detection and beautification

### Batch & Export
- **Batch Processing**: Apply edits to multiple images
- **Format Support**: Export to PNG, JPG, WebP
- **Quality Control**: Adjustable compression and quality settings

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Desktop**: Electron 28
- **AI/ML**: TensorFlow.js, COCO-SSD, OpenCV
- **Image Processing**: Sharp, Canvas API
- **Styling**: Tailwind CSS + Radix UI

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
npm run dist
```

## License

MIT
