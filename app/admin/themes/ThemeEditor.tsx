"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Save, UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';

interface ThemeRow {
  id: string;
  name: string;
  is_active: boolean;
}

type TabType = 'woods' | 'metals' | 'fabrics' | 'lighting';

export function ThemeEditor() {
  const [themes, setThemes] = useState<ThemeRow[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('woods');
  const [loading, setLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  
  const supabase = createClient();

  useEffect(() => {
 
    async function loadThemes() {
// eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { data, error } = await supabase.from('block_themes').select('*').order('created_at', { ascending: false });
      if (data) setThemes(data);
      setLoading(false);
    }
    loadThemes();
  }, [supabase]);

  if (loading) {
    return <div className="animate-pulse h-96 bg-slate-100 rounded-xl" />;
  }

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      // For Phase 5 v1, we push a mocked premium token set to prove the pipeline works
      const dummyTokens = {
        "wsSurfaceBase": "#e6d3ba",
        "wsSurfaceGrain": "#d4b895",
        "wsEdgeBanding": "#c6a67d",
        "shadowColorHeavy": "rgba(15,23,42,0.25)"
      };
      
      const res = await fetch('/api/admin/themes/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeName: 'premium-light', tokens: dummyTokens })
      });
      
      const data = await res.json();
      if (data.success) {
        alert(`Success! Theme deployed to Edge CDN:\n${data.url}`);
      } else {
 
        alert(`Error publishing: ${data.error}`);
      }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      alert(`Network error`);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-8">
      {/* Sidebar List */}
      <div className="col-span-3 space-y-4">
        <button className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium shadow-sm hover:bg-blue-700 transition">
          + Create New Theme
        </button>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {themes.length === 0 ? (
            <div className="p-4 text-sm text-slate-500">No themes found in database. Please run the Supabase migration.</div>
          ) : (
             themes.map(t => (
               <div key={t.id} className="p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition">
                 <span className="font-medium text-slate-800">{t.name}</span>
                 {t.is_active && <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-medium">Live</span>}
               </div>
             ))
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div className="col-span-9">
         <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 p-4 flex justify-between items-center">
               <h2 className="text-lg font-semibold text-slate-800">Edit Theme Tokens</h2>
               <div className="flex gap-3">
                  <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2 transition">
                    <Save size={16} /> Save Draft
                  </button>
                  <button 
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-emerald-700 flex items-center gap-2 transition disabled:opacity-50"
                  >
                    <UploadCloud size={16} /> 
                    {isPublishing ? "Publishing..." : "Publish to Planners"}
                  </button>
               </div>
            </div>
            
            {/* Tabs */}
            <div className="flex border-b border-slate-200 px-4">
               {['woods', 'metals', 'fabrics', 'lighting'].map(tab => (
                 <button 
                   key={tab}
                   onClick={() => setActiveTab(tab as TabType)}
                   className={`px-6 py-4 text-sm font-medium capitalize border-b-2 transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                 >
                   {tab}
                 </button>
               ))}
            </div>

            {/* Token Editor Body */}
            <div className="p-6 min-h-[500px]">
               <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex gap-3 text-blue-800">
                  <AlertCircle size={20} className="shrink-0" />
                  <p className="text-sm">
                    <strong>Architecture Note:</strong> Modifying these tokens will update the 3D meshes and 2D canvas dynamically across Buddy Planner and Oando Planner.
                  </p>
               </div>

               <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                 <p className="italic">Material property editor UI components will render here...</p>
                 <p className="text-sm mt-2">Waiting for Database Sync to populate JSON dictionary.</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}
