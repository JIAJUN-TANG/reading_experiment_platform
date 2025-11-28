import React, { useState, useEffect } from 'react';
import { User, Material, LogEntry, MaterialType, FormTemplate } from '../types';
import { logger } from '../services/loggerService';
import { MOCK_FORMS } from '../services/mockDatabase';
import { 
  ChartBarIcon, 
  UsersIcon, 
  DocumentTextIcon, 
  PlusIcon, 
  XMarkIcon, 
  ClipboardDocumentCheckIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { ResponsiveContainer, XAxis, YAxis, Tooltip, LineChart, Line } from 'recharts';

interface AdminDashboardProps {
  users: User[];
  materials: Material[];
  setMaterials: React.Dispatch<React.SetStateAction<Material[]>>;
}

type TabType = 'materials' | 'participants' | 'statistics' | 'forms';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ users, materials, setMaterials }) => {
  const [activeTab, setActiveTab] = useState<TabType>('materials');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]); // For assignment
  const [forms, setForms] = useState<FormTemplate[]>(MOCK_FORMS);

  // Material Creation State
  const [isCreatingMaterial, setIsCreatingMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState<{
    title: string;
    author: string;
    type: MaterialType;
    content: string;
    coverUrl: string;
  }>({
    title: '',
    author: '',
    type: MaterialType.TEXT,
    content: '',
    coverUrl: 'https://picsum.photos/300/450',
  });

  // Form Creation State
  const [isCreatingForm, setIsCreatingForm] = useState(false);
  const [newForm, setNewForm] = useState<{
    title: string;
    type: 'CONSENT' | 'QUESTIONNAIRE';
    content: string;
    questions: string[];
    currentQuestionInput: string;
  }>({
    title: '',
    type: 'CONSENT',
    content: '',
    questions: [],
    currentQuestionInput: ''
  });

  useEffect(() => {
    setLogs(logger.getLogs());
    const unsub = logger.subscribe((updatedLogs) => setLogs([...updatedLogs]));
    return unsub;
  }, []);

  // Compute Stats
  const participantLogs = logs.filter(l => users.find(u => u.id === l.userId)?.role === 'PARTICIPANT');
  const uniqueParticipants = new Set(participantLogs.map(l => l.userId)).size;
  const totalReads = participantLogs.filter(l => l.action === 'OPEN_MATERIAL').length;
  const aiQueries = participantLogs.filter(l => l.action === 'AI_QUERY').length;

  // Chart Data Preparation
  const activityData = logs.reduce((acc: any[], log) => {
    const hour = new Date(log.timestamp).getHours() + ':00';
    const existing = acc.find((a: any) => a.time === hour);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ time: hour, count: 1 });
    }
    return acc;
  }, []).sort((a: any, b: any) => parseInt(a.time) - parseInt(b.time));

  // --- Handlers ---

  const handleAssign = (materialId: string) => {
    if (selectedUsers.length === 0) return;
    setMaterials(prev => prev.map(m => {
      if (m.id === materialId) {
        const newSet = new Set([...m.assignedToUserIds, ...selectedUsers]);
        return { ...m, assignedToUserIds: Array.from(newSet) };
      }
      return m;
    }));
    alert(`Assigned material to ${selectedUsers.length} users.`);
    setSelectedUsers([]);
  };

  const handleCreateMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.title || !newMaterial.content) return;

    const material: Material = {
      id: Math.random().toString(36).substring(7),
      title: newMaterial.title,
      author: newMaterial.author || 'Unknown',
      type: newMaterial.type,
      content: newMaterial.content,
      coverUrl: newMaterial.coverUrl,
      assignedToUserIds: []
    };

    setMaterials(prev => [material, ...prev]);
    setIsCreatingMaterial(false);
    setNewMaterial({
      title: '',
      author: '',
      type: MaterialType.TEXT,
      content: '',
      coverUrl: 'https://picsum.photos/300/450',
    });
    logger.log({ id: 'admin', name: 'Admin', role: 'ADMIN' } as any, 'CREATE_MATERIAL', `Created ${material.title}`);
  };

  const handleAddQuestion = () => {
    if (newForm.currentQuestionInput.trim()) {
      setNewForm(prev => ({
        ...prev,
        questions: [...prev.questions, prev.currentQuestionInput.trim()],
        currentQuestionInput: ''
      }));
    }
  };

  const handleCreateForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.title) return;

    const form: FormTemplate = {
      id: Math.random().toString(36).substring(7),
      title: newForm.title,
      type: newForm.type,
      content: newForm.content,
      questions: newForm.type === 'QUESTIONNAIRE' ? newForm.questions : undefined,
      createdAt: Date.now()
    };

    setForms(prev => [form, ...prev]);
    setIsCreatingForm(false);
    setNewForm({
      title: '',
      type: 'CONSENT',
      content: '',
      questions: [],
      currentQuestionInput: ''
    });
    logger.log({ id: 'admin', name: 'Admin', role: 'ADMIN' } as any, 'CREATE_FORM', `Created ${form.title}`);
  };

  const handleDeleteForm = (id: string) => {
    if(window.confirm('Are you sure you want to delete this form?')) {
      setForms(prev => prev.filter(f => f.id !== id));
    }
  };

  // --- Renders ---

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header & Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <h1 className="text-3xl font-serif font-bold text-gray-900">Admin Dashboard</h1>
           <p className="text-gray-500">Manage research materials, participants, and forms</p>
        </div>
        <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-gray-200">
          {[
            { id: 'materials', icon: DocumentTextIcon, label: 'Materials' },
            { id: 'participants', icon: UsersIcon, label: 'Participants' },
            { id: 'statistics', icon: ChartBarIcon, label: 'Statistics' },
            { id: 'forms', icon: ClipboardDocumentCheckIcon, label: 'Forms' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-brand-50 text-brand-700 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* --- STATISTICS TAB (Merged Stats + Logs) --- */}
      {activeTab === 'statistics' && (
        <div className="space-y-8 animate-fade-in">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Active Participants</h3>
              <div className="flex items-end justify-between">
                <p className="text-4xl font-bold text-gray-900">{uniqueParticipants}</p>
                <UsersIcon className="w-8 h-8 text-brand-200" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Reading Sessions</h3>
              <div className="flex items-end justify-between">
                 <p className="text-4xl font-bold text-gray-900">{totalReads}</p>
                 <DocumentTextIcon className="w-8 h-8 text-green-200" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">AI Queries</h3>
              <div className="flex items-end justify-between">
                <p className="text-4xl font-bold text-gray-900">{aiQueries}</p>
                <ChartBarIcon className="w-8 h-8 text-purple-200" />
              </div>
            </div>
          </div>
          
          {/* Chart Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-96">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Activity Timeline (Hourly)</h3>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={activityData}>
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#0ea5e9" 
                  strokeWidth={3} 
                  dot={{r: 4, fill: '#0ea5e9', strokeWidth: 0}} 
                  activeDot={{r: 6}}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Logs Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
               <h3 className="text-lg font-bold text-gray-800">System Logs</h3>
               <p className="text-sm text-gray-500">Real-time monitoring of user actions</p>
            </div>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Time</th>
                    <th className="px-6 py-3 font-semibold">User</th>
                    <th className="px-6 py-3 font-semibold">Action</th>
                    <th className="px-6 py-3 font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-400">No logs recorded yet.</td>
                    </tr>
                  ) : logs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 whitespace-nowrap text-gray-400 font-mono text-xs">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-3 font-medium text-gray-900">{log.userName}</td>
                      <td className="px-6 py-3">
                        <span className={`
                          px-2.5 py-1 rounded-full text-xs font-bold
                          ${log.action === 'AI_QUERY' ? 'bg-purple-100 text-purple-700' : 
                            log.action.includes('MEDIA') ? 'bg-blue-100 text-blue-700' :
                            log.action === 'OPEN_MATERIAL' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-600'}
                        `}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-600 max-w-md truncate">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- MATERIALS TAB --- */}
      {activeTab === 'materials' && (
        <div className="space-y-8 animate-fade-in">
           {/* Assignment & Actions Bar */}
           <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-6">
             <div className="bg-white p-2 rounded-xl border shadow-sm flex flex-col sm:flex-row items-center gap-4 flex-1">
                <div className="px-4 py-2 bg-gray-50 rounded-lg text-sm text-gray-500 font-medium whitespace-nowrap">
                   Assign Selected To:
                </div>
                <select 
                   multiple 
                   className="block w-full sm:flex-1 rounded-lg border-gray-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm p-2.5 min-h-[50px]"
                   onChange={(e) => {
                      const options = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
                      setSelectedUsers(options);
                   }}
                >
                   {users.filter(u => u.role === 'PARTICIPANT').map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                   ))}
                </select>
                <div className="text-xs text-gray-400 px-2 hidden sm:block">
                  (Hold Ctrl to select multiple)
                </div>
             </div>

             <button
               onClick={() => setIsCreatingMaterial(true)}
               className="flex items-center justify-center gap-2 px-8 py-4 bg-brand-600 text-white rounded-xl hover:bg-brand-700 shadow-md hover:shadow-lg font-semibold transition-all"
             >
               <PlusIcon className="w-5 h-5" />
               New Material
             </button>
           </div>

           {/* Create Material Form Modal/Panel */}
           {isCreatingMaterial && (
             <div className="bg-white p-8 rounded-2xl shadow-xl border border-brand-100 animate-slide-in-top">
               <div className="flex justify-between items-center mb-8 pb-4 border-b">
                 <div>
                    <h2 className="text-xl font-bold text-gray-900">Add Learning Material</h2>
                    <p className="text-gray-500 text-sm">Create content for participants to read or watch.</p>
                 </div>
                 <button onClick={() => setIsCreatingMaterial(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                   <XMarkIcon className="w-5 h-5 text-gray-600" />
                 </button>
               </div>
               
               <form onSubmit={handleCreateMaterial} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                     <input 
                       required
                       type="text" 
                       value={newMaterial.title}
                       onChange={e => setNewMaterial({...newMaterial, title: e.target.value})}
                       className="w-full rounded-xl border-gray-300 focus:ring-brand-500 focus:border-brand-500 py-2.5 px-4"
                       placeholder="e.g. Introduction to Neural Networks"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-2">Author</label>
                     <input 
                       type="text" 
                       value={newMaterial.author}
                       onChange={e => setNewMaterial({...newMaterial, author: e.target.value})}
                       className="w-full rounded-xl border-gray-300 focus:ring-brand-500 focus:border-brand-500 py-2.5 px-4"
                       placeholder="e.g. Dr. Jane Doe"
                     />
                   </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-2">Content Type</label>
                     <select 
                       value={newMaterial.type}
                       onChange={e => setNewMaterial({...newMaterial, type: e.target.value as MaterialType})}
                       className="w-full rounded-xl border-gray-300 focus:ring-brand-500 focus:border-brand-500 py-2.5 px-4 bg-white"
                     >
                       {Object.values(MaterialType).map(type => (
                         <option key={type} value={type}>{type}</option>
                       ))}
                     </select>
                   </div>
                   <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-2">Cover Image URL</label>
                     <input 
                       type="text" 
                       value={newMaterial.coverUrl}
                       onChange={e => setNewMaterial({...newMaterial, coverUrl: e.target.value})}
                       className="w-full rounded-xl border-gray-300 focus:ring-brand-500 focus:border-brand-500 py-2.5 px-4"
                     />
                   </div>
                 </div>

                 <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {newMaterial.type === MaterialType.TEXT || newMaterial.type === MaterialType.HTML 
                        ? 'Content Body' 
                        : 'Resource URL'}
                    </label>
                    {newMaterial.type === MaterialType.TEXT || newMaterial.type === MaterialType.HTML ? (
                      <textarea 
                        required
                        rows={8}
                        value={newMaterial.content}
                        onChange={e => setNewMaterial({...newMaterial, content: e.target.value})}
                        className="w-full rounded-xl border-gray-300 focus:ring-brand-500 focus:border-brand-500 font-mono text-sm p-4"
                        placeholder="Paste text content or HTML structure here..."
                      />
                    ) : (
                      <input 
                        required
                        type="url"
                        value={newMaterial.content}
                        onChange={e => setNewMaterial({...newMaterial, content: e.target.value})}
                        className="w-full rounded-xl border-gray-300 focus:ring-brand-500 focus:border-brand-500 py-2.5 px-4"
                        placeholder="https://example.com/media.mp4"
                      />
                    )}
                 </div>

                 <div className="flex justify-end gap-4 pt-6 border-t">
                   <button 
                     type="button"
                     onClick={() => setIsCreatingMaterial(false)}
                     className="px-6 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                   >
                     Cancel
                   </button>
                   <button 
                     type="submit"
                     className="px-8 py-2.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                   >
                     Create Material
                   </button>
                 </div>
               </form>
             </div>
           )}

           {/* Material Grid */}
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {materials.map(mat => (
              <div key={mat.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group hover:shadow-xl hover:border-brand-100 transition-all duration-300">
                <div className="h-40 bg-gray-100 relative overflow-hidden">
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                   <img src={mat.coverUrl} alt="" className="w-full h-full object-cover opacity-95 group-hover:scale-110 transition-transform duration-700" />
                   <div className="absolute top-3 right-3 bg-white/90 text-gray-900 text-[10px] uppercase font-bold px-2.5 py-1 rounded-md shadow-sm backdrop-blur-sm">
                     {mat.type}
                   </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-gray-900 line-clamp-1 text-lg mb-1">{mat.title}</h3>
                  <p className="text-sm text-gray-500 mb-4">{mat.author}</p>
                  
                  <div className="mt-auto">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex -space-x-2 overflow-hidden">
                         {/* Visual mock of assigned users avatars */}
                         {mat.assignedToUserIds.slice(0, 3).map(uid => (
                           <div key={uid} className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-gray-200" title={uid} />
                         ))}
                         {mat.assignedToUserIds.length > 3 && (
                           <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-[10px] text-gray-500 font-bold">
                             +{mat.assignedToUserIds.length - 3}
                           </div>
                         )}
                      </div>
                      <span className="text-xs text-gray-400 font-medium">
                        {mat.assignedToUserIds.length > 0 ? 'Assigned' : 'No assignments'}
                      </span>
                    </div>
                    
                    <button 
                      onClick={() => handleAssign(mat.id)}
                      disabled={selectedUsers.length === 0}
                      className="w-full py-2.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-brand-600 hover:text-white hover:border-brand-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-50 disabled:hover:text-gray-700 transition-all"
                    >
                      Assign Selected
                    </button>
                  </div>
                </div>
              </div>
            ))}
           </div>
        </div>
      )}

       {/* --- PARTICIPANTS TAB --- */}
       {activeTab === 'participants' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
            {users.filter(u => u.role === 'PARTICIPANT').map(u => (
               <div key={u.id} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                  <div className="relative inline-block mb-4">
                    <img src={u.avatarUrl} alt="" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-sm" />
                    <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{u.name}</h3>
                  <p className="text-xs font-semibold text-brand-600 uppercase tracking-widest mt-1 mb-6">Participant</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 border-t pt-6 bg-gray-50 -mx-8 -mb-8 pb-6 px-8 rounded-b-2xl">
                    <div className="flex flex-col">
                       <span className="font-bold text-gray-900 text-lg">{logs.filter(l => l.userId === u.id && l.action === 'OPEN_MATERIAL').length}</span>
                       <span className="text-xs uppercase text-gray-400">Reads</span>
                    </div>
                    <div className="flex flex-col">
                       <span className="font-bold text-gray-900 text-lg">{logs.filter(l => l.userId === u.id && l.action === 'AI_QUERY').length}</span>
                       <span className="text-xs uppercase text-gray-400">AI Queries</span>
                    </div>
                  </div>
               </div>
            ))}
        </div>
      )}

      {/* --- FORMS TAB (NEW) --- */}
      {activeTab === 'forms' && (
        <div className="space-y-8 animate-fade-in">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Questionnaires & Consent</h2>
              <p className="text-gray-500 text-sm">Create and manage forms for participants</p>
            </div>
            <button
               onClick={() => setIsCreatingForm(true)}
               className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 shadow-md font-medium transition-all"
             >
               <PlusIcon className="w-5 h-5" />
               Create Form
             </button>
          </div>

          {isCreatingForm && (
             <div className="bg-white p-8 rounded-2xl shadow-xl border border-brand-100 animate-slide-in-top">
               <div className="flex justify-between items-center mb-8 pb-4 border-b">
                 <h2 className="text-xl font-bold text-gray-900">New Form Template</h2>
                 <button onClick={() => setIsCreatingForm(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                   <XMarkIcon className="w-5 h-5 text-gray-600" />
                 </button>
               </div>
               
               <form onSubmit={handleCreateForm} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-2">Form Title</label>
                     <input 
                       required
                       type="text" 
                       value={newForm.title}
                       onChange={e => setNewForm({...newForm, title: e.target.value})}
                       className="w-full rounded-xl border-gray-300 focus:ring-brand-500 focus:border-brand-500 py-2.5 px-4"
                       placeholder="e.g. Pre-Reading Consent"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-2">Form Type</label>
                     <select 
                       value={newForm.type}
                       onChange={e => setNewForm({...newForm, type: e.target.value as 'CONSENT' | 'QUESTIONNAIRE'})}
                       className="w-full rounded-xl border-gray-300 focus:ring-brand-500 focus:border-brand-500 py-2.5 px-4 bg-white"
                     >
                       <option value="CONSENT">Consent Form</option>
                       <option value="QUESTIONNAIRE">Questionnaire / Survey</option>
                     </select>
                   </div>
                 </div>

                 <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {newForm.type === 'CONSENT' ? 'Consent Agreement Text' : 'Survey Description / Instructions'}
                    </label>
                    <textarea 
                      required
                      rows={4}
                      value={newForm.content}
                      onChange={e => setNewForm({...newForm, content: e.target.value})}
                      className="w-full rounded-xl border-gray-300 focus:ring-brand-500 focus:border-brand-500 p-4 text-sm"
                      placeholder={newForm.type === 'CONSENT' ? "Enter the full text of the consent agreement..." : "Instructions for the participant..."}
                    />
                 </div>

                 {newForm.type === 'QUESTIONNAIRE' && (
                   <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                     <h3 className="font-semibold text-gray-900 mb-4">Questions</h3>
                     <ul className="space-y-3 mb-4">
                       {newForm.questions.map((q, idx) => (
                         <li key={idx} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                           <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                           <span className="text-sm text-gray-800 flex-1">{q}</span>
                           <button 
                              type="button"
                              onClick={() => setNewForm(prev => ({...prev, questions: prev.questions.filter((_, i) => i !== idx)}))}
                              className="text-gray-400 hover:text-red-500"
                            >
                             <TrashIcon className="w-4 h-4" />
                           </button>
                         </li>
                       ))}
                       {newForm.questions.length === 0 && <p className="text-sm text-gray-400 italic">No questions added yet.</p>}
                     </ul>
                     
                     <div className="flex gap-2">
                       <input 
                         type="text"
                         value={newForm.currentQuestionInput}
                         onChange={e => setNewForm({...newForm, currentQuestionInput: e.target.value})}
                         onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddQuestion())}
                         placeholder="Type a question and press enter..."
                         className="flex-1 rounded-xl border-gray-300 focus:ring-brand-500 focus:border-brand-500 py-2.5 px-4 text-sm"
                       />
                       <button 
                         type="button" 
                         onClick={handleAddQuestion}
                         className="px-4 py-2 bg-gray-800 text-white rounded-xl text-sm font-medium hover:bg-gray-900"
                       >
                         Add
                       </button>
                     </div>
                   </div>
                 )}

                 <div className="flex justify-end gap-4 pt-6 border-t">
                   <button 
                     type="button"
                     onClick={() => setIsCreatingForm(false)}
                     className="px-6 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                   >
                     Cancel
                   </button>
                   <button 
                     type="submit"
                     className="px-8 py-2.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 shadow-lg"
                   >
                     Save Form
                   </button>
                 </div>
               </form>
             </div>
          )}

          {/* Forms List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map(form => (
              <div key={form.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col group hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <span className={`
                    px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                    ${form.type === 'CONSENT' ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'}
                  `}>
                    {form.type}
                  </span>
                  <button 
                    onClick={() => handleDeleteForm(form.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{form.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-3 mb-6 flex-1">
                  {form.content}
                </p>
                
                {form.type === 'QUESTIONNAIRE' && (
                  <div className="mb-6 px-4 py-3 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Preview Questions</p>
                    <ul className="space-y-1">
                      {form.questions?.slice(0, 2).map((q, i) => (
                        <li key={i} className="text-xs text-gray-700 truncate">• {q}</li>
                      ))}
                      {(form.questions?.length || 0) > 2 && (
                        <li className="text-xs text-gray-400 italic">+{ (form.questions?.length || 0) - 2 } more...</li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-400 border-t pt-4 mt-auto">
                  <span>Created: {new Date(form.createdAt).toLocaleDateString()}</span>
                  <button className="text-brand-600 font-semibold hover:underline">Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;