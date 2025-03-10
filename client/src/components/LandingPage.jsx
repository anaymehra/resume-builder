import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Component() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row items-center justify-center p-8">
      {/* Left side with resume preview */}
      <div className="md:w-1/2 mb-8 md:mb-0">
        <div className="relative">
          <div className="bg-pink-200 absolute -top-8 -left-8 w-64 h-64 rounded-full z-0"></div>
          <div className="bg-orange-200 absolute -bottom-8 -right-8 w-64 h-64 rounded-full z-0"></div>
          <img
            src="./resume.jpeg"
            alt="Resume Preview"
            className="w-full max-w-lg mx-auto relative z-10"
          />
        </div>
      </div>

      {/* Right side with content */}
      <div className="md:w-1/2 md:pl-12">
        <h1 className="text-5xl font-bold mb-4">The Best Online Resume Builder</h1>
        <p className="text-xl mb-8">
          Easily create the perfect resume for any job using our best-in-class resume builder platform.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          {isLoggedIn ? (
            <>
              <button 
                onClick={() => navigate('/home')} 
                className="bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Create Resume
              </button>
              <button 
                onClick={handleLogout} 
                className="bg-white text-pink-500 font-bold py-3 px-8 rounded-full shadow-lg border border-pink-500 hover:bg-pink-50 transition-all duration-300"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => navigate('/auth', { state: { isSignup: true } })} 
                className="bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Sign Up
              </button>
              <button 
                onClick={() => navigate('/auth', { state: { isSignup: false } })} 
                className="bg-white text-pink-500 font-bold py-3 px-8 rounded-full shadow-lg border border-pink-500 hover:bg-pink-50 transition-all duration-300"
              >
                Log in
              </button>
            </>
          )}
        </div>

        {/* Statistics */}
        <div className="flex gap-12 mb-12">
          <div>
            <p className="text-3xl font-bold text-purple-600 flex items-center">
              <span className="mr-2">&#8599;</span>
              38%
            </p>
            <p className="text-gray-600">more interviews</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-purple-600 flex items-center">
              <span className="mr-2">&#8599;</span>
              23%
            </p>
            <p className="text-gray-600">more likely to get a job offer</p>
          </div>
        </div>
      </div>
    </div>
  );
}