import { useState, useEffect } from 'react';
import { Lock, RotateCcw, ArrowRight } from 'lucide-react';
import { getImageUrl } from '../utils/imageStorage';
import { preloadMedia } from '../utils/imagePreloader';

interface QuizQuestion {
  id: number;
  question: string;
  questionTamil: string;
  image?: string;
  options: string[];
  optionsTamil: string[];
  correctAnswer: number;
  explanation?: string;
  explanationTamil?: string;
}

interface ShuffledQuestion {
  question: QuizQuestion;
  shuffledOptions: string[];
  shuffledOptionsTamil: string[];
  correctAnswerIndex: number;
}

interface QuizLevel {
  id: string;
  name: string;
  nameTamil: string;
  description: string;
  descriptionTamil: string;
  passMark: number;
  questions: QuizQuestion[];
  unlocked: boolean;
  completed: boolean;
  bestScore: number;
}

const QuizPage = () => {
  const [currentLevel, setCurrentLevel] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [levels, setLevels] = useState<QuizLevel[]>([]);
  const [shuffledQuestions, setShuffledQuestions] = useState<ShuffledQuestion[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const shuffleQuestion = (question: QuizQuestion): ShuffledQuestion => {
    const indices = Array.from({ length: question.options.length }, (_, i) => i);
    const shuffledIndices = shuffleArray(indices);
    
    const shuffledOptions = shuffledIndices.map(i => question.options[i]);
    const shuffledOptionsTamil = shuffledIndices.map(i => question.optionsTamil[i]);
    const correctAnswerIndex = shuffledIndices.indexOf(question.correctAnswer);
    
    return {
      question,
      shuffledOptions,
      shuffledOptionsTamil,
      correctAnswerIndex
    };
  };

  const getQuizData = (): QuizLevel[] => [
    {
      id: 'easy',
      name: 'Easy',
      nameTamil: 'எளிதான',
      description: 'Basic ISL gestures and common words',
      descriptionTamil: 'அடிப்படை ISL சைகைகள் மற்றும் பொதுவான வார்த்தைகள்',
      passMark: 70,
      unlocked: true,
      completed: false,
      bestScore: 0,
      questions: [
        {
          id: 1,
          question: 'What does this ISL gesture represent?',
          questionTamil: 'இந்த ISL சைகை எதைக் குறிக்கிறது?',
          image: imageUrls['Tree.mp4'] || '/gifs/Tree.mp4',
          options: ['Tree', 'Flower', 'House', 'Car'],
          optionsTamil: ['மரம்', 'மலர்', 'வீடு', 'கார்'],
          correctAnswer: 0,
          explanation: 'This gesture represents a tree with branches.',
          explanationTamil: 'இந்த சைகை கிளைகளுடன் ஒரு மரத்தைக் குறிக்கிறது.'
        },
        {
          id: 2,
          question: 'What does this ISL gesture represent?',
          questionTamil: 'இந்த ISL சைகை எதைக் குறிக்கிறது?',
          image: imageUrls['Happy.mp4'] || '/gifs/Happy.mp4',
          options: ['Sad', 'Happy', 'Angry', 'Tired'],
          optionsTamil: ['வருத்தம்', 'மகிழ்ச்சி', 'கோபம்', 'சோர்வு'],
          correctAnswer: 1,
          explanation: 'The gesture with a smile represents happiness.',
          explanationTamil: 'புன்னகையுடன் கூடிய சைகை மகிழ்ச்சியைக் குறிக்கிறது.'
        },
        {
          id: 3,
          question: 'What does this ISL gesture represent?',
          questionTamil: 'இந்த ISL சைகை எதைக் குறிக்கிறது?',
          image: imageUrls['House.mp4'] || '/gifs/House.mp4',
          options: ['Building', 'House', 'Apartment', 'Office'],
          optionsTamil: ['கட்டிடம்', 'வீடு', 'அபார்ட்மெண்டு', 'அலுவலகம்'],
          correctAnswer: 1,
          explanation: 'The house gesture shows the shape of a roof.',
          explanationTamil: 'வீட்டு சைகை கூரையின் வடிவத்தைக் காட்டுகிறது.'
        },
        {
          id: 4,
          question: 'What does this ISL gesture represent?',
          questionTamil: 'இந்த ISL சைகை எதைக் குறிக்கிறது?',
          image: imageUrls['Car.mp4'] || '/gifs/Car.mp4',
          options: ['Bike', 'Car', 'Bus', 'Train'],
          optionsTamil: ['மிதிவண்டி', 'கார்', 'பஸ்', 'ரயில்'],
          correctAnswer: 1,
          explanation: 'The car gesture mimics steering a wheel.',
          explanationTamil: 'காரின் சைகை சக்கரத்தை சுழற்றுவதைப் போல உள்ளது.'
        },
        {
          id: 5,
          question: 'What does this ISL gesture represent?',
          questionTamil: 'இந்த ISL சைகை எதைக் குறிக்கிறது?',
          image: imageUrls['Beautiful.mp4'] || '/gifs/Beautiful.mp4',
          options: ['Ugly', 'Beautiful', 'Big', 'Small'],
          optionsTamil: ['அசிங்கமான', 'அழகான', 'பெரிய', 'சிறிய'],
          correctAnswer: 1,
          explanation: 'The beautiful gesture shows appreciation with graceful movement.',
          explanationTamil: 'அழகான சைகை நேர்த்தியான இயக்கத்துடன் பாராட்டைக் காட்டுகிறது.'
        }
      ]
    },
    {
      id: 'normal',
      name: 'Normal',
      nameTamil: 'இயல்பான',
      description: 'Intermediate ISL gestures and phrases',
      descriptionTamil: 'இடைநிலை ISL சைகைகள் மற்றும் சொற்றொடர்கள்',
      passMark: 70,
      unlocked: false,
      completed: false,
      bestScore: 0,
      questions: [
        {
          id: 1,
          question: 'What does this ISL gesture represent?',
          questionTamil: 'இந்த ISL சைகை எதைக் குறிக்கிறது?',
          image: imageUrls['Camera.mp4'] || '/gifs/Camera.mp4',
          options: ['Phone', 'Camera', 'Computer', 'Television'],
          optionsTamil: ['தொலைபேசி', 'கேமரா', 'கணினி', 'தொலைக்காட்சி'],
          correctAnswer: 1,
          explanation: 'The camera gesture mimics taking a photo.',
          explanationTamil: 'கேமரா சைகை புகைப்படம் எடுப்பதைப் போல உள்ளது.'
        },
        {
          id: 2,
          question: 'What does this ISL gesture represent?',
          questionTamil: 'இந்த ISL சைகை எதைக் குறிக்கிறது?',
          image: imageUrls['Work.mp4'] || '/gifs/Work.mp4',
          options: ['Play', 'Work', 'Sleep', 'Eat'],
          optionsTamil: ['விளையாடு', 'வேலை', 'தூங்கு', 'சாப்பிடு'],
          correctAnswer: 1,
          explanation: 'The work gesture shows hands moving in work motion.',
          explanationTamil: 'வேலை சைகை கைகள் வேலை செய்யும் இயக்கத்தில் நகர்வதைக் காட்டுகிறது.'
        },
        {
          id: 3,
          question: 'What does this ISL gesture represent?',
          questionTamil: 'இந்த ISL சைகை எதைக் குறிக்கிறது?',
          image: imageUrls['Clever.mp4'] || '/gifs/Clever.mp4',
          options: ['Stupid', 'Clever', 'Lazy', 'Active'],
          optionsTamil: ['முட்டாள்', 'புத்திசாலி', 'சோம்பேறி', 'சுறுசுறுப்பான'],
          correctAnswer: 1,
          explanation: 'The clever gesture points to the head indicating intelligence.',
          explanationTamil: 'புத்திசாலி சைகை தலையைச் சுட்டி அறிவைக் குறிக்கிறது.'
        },
        {
          id: 4,
          question: 'What does this ISL gesture represent?',
          questionTamil: 'இந்த ISL சைகை எதைக் குறிக்கிறது?',
          image: imageUrls['Paper.mp4'] || '/gifs/Paper.mp4',
          options: ['Book', 'Paper', 'Pen', 'Pencil'],
          optionsTamil: ['புத்தகம்', 'காகிதம்', 'பேனா', 'பென்சில்'],
          correctAnswer: 1,
          explanation: 'The paper gesture shows flat surface with writing motion.',
          explanationTamil: 'காகித சைகை எழுதும் இயக்கத்துடன் தட்டையான மேற்பரப்பைக் காட்டுகிறது.'
        },
        {
          id: 5,
          question: 'What does this ISL gesture represent?',
          questionTamil: 'இந்த ISL சைகை எதைக் குறிக்கிறது?',
          image: imageUrls['Sweet.mp4'] || '/gifs/Sweet.mp4',
          options: ['Sour', 'Sweet', 'Bitter', 'Spicy'],
          optionsTamil: ['புளிப்பான', 'இனிய', 'கசப்பான', 'காரமான'],
          correctAnswer: 1,
          explanation: 'The sweet gesture shows tasting something delicious.',
          explanationTamil: 'இனிய சைகை சுவையான ஒன்றை சுவைப்பதைக் காட்டுகிறது.'
        }
      ]
    },
    {
      id: 'hard',
      name: 'Hard',
      nameTamil: 'கடினமான',
      description: 'Advanced ISL gestures and complex expressions',
      descriptionTamil: 'மேம்பட்ட ISL சைகைகள் மற்றும் சிக்கலான வெளிப்பாடுகள்',
      passMark: 80,
      unlocked: false,
      completed: false,
      bestScore: 0,
      questions: [
        {
          id: 1,
          question: 'What does this ISL gesture represent?',
          questionTamil: 'இந்த ISL சைகை எதைக் குறிக்கிறது?',
          image: imageUrls['Generous.mp4'] || '/gifs/Generous.mp4',
          options: ['Selfish', 'Generous', 'Greedy', 'Stingy'],
          optionsTamil: ['சுயநலம்', 'அதிகமான', 'பேராசை', 'கஞ்சத்தனம்'],
          correctAnswer: 1,
          explanation: 'The generous gesture shows giving with open hands.',
          explanationTamil: 'அதிகமான சைகை திறந்த கைகளுடன் கொடுப்பதைக் காட்டுகிறது.'
        },
        {
          id: 2,
          question: 'What does this ISL gesture represent?',
          questionTamil: 'இந்த ISL சைகை எதைக் குறிக்கிறது?',
          image: imageUrls['Greedy.mp4'] || '/gifs/Greedy.mp4',
          options: ['Generous', 'Greedy', 'Kind', 'Helpful'],
          optionsTamil: ['அதிகமான', 'பேராசை', 'கருணை', 'உதவியான'],
          correctAnswer: 1,
          explanation: 'The greedy gesture shows grabbing or hoarding.',
          explanationTamil: 'பேராசை சைகை பிடித்தல் அல்லது சேமித்து வைத்தலைக் காட்டுகிறது.'
        },
        {
          id: 3,
          question: 'What does this ISL gesture represent?',
          questionTamil: 'இந்த ISL சைகை எதைக் குறிக்கிறது?',
          image: imageUrls['Bright.mp4'] || '/gifs/Bright.mp4',
          options: ['Dark', 'Bright', 'Dim', 'Foggy'],
          optionsTamil: ['இருண்ட', 'பிரகாசமான', 'மங்கலான', 'மூடுபனி'],
          correctAnswer: 1,
          explanation: 'The bright gesture shows light radiating outward.',
          explanationTamil: 'பிரகாசமான சைகை வெளிப்புறமாக ஒளி பரவுவதைக் காட்டுகிறது.'
        },
        {
          id: 4,
          question: 'What does this ISL gesture represent?',
          questionTamil: 'இந்த ISL சைகை எதைக் குறிக்கிறது?',
          image: imageUrls['Dark.mp4'] || '/gifs/Dark.mp4',
          options: ['Light', 'Dark', 'Bright', 'Clear'],
          optionsTamil: ['ஒளி', 'இருண்ட', 'பிரகாசமான', 'தெளிவான'],
          correctAnswer: 1,
          explanation: 'The dark gesture shows covering or hiding light.',
          explanationTamil: 'இருண்ட சைகை ஒளியை மறைப்பது அல்லது மூடுவதைக் காட்டுகிறது.'
        },
        {
          id: 5,
          question: 'What does this ISL gesture represent?',
          questionTamil: 'இந்த ISL சைகை எதைக் குறிக்கிறது?',
          image: imageUrls['Short.mp4'] || '/gifs/Short.mp4',
          options: ['Tall', 'Short', 'Long', 'Wide'],
          optionsTamil: ['உயரமான', 'குறுகிய', 'நீளமான', 'அகலமான'],
          correctAnswer: 1,
          explanation: 'The short gesture shows measuring a small distance.',
          explanationTamil: 'குறுகிய சைகை சிறிய தூரத்தை அளவிடுவதைக் காட்டுகிறது.'
        }
      ]
    }
  ];

  useEffect(() => {
    const fetchImageUrls = async () => {
      setIsLoading(true);
      
      try {
        // Extract all unique image paths from quiz data
        const allImages = new Set<string>();
        
        getQuizData().forEach(level => {
          level.questions.forEach(question => {
            if (question.image) {
              // Extract filename from path like '/gifs/Tree.mp4' -> 'Tree.mp4'
              const fileName = question.image.split('/').pop();
              if (fileName) {
                allImages.add(fileName);
              }
            }
          });
        });
        
        // Fetch URLs for all images
        const newImageUrls: Record<string, string> = {};
        
        for (const fileName of allImages) {
          const { url, error } = await getImageUrl(`gifs/${fileName}`);
          if (url && !error) {
            newImageUrls[fileName] = url;
          }
        }
        
        setImageUrls(newImageUrls);
      } catch (error) {
        console.error('Error fetching image URLs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchImageUrls();
  }, []);

  // Preload images when they are available
  useEffect(() => {
    if (Object.keys(imageUrls).length > 0) {
      // Preload all GIFs
      const videoUrls = Object.values(imageUrls).filter(url => url !== undefined) as string[];
      preloadMedia([], videoUrls);
    }
  }, [imageUrls]);

  useEffect(() => {
    const savedProgress = localStorage.getItem('insync-quiz-progress');
    if (savedProgress) {
      const progress = JSON.parse(savedProgress);
      setLevels(progress);
    } else {
      setLevels(getQuizData());
    }
  }, []);

  const saveProgress = (updatedLevels: QuizLevel[]) => {
    localStorage.setItem('insync-quiz-progress', JSON.stringify(updatedLevels));
    setLevels(updatedLevels);
  };

  const startQuiz = (levelId: string) => {
    const level = levels.find(l => l.id === levelId);
    if (!level) return;

    // Shuffle all questions for this level
    const shuffled = level.questions.map(question => shuffleQuestion(question));
    setShuffledQuestions(shuffled);
    
    setCurrentLevel(levelId);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowResult(false);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null) return;

    const shuffledQuestion = shuffledQuestions[currentQuestion];
    if (!shuffledQuestion) return;

    const isCorrect = selectedAnswer === shuffledQuestion.correctAnswerIndex;

    if (isCorrect) {
      setScore(score + 1);
    }

    if (currentQuestion < shuffledQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      const level = levels.find(l => l.id === currentLevel);
      if (!level) return;

      const percentage = ((score + (isCorrect ? 1 : 0)) / shuffledQuestions.length) * 100;
      const passed = percentage >= level.passMark;

      const updatedLevels = levels.map(l => {
        if (l.id === currentLevel) {
          const newBestScore = Math.max(l.bestScore, score + (isCorrect ? 1 : 0));
          return {
            ...l,
            completed: passed,
            bestScore: newBestScore
          };
        }
        return l;
      });

      if (passed) {
        const currentLevelIndex = updatedLevels.findIndex(l => l.id === currentLevel);
        if (currentLevelIndex < updatedLevels.length - 1) {
          updatedLevels[currentLevelIndex + 1].unlocked = true;
        }
      }

      saveProgress(updatedLevels);
      setShowResult(true);
      setShowCelebration(passed);
    }
  };

  const retryQuiz = () => {
    if (!currentLevel) return;
    
    const level = levels.find(l => l.id === currentLevel);
    if (!level) return;

    const shuffled = level.questions.map(question => shuffleQuestion(question));
    setShuffledQuestions(shuffled);
    
    setShowResult(false);
    setShowCelebration(false);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
  };

  const backToLevels = () => {
    setCurrentLevel(null);
    setShowResult(false);
    setShowCelebration(false);
  };

  const resetProgress = () => {
    localStorage.removeItem('insync-quiz-progress');
    setLevels(getQuizData());
    setCurrentLevel(null);
    setShowResult(false);
    setShowCelebration(false);
  };

  if (currentLevel && !showResult) {
    const level = levels.find(l => l.id === currentLevel);
    if (!level) return null;

    const shuffledQuestion = shuffledQuestions[currentQuestion];
    if (!shuffledQuestion) return null;

    const question = shuffledQuestion.question;
    const progress = ((currentQuestion + 1) / shuffledQuestions.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <img src="/InSync-removebg-preview.png" alt="InSync" className="h-12 w-auto" />
              <h1 className="text-2xl font-bold text-emerald-800">Quiz Mode</h1>
            </div>
            <button
              onClick={backToLevels}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Back to Levels
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-semibold text-emerald-800">
                {level.name} Level - Question {currentQuestion + 1} of {shuffledQuestions.length}
              </span>
              <span className="text-lg font-bold text-emerald-600">Score: {score}/{currentQuestion}</span>
            </div>
            <div className="w-full bg-emerald-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-emerald-800 mb-2">{question.question}</h2>
              <p className="text-lg text-emerald-600">{question.questionTamil}</p>
            </div>

            {question.image && (
              <div className="flex justify-center mb-8">
                <div className="w-64 h-64 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl overflow-hidden">
                  <video
                    src={question.image}
                    className="w-full h-full object-cover"
                    loop
                    muted
                    autoPlay
                    playsInline
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {shuffledQuestion.shuffledOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`p-4 rounded-xl text-left transition-all duration-200 ${
                    selectedAnswer === index
                      ? 'bg-emerald-500 text-white shadow-lg scale-105'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:scale-102'
                  }`}
                >
                  <div className="font-semibold text-lg">{option}</div>
                  <div className="text-sm opacity-80">{shuffledQuestion.shuffledOptionsTamil[index]}</div>
                </button>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={handleNextQuestion}
                disabled={selectedAnswer === null}
                className={`px-8 py-3 rounded-xl font-semibold text-lg transition-all duration-200 ${
                  selectedAnswer !== null
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-lg hover:shadow-xl'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {currentQuestion < shuffledQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showResult && currentLevel) {
    const level = levels.find(l => l.id === currentLevel);
    if (!level) return null;

    const percentage = (score / level.questions.length) * 100;
    const passed = percentage >= level.passMark;

    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <img src="/InSync-removebg-preview.png" alt="InSync" className="h-12 w-auto" />
              <h1 className="text-2xl font-bold text-emerald-800">Quiz Results</h1>
            </div>
            <button
              onClick={backToLevels}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Back to Levels
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mb-8">
              {passed ? (
                <div className="text-6xl mb-4">🎉</div>
              ) : (
                <div className="text-6xl mb-4">😔</div>
              )}
              <h2 className="text-3xl font-bold text-emerald-800 mb-2">
                {passed ? 'Congratulations!' : 'Keep Trying!'}
              </h2>
              <p className="text-xl text-emerald-600 mb-4">
                {passed ? 'Level Completed Successfully!' : 'You can do better next time!'}
              </p>
            </div>

            <div className="bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl p-6 mb-8">
              <div className="text-4xl font-bold text-emerald-800 mb-2">
                {score}/{level.questions.length}
              </div>
              <div className="text-2xl font-semibold text-emerald-600 mb-2">
                {percentage.toFixed(1)}%
              </div>
              <div className="text-lg text-emerald-700">
                {passed ? 'Level Passed!' : `Need ${level.passMark}% to pass`}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={retryQuiz}
                className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
              >
                <RotateCcw size={20} />
                <span>Retry Quiz</span>
              </button>
              <button
                onClick={backToLevels}
                className="flex items-center space-x-2 px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors"
              >
                <ArrowRight size={20} />
                <span>Back to Levels</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showCelebration) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center z-50">
        <div className="text-center text-white">
          <div className="text-8xl mb-8 animate-bounce">🎉</div>
          <h1 className="text-5xl font-bold mb-4">Congratulations!</h1>
          <p className="text-2xl mb-8">Level Unlocked Successfully!</p>
          <button
            onClick={() => setShowCelebration(false)}
            className="px-8 py-4 bg-white text-purple-600 rounded-xl font-bold text-xl hover:bg-gray-100 transition-colors shadow-2xl"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <img src="/InSync-removebg-preview.png" alt="InSync" className="h-16 w-auto" />
            <h1 className="text-4xl font-bold text-emerald-800">Quiz Mode</h1>
          </div>
          <p className="text-xl text-emerald-600 mb-4">Test your ISL knowledge and unlock new levels!</p>
          <p className="text-lg text-emerald-500">உங்கள் ISL அறிவை சோதித்து புதிய நிலைகளைத் திறக்கவும்!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {levels.map((level) => (
            <div
              key={level.id}
              className={`relative rounded-2xl p-8 transition-all duration-300 ${
                level.unlocked
                  ? 'bg-white shadow-xl hover:shadow-2xl hover:scale-105 cursor-pointer'
                  : 'bg-gray-200 shadow-lg cursor-not-allowed'
              }`}
              onClick={() => level.unlocked && startQuiz(level.id)}
            >
              {!level.unlocked && (
                <div className="absolute top-4 right-4">
                  <Lock className="h-6 w-6 text-gray-500" />
                </div>
              )}

              <div className="text-center">
                <div className="text-6xl mb-4">
                  {level.completed ? '🏆' : level.unlocked ? '⭐' : '🔒'}
                </div>
                <h3 className="text-2xl font-bold text-emerald-800 mb-2">{level.name}</h3>
                <p className="text-lg text-emerald-600 mb-2">{level.nameTamil}</p>
                <p className="text-emerald-600 mb-4">{level.description}</p>
                <p className="text-emerald-500 text-sm mb-4">{level.descriptionTamil}</p>
                
                {level.completed && (
                  <div className="bg-emerald-100 rounded-lg p-3 mb-4">
                    <div className="text-emerald-800 font-semibold">Best Score: {level.bestScore}/{level.questions.length}</div>
                  </div>
                )}

                <div className="text-sm text-emerald-500">
                  Pass Mark: {level.passMark}%
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Reset Progress Button */}
        <div className="text-center">
          <button
            onClick={resetProgress}
            className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
          >
            Reset All Progress
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
