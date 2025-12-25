 

const Header = () => {
  return (
    <header className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-emerald-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img
              src="/InSync-removebg-preview.png"
              alt="InSync Logo"
              className="w-16 h-16 object-contain"
            />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                InSync
              </h1>
              <p className="text-sm text-emerald-600 font-medium">
                 Bridging Silence with Smart Communication
              </p>
            </div>
          </div>

          {/* Placeholder for potential future use */}
        </div>
      </div>
    </header>
  );
};

export default Header;