# InSync - Indian Sign Language Learning Platform

InSync is a comprehensive web application designed to help users learn Indian Sign Language (ISL) through interactive lessons, visual aids, and practice exercises. The platform combines educational content with technology to make learning ISL accessible and engaging.

## Features

### Sign Language Learning
- **Alphabets Section**: Learn the complete ISL alphabet from A to Z with visual aids
- **Common Words**: Practice essential ISL words for daily communication with video demonstrations
- **Quiz System**: Test your knowledge with multiple difficulty levels (Easy, Normal, Hard)
- **Multi-language Support**: Content available in English and Tamil

### Interactive Learning
- **Gesture Recognition**: Real-time ISL gesture recognition using webcam
- **Video Demonstrations**: Watch proper sign language techniques in action
- **Progress Tracking**: Save your quiz scores and track your learning progress
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Technology Features
- **Supabase Integration**: Cloud storage for images and video content
- **PWA Support**: Installable as a progressive web app
- **Offline Capability**: Some features available offline
- **Media Preloading**: Optimized loading for smooth user experience

## Technologies Used

- **Frontend**: React, TypeScript
- **Styling**: Tailwind CSS
- **Database/Storage**: Supabase
- **Machine Learning**: TensorFlow.js, MediaPipe Hands
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Audio Processing**: Lamejs

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
```

2. Navigate to the project directory:
```bash
cd insync
```

3. Install dependencies:
```bash
npm install
```

4. Create a `.env` file based on `.env.example` and configure your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Start the development server:
```bash
npm run dev
```

## Supabase Setup

To use this application, you'll need to set up a Supabase project:

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project and note down the Project URL and anon key
3. Create a storage bucket named `isl-assets`
4. Configure bucket policies to allow public read access
5. Upload your alphabet images (A.png, B.png, ..., Z.png) to the `alphabets/` folder
6. Upload your GIFs to the `gifs/` folder

For detailed instructions, refer to the [Supabase Setup Guide](./Supabase_Setup_Guide.md).

## Usage

1. **Home Page**: Start with the main navigation to access different learning modules
2. **Sign Language Section**: 
   - Learn alphabets by viewing images of hand gestures
   - Practice common words with video demonstrations
   - Take quizzes to test your knowledge
3. **Gesture Recognition**: Use the Student ↔ Teacher sections to practice real-time gesture recognition
4. **Quiz Mode**: 
   - Select from Easy, Normal, or Hard levels
   - Answer questions based on ISL gesture videos
   - Track your progress and scores

## Project Structure

```
src/
├── components/
│   ├── Header.tsx          # Application header
│   ├── HomePage.tsx        # Main landing page
│   ├── Quiz.tsx            # Quiz functionality
│   ├── SignLanguagePage.tsx # Main learning interface
│   ├── StudentToTeacher.tsx # Gesture recognition (student to teacher)
│   └── TeacherToStudent.tsx # Gesture recognition (teacher to student)
├── hooks/
│   └── useGestureRecognition.ts # Custom hook for gesture recognition
├── types/
│   └── speech.d.ts         # Type definitions for speech recognition
├── utils/
│   ├── imagePreloader.ts   # Media preloading utilities
│   ├── imageStorage.ts     # Supabase storage utilities
│   └── supabaseClient.ts   # Supabase client configuration
├── App.tsx                 # Main application component
├── index.css               # Global styles
└── main.tsx                # Application entry point
```

## Gesture Recognition

The application includes advanced ISL recognition functionality that allows users to perform sign language gestures in front of their webcam and have them converted to text and speech. For more details, refer to the [ISL Recognition Guide](./ISL_RECOGNITION_GUIDE.md).

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Special thanks to the ISL community for their contributions to making communication more accessible
- MediaPipe and TensorFlow.js for providing the tools for gesture recognition
- The open-source community for various libraries and resources used in this project