import { useState } from 'react';
import { Hand, Mic, Video } from 'lucide-react';
import SignLanguagePage from './components/SignLanguagePage';
import StudentToTeacher from './components/StudentToTeacher';
import TeacherToStudent from './components/TeacherToStudent';
import Header from './components/Header';
import HomePage from './components/HomePage';

function App() {
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const tabs = [
    { id: 'sign-language', label: 'Sign Language', icon: Hand },
    { id: 'student-teacher', label: 'Student → Teacher', icon: Video },
    { id: 'teacher-student', label: 'Teacher → Student', icon: Mic },
  ];

  const handleCategorySelect = (category: string) => {
    setActiveTab(category);
  };

  const handleBackToHome = () => {
    setActiveTab(null);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'sign-language':
        return <SignLanguagePage />;
      case 'student-teacher':
        return <StudentToTeacher />;
      case 'teacher-student':
        return <TeacherToStudent />;
      default:
        return <HomePage onCategorySelect={handleCategorySelect} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50">
      <Header />
      
      {activeTab && (
        <nav className="bg-white/80 backdrop-blur-sm border-b border-emerald-100 sticky top-0 z-40 no-scrollbar overflow-x-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-2">
              <button
                onClick={handleBackToHome}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 text-emerald-700 hover:bg-emerald-50 hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Home</span>
              </button>

              <div className="flex space-x-1 overflow-x-auto no-scrollbar">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 transform scale-105'
                          : 'text-emerald-700 hover:bg-emerald-50 hover:scale-105'
                      }`}
                    >
                      <Icon size={20} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>
      )}

      <main className={activeTab ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" : ""}>
        {renderActiveTab()}
      </main>
    </div>
  );
}

export default App;