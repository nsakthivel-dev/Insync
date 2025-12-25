import { useState, useEffect, useRef } from 'react';
import { Book, Award, Users } from 'lucide-react';
import QuizPage from './Quiz';
import { getImageUrls } from '../utils/imageStorage';
import { preloadMedia } from '../utils/imagePreloader';

const SignLanguagePage = () => {
  const [activeSection, setActiveSection] = useState('alphabets');
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [letterToImageUrl, setLetterToImageUrl] = useState<Record<string, string>>({});
  const [gifMap, setGifMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const videoRefs = useRef<{[key: string]: HTMLVideoElement | null}>({});

  useEffect(() => {
    const fetchImagesFromSupabase = async () => {
      setIsLoading(true);
      
      try {
        // Fetch alphabet images (A.png, B.png, ..., Z.png)
        const alphabetFileNames = Array.from({ length: 26 }, (_, i) => 
          `alphabets/${String.fromCharCode(65 + i)}.png`
        );
        
        // Fetch common word GIFs
        const commonWordNames = [
          'Tree', 'Flower', 'House', 'Apartment', 'Car', 'Chair', 'Table', 'Happy',
          'Beautiful', 'Fat', 'Tail', 'Short', 'Generous', 'Greedy', 'Clever',
          'Sweet', 'Bright', 'Dark', 'Paper', 'Camera', 'Photo', 'Work'
        ];
        
        const gifFileNames = commonWordNames.map(name => `gifs/${name}.mp4`);
        
        // Get all image URLs in parallel
        const [alphabetResults, gifResults] = await Promise.all([
          getImageUrls(alphabetFileNames),
          getImageUrls(gifFileNames)
        ]);
        
        // Build the letter to image URL map
        const newLetterToImageUrl: Record<string, string> = {};
        alphabetResults.forEach(result => {
          if (result.url) {
            const fileName = result.fileName.split('/').pop(); // Extract filename
            if (fileName) {
              const letter = fileName.replace('.png', '').toUpperCase();
              newLetterToImageUrl[letter] = result.url;
            }
          }
        });
        
        // Build the GIF map
        const newGifMap: Record<string, string> = {};
        gifResults.forEach(result => {
          if (result.url) {
            const fileName = result.fileName.split('/').pop(); // Extract filename
            if (fileName) {
              const word = fileName.replace('.mp4', '');
              newGifMap[word] = result.url;
            }
          }
        });
        
        setLetterToImageUrl(newLetterToImageUrl);
        setGifMap(newGifMap);
      } catch (error) {
        console.error('Error fetching images from Supabase:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchImagesFromSupabase();
  }, []);

  // Preload images when they are available
  useEffect(() => {
    if (Object.keys(letterToImageUrl).length > 0 || Object.keys(gifMap).length > 0) {
      // Collect all image and video URLs
      const imageUrls = Object.values(letterToImageUrl).filter(url => url !== undefined) as string[];
      const videoUrls = Object.values(gifMap).filter(url => url !== undefined) as string[];
      
      // Preload all media
      preloadMedia(imageUrls, videoUrls);
    }
  }, [letterToImageUrl, gifMap]);

  // ISL Alphabet data using Supabase images (fallback to placeholder if missing)
  const alphabets = Array.from({ length: 26 }, (_, i) => {
    const letter = String.fromCharCode(65 + i);
    const image = letterToImageUrl[letter] || `https://images.pexels.com/photos/8553899/pexels-photo-8553899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop`;
    return {
      letter,
      lowercase: String.fromCharCode(97 + i),
      image,
      description: `${letter}`
    };
  });

  // Common ISL words with GIFs from Supabase
  const commonWords = [
    { word: 'Tree', hindi: 'மரம்', image: gifMap['Tree'] || '', emoji: '🌳' },
    { word: 'Flower', hindi: 'மலர்', image: gifMap['Flower'] || '', emoji: '🌺' },
    { word: 'House', hindi: 'வீடு', image: gifMap['House'] || '', emoji: '🏠' },
    { word: 'Apartment', hindi: 'அபார்ட்மெண்டு', image: gifMap['Apartment'] || '', emoji: '🏢' },
    { word: 'Car', hindi: 'கார்', image: gifMap['Car'] || '', emoji: '🚙' },
    { word: 'Chair', hindi: 'நாற்காலி', image: gifMap['Chair'] || '', emoji: '🪑' },
    { word: 'Table', hindi: 'பட்டாங்காலி', image: gifMap['Table'] || '', emoji: '🛋' },
    { word: 'Happy', hindi: 'மகிழ்ச்சி', image: gifMap['Happy'] || '', emoji: '😊' },
    { word: 'Beautiful', hindi: 'அழகான', image: gifMap['Beautiful'] || '', emoji: '🥰' },
    { word: 'Fat', hindi: 'பெருத்த', image: gifMap['Fat'] || '', emoji: '🫃' },
    { word: 'Tail', hindi: 'வால்', image: gifMap['Tail'] || '', emoji: '🐒' },
    { word: 'Short', hindi: 'குறுகிய', image: gifMap['Short'] || '', emoji: '🤏' },
    { word: 'Generous', hindi: 'அதிகமான', image: gifMap['Generous'] || '', emoji: '🤲' },
    { word: 'Greedy', hindi: 'பேராசை கொண்ட', image: gifMap['Greedy'] || '', emoji: '🤑' },
    { word: 'Clever', hindi: 'புத்திசாலி', image: gifMap['Clever'] || '', emoji: '👨\u200d🎓' },
    { word: 'Sweet', hindi: 'இனிய', image: gifMap['Sweet'] || '', emoji: '🍬' },
    { word: 'Bright', hindi: 'பிரகாசமான', image: gifMap['Bright'] || '', emoji: '🔆' },
    { word: 'Dark', hindi: 'இருண்ட', image: gifMap['Dark'] || '', emoji: '🌑' },
    { word: 'Paper', hindi: 'காகிதம்', image: gifMap['Paper'] || '', emoji: '📄' },
    { word: 'Camera', hindi: 'பகைப்படக்கருவி', image: gifMap['Camera'] || '', emoji: '📸' },
    { word: 'Photo', hindi: 'புகைப்படம்', image: gifMap['Photo'] || '', emoji: '🖼' },
    { word: 'Work', hindi: 'வேலை', image: gifMap['Work'] || '', emoji: '💼' }
  ];

  // Navigation tabs
  const sections = [
    { id: 'alphabets', label: 'Alphabets', icon: Book },
    { id: 'words', label: 'Common Words', icon: Users },
    { id: 'quiz', label: 'Quiz', icon: Award },
  ];




  return (
    <div className="space-y-8">
      {/* Section Navigation */}
      <div className="flex flex-wrap gap-4 justify-center">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center space-x-3 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 ${
                activeSection === section.id
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-xl shadow-emerald-500/30 scale-105'
                  : 'bg-white/80 text-emerald-700 hover:bg-emerald-50 hover:scale-105 shadow-lg'
              }`}
            >
              <Icon size={22} />
              <span>{section.label}</span>
            </button>
          );
        })}
      </div>

      {/* Alphabets Section */}
      {activeSection === 'alphabets' && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-emerald-800 mb-2">
               Indian Sign Language Alphabets
            </h2>
            <p className="text-emerald-600 text-lg">Learn the complete ISL alphabet from A to Z</p>
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            {alphabets.map((letter) => (
              <div
                key={letter.letter}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border border-emerald-100"
              >
                <div className="aspect-square mb-3 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center overflow-hidden">
                  <img
                    src={letter.image}
                    alt={`${letter.letter}`}
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-emerald-800">{letter.letter}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Common Words Section */}
      {activeSection === 'words' && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-emerald-800 mb-2">
              Common ISL Words
            </h2>
            <p className="text-emerald-600 text-lg">Essential words for daily communication</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {commonWords.map((word, index) => (
              <div
                key={index}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border border-emerald-100"
              >
                <div className="aspect-square mb-4 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl overflow-hidden">
                  <video
                    ref={(el) => videoRefs.current[word.word] = el}
                    src={word.image}
                    className="w-full h-full object-cover cursor-pointer"
                    loop
                    muted
                    playsInline
                    onClick={() => {
                      const video = videoRefs.current[word.word];
                      if (!video) return;
                      
                      // If another video is playing, pause it
                      if (currentlyPlaying && currentlyPlaying !== word.word && videoRefs.current[currentlyPlaying]) {
                        videoRefs.current[currentlyPlaying]?.pause();
                      }
                      
                      // Toggle current video
                      if (video.paused) {
                        video.play();
                        setCurrentlyPlaying(word.word);
                      } else {
                        video.pause();
                        setCurrentlyPlaying(null);
                      }
                    }}
                    onEnded={() => setCurrentlyPlaying(null)}
                  />
                </div>
                <div className="text-center space-y-2">
                  <div className="text-2xl">{word.emoji}</div>
                  <h3 className="text-xl font-bold text-emerald-800">{word.word}</h3>
                  <p className="text-emerald-600 font-medium">{word.hindi}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quiz Section */}
      {activeSection === 'quiz' && (
        <div className="space-y-6">
          <QuizPage />
        </div>
      )}
    </div>
  );
};

export default SignLanguagePage;