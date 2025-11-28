import React, { useState, useEffect } from 'react';
import { Material, User, LogEntry } from '../types';
import { logger } from '../services/loggerService';
import { PlayCircleIcon, DocumentTextIcon, MusicalNoteIcon, PhotoIcon, ChartPieIcon, CheckCircleIcon, BookOpenIcon } from '@heroicons/react/24/solid';

interface ParticipantHomeProps {
  user: User;
  materials: Material[];
  onOpenMaterial: (material: Material) => void;
}

const ParticipantHome: React.FC<ParticipantHomeProps> = ({ user, materials, onOpenMaterial }) => {
  const [readHistory, setReadHistory] = useState<Set<string>>(new Set());

  useEffect(() => {
    const updateStats = (currentLogs: LogEntry[]) => {
      // Identify materials that have been opened/started by the user
      const userReads = new Set(
        currentLogs
          .filter(l => l.userId === user.id && l.action === 'OPEN_MATERIAL' && l.materialId)
          .map(l => l.materialId!)
      );
      setReadHistory(userReads);
    };

    updateStats(logger.getLogs());
    const unsub = logger.subscribe(updateStats);
    return unsub;
  }, [user.id]);

  const myMaterials = materials.filter(m => m.assignedToUserIds.includes(user.id));
  
  const totalAssigned = myMaterials.length;
  const finishedCount = myMaterials.filter(m => readHistory.has(m.id)).length;
  const remainingCount = totalAssigned - finishedCount;

  const getIcon = (type: string) => {
    switch(type) {
      case 'VIDEO': return <PlayCircleIcon className="w-8 h-8 text-white/90" />;
      case 'AUDIO': return <MusicalNoteIcon className="w-8 h-8 text-white/90" />;
      case 'IMAGE': return <PhotoIcon className="w-8 h-8 text-white/90" />;
      default: return <DocumentTextIcon className="w-8 h-8 text-white/90" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-10 pb-20">
      <header className="flex items-center gap-4 py-6 border-b border-gray-100">
         <img src={user.avatarUrl} alt="avatar" className="w-16 h-16 rounded-full border-2 border-brand-200" />
         <div>
           <h1 className="text-3xl font-serif font-bold text-gray-900">Welcome, {user.name.split(' ')[0]}</h1>
           <p className="text-gray-500">Ready to continue your research?</p>
         </div>
      </header>

      {/* Statistics Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-50 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <BookOpenIcon className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Assigned</p>
            <p className="text-3xl font-bold text-gray-900">{totalAssigned}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-50 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <CheckCircleIcon className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Read / Started</p>
            <p className="text-3xl font-bold text-gray-900">{finishedCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-50 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
            <ChartPieIcon className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Remaining</p>
            <p className="text-3xl font-bold text-gray-900">{remainingCount}</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="w-1 h-6 bg-brand-500 rounded-full block"></span>
          Your Library
        </h2>
        
        {myMaterials.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
            <p className="text-gray-400">No materials assigned yet. Please contact the administrator.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {myMaterials.map(mat => {
              const isRead = readHistory.has(mat.id);
              return (
                <div 
                  key={mat.id} 
                  onClick={() => onOpenMaterial(mat)}
                  className="group cursor-pointer flex flex-col gap-3 relative"
                >
                  <div className="aspect-[2/3] relative rounded-xl overflow-hidden shadow-md group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300 bg-gray-200">
                    <img src={mat.coverUrl} alt={mat.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                       <div className="bg-black/30 p-3 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity scale-75 group-hover:scale-100 duration-300">
                         {getIcon(mat.type)}
                       </div>
                    </div>
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded text-[10px] text-white font-medium uppercase tracking-wide">
                      {mat.type}
                    </div>
                    {isRead && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-500"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 line-clamp-1 group-hover:text-brand-600 transition-colors">{mat.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-1">{mat.author}</p>
                  </div>
                  {isRead && (
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur rounded-full p-1 shadow-sm">
                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Simulated "Recommended" Section for aesthetics */}
      <section className="opacity-60 pointer-events-none grayscale">
         <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="w-1 h-6 bg-gray-300 rounded-full block"></span>
          Recommended (Locked)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => (
               <div key={i} className="aspect-[2/3] bg-gray-200 rounded-xl animate-pulse"></div>
            ))}
        </div>
      </section>
    </div>
  );
};

export default ParticipantHome;