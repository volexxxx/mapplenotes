import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FileText, LogIn, User, Sun, Moon, Instagram } from 'lucide-react';
import { signIn } from './firebase';

export const StartScreen = ({ onGuestEnter, theme, setTheme }: any) => {
  const [name, setName] = useState('');

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#F2F1F6] dark:bg-[#050505] transition-colors duration-500">
      <a 
         href="https://instagram.com/habib.akhmadov" 
         target="_blank" 
         rel="noopener noreferrer" 
         className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/40 dark:bg-white/5 backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/10 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white shadow-sm"
      >
         <Instagram className="w-4 h-4" />
      </a>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 400 }}
        className="max-w-md w-full px-8 py-10 flex flex-col items-center"
      >
        <div className="relative mb-10 group">
          <div className="relative w-24 h-24 bg-white/50 dark:bg-white/5 backdrop-blur-[64px] saturate-[1.5] rounded-[32px] ring-1 ring-white/60 dark:ring-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.3)] flex items-center justify-center overflow-hidden transition-all duration-500 group-hover:scale-105 group-hover:-translate-y-1">
             <div className="absolute top-0 left-0 w-full h-6 bg-white/60 dark:bg-white/10 border-b border-white/50 dark:border-white/5"></div>
             <FileText className="w-10 h-10 text-gray-800 dark:text-gray-200 drop-shadow-sm z-10 transition-transform duration-500 group-hover:-translate-y-1 mt-4" strokeWidth={1.5} />
             <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-gradient-to-br from-white/60 to-transparent dark:from-white/5 rotate-45 pointer-events-none blur-xl"></div>
          </div>
        </div>

        <div className="w-full space-y-5 bg-white/60 dark:bg-[#1C1C1E]/60 backdrop-blur-[64px] p-6 rounded-[36px] ring-1 ring-white/60 dark:ring-white/10 shadow-[0_12px_48px_rgba(0,0,0,0.05)] dark:shadow-[0_12px_48px_rgba(0,0,0,0.3)]">
          <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-[24px] w-full">
            <button 
              onClick={() => setTheme('light')}
              className={`flex-1 flex justify-center items-center py-3 rounded-[20px] text-[15px] font-medium transition-all duration-300 ${theme === 'light' ? 'bg-white text-gray-900 shadow-sm dark:bg-[#2C2C2E] dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
            >
              <Sun className="w-4 h-4 mr-2" /> Light
            </button>
            <button 
              onClick={() => setTheme('dark')}
              className={`flex-1 flex justify-center items-center py-3 rounded-[20px] text-[15px] font-medium transition-all duration-300 ${theme === 'dark' ? 'bg-gray-900 text-white shadow-sm dark:bg-[#2C2C2E] dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
            >
              <Moon className="w-4 h-4 mr-2" /> Dark
            </button>
          </div>

          <div className="space-y-4 pt-2">
            <input 
               type="text"
               placeholder="Your Name (Optional)"
               value={name}
               onChange={(e) => setName(e.target.value)}
               className="w-full px-5 py-4 bg-white/50 dark:bg-black/20 ring-1 ring-black/5 dark:ring-white/5 focus:ring-2 focus:ring-accent/50 dark:focus:ring-accent/50 rounded-[24px] text-[15px] font-medium text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none transition-all duration-300 shadow-inner"
            />
            
            <button 
              onClick={() => onGuestEnter(name)}
              className="w-full flex items-center justify-center py-4 bg-white/40 dark:bg-white/5 text-gray-900 dark:text-white rounded-[24px] font-semibold hover:bg-white/60 dark:hover:bg-white/10 active:scale-[0.98] transition-all duration-300 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
            >
               <User className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" strokeWidth={2.5} />
               <span className="text-[15px]">Continue as Guest</span>
            </button>

            <div className="flex items-center gap-3">
               <div className="h-px bg-black/10 dark:bg-white/10 flex-1"></div>
               <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">OR</span>
               <div className="h-px bg-black/10 dark:bg-white/10 flex-1"></div>
            </div>

            <button 
              onClick={signIn}
              className="w-full flex items-center justify-center py-4 bg-black dark:bg-white text-white dark:text-black rounded-[24px] font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 active:scale-[0.98] transition-all duration-300 shadow-[0_8px_16px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_16px_rgba(255,255,255,0.1)] border border-transparent dark:border-white/20 relative overflow-hidden"
            >
               <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent dark:via-black/10 opacity-50"></div>
               <svg className="w-5 h-5 mr-3 relative z-10" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
               </svg>
               <span className="relative z-10 text-[15px]">Sign in with Google</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
