import React, { useState, useEffect } from 'react';
import { AppView, Contact, NewContactDraft, ScannedDocument, ScanMode } from './types';
import Scanner from './components/Scanner';
import ContactList from './components/ContactList';
import ContactEditor from './components/ContactEditor';
import ContactDetails from './components/ContactDetails';
import DocumentEditor from './components/DocumentEditor';
import { ChevronLeft, FileText } from 'lucide-react';

const CONTACTS_KEY = 'scanbiz_contacts_v3';
const DOCUMENTS_KEY = 'scanbiz_docs_v3';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LIST);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [documents, setDocuments] = useState<ScannedDocument[]>([]);
  
  const [currentContact, setCurrentContact] = useState<Contact | null>(null);
  const [draftContact, setDraftContact] = useState<NewContactDraft | Contact | null>(null);
  const [draftDoc, setDraftDoc] = useState<Partial<ScannedDocument> | null>(null);
  const [scannerMode, setScannerMode] = useState<ScanMode>('CARD');

  // Load data
  useEffect(() => {
    try {
      const storedContacts = localStorage.getItem(CONTACTS_KEY);
      const storedDocs = localStorage.getItem(DOCUMENTS_KEY);
      if (storedContacts) setContacts(JSON.parse(storedContacts));
      if (storedDocs) setDocuments(JSON.parse(storedDocs));
    } catch (e) {
      console.error("Failed to load data from localStorage", e);
    }
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(documents));
  }, [documents]);

  const handleScanComplete = (data: any, imageUrl: string, isDoc?: boolean, isQR?: boolean) => {
    if (isDoc) {
      setDraftDoc({
        id: crypto.randomUUID(),
        title: `Documento ${new Date().toLocaleDateString()}`,
        content: typeof data === 'string' ? data : (data.content || ""),
        pages: [imageUrl],
        createdAt: Date.now()
      });
      setView(AppView.DOC_EDIT);
    } else if (isQR) {
      if (data.contactData) {
        setDraftContact({
          ...data.contactData,
          avatarUrl: imageUrl,
          notes: `Dati letti da Codice ${data.type}`
        });
        setView(AppView.EDIT);
      } else {
        setDraftDoc({
          id: crypto.randomUUID(),
          title: `Codice ${data.type} - ${new Date().toLocaleTimeString()}`,
          content: data.content || "",
          pages: [imageUrl],
          createdAt: Date.now()
        });
        setView(AppView.DOC_EDIT);
      }
    } else {
      setDraftContact({
        ...data,
        avatarUrl: imageUrl
      });
      setView(AppView.EDIT);
    }
  };

  const handleSaveContact = (data: Contact | NewContactDraft) => {
    if ('id' in data) {
      setContacts(prev => prev.map(c => c.id === data.id ? data : c));
    } else {
      const newContact: Contact = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: Date.now()
      };
      setContacts(prev => [newContact, ...prev]);
    }
    setView(AppView.LIST);
  };

  const handleSaveDoc = (doc: ScannedDocument) => {
    setDocuments(prev => {
      const exists = prev.find(d => d.id === doc.id);
      if (exists) return prev.map(d => d.id === doc.id ? doc : d);
      return [doc, ...prev];
    });
    setView(AppView.DOC_LIST);
  };

  return (
    <div className="max-w-md mx-auto h-[100dvh] bg-white shadow-2xl overflow-hidden flex flex-col relative">
      <main className="flex-1 relative overflow-hidden bg-gray-50">
        {view === AppView.LIST && (
          <ContactList 
            contacts={contacts} 
            onSelectContact={(c) => {
              setCurrentContact(c);
              setView(AppView.DETAILS);
            }}
            onAddNew={() => {
              setDraftContact({ firstName: '', lastName: '', category: 'Altro' });
              setView(AppView.EDIT);
            }}
            onScan={() => {
              setScannerMode('CARD');
              setView(AppView.SCAN);
            }} 
            onOpenScanMenu={(mode) => {
              if (mode === 'DOC_LIST') {
                setView(AppView.DOC_LIST);
              } else {
                setScannerMode(mode as ScanMode);
                setView(AppView.SCAN);
              }
            }}
          />
        )}

        {view === AppView.DOC_LIST && (
          <div className="flex flex-col h-full bg-white">
            <div className="px-6 py-6 border-b flex items-center justify-between">
               <button onClick={() => setView(AppView.LIST)} className="p-2 -ml-2 text-gray-400 hover:text-primary transition-colors">
                 <ChevronLeft size={24} />
               </button>
               <h1 className="text-lg font-black uppercase tracking-widest text-slate-900">Archivio Testi</h1>
               <div className="w-10"></div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3 force-scrollbar">
               {documents.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-20 text-center opacity-20">
                    <FileText size={60} className="mb-4" />
                    <p className="font-black uppercase tracking-widest text-xs">Nessun documento</p>
                 </div>
               ) : (
                 documents.map(doc => (
                   <div 
                    key={doc.id} 
                    onClick={() => {
                      setDraftDoc(doc);
                      setView(AppView.DOC_EDIT);
                    }}
                    className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 active:scale-95 transition-all"
                   >
                      <div className="w-12 h-12 bg-slate-900 text-white flex items-center justify-center rounded-xl shadow-lg">
                        <FileText size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 truncate">{doc.title}</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                          {new Date(doc.createdAt).toLocaleDateString()} • {doc.content.length} caratteri
                        </p>
                      </div>
                   </div>
                 ))
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
              setDocuments(prev => prev.filter(d => d.id !== draftDoc.id));
              setView(AppView.DOC_LIST);
            }}
          />
        )}

        {view === AppView.DETAILS && currentContact && (
          <ContactDetails 
            contact={currentContact} 
            onBack={() => setView(AppView.LIST)} 
            onEdit={() => {
              setDraftContact(currentContact);
              setView(AppView.EDIT);
            }} 
            onDelete={() => {
              if (window.confirm("Eliminare questo contatto?")) {
                setContacts(contacts.filter(c => c.id !== currentContact.id));
                setView(AppView.LIST);
              }
            }} 
            onToggleFavorite={() => {
              const updated = {...currentContact, isFavorite: !currentContact.isFavorite};
              setContacts(contacts.map(c => c.id === currentContact.id ? updated : c));
              setCurrentContact(updated);
            }} 
            onToggleArchive={() => {
              const updated = {...currentContact, isArchived: !currentContact.isArchived};
              setContacts(contacts.map(c => c.id === currentContact.id ? updated : c));
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