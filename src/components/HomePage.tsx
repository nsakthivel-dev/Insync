import React from 'react';
import { Hand, Video, Mic } from 'lucide-react';

interface HomePageProps {
  onCategorySelect: (category: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onCategorySelect }) => {
  const categories = [
    {
      id: 'sign-language',
      title: 'Sign Language',
      description: 'Learn Indian Sign Language alphabets, words, and conversations',
      icon: Hand,
      gradient: 'from-emerald-500 to-teal-500',
      bgGradient: 'from-emerald-50 to-teal-50',
      textColor: 'text-emerald-800',
      iconBg: 'bg-emerald-100',
      hoverScale: 'hover:scale-105',
      shadow: 'shadow-emerald-500/25'
    },
    {
      id: 'student-teacher',
      title: 'Student → Teacher',
      description: 'Convert your signs to text and speech for teacher communication',
      icon: Video,
      gradient: 'from-blue-500 to-indigo-500',
      bgGradient: 'from-blue-50 to-indigo-50',
      textColor: 'text-blue-800',
      iconBg: 'bg-blue-100',
      hoverScale: 'hover:scale-105',
      shadow: 'shadow-blue-500/25'
    },
    {
      id: 'teacher-student',
      title: 'Teacher → Student',
      description: 'Convert your speech to text for student communication',
      icon: Mic,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50',
      textColor: 'text-purple-800',
      iconBg: 'bg-purple-100',
      hoverScale: 'hover:scale-105',
      shadow: 'shadow-purple-500/25'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4">
            Welcome to InSync
          </h1>
          <p className="text-xl text-emerald-600 font-medium mb-2">
            Indian Sign Language Learning Platform
          </p>
          <p className="text-lg text-gray-600">
            Choose a category to get started with your learning journey
          </p>
        </div>

        <div className="flex justify-center mb-10">
          <button 
            onClick={() => onCategorySelect("sign-language")} 
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-500 text-white font-bold py-4 px-8 rounded-full text-lg shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
          >
            Enter
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => onCategorySelect(category.id)}
                className={`group relative bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-100 transition-all duration-300 ${category.hoverScale} hover:shadow-2xl`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${category.bgGradient} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                
                <div className="relative z-10">
                  <div className={`w-24 h-24 ${category.iconBg} rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={40} className={`text-${category.textColor.split('-')[1]}-600`} />
                  </div>

                  <h3 className={`text-2xl font-bold ${category.textColor} mb-4 group-hover:scale-105 transition-transform duration-300`}>
                    {category.title}
                  </h3>

                  <p className="text-gray-600 text-lg leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                    {category.description}
                  </p>

                  <div className="mt-6 flex justify-center">
                    <div className={`w-12 h-12 bg-gradient-to-r ${category.gradient} rounded-full flex items-center justify-center transform group-hover:translate-x-2 transition-transform duration-300 ${category.shadow} shadow-lg`}>
                      <svg 
                        className="w-6 h-6 text-white" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${category.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
              </button>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-500 text-sm">
            Click on any category above to start your learning experience
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
