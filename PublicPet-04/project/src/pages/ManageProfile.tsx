import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Camera, Loader2, Save, Edit2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  state: string;
  intent: string;
  about: string;
  avatar_url: string;
};

const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > height && width > 400) { height *= 400 / width; width = 400; }
        else if (height > 400) { width *= 400 / height; height = 400; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(blob => {
          if (blob) resolve(new File([blob], `${Date.now()}-avatar.jpeg`, { type: 'image/jpeg' }));
          else reject(new Error('Compression failed'));
        }, 'image/jpeg', 0.8);
      };
    };
    reader.onerror = reject;
  });
};

export const ManageProfile: React.FC = () => {
  const navigate = useNavigate();
  const [sessionUser, setSessionUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/auth');
        return;
      }
      setSessionUser(session.user.id);

      const { data } = await supabase.from('users').select('*').eq('id', session.user.id).single();
      if (data) {
        setProfile(data as UserProfile);
        setEditForm(data as UserProfile);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [navigate]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sessionUser) return;

    setIsUploadingAvatar(true);
    try {
      const compressedFile = await compressImage(file);
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${sessionUser}-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, compressedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(uploadData.path);

      await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', sessionUser);
      
      const updatedProfile = { ...profile!, avatar_url: publicUrl };
      setProfile(updatedProfile);
      setEditForm(prev => ({ ...prev, avatar_url: publicUrl }));
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Failed to update profile picture.");
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async () => {
    if (!sessionUser) return;
    setIsSavingProfile(true);

    const updates = {
      full_name: editForm.full_name,
      phone: editForm.phone,
      state: editForm.state,
      about: editForm.about,
    };

    const { error } = await supabase.from('users').update(updates).eq('id', sessionUser);

    if (!error) {
      setProfile({ ...profile!, ...updates });
      setIsEditingProfile(false);
    } else {
      console.error("Error updating profile:", error);
      alert("Failed to save profile updates.");
    }
    setIsSavingProfile(false);
  };

  if (loading || !profile) return <div className="min-h-screen bg-white" />;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto"
    >
      <div className="bg-white border border-gray-100 rounded-[2rem] p-6 md:p-10 shadow-sm relative overflow-hidden">
        
        <div className="flex justify-between items-start mb-8">
          <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
          {!isEditingProfile ? (
            <button onClick={() => setIsEditingProfile(true)} className="flex items-center space-x-2 text-sm font-semibold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full hover:bg-indigo-100 transition-colors">
              <Edit2 size={14} /> <span>Edit</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              <button onClick={() => { setIsEditingProfile(false); setEditForm(profile); }} className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors px-4 py-2">
                Cancel
              </button>
              <button onClick={handleSaveProfile} disabled={isSavingProfile} className="flex items-center space-x-2 text-sm font-semibold text-white bg-gray-900 px-4 py-2 rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50">
                {isSavingProfile ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} <span>Save</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative group cursor-pointer" onClick={() => isEditingProfile && fileInputRef.current?.click()}>
              <div className={`w-32 h-32 rounded-full bg-gray-50 border-4 border-white shadow-md overflow-hidden flex items-center justify-center ${isEditingProfile ? 'group-hover:opacity-80 transition-opacity' : ''}`}>
                {isUploadingAvatar ? (
                  <Loader2 size={32} className="text-indigo-600 animate-spin" />
                ) : editForm.avatar_url ? (
                  <img src={editForm.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-gray-300" />
                )}
              </div>
              {isEditingProfile && !isUploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={24} className="text-white" />
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleAvatarUpload} />
            </div>
            {isEditingProfile && <p className="text-xs font-semibold text-gray-400">Click to update picture</p>}
          </div>

          <div className="flex-1 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Full Name</label>
              {isEditingProfile ? (
                <input type="text" value={editForm.full_name || ''} onChange={e => setEditForm({...editForm, full_name: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:border-indigo-600 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 outline-none transition-all" />
              ) : (
                <p className="text-base font-semibold text-gray-900">{profile.full_name}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
                <p className="text-base font-semibold text-gray-900">{profile.email} <span className="ml-2 text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Uneditable</span></p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Phone Number</label>
                {isEditingProfile ? (
                  <input type="text" value={editForm.phone || ''} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:border-indigo-600 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 outline-none transition-all" />
                ) : (
                  <p className="text-base font-semibold text-gray-900">{profile.phone || 'Not provided'}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Location (State)</label>
                {isEditingProfile ? (
                  <input type="text" value={editForm.state || ''} onChange={e => setEditForm({...editForm, state: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:border-indigo-600 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 outline-none transition-all" />
                ) : (
                  <p className="text-base font-semibold text-gray-900">{profile.state || 'Not provided'}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Primary Intent</label>
                <p className="text-base font-semibold text-gray-900 capitalize">{profile.intent?.replace('_', ' ') || 'General'}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">About Me</label>
              {isEditingProfile ? (
                <textarea rows={4} value={editForm.about || ''} onChange={e => setEditForm({...editForm, about: e.target.value})} placeholder="Tell the community a bit about yourself..." className="w-full bg-gray-50 border border-transparent focus:border-indigo-600 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 outline-none transition-all resize-none" />
              ) : (
                <p className="text-sm font-medium text-gray-600 whitespace-pre-line leading-relaxed">{profile.about || "You haven't added a bio yet."}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};