/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, memo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { ChevronLeft, FolderPlus, Cloud, ChevronRight, MoreHorizontal, Check, SquarePen, Mic, Search, Undo2, Share, Type, Pen, Camera, Trash, Pin, ListTodo, Table as TableIcon, FileText, X, Folder, LogIn, LogOut, PanelLeftClose, PanelLeftOpen, Sun, Moon, Plus, Minus, Image as ImageIcon, Download, Upload, Copy } from 'lucide-react';
import { encryptData, decryptData, hashKey } from './sync';
import { db, auth, logOut } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

import { StartScreen } from './StartScreen';

// --- Utils ---
const genId = () => Math.random().toString(36).substr(2, 9);

const isToday = (d: Date) => new Date().toDateString() === d.toDateString();
const isYesterday = (d: Date) => {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return y.toDateString() === d.toDateString();
};
const fmtDate = (d: Date) => {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}.${mm}.${yy}`;
};
const fmtTime = (d: Date) => {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};
const differenceInDays = (d1: Date, d2: Date) => Math.floor((d1.getTime() - d2.getTime()) / 86400000);

const getNoteSummary = (content: string) => {
  const text = content
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>|<\/div>|<\/h[1-6]>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const title = lines[0] || '';
  const preview = lines[1] || 'No additional text';
  return { title, preview };
};

// --- Mock Data ---
interface Note {
  id: string;
  content: string;
  date: Date;
  isPinned: boolean;
  isDeleted: boolean;
  folderId?: string;
}

interface FolderData {
  id: string;
  name: string;
  color?: string;
}

type Screen = 'folders' | 'notes' | 'deleted' | 'editor';

// --- Shared Components ---

const SearchBottomBar = ({ onCompose, searchString, setSearchString, noteCount, onFolders }: any) => (
  <div className="relative flex items-center justify-between z-20 gap-2 pointer-events-auto w-full">
     <div className="absolute -top-8 left-0 right-0 flex justify-center pointer-events-none">
       {noteCount > 0 && <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">{noteCount} {noteCount === 1 ? 'Note' : 'Notes'}</span>}
     </div>
     
     <motion.button 
       onClick={onFolders} 
       initial={{ y: 20, opacity: 0 }}
       animate={{ y: 0, opacity: 1 }}
       transition={{ type: 'spring', stiffness: 300, damping: 25 }}
       className="md:hidden px-4 h-[52px] rounded-[26px] bg-white/40 dark:bg-white/5 backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.2)] flex items-center justify-center shrink-0 transition-all duration-300 ease-out hover:bg-white/50 dark:hover:bg-white/10 hover:scale-105 active:scale-95 text-gray-900 dark:text-gray-100 font-medium"
     >
       <Folder className="w-5 h-5 mr-2 relative z-10" />
       <span className="relative z-10 text-[15px]">Folders</span>
     </motion.button>
     
     {/* Search Bar Pill */}
     <motion.div 
       initial={{ y: 20, opacity: 0 }}
       animate={{ y: 0, opacity: 1 }}
       transition={{ type: 'spring', stiffness: 300, damping: 25 }}
       className="flex-1 overflow-hidden bg-white/40 dark:bg-white/5 backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/10 rounded-[26px] h-[52px] flex items-center px-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-all duration-300 ease-out hover:bg-white/50 dark:hover:bg-white/10"
     >
       <Search className="w-[18px] h-[18px] text-gray-900 dark:text-white shrink-0" strokeWidth={2.5} />
       <input
         type="text"
         placeholder="Search min 3 chars"
         value={searchString}
         onChange={(e) => setSearchString(e.target.value)}
         className="bg-transparent border-none outline-none text-[15px] text-gray-900 dark:text-white placeholder-gray-500 font-medium ml-3 flex-1 w-full"
       />
     </motion.div>

     {/* Compose Button Circle */}
     <motion.button 
       onClick={onCompose} 
       initial={{ y: 20, opacity: 0 }}
       animate={{ y: 0, opacity: 1 }}
       transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.05 }}
       className="w-[52px] h-[52px] rounded-[26px] bg-white/40 dark:bg-white/5 backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.2)] flex items-center justify-center shrink-0 transition-all duration-300 ease-out hover:bg-white/50 dark:hover:bg-white/10 hover:scale-105 active:scale-95"
     >
       <SquarePen className="w-6 h-6 text-gray-900 dark:text-white ml-0.5" strokeWidth={2} />
     </motion.button>
  </div>
);

const SwipeableNoteItem = React.memo(({ note, isActive, onNoteClick, onDelete, onPin }: any) => {
  const { title, preview } = getNoteSummary(note.content);
  const x = useMotionValue(0);
  const leftOpacity = useTransform(x, [10, 50], [0, 1]);
  const rightOpacity = useTransform(x, [-50, -10], [1, 0]);

  return (
    <motion.div layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="relative group mb-1">
      <div className="absolute inset-0 flex justify-between rounded-lg overflow-hidden pointer-events-none">
         <motion.div style={{ opacity: leftOpacity }} className="bg-accent w-1/2 flex items-center px-6">
            <Pin className="text-white w-5 h-5" />
         </motion.div>
         <motion.div style={{ opacity: rightOpacity }} className="bg-red-500 w-1/2 flex items-center justify-end px-6">
            <Trash className="text-white w-5 h-5" strokeWidth={1.5} />
         </motion.div>
      </div>
      <motion.div
         style={{ x }}
         drag="x"
         dragConstraints={{ left: 0, right: 0 }}
         dragElastic={0.06}
         dragTransition={{ bounceStiffness: 600, bounceDamping: 25 }}
         dragDirectionLock
         onDragEnd={(e, { offset }) => {
           if (offset.x > 70) onPin(note.id);
           else if (offset.x < -70) onDelete(note.id);
         }}
         onClick={() => onNoteClick(note.id)}
         className={`relative z-10 p-4 transition-all duration-300 overflow-hidden cursor-pointer touch-pan-y backdrop-blur-2xl active:scale-[0.98] ${isActive ? 'bg-[#b6923c] dark:bg-[#b6923c] rounded-[24px] shadow-sm' : note.isPinned ? 'border-l-2 border-l-accent rounded-r-[24px] bg-white/70 dark:bg-white/5 ring-1 ring-accent/20 dark:ring-accent/40' : 'rounded-[24px] ring-1 ring-black/5 dark:ring-white/10 bg-white/60 dark:bg-black/30 hover:bg-white/80 dark:hover:bg-white/5'}`}
      >
         <h4 className={`font-semibold text-[15px] truncate mb-1 ${isActive ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>{title || 'New Note'}</h4>
         <div className={`flex items-center text-xs ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
           <span className="mr-2 whitespace-nowrap">{isToday(note.date) ? fmtTime(note.date) : fmtDate(note.date)}</span>
           <span className="truncate">{preview || 'No additional text'}</span>
         </div>
      </motion.div>
    </motion.div>
  );
});

// --- Main Screens ---

const FolderItem = ({ f, activeCount, onNavigate, onRenameFolder, onDeleteFolder }: any) => {
   const [showMenu, setShowMenu] = useState(false);
   const [showRenameModal, setShowRenameModal] = useState(false);
   const [showDeleteModal, setShowDeleteModal] = useState(false);
   const [folderName, setFolderName] = useState(f.name);
   const inputRef = useRef<HTMLInputElement>(null);

   const handleDotClick = (e: any) => {
      e.stopPropagation();
      setShowMenu(!showMenu);
   };

   const handleRename = () => {
      if (folderName.trim()) {
         onRenameFolder(f.id, folderName.trim());
      }
      setShowRenameModal(false);
   };

   const handleDelete = () => {
      onDeleteFolder(f.id);
      setShowDeleteModal(false);
   };

   useEffect(() => {
      if (showRenameModal && inputRef.current) {
         inputRef.current.focus();
      }
   }, [showRenameModal]);

   return (
      <div className="relative group">
         <motion.div whileTap={{scale: 0.98}} onClick={() => onNavigate('notes', f.id)} className="flex items-center px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-full text-sm font-medium text-gray-800 dark:text-gray-200 cursor-pointer">
            <div className="relative z-10 p-1.5 -ml-1.5 mr-2 rounded-md">
               <Folder className="w-5 h-5 transition-colors text-accent dark:text-accent" strokeWidth={1.5} />
            </div>
            <span className="flex-1 truncate">{f.name}</span>
            <button onClick={handleDotClick} className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-all rounded-md hover:bg-gray-200 dark:hover:bg-[#38383A] mr-2">
               <MoreHorizontal className="w-4 h-4" />
            </button>
         </motion.div>

         <AnimatePresence>
            {showMenu && (
               <>
                  <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
                  <motion.div
                     initial={{ opacity: 0, scale: 0.95, y: -10 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.95, y: -10 }}
                     transition={{ duration: 0.15 }}
                     className="absolute right-4 top-10 z-40 w-36 bg-white/50 dark:bg-[#1C1C1E]/50 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_8px_32px_rgba(0,0,0,0.1)] rounded-xl py-1 border border-white/40 dark:border-white/10"
                  >
                     <button onClick={(e) => { e.stopPropagation(); setShowMenu(false); setShowRenameModal(true); }} className="w-full text-left px-4 py-2 text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors">Rename</button>
                     <button onClick={(e) => { e.stopPropagation(); setShowMenu(false); setShowDeleteModal(true); }} className="w-full text-left px-4 py-2 text-sm font-semibold text-red-500 hover:bg-black/5 dark:hover:bg-white/10 transition-colors">Delete</button>
                  </motion.div>
               </>
            )}
         </AnimatePresence>

         {typeof document !== 'undefined' && createPortal(
            <AnimatePresence>
               {showRenameModal && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                     <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm" 
                        onClick={(e) => { e.stopPropagation(); setShowRenameModal(false); }} 
                     />
                     <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 30 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                        className="relative w-full max-w-sm bg-white/40 dark:bg-black/40 backdrop-blur-[64px] saturate-[1.5] ring-1 ring-black/5 dark:ring-white/10 shadow-[0_24px_48px_rgba(0,0,0,0.1)] dark:shadow-[0_24px_48px_rgba(0,0,0,0.4)] rounded-[32px] p-6"
                        onClick={(e) => e.stopPropagation()}
                     >
                        <h3 className="relative z-10 text-lg font-semibold text-gray-900 dark:text-white mb-4">Rename Folder</h3>
                        <input
                           ref={inputRef}
                           type="text"
                           value={folderName}
                           onChange={(e) => setFolderName(e.target.value)}
                           onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                           className="relative z-10 w-full bg-white/50 dark:bg-black/20 ring-1 ring-black/5 dark:ring-white/10 rounded-[20px] px-4 py-3 text-[15px] font-medium text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 shadow-inner mb-6"
                           placeholder="Folder Name"
                        />
                        <div className="relative z-10 flex space-x-3">
                           <button onClick={(e) => { e.stopPropagation(); setShowRenameModal(false); }} className="flex-1 py-3 rounded-[20px] font-medium text-[15px] bg-white/50 dark:bg-white/10 text-gray-700 dark:text-gray-200 hover:bg-white/80 dark:hover:bg-white/20 transition-colors shadow-sm">Cancel</button>
                           <button onClick={(e) => { e.stopPropagation(); handleRename(); }} className="flex-1 py-3 rounded-[20px] font-medium text-[15px] bg-accent text-black hover:bg-[#D5A025] transition-colors shadow-md">Save</button>
                        </div>
                     </motion.div>
                  </div>
               )}
            </AnimatePresence>,
            document.body
         )}

         {typeof document !== 'undefined' && createPortal(
            <AnimatePresence>
               {showDeleteModal && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                     <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm" 
                        onClick={(e) => { e.stopPropagation(); setShowDeleteModal(false); }} 
                     />
                     <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 30 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                        className="relative w-full max-w-sm bg-white/40 dark:bg-black/40 backdrop-blur-[64px] saturate-[1.5] ring-1 ring-black/5 dark:ring-white/10 shadow-[0_24px_48px_rgba(0,0,0,0.1)] dark:shadow-[0_24px_48px_rgba(0,0,0,0.4)] rounded-[32px] p-6"
                        onClick={(e) => e.stopPropagation()}
                     >
                        <h3 className="relative z-10 text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Folder?</h3>
                        <p className="relative z-10 text-[15px] text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">"{f.name}"</span>? The notes inside will not be deleted, they will be moved to Notes.</p>
                        <div className="relative z-10 flex space-x-3">
                           <button onClick={(e) => { e.stopPropagation(); setShowDeleteModal(false); }} className="flex-1 py-3 rounded-[20px] font-medium text-[15px] bg-white/50 dark:bg-white/10 text-gray-700 dark:text-gray-200 hover:bg-white/80 dark:hover:bg-white/20 transition-colors shadow-sm">Cancel</button>
                           <button onClick={(e) => { e.stopPropagation(); handleDelete(); }} className="flex-1 py-3 rounded-[20px] font-medium text-[15px] bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white transition-colors shadow-sm">Delete</button>
                        </div>
                     </motion.div>
                  </div>
               )}
            </AnimatePresence>,
            document.body
         )}
      </div>
   );
};

const FoldersScreen = memo(({ notesCount, deletedCount, getFolderCount, folders, onNavigate, onCreate, onCreateFolder, onUpdateFolderColor, onRenameFolder, onDeleteFolder, defaultFolderName, onToggleSidebar, glassEffect }: any) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  const handleCreate = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
    }
    setIsCreating(false);
    setNewFolderName('');
  };

  return (
    <div className={`relative flex-1 h-full flex flex-col z-0 pb-0 overflow-y-auto w-full transition-colors duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] md:rounded-3xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10 shadow-sm ${glassEffect ? 'bg-white/40 dark:bg-[#111111]/80 backdrop-blur-[80px] saturate-[1.5]' : 'bg-white dark:bg-[#111111]'}`}>
       <div className={`sticky top-0 h-16 px-4 flex items-center justify-between z-30 w-full transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] shrink-0 ${glassEffect ? 'bg-white/30 dark:bg-transparent backdrop-blur-2xl mb-0' : 'bg-white/90 dark:bg-[#111111]/90 backdrop-blur-2xl mb-0'}`}>
          <div className="flex justify-between items-center">
             <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">Folders</h2>
          </div>
       </div>
       <div className="w-full flex flex-col flex-1 pb-4">
          <div className="flex-1 overflow-y-auto px-2">
             <div className="mb-6">
             <div className="space-y-0.5 mt-2">
               <FolderItem 
                  f={{ name: defaultFolderName }} 
                  activeCount={notesCount} 
                  onNavigate={onNavigate} 
                  onRenameFolder={onRenameFolder}
                  onDeleteFolder={onDeleteFolder}
               />
               {folders?.map((f: any) => (
                  <FolderItem 
                     key={f.id} 
                     f={f} 
                     activeCount={getFolderCount(f.id)} 
                     onNavigate={onNavigate} 
                     onRenameFolder={onRenameFolder}
                     onDeleteFolder={onDeleteFolder}
                  />
               ))}
               <AnimatePresence>
                 {isCreating && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-4 py-3 bg-[#E5E5E7] dark:bg-[#2C2C2E]/60 rounded-[24px] flex items-center mt-1"
                    >
                      <div className="p-1.5 -ml-1.5 mr-2">
                        <Folder className="w-5 h-5 text-[#FFD670]" strokeWidth={1.5} />
                      </div>
                      <input 
                         ref={inputRef}
                         type="text"
                         value={newFolderName}
                         onChange={e => setNewFolderName(e.target.value)}
                         onBlur={handleCreate}
                         onKeyDown={e => e.key === 'Enter' && handleCreate()}
                         placeholder="New Folder Name..."
                         className="bg-transparent border-none outline-none text-sm font-medium text-gray-900 dark:text-white flex-1 placeholder-gray-400"
                      />
                    </motion.div>
                 )}
               </AnimatePresence>
               <motion.div whileTap={{scale: 0.98}} onClick={() => onNavigate('deleted')} className="flex items-center px-4 py-3 hover:bg-[#E5E5E7] dark:hover:bg-[#2C2C2E]/60 transition-colors rounded-lg text-sm font-medium text-gray-800 dark:text-gray-200 cursor-pointer mt-1">
                  <div className="p-1.5 -ml-1.5 mr-2">
                    <Trash className="w-5 h-5 text-gray-500 dark:text-gray-400" strokeWidth={1.5}/>
                  </div>
                  <span>Recently Deleted</span>
               </motion.div>
            </div>
          </div>
       </div>
       </div>
       <div className={`sticky bottom-0 mt-auto px-4 pb-6 z-20 w-full shrink-0 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]`}>
          <div className="w-full flex items-center justify-between pointer-events-auto">
             <button onClick={() => setIsCreating(true)} className="flex items-center justify-center w-[52px] h-[52px] rounded-[26px] bg-white/40 dark:bg-white/5 backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-all duration-300 ease-out hover:bg-white/50 dark:hover:bg-white/10 hover:scale-105 active:scale-95 group text-accent">
                <FolderPlus className="w-5 h-5 relative z-10" />
             </button>
             <div className="flex items-center gap-2">
                <button onClick={() => onNavigate('notes')} className="md:hidden flex items-center justify-center px-4 h-[52px] rounded-[26px] bg-white/40 dark:bg-white/5 backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-all duration-300 ease-out hover:bg-white/50 dark:hover:bg-white/10 hover:scale-105 active:scale-95 group text-gray-900 dark:text-gray-100 font-medium">
                   <FileText className="w-5 h-5 mr-2 relative z-10" />
                   <span className="relative z-10">Documents</span>
                </button>
                <button onClick={onCreate} className="md:hidden flex items-center justify-center w-[52px] h-[52px] rounded-[26px] bg-white/40 dark:bg-white/5 backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-all duration-300 ease-out hover:bg-white/50 dark:hover:bg-white/10 hover:scale-105 active:scale-95 group text-accent">
                   <SquarePen className="w-5 h-5 relative z-10" />
                </button>
             </div>
          </div>
       </div>
    </div>
  )
});

const NotesScreen = memo(({ activeNoteId, activeFolderId, folderName, notes, onBack, onNoteClick, onDelete, onPin, isDeletedMode, onCreate, onToggleTheme, theme, guestName, onExportData, onImportData, zoomLevel, onZoomChange, sidebarVisible, onToggleSidebar, onRecoverAll, onDeleteAll, glassEffect, setGlassEffect, accentColor, setAccentColor }: any) => {
  const [search, setSearch] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  
  const userName = guestName || 'Guest';
  
  useEffect(() => {
     const handleKeyDown = (e: KeyboardEvent) => {
         if (e.key === 'Escape') {
             setShowMenu(false);
         }
     };
     window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  const groups = useMemo(() => {
     const result = notes
        .filter((n: Note) => n.isDeleted === isDeletedMode)
        .filter((n: Note) => isDeletedMode ? true : activeFolderId ? n.folderId === activeFolderId : !n.folderId)
        .filter((n: Note) => !search || n.content.toLowerCase().includes(search.toLowerCase()))
        .sort((a: Note, b: Note) => b.date.getTime() - a.date.getTime());

     const grp: any = { Pinned: [], Today: [], 'Previous 30 Days': [], Older: [] };
     result.forEach((note: Note) => {
        if (note.isPinned) grp.Pinned.push(note);
        else if (isToday(note.date)) grp.Today.push(note);
        else if (differenceInDays(new Date(), note.date) <= 30) grp['Previous 30 Days'].push(note);
        else grp.Older.push(note);
     });
     return [
        { title: 'Pinned', data: grp.Pinned },
        { title: 'Today', data: grp.Today },
        { title: 'Previous 30 Days', data: grp['Previous 30 Days'] },
        { title: 'Older', data: grp.Older }
     ].filter(g => g.data.length > 0);
  }, [notes, isDeletedMode, activeFolderId, search]);

  return (
    <div className={`relative flex-1 h-full flex flex-col z-10 pb-0 overflow-y-auto w-full transition-colors duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] md:rounded-3xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10 shadow-sm ${glassEffect ? 'bg-white/40 dark:bg-[#111111]/80 backdrop-blur-[80px] saturate-[1.5]' : 'bg-white dark:bg-[#111111]'}`}>
       <div className={`sticky top-0 h-16 px-4 flex items-center justify-between z-30 w-full transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] shrink-0 ${glassEffect ? 'bg-white/30 dark:bg-transparent backdrop-blur-2xl mb-0' : 'bg-white/90 dark:bg-[#111111]/90 backdrop-blur-2xl mb-0'}`}>
          <div className="relative pointer-events-auto">
             <button onClick={onBack} className="md:hidden flex items-center justify-center w-10 h-10 rounded-full bg-white/40 dark:bg-white/10 backdrop-blur-3xl shadow-sm ring-1 ring-black/5 dark:ring-white/10 hover:bg-white/60 dark:hover:bg-white/20 active:scale-95 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] shrink-0 group z-50">
                <ChevronLeft className="w-5 h-5 text-gray-900 dark:text-white relative z-10 drop-shadow-sm pr-[2px]" strokeWidth={2.5} />
             </button>
          </div>
          <div className="relative pointer-events-auto flex gap-2">
             <button onClick={() => setShowMenu(!showMenu)} className="flex items-center justify-center w-10 h-10 rounded-full bg-white/40 dark:bg-white/10 backdrop-blur-3xl shadow-sm ring-1 ring-black/5 dark:ring-white/10 hover:bg-white/60 dark:hover:bg-white/20 active:scale-95 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] shrink-0 group z-50">
                <MoreHorizontal className="w-5 h-5 text-gray-900 dark:text-white relative z-10 drop-shadow-sm" strokeWidth={2} />
             </button>
             {showMenu && createPortal(
                <div className="fixed inset-0 z-[100] flex justify-center items-center p-4">
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowMenu(false)} />
                   <motion.div 
                      initial={{ y: '10%', opacity: 0, scale: 0.95 }} 
                      animate={{ y: 0, opacity: 1, scale: 1 }} 
                      exit={{ y: '10%', opacity: 0, scale: 0.95 }} 
                      transition={{ type: 'spring', damping: 30, stiffness: 350, mass: 0.8 }} 
                      className="relative w-full max-w-lg max-h-[90dvh] rounded-[36px] bg-white/60 dark:bg-black/40 backdrop-blur-[64px] saturate-[1.5] ring-1 ring-black/5 dark:ring-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.1)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.4)] flex flex-col pt-10 pb-8 px-8 overflow-y-auto"
                   >
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(false); }} className="absolute z-50 top-4 right-4 w-10 h-10 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/20 active:scale-95 backdrop-blur-md transition-all cursor-pointer pointer-events-auto"><X className="w-5 h-5 text-gray-900 dark:text-white" /></button>
                      
                      <div className="flex flex-col mb-8">
                         <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight drop-shadow-sm flex items-center gap-2">
                           Hi, {userName}
                         </h2>
                      </div>
                      
                      <div className="flex flex-col space-y-6">
                         
                         {/* Data Sync */}
                         <div>
                            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1 mb-2 block">Local Data</span>
                            <div className="flex gap-2">
                               <button onClick={(e) => { e.stopPropagation(); onExportData(); setShowMenu(false); }} className="flex-1 flex items-center justify-center py-3 rounded-2xl bg-white/60 dark:bg-[#2C2C2E]/60 ring-1 ring-black/5 dark:ring-white/10 hover:bg-white/80 dark:hover:bg-[#3C3C3E]/80 active:scale-95 transition-all text-sm font-semibold text-gray-900 dark:text-white shadow-[0_2px_10px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.6)]">
                                  <Download className="w-4 h-4 mr-2" /> Export Code
                               </button>
                               <button onClick={(e) => { e.stopPropagation(); onImportData(); setShowMenu(false); }} className="flex-1 flex items-center justify-center py-3 rounded-2xl bg-white/60 dark:bg-[#2C2C2E]/60 ring-1 ring-black/5 dark:ring-white/10 hover:bg-white/80 dark:hover:bg-[#3C3C3E]/80 active:scale-95 transition-all text-sm font-semibold text-gray-900 dark:text-white shadow-[0_2px_10px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.6)]">
                                  <Upload className="w-4 h-4 mr-2" /> Import Code
                               </button>
                            </div>
                         </div>
                         
                         {/* Theme */}
                         <div>
                            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1 mb-2 block">Appearance</span>
                            <button onClick={(e) => { e.stopPropagation(); onToggleTheme(); }} className="relative w-full flex items-center justify-between px-5 py-3.5 text-[15px] font-medium text-gray-900 dark:text-white bg-white/60 dark:bg-[#2C2C2E]/60 backdrop-blur-xl hover:bg-white/80 dark:hover:bg-[#2C2C2E]/80 overflow-hidden group transition-all duration-300 rounded-[24px] shadow-sm ring-1 ring-black/5 dark:ring-white/10 active:scale-95">
                              <span className="relative z-10">Theme</span>
                              <div className="relative z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-black/30 shadow-inner group-hover:rotate-12 transition-transform duration-300">
                                 {theme === 'light' ? <Sun className="w-4 h-4 text-orange-500" strokeWidth={2.5} /> : <Moon className="w-4 h-4 text-blue-400" strokeWidth={2.5} />}
                              </div>
                            </button>
                         </div>

                         {/* Font Size */}
                         <div>
                            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1 mb-2 block">Text Size</span>
                            <div className="relative bg-white/60 dark:bg-[#2C2C2E]/60 backdrop-blur-xl rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.6)] border border-white/60 dark:border-white/10 p-1 flex">
                               {[ {label: 'S', val: 85}, {label: 'M', val: 100}, {label: 'L', val: 120} ].map(sz => (
                                 <button
                                    key={sz.label}
                                    onClick={() => onZoomChange(sz.val)}
                                    className={`flex-1 py-2 rounded-xl text-[15px] font-semibold transition-all duration-300 ${zoomLevel === sz.val ? 'bg-white dark:bg-[#48484A] text-accent shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-white/5'}`}
                                 >{sz.label}</button>
                               ))}
                            </div>
                         </div>

                         {/* Accent Color */}
                         <div>
                            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1 mb-3 block">Accent Color</span>
                            <div className="flex justify-between items-center px-2">
                               {['#FF453A', '#30D158', '#0A84FF', '#FF9F0A', '#BF5AF2'].map(color => (
                                  <button 
                                     key={color}
                                     onClick={(e) => { 
                                        e.stopPropagation(); 
                                        setAccentColor(color); 
                                        document.documentElement.style.setProperty('--app-accent', color);
                                        localStorage.setItem('accentColor', color);
                                     }}
                                     className={`w-8 h-8 rounded-full transition-all duration-300 active:scale-95 ${accentColor === color ? 'bg-white dark:bg-black bg-opacity-20 backdrop-blur-md shadow-[0_0_0_2px_white,0_0_0_4px_var(--app-accent)] scale-[1.15]' : 'hover:scale-[1.15] shadow-sm ring-1 ring-black/5 dark:ring-white/10'}`}
                                     style={{ backgroundColor: color }}
                                  />
                               ))}
                            </div>
                         </div>
                         
                         <div className="h-px w-full bg-black/5 dark:bg-white/10 my-2"></div>

                         {/* Account Actions */}
                         <div>
                            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1 mb-2 block">Account</span>
                            <div className="flex flex-col gap-2">
                               <button 
                                 onClick={async () => { 
                                     await logOut();
                                     localStorage.removeItem('guestMode'); 
                                     window.location.reload(); 
                                 }} 
                                 className="relative w-full flex items-center px-5 py-3.5 text-[15px] font-medium text-red-500 bg-white/60 dark:bg-[#2C2C2E]/60 backdrop-blur-xl hover:bg-white/80 dark:hover:bg-[#2C2C2E]/80 overflow-hidden group transition-all duration-300 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.6)] border border-white/60 dark:border-white/10 active:scale-95"
                               >
                                 <LogOut className="w-5 h-5 mr-3" /> 
                                 <span className="relative z-10 font-semibold">Logout</span>
                               </button>
                            </div>
                         </div>
                      </div>
                   </motion.div>
                </div>, 
                document.body
             )}
          </div>
       </div>
       
       <div className="flex-1 overflow-visible w-full">
         <div className="px-4 py-3 border-b border-gray-100 dark:border-[#38383A] mb-2">
           <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{isDeletedMode ? 'Recently Deleted' : folderName}</h1>
         </div>
         
         {groups.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3 pb-32">
               <FileText className="w-12 h-12 opacity-50" />
               <p className="font-medium text-sm">No notes yet</p>
            </div>
         ) : (
            <div className="px-3 pt-2">
              {groups.map(g => (
                 <div key={g.title} className="mb-4">
                   <h3 className="px-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                      {g.title}
                   </h3>
                   <div className="space-y-1">
                     <AnimatePresence>
                       {g.data.map((note: Note) => (
                          <SwipeableNoteItem 
                            key={note.id} 
                            note={note} 
                            isActive={note.id === activeNoteId} 
                            onNoteClick={onNoteClick} 
                            onDelete={onDelete} 
                            onPin={onPin} 
                          />
                       ))}
                     </AnimatePresence>
                   </div>
                 </div>
              ))}
            </div>
         )}
       </div>

       {isDeletedMode ? (
         <div className={`absolute bottom-0 left-0 right-0 h-16 z-20 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${glassEffect ? 'bg-gradient-to-t from-white/60 via-white/40 to-transparent dark:from-black/60 dark:via-black/30 dark:to-transparent' : 'bg-gradient-to-t from-white via-white/80 to-transparent dark:from-[#0A0A0A] dark:via-[#0A0A0A]/80 dark:to-transparent'}`}>
           <div className="w-full h-full flex items-center justify-between px-6 pb-2">
             <button onClick={onRecoverAll} className="text-accent font-medium text-sm">Recover All</button>
             <button onClick={onDeleteAll} className="text-red-500 font-medium text-sm">Delete All</button>
           </div>
         </div>
       ) : (
         <div className={`sticky bottom-0 mt-auto p-4 pb-6 z-20 w-full shrink-0 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] pointer-events-none`}>
           <SearchBottomBar onCompose={onCreate} searchString={search} setSearchString={setSearch} noteCount={notes.filter((n:Note)=>!n.isDeleted).length} onFolders={onBack} />
         </div>
       )}
    </div>
  )
});

const Editor = memo(({ note, onUpdate, onBack, onToggleTheme, theme, zoomLevel, onZoomChange, sidebarVisible, isFullScreen, onToggleFullScreen, isMobile, glassEffect }: any) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedSelection = useRef<Range | null>(null);
  const [showFormat, setShowFormat] = useState(false);

  useEffect(() => {
    const handleSelectionChange = () => {
       const active = document.activeElement;
       if (editorRef.current && (active === editorRef.current || editorRef.current.contains(active))) {
         const sel = window.getSelection();
         if (sel && sel.rangeCount > 0) {
           savedSelection.current = sel.getRangeAt(0).cloneRange();
         }
       }
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  useEffect(() => {
    if (editorRef.current && note && editorRef.current.innerHTML !== note.content) {
      editorRef.current.innerHTML = note.content;
      // sync checkboxes state
      editorRef.current.querySelectorAll('.goal-checkbox').forEach((cb: any) => {
         const item = cb.closest('.goal-item');
         if (item && item.getAttribute('data-completed') === 'true') {
            cb.checked = true;
         }
      });
      // Place cursor at the end or inside the first div if empty
      if (note.content === '<div><br></div>') {
         const range = document.createRange();
         range.selectNodeContents(editorRef.current);
         range.collapse(false);
         const sel = window.getSelection();
         if (sel) {
            sel.removeAllRanges();
            sel.addRange(range);
         }
      }
    }
  }, [note?.id]);

  const restoreSelection = () => {
    if (savedSelection.current && editorRef.current) {
        editorRef.current.focus();
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(savedSelection.current);
    }
  };

  const handleFormat = (command: string, arg?: string) => {
    restoreSelection();
    document.execCommand(command, false, arg);
    editorRef.current?.focus();
    onUpdate(editorRef.current?.innerHTML || '');
  };

  const hexToRgb = (hex: string) => {
    const bigint = parseInt(hex.replace('#',''), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgb(${r}, ${g}, ${b})`;
  };

  const handleTextColor = (hexColor: string | null) => {
    if (!editorRef.current) return;
    restoreSelection();

    if (!hexColor) {
        document.execCommand('styleWithCSS', false, 'true');
        document.execCommand('hiliteColor', false, 'transparent');
        document.execCommand('foreColor', false, '#fefdfc');
        
        const elements = Array.from(editorRef.current.querySelectorAll('*'));
        let modified = false;
        elements.forEach((el: any) => {
            const computedColor = window.getComputedStyle(el).color;
            if (computedColor === 'rgb(254, 253, 252)' || computedColor === '#fefdfc' || computedColor === 'rgba(254, 253, 252, 1)') {
                 (el as HTMLElement).style.color = '';
                 (el as HTMLElement).style.backgroundColor = '';
                 if ((el as HTMLElement).getAttribute('style') === '') {
                     (el as HTMLElement).removeAttribute('style');
                 }
                 modified = true;
            }
        });
        
        onUpdate(editorRef.current.innerHTML);
        setShowFormat(false);
        return;
    }

    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand('foreColor', false, hexColor);
    
    let r = parseInt(hexColor.slice(1, 3), 16);
    let g = parseInt(hexColor.slice(3, 5), 16);
    let b = parseInt(hexColor.slice(5, 7), 16);
    document.execCommand('hiliteColor', false, `rgba(${r}, ${g}, ${b}, 0.2)`);
    
    onUpdate(editorRef.current.innerHTML);
    setShowFormat(false);
  };

  const handleInsertTable = (cols: number = 2) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const parent = range.commonAncestorContainer.nodeType === 3 
            ? range.commonAncestorContainer.parentElement 
            : range.commonAncestorContainer as HTMLElement;
        if (parent?.closest('table') || parent?.closest('.goal-item')) {
            setShowFormat(false);
            return; // prevent inserting table inside a table or goal
        }
    }

    let rowsHTML = '';
    for (let r = 0; r < 2; r++) {
      let cellsHTML = '';
      for (let c = 0; c < cols; c++) {
        cellsHTML += `<td class="border border-gray-200 dark:border-white/10 p-2 min-w-[100px]"><br></td>`;
      }
      rowsHTML += `<tr>${cellsHTML}</tr>`;
    }

    const tableHTML = `
      <table class="w-full border-collapse border border-gray-200 dark:border-white/10 mb-6 text-sm my-4 table-fixed layout-fixed">
        <tbody>
          ${rowsHTML}
        </tbody>
      </table>
      <p><br></p>
    `;
    handleFormat('insertHTML', tableHTML);
  };

  const handleInsertGoal = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const parent = range.commonAncestorContainer.nodeType === 3 
            ? range.commonAncestorContainer.parentElement 
            : range.commonAncestorContainer as HTMLElement;
        if (parent?.closest('table') || parent?.closest('.goal-item')) {
            setShowFormat(false);
            return; // prevent inserting goal inside a table or goal
        }
    }

    const id = Math.random().toString(36).substr(2, 9);
    const goalHTML = `<div id="${id}" class="goal-item flex items-start gap-3 mb-3" data-completed="false"><input type="checkbox" class="goal-checkbox mt-[2px] w-5 h-5 appearance-none rounded-full border border-gray-300 dark:border-gray-600 checked:bg-accent checked:border-accent relative flex-shrink-0 cursor-pointer transition-all after:content-[''] after:absolute after:hidden checked:after:block after:w-[5px] after:h-[10px] after:border-white after:border-r-2 after:border-b-2 after:rotate-45 after:left-[6px] after:top-[2.5px]" /><span class="goal-text flex-1 outline-none transition-all duration-300"><br></span></div>`;
    handleFormat('insertHTML', goalHTML);
  };

  const handleEditorInput = (e: any) => {
    let newHtml = e.currentTarget.innerHTML;
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const node = range.endContainer;
      if (node.nodeType === 3) { // Node.TEXT_NODE
        const text = node.textContent || '';
        const cursorOffset = range.endOffset;
        const textBeforeCursor = text.slice(0, cursorOffset);
        if (textBeforeCursor.endsWith('=')) {
            const exprMatch = textBeforeCursor.slice(0, -1).match(/([\d\.\(\)\s\+\-\*\/]+)$/);
            if (exprMatch && exprMatch[1].trim().length > 0) {
              let expr = exprMatch[1].trim();
              if (/[\+\-\*\/]/.test(expr)) {
                const sanitizedExpr = expr.replace(/[^\d\.\+\-\*\/\(\)]/g, '');
                try {
                  const result = new Function(`return ${sanitizedExpr}`)();
                  if (result !== undefined && !Number.isNaN(result) && isFinite(result)) {
                    const resultText = ` ${Math.round(result * 1000000) / 1000000}`;
                    const textAfter = text.slice(cursorOffset);
                    node.textContent = textBeforeCursor + resultText + textAfter;
                    
                    const newRange = document.createRange();
                    newRange.setStart(node, cursorOffset + resultText.length);
                    newRange.setEnd(node, cursorOffset + resultText.length);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                    
                    newHtml = e.currentTarget.innerHTML;
                  }
                } catch(err) {}
              }
            }
        }
      }
    }
    
    onUpdate(newHtml);
  };

  const handleEditorClick = (e: any) => {
    if (e.target.classList.contains('goal-checkbox')) {
      const goalItem = e.target.closest('.goal-item');
      if (!goalItem) return;

      const isChecked = e.target.checked;
      goalItem.setAttribute('data-completed', isChecked.toString());
      
      const textSpan = goalItem.querySelector('.goal-text');
      if (textSpan) {
         if (isChecked) {
            textSpan.classList.add('line-through', 'text-gray-400', 'opacity-60');
         } else {
            textSpan.classList.remove('line-through', 'text-gray-400', 'opacity-60');
         }
      }
      
      // Move down animation
      if (isChecked && editorRef.current) {
         goalItem.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
         goalItem.style.transform = 'translateY(10px) scale(0.95)';
         goalItem.style.opacity = '0.5';
         
         setTimeout(() => {
            if (editorRef.current) {
               // move to the bottom of the current goal list block
               let curr = goalItem.nextElementSibling;
               let lastGoal = goalItem;
               while (curr && curr.classList && curr.classList.contains('goal-item')) {
                  lastGoal = curr as HTMLElement;
                  curr = curr.nextElementSibling;
               }
               if (lastGoal !== goalItem) {
                  lastGoal.after(goalItem);
               } else {
                  editorRef.current.appendChild(goalItem);
               }
               
               // reveal
               goalItem.style.transform = 'translateY(0) scale(1)';
               goalItem.style.opacity = '1';
               onUpdate(editorRef.current.innerHTML);
            }
         }, 300);
      } else {
         onUpdate(editorRef.current?.innerHTML || '');
      }
    }
  };

  const handleEditorKeyDown = (e: any) => {
    if (e.key === 'Tab') {
       const selection = window.getSelection();
       if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const parent = range.commonAncestorContainer.nodeType === 3 
              ? range.commonAncestorContainer.parentElement 
              : range.commonAncestorContainer as HTMLElement;
          const td = parent?.closest('td');
          if (td) {
             e.preventDefault();
             const tr = td.closest('tr');
             const tbody = tr?.closest('tbody');
             
             if (!e.shiftKey) {
                if (td.nextElementSibling) {
                   // Move to next cell
                   const newRange = document.createRange();
                   newRange.setStart(td.nextElementSibling, 0);
                   newRange.collapse(true);
                   selection.removeAllRanges();
                   selection.addRange(newRange);
                } else if (tr?.nextElementSibling) {
                   // Move to first cell of next row
                   const firstCell = tr.nextElementSibling.firstElementChild;
                   if (firstCell) {
                      const newRange = document.createRange();
                      newRange.setStart(firstCell, 0);
                      newRange.collapse(true);
                      selection.removeAllRanges();
                      selection.addRange(newRange);
                   }
                } else if (tr && tbody) {
                   // At end of LAST row, add a new row
                   const cols = tr.children.length;
                   const newTr = document.createElement('tr');
                   for(let c=0; c<cols; c++) {
                     const newTd = document.createElement('td');
                     newTd.className = "border border-gray-200 dark:border-white/10 p-2 min-w-[100px]";
                     newTd.innerHTML = "<br>";
                     newTr.appendChild(newTd);
                   }
                   tbody.appendChild(newTr);
                   
                   const newRange = document.createRange();
                   newRange.selectNodeContents(newTr.firstElementChild as Node);
                   newRange.collapse(true);
                   selection.removeAllRanges();
                   selection.addRange(newRange);
                   
                   if (editorRef.current) {
                      onUpdate(editorRef.current.innerHTML);
                   }
                }
             } else {
                if (td.previousElementSibling) {
                   const newRange = document.createRange();
                   newRange.setStart(td.previousElementSibling, 0);
                   newRange.collapse(true);
                   selection.removeAllRanges();
                   selection.addRange(newRange);
                } else if (tr?.previousElementSibling) {
                   const lastCell = tr.previousElementSibling.lastElementChild;
                   if (lastCell) {
                      const newRange = document.createRange();
                      newRange.setStart(lastCell, 0);
                      newRange.collapse(true);
                      selection.removeAllRanges();
                      selection.addRange(newRange);
                   }
                }
             }
             return;
          }
       }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const parent = range.commonAncestorContainer.nodeType === 3 
                ? range.commonAncestorContainer.parentElement 
                : range.commonAncestorContainer as HTMLElement;
                
            const td = parent?.closest('td');
            if (td) {
               e.preventDefault();
               const tr = td.closest('tr');
               const tbody = tr?.closest('tbody');
               if (tr && tbody) {
                  const cols = tr.children.length;
                  const newTr = document.createElement('tr');
                  for(let c=0; c<cols; c++) {
                    const newTd = document.createElement('td');
                    newTd.className = "border border-gray-200 dark:border-white/10 p-2 min-w-[100px]";
                    newTd.innerHTML = "<br>";
                    newTr.appendChild(newTd);
                  }
                  tr.after(newTr);
                  
                  const newRange = document.createRange();
                  newRange.selectNodeContents(newTr.firstElementChild as Node);
                  newRange.collapse(true);
                  selection.removeAllRanges();
                  selection.addRange(newRange);
                  
                  if (editorRef.current) {
                     onUpdate(editorRef.current.innerHTML);
                  }
               }
               return;
            }

            const heading = parent?.closest('h1, h2, h3');
            if (heading) {
               const atEnd = range.endContainer.nodeType === 3 ? range.endOffset >= (range.endContainer.textContent?.length || 0) : true;
               if (atEnd && !e.shiftKey) {
                  e.preventDefault();
                  const p = document.createElement('div');
                  p.innerHTML = '<br>';
                  heading.after(p);
                  const newRange = document.createRange();
                  newRange.setStart(p, 0);
                  newRange.collapse(true);
                  selection.removeAllRanges();
                  selection.addRange(newRange);
                  if (editorRef.current) {
                     onUpdate(editorRef.current.innerHTML);
                  }
                  return;
               } else {
                  setTimeout(() => {
                     const newSelection = window.getSelection();
                     const newParent = newSelection?.anchorNode?.parentElement;
                     if (newParent && ['H1', 'H2', 'H3'].includes(newParent.tagName)) {
                        document.execCommand('formatBlock', false, 'div');
                        if (editorRef.current) {
                           onUpdate(editorRef.current.innerHTML);
                        }
                     }
                  }, 0);
               }
            }

            const goalItem = parent?.closest('.goal-item');
            if (goalItem) {
               e.preventDefault();
               const textSpan = goalItem.querySelector('.goal-text');
               const textContent = textSpan?.textContent?.trim() || '';
               
               if (textContent === '' || textContent === 'New goal...') {
                  const p = document.createElement('div');
                  p.innerHTML = '<br>';
                  goalItem.after(p);
                  goalItem.remove();
                  const sel = window.getSelection();
                  const newRange = document.createRange();
                  newRange.setStart(p, 0);
                  newRange.collapse(true);
                  sel?.removeAllRanges();
                  sel?.addRange(newRange);
                  if (editorRef.current) onUpdate(editorRef.current.innerHTML);
                  return;
               }

               const id = Math.random().toString(36).substr(2, 9);
               const newGoalHTML = `<div id="${id}" class="goal-item flex items-start gap-3 mb-3" data-completed="false"><input type="checkbox" class="goal-checkbox mt-[2px] w-5 h-5 appearance-none rounded-full border border-gray-300 dark:border-gray-600 checked:bg-accent checked:border-accent relative flex-shrink-0 cursor-pointer transition-all after:content-[''] after:absolute after:hidden checked:after:block after:w-[5px] after:h-[10px] after:border-white after:border-r-2 after:border-b-2 after:rotate-45 after:left-[6px] after:top-[2.5px]" /><span class="goal-text flex-1 outline-none transition-all duration-300"><br></span></div>`;
               
               const tempDiv = document.createElement('div');
               tempDiv.innerHTML = newGoalHTML;
               const newGoalItem = tempDiv.firstElementChild;
               
               if (newGoalItem) {
                  goalItem.after(newGoalItem);
                  const startNode = newGoalItem.querySelector('.goal-text');
                  if (startNode) {
                     const sel = window.getSelection();
                     const newRange = document.createRange();
                     newRange.setStart(startNode, 0);
                     newRange.collapse(true);
                     sel?.removeAllRanges();
                     sel?.addRange(newRange);
                  }
                  if (editorRef.current) onUpdate(editorRef.current.innerHTML);
               }
               return;
            }
        }
    }
  };

  return (
    <div className={`relative flex-1 h-full flex flex-col z-20 transition-colors duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] md:rounded-3xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10 shadow-sm ${glassEffect ? 'bg-white/40 dark:bg-[#111111]/80 backdrop-blur-[80px] saturate-[1.5]' : 'bg-white dark:bg-[#111111]'}`}>
       <div className={`sticky top-0 h-16 px-4 flex items-center justify-between z-30 w-full transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] shrink-0 ${glassEffect ? 'bg-white/30 dark:bg-transparent backdrop-blur-2xl mb-0' : 'bg-white/90 dark:bg-[#111111]/90 backdrop-blur-2xl mb-0'}`}>
           <div className="flex items-center pointer-events-auto">
             <button onClick={isMobile ? onBack : onToggleFullScreen} className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-3xl shadow-sm border border-white/40 dark:border-white/10 hover:bg-white/30 dark:hover:bg-white/10 active:scale-95 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] shrink-0 overflow-hidden group">
                {isMobile ? (
                   <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-white pr-[2px] relative z-10 drop-shadow-sm" strokeWidth={2.5} />
                ) : isFullScreen ? (
                   <PanelLeftOpen className="w-5 h-5 text-gray-900 dark:text-white relative z-10 drop-shadow-sm" strokeWidth={2} />
                ) : (
                   <PanelLeftClose className="w-5 h-5 text-gray-900 dark:text-white relative z-10 drop-shadow-sm" strokeWidth={2} />
                )}
             </button>
           </div>
           <div className="flex items-center gap-1 pointer-events-auto">
               <button onClick={() => {setShowFormat(!showFormat)}} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all duration-300 shrink-0 text-gray-800 dark:text-gray-200">
                  <Type strokeWidth={2} className="w-5 h-5"/>
               </button>
               <button onClick={(e)=>{e.preventDefault(); handleInsertGoal()}} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all duration-300 shrink-0 text-gray-800 dark:text-gray-200">
                  <ListTodo strokeWidth={2} className="w-5 h-5"/>
               </button>
               <button onClick={(e)=>{e.preventDefault(); setShowFormat(false); handleInsertTable(2);}} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all duration-300 shrink-0 text-gray-800 dark:text-gray-200 mr-2">
                  <TableIcon strokeWidth={2} className="w-5 h-5"/>
               </button>
             <button onClick={()=>handleFormat('undo')} className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white/40 dark:bg-white/10 backdrop-blur-3xl shadow-sm ring-1 ring-black/5 dark:ring-white/10 hover:bg-white/60 dark:hover:bg-white/20 active:scale-95 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] shrink-0 overflow-hidden group">
                <Undo2 className="w-5 h-5 text-gray-900 dark:text-white relative z-10" strokeWidth={2} />
             </button>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 lg:px-10 pt-2 pb-32 w-full h-full">
          <div className="w-full h-full max-w-full overflow-x-hidden">
            <p className="text-center text-gray-400 dark:text-gray-500 text-xs mb-3">{fmtDate(note.date)} at {fmtTime(note.date)}</p>
            <div
               ref={editorRef}
               contentEditable
               data-placeholder="New Note"
               onInput={handleEditorInput}
               onClick={handleEditorClick}
               onKeyDown={handleEditorKeyDown}
               style={{ overflowWrap: 'anywhere', fontSize: `${zoomLevel}%` }}
               className="editor-canvas leading-relaxed text-gray-800 dark:text-gray-200 outline-none transition-all duration-300 ease-out w-full max-w-full whitespace-pre-wrap break-words"
            />
          </div>
       </div>



       <AnimatePresence>
         {showFormat && (
           <motion.div initial={{ y: 25, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 15, opacity: 0, scale: 0.95 }} transition={{ type: 'spring', damping: 22, stiffness: 300, mass: 0.9 }}
             className={`absolute top-16 right-4 w-[90%] max-w-[340px] shadow-[0_12px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.3)] rounded-[32px] p-4 z-50 flex flex-col gap-3 transition-colors duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${glassEffect ? 'bg-white/40 dark:bg-white/5 backdrop-blur-3xl saturate-[1.5] ring-1 ring-black/5 dark:ring-white/10' : 'bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-3xl ring-1 ring-black/5 dark:ring-white/10'}`}>
              <div className="flex justify-between items-center px-2 mb-1">
                 <span className="font-bold text-gray-800 dark:text-gray-200 text-[10px] uppercase tracking-widest">Format</span>
                 <button onClick={() => setShowFormat(false)} className="text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors p-1"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex rounded-[20px] overflow-hidden bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/5 drop-shadow-sm p-1 gap-1">
                 <button onClick={(e) => {e.preventDefault(); handleFormat('formatBlock', 'H1'); setShowFormat(false)}} className="flex-1 py-1.5 text-xs font-bold text-gray-800 dark:text-gray-200 hover:bg-white dark:hover:bg-white/10 rounded-[14px] transition-colors">H1</button>
                 <button onClick={(e) => {e.preventDefault(); handleFormat('formatBlock', 'H2'); setShowFormat(false)}} className="flex-1 py-1.5 text-xs font-semibold text-gray-800 dark:text-gray-200 hover:bg-white dark:hover:bg-white/10 rounded-[14px] transition-colors">H2</button>
                 <button onClick={(e) => {e.preventDefault(); handleFormat('formatBlock', 'H3'); setShowFormat(false)}} className="flex-1 py-1.5 text-xs text-gray-800 dark:text-gray-200 hover:bg-white dark:hover:bg-white/10 rounded-[14px] transition-colors">H3</button>
              </div>
              <div className="flex rounded-[20px] overflow-hidden bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/5 drop-shadow-sm p-1 gap-1">
                 <button onClick={(e) => {e.preventDefault(); handleFormat('bold')}} className="flex-1 py-1.5 font-bold text-gray-800 dark:text-gray-200 hover:bg-white dark:hover:bg-white/10 rounded-[14px] transition-colors">B</button>
                 <button onClick={(e) => {e.preventDefault(); handleFormat('italic')}} className="flex-1 py-1.5 italic text-gray-800 dark:text-gray-200 hover:bg-white dark:hover:bg-white/10 rounded-[14px] transition-colors">I</button>
                 <button onClick={(e) => {e.preventDefault(); handleFormat('underline')}} className="flex-1 py-1.5 underline text-gray-800 dark:text-gray-200 hover:bg-white dark:hover:bg-white/10 rounded-[14px] transition-colors">U</button>
                 <button onClick={(e) => {e.preventDefault(); handleFormat('strikeThrough')}} className="flex-1 py-1.5 line-through text-gray-800 dark:text-gray-200 hover:bg-white dark:hover:bg-white/10 rounded-[14px] transition-colors">S</button>
              </div>
              <div className="flex justify-between items-center px-1 mt-1">
                 {['#FF453A', '#30D158', '#0A84FF', '#FF9F0A', '#BF5AF2'].map(color => (
                    <button 
                       key={color}
                       onClick={(e) => { 
                          e.preventDefault(); 
                          e.stopPropagation(); 
                          handleTextColor(color);
                       }}
                       className="w-6 h-6 rounded-full transition-all duration-300 active:scale-90 hover:scale-110 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                       style={{ backgroundColor: color }}
                    />
                 ))}
                 <button 
                    onClick={(e) => { 
                       e.preventDefault(); 
                       e.stopPropagation(); 
                       handleTextColor(null);
                    }}
                    className="w-6 h-6 rounded-full transition-all duration-300 active:scale-90 hover:scale-110 shadow-sm ring-1 ring-black/5 dark:ring-white/10 bg-white dark:bg-black flex items-center justify-center relative overflow-hidden"
                 >
                    <div className="absolute w-[120%] h-[1.5px] bg-red-400/80 -rotate-45 pointer-events-none" />
                 </button>
              </div>
           </motion.div>
         )}
       </AnimatePresence>
    </div>
  )
});

