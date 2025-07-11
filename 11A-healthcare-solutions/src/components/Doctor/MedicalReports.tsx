import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, User, Calendar, Trash2, Pencil, CheckCircle2, Upload, BrainCircuit, FileUp } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Patient, MedicalReport } from '../../types';
import { notifyNewMedicalReport } from '../../utils/notificationHelpers';

const fileToGenerativePart = async (file: File) => {
  const base64EncodedData = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    },
  };
};

const generateAiSummary = async (formText: string, file: File | null): Promise<string> => {
  const prompt = `
    Act as a medical assistant. Carefully read the content of the doctor's notes and analyze the uploaded medical report image. Combine them to create a comprehensive summary for the patient.

    Doctor's Notes:
    """
    ${formText}
    """

    Return a clear and concise summary for patient view, including:
    - Diagnosis
    - Prescription
    - Symptoms
    - Follow-up instructions
    - Any critical information from the doctor's notes or the uploaded report.
  `;

  const contents = file ? [{ parts: [{ text: prompt }, await fileToGenerativePart(file)] }] : [{ parts: [{ text: prompt }] }];

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("AI API Error Response:", errorBody);
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const display = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return display || "No summary could be generated.";
  } catch (error) {
    console.error("Error fetching AI response:", error);
    return "Failed to generate AI summary. Please check the console for details.";
  }
};

