import React, { useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { SalesNumber, Note } from '../types';

interface NotesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  salesNumber: SalesNumber | null;
  logActivity: (action: string, type: string, desc: string) => void;
  supabase: SupabaseClient;
}

const NotesPanel: React.FC<NotesPanelProps> = ({ isOpen, onClose, salesNumber, logActivity, supabase }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteText, setNewNoteText] = useState('');

  useEffect(() => {
    if (!isOpen || !salesNumber) {
      setNotes([]);
      return;
    }
    
    const fetchNotes = async () => {
      if (!salesNumber) return;
      const { data, error } = await supabase.from('notes').select('*').eq('sales_number_id', salesNumber.id).order('created_at', { ascending: false });
      if (data) setNotes(data);
    };
    fetchNotes();
    
    const channel = supabase.channel(`notes:${salesNumber.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notes', filter: `sales_number_id=eq.${salesNumber.id}` }, (payload) => {
          setNotes(current => [payload.new as Note, ...current]);
      }).subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    }
  }, [isOpen, salesNumber, supabase]);

  const handleAddNote = async () => {
    if (!newNoteText.trim() || !salesNumber) return;
    const { error } = await supabase.from('notes').insert({
      text: newNoteText.trim(),
      sales_number_id: salesNumber.id,
    });
    if (!error) {
      logActivity('note_added', 'salesNumberNote', `Nota añadida a '${salesNumber.number}': ${newNoteText.trim()}`);
      setNewNoteText('');
    }
  };

  return (
    <div className={`fixed inset-0 z-50 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300`}>
      <div className="absolute inset-0 bg-black bg-opacity-70" onClick={onClose}></div>
      <div className="relative bg-gray-800 w-full sm:w-96 h-full shadow-lg ml-auto p-6 flex flex-col border-l border-gray-700">
         <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">Notas para {salesNumber?.number}</h2>
            <button onClick={onClose} className="text-gray-400 p-1 rounded-full hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="flex mb-4">
          <textarea placeholder="Añadir nota..." value={newNoteText} onChange={(e) => setNewNoteText(e.target.value)} className="flex-1 p-3 bg-gray-700 text-white rounded-l-lg border border-gray-600" rows={2}/>
          <button onClick={handleAddNote} className="bg-indigo-600 text-white px-6 py-3 rounded-r-lg hover:bg-indigo-700">Añadir</button>
        </div>
        <ul className="space-y-3 overflow-y-auto flex-1">
          {notes.map(note => (
            <li key={note.id} className="bg-gray-700 p-3 rounded-md">
              <p className="text-gray-200 whitespace-pre-wrap">{note.text}</p>
              <p className="text-gray-400 text-xs text-right">{new Date(note.created_at).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default NotesPanel;