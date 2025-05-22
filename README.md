# Trace-to-Vector Web App

A modern web application for converting physical drawings into vector graphics using ArUco markers. This application provides a seamless workflow from capturing images to exporting vector files.

## Features

- 📱 Mobile-friendly interface
- 📸 Real-time ArUco marker detection
- 🎨 Image processing and perspective correction
- ✏️ Vector tracing and editing
- 📤 Multiple export formats (SVG, PDF, PNG)
- 💾 Export management and sharing

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/trace-to-vector.git
cd trace-to-vector
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

1. **Capture**: Use your device's camera to capture images with ArUco markers
2. **Adjust**: Process the image with perspective correction and thresholding
3. **Trace**: Convert the image to vector graphics
4. **Preview**: Review and edit the vector output
5. **Export**: Save or share your vector file

## Development

### Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── utils/         # Utility functions
├── hooks/         # Custom React hooks
├── types/         # TypeScript type definitions
└── assets/        # Static assets
```

### Technologies Used

- React
- TypeScript
- Material-UI
- OpenCV.js (for ArUco marker detection)
- React Router
- React Webcam

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenCV.js for ArUco marker detection
- Material-UI for the component library
- React community for the amazing tools and libraries