const MedicalReports: React.FC = () => {
  const { currentUser } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editReportId, setEditReportId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [aiSummary, setAiSummary] = useState('');
  const [editedAiSummary, setEditedAiSummary] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [generatingAiSummary, setGeneratingAiSummary] = useState(false);


  const [reportForm, setReportForm] = useState({
    diagnosis: '',
    prescription: '',
    notes: '',
    symptoms: '',
    treatmentPlan: '',
    followUpDate: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      try {
        const appointmentsQuery = query(collection(db, 'appointments'), where('doctorId', '==', currentUser.uid));
        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        const patientIds = [...new Set(appointmentsSnapshot.docs.map(doc => doc.data().patientId))];

        const patientsData: Patient[] = [];
        for (const patientId of patientIds) {
          const patientQuery = query(collection(db, 'users'), where('uid', '==', patientId));
          const patientSnapshot = await getDocs(patientQuery);
          if (!patientSnapshot.empty) {
            patientsData.push(patientSnapshot.docs[0].data() as Patient);
          }
        }

        const reportsQuery = query(collection(db, 'medicalReports'), where('doctorId', '==', currentUser.uid));
        const reportsSnapshot = await getDocs(reportsQuery);
        const reportsData = reportsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: (data.createdAt as any).toDate(),
            followUpDate: data.followUpDate ? (data.followUpDate as any).toDate() : null
          };
        }) as MedicalReport[];

        setPatients(patientsData);
        setReports(reportsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const patientReports = selectedPatient ? reports.filter(r => r.patientId === selectedPatient.uid) : [];

  const openAddReportForm = () => {
    setEditMode(false);
    setEditReportId(null);
    setReportForm({ diagnosis: '', prescription: '', notes: '', symptoms: '', treatmentPlan: '', followUpDate: '' });
    setShowReportModal(true);
  };

  const openEditReportForm = (report: MedicalReport) => {
    setEditMode(true);
    setEditReportId(report.id);

    let formattedFollowUpDate = '';
    if (report.followUpDate) {
      const date = new Date(report.followUpDate);
      if (!isNaN(date.getTime())) {
        formattedFollowUpDate = date.toISOString().slice(0, 10);
      }
    }

    setReportForm({
      diagnosis: report.diagnosis || '',
      prescription: report.prescription || '',
      notes: report.notes || '',
      symptoms: report.symptoms || '',
      treatmentPlan: report.treatmentPlan || '',
      followUpDate: formattedFollowUpDate
    });
    setShowReportModal(true);
  };

  const handleDeleteReport = async (id: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;
    await deleteDoc(doc(db, 'medicalReports', id));
    setReports(prev => prev.filter(r => r.id !== id));
  };

  const handleGenerateSummary = async () => {
    if (!currentUser || !selectedPatient) return;

    setGeneratingAiSummary(true);
    setShowAiModal(true);

    const formText = `
      Diagnosis: ${reportForm.diagnosis}
      Prescription: ${reportForm.prescription}
      Symptoms: ${reportForm.symptoms}
      Treatment Plan: ${reportForm.treatmentPlan}
      Notes: ${reportForm.notes}
    `;

    const summary = await generateAiSummary(formText, file);
    setAiSummary(summary);
    setEditedAiSummary(summary);
    setGeneratingAiSummary(false);
  };

  const handleFinalizeReport = async () => {
    if (!currentUser || !selectedPatient) return;

    setSaving(true);
    try {
      let fileUrl = '';

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'ml_default');

        const response = await fetch('https://api.cloudinary.com/v1_1/dxm35ylj5/auto/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        fileUrl = data.secure_url;
      }

      const doctorQuery = query(collection(db, 'doctors'), where('uid', '==', currentUser.uid));
      const doctorSnapshot = await getDocs(doctorQuery);
      const doctorData = doctorSnapshot.docs[0]?.data();

      const newReport: Omit<MedicalReport, 'id'> = {
        patientId: selectedPatient.uid,
        doctorId: currentUser.uid,
        patientName: selectedPatient.name,
        doctorName: doctorData?.name || 'Doctor',
        diagnosis: reportForm.diagnosis,
        prescription: reportForm.prescription,
        notes: reportForm.notes,
        symptoms: reportForm.symptoms,
        treatmentPlan: reportForm.treatmentPlan,
        followUpDate: reportForm.followUpDate ? new Date(reportForm.followUpDate) : null,
        createdAt: new Date(),
        reportType: file ? 'uploaded_document' : 'consultation',
        fileUrl: fileUrl,
        aiSummary: editedAiSummary,
      };

      const reportToUpdate = {
        ...newReport,
        followUpDate: newReport.followUpDate ? new Date(newReport.followUpDate) : null
      };

      if (editMode && editReportId) {
        await updateDoc(doc(db, 'medicalReports', editReportId), reportToUpdate);
        setReports(prev => prev.map(r => (r.id === editReportId ? { ...reportToUpdate, id: editReportId } as MedicalReport : r)));
      } else {
        const docRef = await addDoc(collection(db, 'medicalReports'), reportToUpdate);
        const reportWithId = { id: docRef.id, ...reportToUpdate } as MedicalReport;
        setReports(prev => [...prev, reportWithId]);
        
        await notifyNewMedicalReport(reportWithId, selectedPatient.uid);
      }

      setShowReportModal(false);
      setShowAiModal(false);
      setEditMode(false);
      setEditReportId(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      alert('Error saving report');
      console.error(error);
    } finally {
      setSaving(false);
      setFile(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {showSuccess && (
          <div className="fixed top-5 right-5 z-[60] bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md shadow-lg" role="alert">
            <div className="flex">
              <div className="py-1"><CheckCircle2 className="h-6 w-6 text-green-500 mr-4" /></div>
              <div>
                <p className="font-bold">Success</p>
                <p className="text-sm">Report saved successfully!</p>
              </div>
            </div>
          </div>
        )}

        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Medical Reports</h1>
          <p className="mt-1 text-sm text-gray-500">Manage patient reports and generate AI-powered summaries.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Patients</h2>
              </div>
              <div className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search patients..."
                    className="pl-10 w-full py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                {filteredPatients.map(p => (
                  <div
                    key={p.uid}
                    onClick={() => setSelectedPatient(p)}
                    className={`flex items-center gap-4 p-4 cursor-pointer border-l-4 ${selectedPatient?.uid === p.uid ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:bg-gray-100'}`}
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="text-blue-600 w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{p.name}</p>
                      <p className="text-sm text-gray-500">{p.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <main className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {selectedPatient ? `Reports for ${selectedPatient.name}` : 'Select a Patient'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedPatient ? 'View, edit, or add new reports.' : 'Please select a patient from the list to see their reports.'}
                  </p>
                </div>
                {selectedPatient && (
                  <button
                    onClick={openAddReportForm}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus className="w-5 h-5" />
                    Add New Report
                  </button>
                )}
              </div>
              <div className="p-6">
                {selectedPatient ? (
                  patientReports.length > 0 ? (
                    <ul className="space-y-4">
                      {patientReports.map((r) => (
                        <li key={r.id} className="border border-gray-200 p-4 rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-gray-800">{r.diagnosis}</p>
                              <p className="text-sm text-gray-500">
                                <span className="font-medium">Prescription:</span> {r.prescription}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">{r.createdAt.toLocaleDateString()}</p>
                              <div className="flex gap-3 mt-2">
                                <button onClick={() => openEditReportForm(r)} className="text-blue-600 hover:text-blue-800"><Pencil className="w-5 h-5" /></button>
                                <button onClick={() => handleDeleteReport(r.id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-5 h-5" /></button>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No reports found</h3>
                      <p className="mt-1 text-sm text-gray-500">This patient doesn't have any reports yet.</p>
                    </div>
                  )
                ) : (
                  <div className="text-center py-12">
                    <User className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No patient selected</h3>
                    <p className="mt-1 text-sm text-gray-500">Select a patient to get started.</p>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>

        {showReportModal && selectedPatient && (
          <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                {editMode ? 'Edit' : 'Add'} Report for {selectedPatient.name}
              </h3>
              <div className="space-y-6">
                {['symptoms', 'diagnosis', 'prescription', 'treatmentPlan', 'notes'].map(field => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field.replace('Plan', ' Plan')}</label>
                    <textarea
                      value={(reportForm as any)[field]}
                      onChange={e => setReportForm(prev => ({ ...prev, [field]: e.target.value }))}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      rows={field === 'prescription' || field === 'notes' ? 3 : 2}
                    />
                  </div>
                ))}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
                    <input
                      type="date"
                      value={reportForm.followUpDate}
                      onChange={(e) => setReportForm(prev => ({ ...prev, followUpDate: e.target.value }))}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Upload Document (Optional)</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <FileUp className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                            <span>Upload a file</span>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">{file ? file.name : 'PDF, PNG, JPG up to 10MB'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-8">
                <button onClick={() => setShowReportModal(false)} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button
                  onClick={handleGenerateSummary}
                  disabled={!reportForm.diagnosis || !reportForm.prescription || saving || generatingAiSummary}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  <BrainCircuit className="w-5 h-5" />
                  {generatingAiSummary ? 'Generating...' : 'Generate AI Summary'}
                </button>
              </div>
            </div>
          </div>
        )}

      {showAiModal && (
  <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center">
    <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-3xl max-h-[90vh] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold text-gray-900">Review AI Summary</h3>
        <button
          onClick={() => setShowAiModal(false)}
          className="text-gray-400 hover:text-gray-600 text-3xl font-bold leading-none"
        >
          &times;
        </button>
      </div>
      <div className="flex-grow overflow-y-auto">
        {generatingAiSummary ? (
          <div className="flex flex-col items-center justify-center h-full">
            <BrainCircuit className="w-16 h-16 text-blue-500 animate-pulse" />
            <p className="mt-4 text-lg text-gray-600">Generating summary, please wait...</p>
          </div>
        ) : (
          <textarea
            className="w-full min-h-[300px] max-h-[50vh] p-4 border border-gray-300 rounded-md shadow-sm resize-y focus:ring-blue-500 focus:border-blue-500"
            value={editedAiSummary}
            onChange={(e) => setEditedAiSummary(e.target.value)}
            placeholder="AI-generated summary will appear here..."
          />
        )}
      </div>
      {!generatingAiSummary && (
        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={() => setShowAiModal(false)}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleFinalizeReport}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-sm hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Final Report'}
          </button>
        </div>
      )}
    </div>
  </div>
)}

      </div>
    </div>
  );
};

export default MedicalReports;
