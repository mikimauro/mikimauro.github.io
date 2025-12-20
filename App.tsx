
import React, { useState, useEffect } from 'react';
import { AppView, Contact, NewContactDraft, ScannedDocument } from './types';
import Scanner from './components/Scanner';
import ContactEditor from './components/ContactEditor';
import ContactList from './components/ContactList';
import ContactDetails from './components/ContactDetails';
import DocumentEditor from './components/DocumentEditor';
import { FileText, Archive, ChevronLeft } from 'lucide-react';

const CONTACTS_KEY = 'scanbiz_contacts_v3';
const DOCUMENTS_KEY = 'scanbiz_docs_v3';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LIST);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [documents, setDocuments] = useState<ScannedDocument[]>([]);
  
  const [currentContact, setCurrentContact] = useState<Contact | null>(null);
  const [draftContact, setDraftContact] = useState<NewContactDraft | Contact | null>(null);
  const [draftDoc, setDraftDoc] = useState<Partial<ScannedDocument> | null>(null);
  const [scannerMode, setScannerMode] = useState<'CARD' | 'TEXT'>('CARD');

  useEffect(() => {
    try {
      const storedC = localStorage.getItem(CONTACTS_KEY);
      const storedD = localStorage.getItem(DOCUMENTS_KEY);
      if (storedC) setContacts(JSON.parse(storedC));
      if (storedD) setDocuments(JSON.parse(storedD));
    } catch (e) {
      console.error("Errore caricamento localStorage:", e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(documents));
  }, [documents]);

  const handleScanComplete = (data: any, imageUrl: string, isDoc?: boolean) => {
    if (isDoc) {
      // Impacchettiamo correttamente il testo nel formato ScannedDocument
      setDraftDoc({
        id: crypto.randomUUID(),
        title: `Documento ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        content: typeof data === 'string' ? data : (data.content || ""),
        pages: [imageUrl],
        createdAt: Date.now()
      });
      setView(AppView.DOC_EDIT);
    } else {
      setDraftContact({ ...data, avatarUrl: imageUrl });
      setView(AppView.EDIT);
    }
  };

  const handleSaveContact = (data: Contact | NewContactDraft) => {
    if ('id' in data) {
      setContacts(prev => prev.map(c => c.id === data.id ? data : c));
    } else {
      setContacts(prev => [{ ...data, id: crypto.randomUUID(), createdAt: Date.now() }, ...prev]);
    }
    setView(AppView.LIST);
    setDraftContact(null);
  };

  const handleSaveDoc = (doc: ScannedDocument) => {
    const exists = documents.find(d => d.id === doc.id);
    if (exists) {
      setDocuments(prev => prev.map(d => d.id === doc.id ? doc : d));
    } else {
      setDocuments(prev => [doc, ...prev]);
    }
    setView(AppView.DOC_LIST);
    setDraftDoc(null);
  };

  const openScanner = (mode: 'CARD' | 'TEXT') => {
    setScannerMode(mode);
    setView(AppView.SCAN);
  };

  return (
    <div className="max-w-md mx-auto h-[100dvh] bg-white shadow-2xl overflow-hidden flex flex-col relative font-sans">
      <main className="flex-1 relative overflow-hidden bg-gray-50">
        {view === AppView.LIST && (
          <ContactList 
            contacts={contacts} 
            onSelectContact={(c) => { setCurrentContact(c); setView(AppView.DETAILS); }}
            onAddNew={() => { setDraftContact({ firstName: '', lastName: '', category: 'Altro' }); setView(AppView.EDIT); }}
            onScan={() => {}} 
            onOpenScanMenu={(mode) => {
              if (mode === 'DOC_LIST') setView(AppView.DOC_LIST);
              else openScanner(mode as 'CARD' | 'TEXT');
            }}
          />
        )}

        {view === AppView.DOC_LIST && (
          <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-300">
            <div className="px-6 py-6 border-b flex items-center justify-between">
               <button onClick={() => setView(AppView.LIST)} className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors"><ChevronLeft size={24}/></button>
               <h1 className="text-lg font-black text-gray-900 uppercase tracking-widest">Archivio Testi</h1>
               <div className="w-10"></div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50/50">
               {documents.map(doc => (
                 <div key={doc.id} onClick={() => { setDraftDoc(doc); setView(AppView.DOC_EDIT); }} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4 active:scale-95 transition-all">
                    <div className="w-14 h-14 bg-gray-900 text-white flex items-center justify-center rounded-2xl shadow-lg"><FileText size={24}/></div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-gray-900 truncate text-sm uppercase tracking-tight">{doc.title}</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{new Date(doc.createdAt).toLocaleDateString()}</p>
                    </div>
                 </div>
               ))}
               {documents.length === 0 && (
                 <div className="flex flex-col items-center justify-center py-24 text-gray-200">
                   <Archive size={64} strokeWidth={1} className="mb-6 opacity-20" />
                   <p className="font-black text-xs uppercase tracking-[0.3em]">Nessun documento salvato</p>
                 </div>
               )}
            </div>
          </div>
        )}

        {view === AppView.SCAN && (
          <Scanner 
            initialMode={scannerMode} 
            onScanComplete={handleScanComplete} 
            onCancel={() => setView(AppView.LIST)} 
          />
        )}
        
        {view === AppView.EDIT && draftContact && (
          <ContactEditor 
            initialData={draftContact} 
            isNew={!('id' in draftContact)} 
            onSave={handleSaveContact} 
            onCancel={() => setView(AppView.LIST)} 
          />
        )}

        {view === AppView.DOC_EDIT && draftDoc && (
          <DocumentEditor 
            initialData={draftDoc} 
            onSave={handleSaveDoc} 
            onCancel={() => setView(AppView.DOC_LIST)} 
            onDelete={() => {
              if(confirm('Vuoi eliminare definitivamente questo documento?')) {
                setDocuments(prev => prev.filter(d => d.id !== draftDoc.id));
                setView(AppView.DOC_LIST);
              }
            }} 
          />
        )}

        {view === AppView.DETAILS && currentContact && (
          <ContactDetails 
            contact={currentContact} 
            onBack={() => setView(AppView.LIST)} 
            onEdit={() => { setDraftContact(currentContact); setView(AppView.EDIT); }} 
            onDelete={() => {
              if(confirm('Eliminare il contatto?')) {
                setContacts(contacts.filter(c => c.id !== currentContact.id)); 
                setView(AppView.LIST);
              }
            }} 
            onToggleFavorite={() => {
              const updated = {...currentContact, isFavorite: !currentContact.isFavorite};
              setContacts(prev => prev.map(c => c.id === currentContact.id ? updated : c));
              setCurrentContact(updated);
            }} 
            onToggleArchive={() => {
              const updated = {...currentContact, isArchived: !currentContact.isArchived};
              setContacts(prev => prev.map(c => c.id === currentContact.id ? updated : c));
              setCurrentContact(updated);
              setView(AppView.LIST);
            }} 
          />
        )}
      </main>
    </div>
  );
};

export default App;