// --- App Root ---

const screenVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? '100%' : '-100%',
    zIndex: dir > 0 ? 10 : 0,
    boxShadow: dir > 0 ? '-20px 0 30px rgba(0,0,0,0.1)' : 'none',
  }),
  center: {
    x: '0%',
    zIndex: 5,
    boxShadow: '0 0 0 rgba(0,0,0,0)',
  },
  exit: (dir: number) => ({
    x: dir > 0 ? '-30%' : '100%',
    zIndex: dir > 0 ? 0 : 10,
    opacity: dir > 0 ? 0.8 : 1
  })
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [exportCode, setExportCode] = useState<string | null>(null);
  const [importMode, setImportMode] = useState(false);
  const [importInput, setImportInput] = useState('');

  useEffect(() => {
     const unsub = onAuthStateChanged(auth, (u) => {
        setUser(u);
        setAuthLoading(false);
     });
     return () => unsub();
  }, []);

  const [viewMode, setViewMode] = useState<'notes' | 'deleted'>('notes');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | undefined>(undefined);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [notesListVisible, setNotesListVisible] = useState(true);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
         setSidebarVisible(true);
         setNotesListVisible(false);
      } else {
         setSidebarVisible(true);
         setNotesListVisible(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isFullScreen = !sidebarVisible && !notesListVisible;

  const toggleFullScreen = () => {
    if (isFullScreen) {
      setSidebarVisible(true);
      setNotesListVisible(true);
    } else {
      setSidebarVisible(false);
      setNotesListVisible(false);
    }
  };

  const handleNavToFolder = (type: string, id?: string) => {
     if (type === 'deleted') {
        setViewMode('deleted');
        setActiveFolderId(undefined);
     } else if (type === 'notes') {
        setViewMode('notes');
        setActiveFolderId(id);
     }
     setActiveNoteId(null);
     
     if (window.innerWidth < 768) {
        setSidebarVisible(false);
        setNotesListVisible(true);
     }
  };

  const [defaultFolderName, setDefaultFolderName] = useState(() => localStorage.getItem('defaultFolderName') || 'Documents');
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => typeof window !== 'undefined' ? (localStorage.getItem('theme') as 'light' | 'dark' || 'light') : 'light');
  const [zoomLevel, setZoomLevel] = useState<number>(() => typeof window !== 'undefined' ? Number(localStorage.getItem('zoomLevel')) || 100 : 100);
  const [glassEffect, setGlassEffect] = useState<boolean>(true);
  const [accentColor, setAccentColor] = useState<string>(() => typeof window !== 'undefined' ? (localStorage.getItem('accentColor') || '#FF9F0A') : '#FF9F0A');

  useEffect(() => {
     document.documentElement.style.setProperty('--app-accent', accentColor);
  }, [accentColor]);
  const [guestMode, setGuestMode] = useState(() => localStorage.getItem('guestMode') === 'true');
  const [guestName, setGuestName] = useState(() => localStorage.getItem('guestName') || 'Guest');
  
  const activeSyncKey = user ? user.uid : null;
  
  useEffect(() => {
     localStorage.setItem('zoomLevel', String(zoomLevel));
     document.documentElement.style.fontSize = zoomLevel + '%';
  }, [zoomLevel]);
  

  const activeNoteIdRef = useRef(activeNoteId);
  useEffect(() => { activeNoteIdRef.current = activeNoteId; }, [activeNoteId]);
  
  

  useEffect(() => {
     localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    const savedNotes = localStorage.getItem('notes');
    const savedFolders = localStorage.getItem('folders');
    if (savedNotes) {
       try {
          const parsed = JSON.parse(savedNotes);
          setNotes(parsed.map((n:any)=>({...n, date: new Date(n.date)})));
       } catch (e) {}
    }
    if (savedFolders) {
       try { setFolders(JSON.parse(savedFolders)); } catch (e) {}
    }
  }, []);

  // Sync to localstorage
  useEffect(() => {
     localStorage.setItem('notes', JSON.stringify(notes));
     localStorage.setItem('folders', JSON.stringify(folders));
  }, [notes, folders]);

  const [initialSyncReady, setInitialSyncReady] = useState(false);

  // Firestore SyncKey integration
  useEffect(() => {
     if (activeSyncKey) {
        // Sync down from Firestore
        const docId = hashKey(activeSyncKey);
        const unsub = onSnapshot(doc(db, 'sync_spaces', docId), (docSnap) => {
           if (docSnap.exists()) {
               const data = docSnap.data();
               if (data.encryptedPayload) {
                  const decrypted = decryptData(data.encryptedPayload, activeSyncKey);
                  if (decrypted) {
                     const lastSync = (window as any).lastSyncPushTime || 0;
                     if (data.updatedAt && data.updatedAt > lastSync) {
                        setNotes(decrypted.notes.map((n: any) => ({...n, date: new Date(n.date)})));
                        setFolders(decrypted.folders);
                     }
                  }
               }
           }
           setInitialSyncReady(true);
        });
        return () => unsub();
     } else {
        setInitialSyncReady(true);
     }
  }, [activeSyncKey]);

  // Push to Firestore if we have a syncKey
  useEffect(() => {
     if (activeSyncKey && initialSyncReady) {
        const docId = hashKey(activeSyncKey);
        const timeout = setTimeout(() => {
           const payload = encryptData({ notes, folders }, activeSyncKey);
           const now = Date.now();
           (window as any).lastSyncPushTime = now;
           setDoc(doc(db, 'sync_spaces', docId), {
              encryptedPayload: payload,
              updatedAt: now
           }, { merge: true });
        }, 1500);
        return () => clearTimeout(timeout);
     }
  }, [notes, folders, activeSyncKey, initialSyncReady]);

  const activeNote = notes.find(n => n.id === activeNoteId);

  const createNewNote = useCallback(async () => {
    const id = genId();
    const newNote = { id, content: '<div><br></div>', date: new Date(), isPinned: false, isDeleted: false, folderId: activeFolderId };
    
    // Optimistic UI updates
    setNotes(prev => [newNote, ...prev]);
    setActiveNoteId(id);
    setViewMode('notes');
    if (isMobile) {
       setNotesListVisible(false);
       setSidebarVisible(false);
    }
    
    setTimeout(() => {
       const editor = document.querySelector('.editor-canvas') as HTMLElement;
       if (editor) editor.focus();
    }, 100);
  }, [activeFolderId, isMobile]);

  const createFolder = async (name: string) => {
     const id = genId();
     const newFolder = { id, name, color: '#FFD670' };
     setFolders(prev => [...prev, newFolder]);
  };

  const deleteNote = async (id: string) => {
    if (viewMode === 'deleted') {
       setNotes(ns => ns.filter(n => n.id !== id));
    } else {
       setNotes(ns => ns.map(n => n.id === id ? {...n, isDeleted: true} : n));
    }
  };

  const pinNote = async (id: string) => {
    const n = notes.find(n => n.id === id);
    if (!n) return;
    setNotes(ns => ns.map(n => n.id === id ? {...n, isPinned: !n.isPinned} : n));
  };

  const recoverAllDeleted = async () => {
     setNotes(ns => ns.map(n => n.isDeleted ? { ...n, isDeleted: false } : n));
  };

  const deleteAllDeleted = async () => {
     setNotes(ns => ns.filter(n => !n.isDeleted));
  };

  const updateTimeoutRef = useRef<any>(null);

  const updateNote = useCallback((html: string) => {
     if (!activeNoteIdRef.current) return;
     if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
     
     updateTimeoutRef.current = setTimeout(async () => {
        const id = activeNoteIdRef.current;
        setNotes(ns => ns.map(n => n.id === id ? {...n, content: html, date: new Date()} : n));
     }, 1000);
  }, []);

  const updateFolderColor = async (id: string, color: string) => {
     setFolders(prev => prev.map(f => f.id === id ? { ...f, color } : f));
  };

  const renameFolder = async (id: string, name: string) => {
     if (!id) {
         setDefaultFolderName(name);
         localStorage.setItem('defaultFolderName', name);
         return;
     }
     setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f));
  };

  const deleteFolder = async (id: string) => {
     if (!id) {
         // for default folder, we can just clear it or move everything to deleted?
         setNotes(ns => ns.map(n => !n.folderId ? { ...n, isDeleted: true } : n));
         setDefaultFolderName('Notes');
         localStorage.setItem('defaultFolderName', 'Notes');
         return;
     }

     setFolders(prev => prev.filter(f => f.id !== id));
     setNotes(ns => ns.map(n => n.folderId === id ? { ...n, folderId: undefined, isDeleted: true } : n));
     if (activeFolderId === id) {
        setActiveFolderId(null);
        setViewMode('notes');
     }
  };

  if (authLoading) return <div className="h-[100dvh] w-full flex items-center justify-center bg-[#F2F1F6] dark:bg-[#050505]"><div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin"></div></div>;

  if (!guestMode && !user) {
     return (
       <div className={`theme-${theme} ${theme === 'dark' ? 'dark' : ''} h-[100dvh]`}>
         <StartScreen 
           onGuestEnter={(name: string) => { 
             localStorage.setItem('guestMode', 'true');
             if(name) localStorage.setItem('guestName', name);
             setGuestName(name || 'Guest');
             setGuestMode(true); 
           }}
           theme={theme}
           setTheme={setTheme}
         />
       </div>
     );
  }

  return (
    <div className={`theme-${theme} ${theme === 'dark' ? 'dark' : ''} flex w-full h-[100dvh] relative ${isMobile ? '' : 'gap-3 p-3'} overflow-hidden bg-[#F2F1F6] dark:bg-[#050505] font-sans text-gray-900 dark:text-white`}>
       <style dangerouslySetInnerHTML={{__html: `
          @keyframes float1 {
            0%, 100% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); }
            33% { transform: translate3d(5%, 5%, 0) scale(1.05) rotate(2deg); }
            66% { transform: translate3d(-5%, 8%, 0) scale(0.95) rotate(-2deg); }
          }
          @keyframes float2 {
            0%, 100% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); }
            33% { transform: translate3d(-8%, -5%, 0) scale(0.95) rotate(-2deg); }
            66% { transform: translate3d(5%, -8%, 0) scale(1.05) rotate(2deg); }
          }
          .animate-float1 { animation: float1 25s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
          .animate-float2 { animation: float2 30s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
          .editor-canvas {
            outline: none;
            min-height: calc(100vh - 150px);
            padding-bottom: 30vh;
            max-width: 100%;
            overflow-wrap: break-word;
            word-wrap: break-word;
            word-break: break-word;
          }
          .editor-canvas > div:first-child:empty:before,
          .editor-canvas > p:first-child:empty:before,
          .editor-canvas > h1:first-child:empty:before,
          .editor-canvas > div:first-child:has(> br:only-child):before,
          .editor-canvas > p:first-child:has(> br:only-child):before,
          .editor-canvas > h1:first-child:has(> br:only-child):before {
            content: "Title";
            color: #9CA3AF;
            pointer-events: none;
            display: inline-block;
          }
          .editor-canvas:has(> *:first-child:empty:last-child):after,
          .editor-canvas:has(> *:first-child:has(> br:only-child):last-child):after {
            content: "Start writing...";
            color: #D1D5DB;
            font-size: 1.125rem;
            font-weight: 400;
            line-height: 1.5;
            pointer-events: none;
            display: block;
            margin-top: 1rem;
          }
          .theme-dark .editor-canvas > *:first-child:empty:before,
          .theme-dark .editor-canvas > *:first-child:has(> br:only-child):before { color: #6B7280; }
          .theme-dark .editor-canvas:has(> *:first-child:empty:last-child):after,
          .theme-dark .editor-canvas:has(> *:first-child:has(> br:only-child):last-child):after { color: #4B5563; }
          .goal-text:empty:before,
          .goal-text:has(> br:only-child):before {
            content: "New goal...";
            color: #9CA3AF;
            pointer-events: none;
            display: inline-block;
          }
          .goal-text {
            min-width: 0;
            overflow-wrap: break-word;
            word-break: break-word;
            word-wrap: break-word;
          }
          .theme-dark .goal-text:empty:before,
          .theme-dark .goal-text:has(> br:only-child):before {
            color: #6B7280;
          }
          .editor-canvas > div:first-child,
          .editor-canvas > p:first-child,
          .editor-canvas:not(:has(*)):first-line {
            font-size: 2.25rem;
            font-weight: 700;
            line-height: 1.1;
            margin-bottom: 0px;
          }
          .editor-canvas h1 { font-size: 2.25rem; font-weight: bold; line-height: 1.1; margin-bottom: 0px; }
          .editor-canvas h2 { font-size: 1.5rem; font-weight: bold; margin-bottom: 0px; }
          .editor-canvas h3 { font-size: 1.125rem; font-weight: 600; margin-bottom: 0px; }
          .editor-canvas ul { list-style-type: 'disc'; padding-left: 1.5rem; margin-bottom: 0.5rem; color: inherit; }
          .editor-canvas table { border-color: inherit; }
          .editor-canvas td { border-color: inherit; }
           .theme-dark .editor-canvas table, .theme-dark .editor-canvas td { border-color: #38383A; }
          .editor-canvas span[style*="background-color: rgba"] {
             border-radius: 6px;
             padding: 0.1em 0.2rem;
             margin: 0 -0.1em;
             box-decoration-break: clone;
             -webkit-box-decoration-break: clone;
          }
        `}} />
       
       {/* bg removed */}

       <AnimatePresence initial={false}>
         {sidebarVisible && (
           <motion.div
             initial={{ width: isMobile ? '100vw' : 0, opacity: 0, x: isMobile ? -20 : 0 }}
             animate={{ width: isMobile ? '100vw' : 280, opacity: 1, x: 0 }}
             exit={{ width: isMobile ? '100vw' : 0, opacity: 0, x: isMobile ? -20 : 0 }}
             transition={{ type: "spring", stiffness: 400, damping: 32 }}
             className={`h-full shrink-0 overflow-hidden z-40 transition-all bg-transparent ${isMobile ? 'absolute inset-0' : 'relative'}`}
           >
              <FoldersScreen 
                 defaultFolderName={defaultFolderName}
                 notesCount={notes.filter(n=>!n.isDeleted && !n.folderId).length}
                 deletedCount={notes.filter(n=>n.isDeleted).length}
                 getFolderCount={(id: string) => notes.filter(n=>!n.isDeleted && n.folderId === id).length}
                 folders={folders}
                 onCreateFolder={createFolder}
                 onUpdateFolderColor={updateFolderColor}
                 onRenameFolder={renameFolder}
                 onDeleteFolder={deleteFolder}
                 onNavigate={handleNavToFolder}
                 onCreate={() => { handleNavToFolder('notes'); setTimeout(createNewNote, 50); }}
                 onToggleSidebar={() => setSidebarVisible(!sidebarVisible)}
                 glassEffect={glassEffect}
              />
           </motion.div>
         )}
       </AnimatePresence>

       <AnimatePresence initial={false}>
         {notesListVisible && (
           <motion.div
             initial={{ width: isMobile ? '100vw' : 0, opacity: 0, x: isMobile ? 20 : 0 }}
             animate={{ width: isMobile ? '100vw' : 320, opacity: 1, x: 0 }}
             exit={{ width: isMobile ? '100vw' : 0, opacity: 0, x: isMobile ? 20 : 0 }}
             transition={{ type: "spring", stiffness: 400, damping: 32 }}
             className={`h-full shrink-0 z-30 flex overflow-hidden transition-all bg-transparent ${isMobile ? 'absolute inset-0' : 'relative'}`}
           >
              <NotesScreen
                 syncKey={activeSyncKey}
                 activeNoteId={activeNoteId}
                 activeFolderId={activeFolderId}
                 folderName={activeFolderId ? folders.find(f => f.id === activeFolderId)?.name : 'Documents'}
                 isDeletedMode={viewMode === 'deleted'}
                 notes={notes}
                 onExportData={() => {
                    const encoded = encryptData({notes, folders}, 'local-export');
                    setExportCode(encoded);
                 }}
                 onImportData={() => {
                    setImportInput('');
                    setImportMode(true);
                 }}
                 guestName={user ? (user.displayName || user.email?.split('@')[0] || 'User') : guestName}
                 onBack={() => {
                    if (isMobile) {
                       setSidebarVisible(true);
                       setNotesListVisible(false);
                    }
                 }}
                 onCreate={createNewNote}
                 onNoteClick={(id: string) => { setActiveNoteId(id); if (isMobile) setNotesListVisible(false); }}
                 onDelete={deleteNote}
                 onPin={pinNote}
                 onToggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
                 theme={theme}
                 zoomLevel={zoomLevel}
                 onZoomChange={setZoomLevel}
                 sidebarVisible={sidebarVisible}
                 onToggleSidebar={() => setSidebarVisible(!sidebarVisible)}
                 onRecoverAll={recoverAllDeleted}
                 onDeleteAll={deleteAllDeleted}
                 glassEffect={glassEffect}
                 setGlassEffect={setGlassEffect}
                 accentColor={accentColor}
                 setAccentColor={setAccentColor}
              />
           </motion.div>
         )}
       </AnimatePresence>

       <div className={`flex-1 h-full flex flex-col overflow-hidden z-20 transition-all duration-300 bg-transparent ${isMobile ? 'absolute inset-0' : 'relative'}`}>
          {activeNote ? (
             <Editor 
                note={activeNote}
                onBack={() => {
                   setActiveNoteId(null);
                   if (isMobile) setNotesListVisible(true);
                }}
                onUpdate={updateNote}
                onToggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
                theme={theme}
                zoomLevel={zoomLevel}
                onZoomChange={setZoomLevel}
                sidebarVisible={sidebarVisible}
                isFullScreen={isFullScreen}
                onToggleFullScreen={toggleFullScreen}
                isMobile={isMobile}
                glassEffect={glassEffect}
             />
          ) : (
             <div className={`flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 md:rounded-3xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10 shadow-sm ${glassEffect ? 'bg-white/40 dark:bg-[#111111]/80 backdrop-blur-[80px]' : 'bg-white dark:bg-[#111111]'}`}>
                <FileText className="w-16 h-16 opacity-30 mb-4" />
                <p className="text-lg font-medium">Select a note</p>
             </div>
          )}
       </div>

       {exportCode && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
           <div className={`p-6 rounded-3xl shadow-xl max-w-md w-full border border-black/5 dark:border-white/10 ${glassEffect ? 'bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-3xl' : 'bg-white dark:bg-[#1C1C1E]'}`}>
             <h3 className="text-lg font-bold mb-2">Export Data</h3>
             <p className="text-sm opacity-70 mb-4 text-gray-600 dark:text-gray-400">Copy your encrypted Code below. Do not share this openly!</p>
             <textarea 
               readOnly 
               className="w-full h-32 p-3 text-xs leading-relaxed break-all rounded-xl border focus:outline-none mb-4 resize-none bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-gray-800 dark:text-gray-200"
               value={exportCode} 
               onClick={(e) => (e.target as HTMLTextAreaElement).select()}
             />
             <div className="flex gap-3">
               <button onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(exportCode).then(() => alert('Copied to clipboard!'));
                  }
               }} className="flex-1 py-3 text-sm font-semibold rounded-xl bg-accent text-white hover:opacity-90 transition-all">Copy</button>
               <button onClick={() => setExportCode(null)} className="flex-1 py-3 text-sm font-semibold rounded-xl ring-1 ring-inset ring-black/10 dark:ring-white/10 hover:bg-black/5 dark:hover:bg-white/10 transition-all">Close</button>
             </div>
           </div>
         </div>
       )}

       {importMode && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
           <div className={`p-6 rounded-3xl shadow-xl max-w-md w-full border border-black/5 dark:border-white/10 ${glassEffect ? 'bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-3xl' : 'bg-white dark:bg-[#1C1C1E]'}`}>
             <h3 className="text-lg font-bold mb-2">Import Data</h3>
             <p className="text-sm opacity-70 mb-4 text-gray-600 dark:text-gray-400">Paste your encrypted Data Code below. This will overwrite conflicting items.</p>
             <textarea 
               value={importInput}
               onChange={(e) => setImportInput(e.target.value)}
               placeholder="Paste Data Code here..."
               className="w-full h-32 p-3 text-xs leading-relaxed break-all rounded-xl border focus:outline-none mb-4 resize-none bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-gray-800 dark:text-gray-200"
             />
             <div className="flex gap-3">
               <button onClick={() => {
                   try {
                      const decoded = decryptData(importInput, 'local-export');
                      if (decoded && decoded.notes && decoded.folders) {
                         setNotes(decoded.notes.map((n: any) => ({...n, date: new Date(n.date)})));
                         setFolders(decoded.folders);
                         setImportMode(false);
                         alert('Data imported successfully!');
                      } else {
                         alert('Invalid code.');
                      }
                   } catch (e) {
                      alert('Invalid Data Code.');
                   }
               }} className="flex-1 py-3 text-sm font-semibold rounded-xl bg-accent text-white hover:opacity-90 transition-all">Import</button>
               <button onClick={() => setImportMode(false)} className="flex-1 py-3 text-sm font-semibold rounded-xl ring-1 ring-inset ring-black/10 dark:ring-white/10 hover:bg-black/5 dark:hover:bg-white/10 transition-all">Cancel</button>
             </div>
           </div>
         </div>
       )}
    </div>
  )
}
