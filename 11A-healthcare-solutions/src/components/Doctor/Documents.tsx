import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc, getDocs } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import { DoctorDocument, Folder } from '../../types';
import { UploadCloud, File, Download, Trash2, Loader2, Folder as FolderIcon, Plus, Pencil } from 'lucide-react';

const getFileIcon = (fileType: string) => {
  if (fileType.includes('pdf')) return <File className="text-red-500 w-8 h-8" />;
  if (fileType.includes('image')) return <File className="text-blue-500 w-8 h-8" />;
  return <File className="text-gray-500 w-8 h-8" />;
};

const DoctorDocuments: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [documents, setDocuments] = useState<DoctorDocument[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [folderPrivacy, setFolderPrivacy] = useState<'private' | 'global'>('private');
  const [showPrivacyConfirm, setShowPrivacyConfirm] = useState<Folder | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);

    let unsubscribe: () => void;

    const fetchDocuments = async () => {
      try {
        let q;
        
        // Root folder - only show user's own documents
        if (currentFolder === null) {
          q = query(collection(db, 'doctorDocuments'),
            where('doctorId', '==', currentUser.uid),
            where('folderId', '==', null));
        } else {
          // Get the folder details to check permissions
          const folderSnap = await getDocs(query(collection(db, 'folders'),
            where('__name__', '==', currentFolder)));
          
          if (folderSnap.empty) {
            q = query(collection(db, 'doctorDocuments'), where('folderId', '==', null));
          } else {
            const folder = { id: folderSnap.docs[0].id, ...folderSnap.docs[0].data() } as Folder;
            
            // If it's a global folder, show all documents in that folder but only if they're the owner
            if (folder.privacy === 'global') {
              q = query(collection(db, 'doctorDocuments'), where('folderId', '==', currentFolder));
            }
            // If it's a private folder, only show if user is the owner
            else if (folder.privacy === 'private' && folder.ownerId === currentUser.uid) {
              q = query(collection(db, 'doctorDocuments'), where('folderId', '==', currentFolder));
            }
            // Default to showing nothing if user doesn't have access
            else {
              q = query(collection(db, 'doctorDocuments'), where('folderId', '==', 'no-access'));
            }
          }
        }
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          const docs = snapshot.docs.map(docSnapshot => ({
            id: docSnapshot.id,
            ...docSnapshot.data(),
            createdAt: docSnapshot.data().createdAt?.toDate() ?? new Date(),
          })) as DoctorDocument[];
          setDocuments(docs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
          setLoading(false);
        });
      } catch (error) {
        console.error("Error fetching documents:", error);
        setLoading(false);
      }
    };

    fetchDocuments();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser, userProfile, currentFolder]);

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);

    // All users can see global folders
    const queries = [query(collection(db, 'folders'), where('privacy', '==', 'global'))];
    
    // Users can only see their own private folders
    queries.push(query(collection(db, 'folders'), where('ownerId', '==', currentUser.uid), where('privacy', '==', 'private')));

    const unsubscribes = queries.map(q => {
      return onSnapshot(q, () => {
        Promise.all(queries.map(getDocs)).then(allSnapshots => {
          const allFolders = new Map<string, Folder>();
          allSnapshots.forEach(snapshot => {
            snapshot.docs.forEach(doc => {
              if (!allFolders.has(doc.id)) {
                allFolders.set(doc.id, { id: doc.id, ...doc.data() } as Folder);
              }
            });
          });
          setFolders(Array.from(allFolders.values()));
          setLoading(false);
        });
      });
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [currentUser, userProfile]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!currentUser) return;
    setUploading(true);

    try {
      // Check folder permissions before uploading
      if (currentFolder) {
        const folderSnap = await getDocs(query(collection(db, 'folders'),
          where('__name__', '==', currentFolder)));
        
        if (!folderSnap.empty) {
          const folder = { id: folderSnap.docs[0].id, ...folderSnap.docs[0].data() } as Folder;
          
          // Only folder owner can upload to any folder
          if (folder.ownerId !== currentUser.uid) {
            // For global folders, no one except owner can upload
            if (folder.privacy === 'global') {
              alert("You don't have permission to upload files to this global folder.");
              setUploading(false);
              return;
            }
            
            // For private folders, only owner can upload
            if (folder.privacy === 'private') {
              alert("You don't have permission to upload files to this private folder.");
              setUploading(false);
              return;
            }
          }
        }
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'ml_default');

      const response = await fetch('https://api.cloudinary.com/v1_1/dxm35ylj5/auto/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!data.secure_url) {
        throw new Error('File upload to Cloudinary failed.');
      }

      await addDoc(collection(db, 'doctorDocuments'), {
        doctorId: currentUser.uid,
        name: file.name,
        url: data.secure_url,
        type: file.type,
        size: file.size,
        createdAt: serverTimestamp(),
        folderId: currentFolder,
      });
    } catch (error) {
      console.error("Error uploading document: ", error);
      alert('Failed to upload document.');
    } finally {
      setUploading(false);
    }
  }, [currentUser, currentFolder]);

  const handleDelete = async (id: string) => {
    try {
      // Get the document to check ownership
      const docRef = doc(db, 'doctorDocuments', id);
      const docSnap = await getDocs(query(collection(db, 'doctorDocuments'), where('__name__', '==', id)));
      
      if (docSnap.empty) {
        alert("Document not found.");
        return;
      }
      
      const document = { id: docSnap.docs[0].id, ...docSnap.docs[0].data() } as DoctorDocument;
      
      // Check if user has permission to delete (only document owner can delete)
      if (document.doctorId !== currentUser?.uid) {
        alert("You don't have permission to delete this document.");
        return;
      }
      
      // If document is in a folder, check folder permissions
      if (document.folderId) {
        const folderSnap = await getDocs(query(collection(db, 'folders'), where('__name__', '==', document.folderId)));
        
        if (!folderSnap.empty) {
          const folder = { id: folderSnap.docs[0].id, ...folderSnap.docs[0].data() } as Folder;
          
          // For global folders, only the folder owner can delete documents
          if (folder.privacy === 'global' && folder.ownerId !== currentUser?.uid) {
            alert("You don't have permission to delete documents in this global folder.");
            return;
          }
        }
      }
      
      if (window.confirm('Are you sure you want to delete this document?')) {
        await deleteDoc(docRef);
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Failed to delete document.");
    }
  };

  const handleCreateFolder = async () => {
    if (!currentUser || !newFolderName.trim()) return;
    await addDoc(collection(db, 'folders'), {
      name: newFolderName,
      ownerId: currentUser.uid,
      createdAt: serverTimestamp(),
      privacy: folderPrivacy,
    });
    setNewFolderName('');
    setFolderPrivacy('private');
  };

  const handleUpdateFolder = async () => {
    if (!editingFolder || !newFolderName.trim() || (userProfile?.role !== 'admin' && editingFolder.ownerId !== currentUser?.uid)) return;
    const folderRef = doc(db, 'folders', editingFolder.id);
    await updateDoc(folderRef, { name: newFolderName, privacy: folderPrivacy });
    setEditingFolder(null);
    setNewFolderName('');
  };

  const handleDeleteFolder = async (folder: Folder) => {
    if (userProfile?.role !== 'admin' && folder.ownerId !== currentUser?.uid) {
      alert("You don't have permission to delete this folder.");
      return;
    }
    if (window.confirm('Are you sure you want to delete this folder and all its contents?')) {
      const documentsQuery = query(collection(db, 'doctorDocuments'), where('folderId', '==', folder.id));
      const documentsSnapshot = await getDocs(documentsQuery);
      const deletePromises = documentsSnapshot.docs.map((d: any) => deleteDoc(d.ref));
      await Promise.all(deletePromises);
      await deleteDoc(doc(db, 'folders', folder.id));
    }
  };

  const handlePrivacyChange = (folder: Folder) => {
    if (userProfile?.role !== 'admin' && folder.ownerId !== currentUser?.uid) {
      alert("You don't have permission to change this folder's privacy.");
      return;
    }
    // Show confirmation dialog instead of immediately changing
    setShowPrivacyConfirm(folder);
  };

  const confirmPrivacyChange = async () => {
    if (!showPrivacyConfirm) return;
    
    const folder = showPrivacyConfirm;
    const newPrivacy = folder.privacy === 'private' ? 'global' : 'private';
    const folderRef = doc(db, 'folders', folder.id);
    
    try {
      await updateDoc(folderRef, { privacy: newPrivacy });
      // Close the confirmation dialog
      setShowPrivacyConfirm(null);
    } catch (error) {
      console.error("Error updating folder privacy:", error);
      alert("Failed to update folder privacy.");
    }
  };

  const cancelPrivacyChange = () => {
    setShowPrivacyConfirm(null);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <header className="mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Document Center</h1>
          <p className="mt-2 text-lg text-gray-500">Your secure hub for managing and sharing documents.</p>
        </header>

        <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Enter folder name"
              className="flex-grow border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Privacy:</span>
              <select
                value={folderPrivacy}
                onChange={(e) => setFolderPrivacy(e.target.value as 'private' | 'global')}
                className="border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="private">Private</option>
                <option value="global">Global</option>
              </select>
            </div>
            <button
              onClick={editingFolder ? handleUpdateFolder : handleCreateFolder}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="w-5 h-5" />
              {editingFolder ? 'Update Folder' : 'Create Folder'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Folders</h2>
              </div>
              <div className="p-2 max-h-[60vh] overflow-y-auto">
                <div
                  onClick={() => setCurrentFolder(null)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${currentFolder === null ? 'bg-indigo-100 text-indigo-800' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <FolderIcon className="w-6 h-6" />
                  <span className="font-medium">Root</span>
                </div>
                {folders.map(f => (
                  <div
                    key={f.id}
                    className={`flex items-center justify-between p-3 rounded-lg group ${currentFolder === f.id ? 'bg-indigo-100' : ''}`}
                  >
                    <div className="flex items-center gap-3 cursor-pointer flex-grow" onClick={() => setCurrentFolder(f.id)}>
                      <FolderIcon className={`w-6 h-6 ${currentFolder === f.id ? 'text-indigo-800' : 'text-gray-500'}`} />
                      <span className={`font-medium ${currentFolder === f.id ? 'text-indigo-800' : 'text-gray-700'}`}>{f.name}</span>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Show privacy badge for all folders - make it clickable for folder owners */}
                      {f.ownerId === currentUser?.uid ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); handlePrivacyChange(f); }}
                          className={`text-xs font-semibold p-1 rounded-full cursor-pointer hover:opacity-80 ${f.privacy === 'private' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                          title={`Click to change to ${f.privacy === 'private' ? 'global' : 'private'}`}
                        >
                          {f.privacy}
                        </button>
                      ) : (
                        <span className={`text-xs font-semibold p-1 rounded-full ${f.privacy === 'private' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {f.privacy}
                        </span>
                      )}
                      
                      {/* Only show edit/delete buttons if user is the folder owner */}
                      {f.ownerId === currentUser?.uid && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingFolder(f); setNewFolderName(f.name); setFolderPrivacy(f.privacy); }}
                            className="p-1 text-gray-500 hover:text-indigo-600"
                            title="Edit folder"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteFolder(f); }}
                            className="p-1 text-gray-500 hover:text-red-600"
                            title="Delete folder"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
          <main className="lg:col-span-9">
            <div className="bg-white rounded-xl shadow-lg">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Documents</h2>
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 cursor-pointer"
                >
                  <UploadCloud className="w-5 h-5" />
                  Upload File
                  <input id="file-upload" type="file" className="sr-only" onChange={handleFileChange} disabled={uploading} />
                </label>
              </div>
              {loading || uploading ? (
                <div className="p-12 text-center">
                  <Loader2 className="mx-auto h-10 w-10 text-indigo-500 animate-spin" />
                  <p className="mt-3 text-sm text-gray-500">{uploading ? 'Uploading file...' : 'Loading documents...'}</p>
                </div>
              ) : documents.length === 0 ? (
                <div className="p-12 text-center">
                  <File className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No documents in this folder</h3>
                  <p className="mt-1 text-sm text-gray-500">Drag and drop files here to upload.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {documents.map((doc) => (
                    <li key={doc.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        {getFileIcon(doc.type)}
                        <div>
                          <p className="font-semibold text-gray-900">{doc.name}</p>
                          <p className="text-sm text-gray-500">
                            {(doc.size / 1024 / 1024).toFixed(2)} MB &middot; {doc.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <a href={doc.url} download={doc.name} className="p-2 text-gray-500 hover:text-indigo-600"><Download className="w-5 h-5" /></a>
                        {/* Only show delete button if user is the document owner */}
                        {doc.doctorId === currentUser?.uid && (
                          <button onClick={() => handleDelete(doc.id)} className="p-2 text-gray-500 hover:text-red-600"><Trash2 className="w-5 h-5" /></button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Privacy Change Confirmation Dialog */}
      {showPrivacyConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Change Folder Privacy</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to change this folder's privacy from
              <span className={`font-semibold mx-1 ${showPrivacyConfirm.privacy === 'private' ? 'text-green-600' : 'text-yellow-600'}`}>
                {showPrivacyConfirm.privacy}
              </span>
              to
              <span className={`font-semibold mx-1 ${showPrivacyConfirm.privacy === 'private' ? 'text-yellow-600' : 'text-green-600'}`}>
                {showPrivacyConfirm.privacy === 'private' ? 'global' : 'private'}
              </span>?
            </p>
            
            {showPrivacyConfirm.privacy === 'private' && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      <strong>Note:</strong> Making this folder global will allow all doctors and admins to view its contents.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {showPrivacyConfirm.privacy === 'global' && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-green-700">
                      <strong>Note:</strong> Making this folder private will restrict access to only you.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={cancelPrivacyChange}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                onClick={confirmPrivacyChange}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDocuments;