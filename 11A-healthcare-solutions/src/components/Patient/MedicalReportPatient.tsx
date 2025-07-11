import React, { useEffect, useState } from 'react';
import {
  FileText, NotebookPen, Calendar, Eye, EyeOff, Download, Brain, Languages
} from 'lucide-react';
import {
  collection, query, where, onSnapshot, getDocs, DocumentData
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { MedicalReport } from '../../types';

const MedicalReportsPatient: React.FC = () => {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [doctorMap, setDoctorMap] = useState<Record<string, DocumentData>>({});
  const [translatedReport, setTranslatedReport] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('Tamil');

  useEffect(() => {
    if (!currentUser) return;

    const reportQuery = query(collection(db, 'medicalReports'), where('patientId', '==', currentUser.uid));
    
    const unsubscribe = onSnapshot(reportQuery, async (reportSnapshot) => {
      setLoading(true);
      const reportsData = reportSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        followUpDate: doc.data().followUpDate ? doc.data().followUpDate.toDate() : null,
      })) as MedicalReport[];

      const doctorIds = [...new Set(reportsData.map(r => r.doctorId))].filter(Boolean);

      if (doctorIds.length > 0) {
        // Query doctors collection with the correct field
        const doctorsQuery = query(collection(db, 'users'), where('uid', 'in', doctorIds));
        const doctorsSnapshot = await getDocs(doctorsQuery);
        const newDoctorMap = doctorsSnapshot.docs.reduce((acc: Record<string, DocumentData>, doc) => {
          const data = doc.data();
          if (data.uid) {
            // Make sure we're capturing all the doctor data including specialization and experience
            acc[data.uid] = {
              ...data,
              name: data.name || 'Unknown Doctor',
              specialization: data.specialization || 'General Medicine',
              experience: data.experience || 0
            };
          }
          return acc;
        }, {});
        
        setDoctorMap(newDoctorMap);

        const finalReports = reportsData.map(report => ({
          ...report,
          doctorName: newDoctorMap[report.doctorId]?.name ?? report.doctorName ?? 'Unknown',
        }));
        setReports(finalReports);
      } else {
        setReports(reportsData);
        setDoctorMap({});
      }
      setLoading(false);
    }, (err) => {
      console.error('Error fetching reports:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
    setTranslatedReport(null);
  };

  const handleTranslate = async (report: MedicalReport) => {
    setTranslating(true);
    setTranslatedReport(null);
    const textToTranslate = `
      Diagnosis: ${report.diagnosis}
      Prescription: ${report.prescription}
      Symptoms: ${report.symptoms}
      Treatment Plan: ${report.treatmentPlan}
      Notes: ${report.notes}
      AI Summary: ${report.aiSummary}
    `;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Translate the following medical report to ${targetLanguage}:\n\n${textToTranslate}` }] }],
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to translate");

      const data = await response.json();
      const translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      setTranslatedReport(translatedText || "Translation not available.");
    } catch (error) {
      console.error("Translation error:", error);
      setTranslatedReport("Failed to translate. Please try again.");
    } finally {
      setTranslating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="w-14 h-14 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-gray-600 animate-pulse">Loading your health reports...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 tracking-tight">
            Your Medical Reports
          </h1>
          <p className="mt-2 text-lg text-gray-600">A secure and simple way to view your health history.</p>
        </header>

        {reports.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-lg shadow-md">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No reports found</h3>
            <p className="mt-1 text-sm text-gray-500">Your medical reports will appear here once they are available.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {reports.map((report) => {
              const isExpanded = expandedId === report.id;
              const doctor = doctorMap[report.doctorId];

              return (
                <div key={report.id} className="bg-white shadow-lg rounded-xl overflow-hidden transition-all duration-300">
                  <div
                    className="px-6 py-5 flex justify-between items-center cursor-pointer bg-blue-50 hover:bg-blue-100"
                    onClick={() => toggleExpand(report.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-200 rounded-full">
                        <FileText className="text-blue-600 w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-blue-900">
                          Dr. {doctor?.name || report.doctorName || 'Doctor'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {doctor?.specialization || 'Specialist'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-sm text-gray-500">{new Date(report.createdAt).toLocaleDateString()}</span>
                      <button className="text-blue-600 hover:text-blue-800">
                        {isExpanded ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-6 py-6 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="flex items-start gap-3">
                          <NotebookPen className="w-5 h-5 text-gray-500 mt-1" />
                          <div>
                            <p className="font-semibold text-gray-700">Experience</p>
                            <p className="text-gray-600">
                              {doctor?.experience ?
                                (typeof doctor.experience === 'number' ?
                                  `${doctor.experience} years` :
                                  doctor.experience) :
                                '5+ years'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Calendar className="w-5 h-5 text-gray-500 mt-1" />
                          <div>
                            <p className="font-semibold text-gray-700">Follow-up Date</p>
                            <p className="text-gray-600">{report.followUpDate ? report.followUpDate.toLocaleDateString() : 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      {report.reportType === 'uploaded_document' ? (
                        <>
                          {report.aiSummary && (
                            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                              <h4 className="font-bold text-blue-800 flex items-center gap-2 mb-2"><Brain className="w-5 h-5" /> AI Generated Summary</h4>
                              <p className="text-gray-700 whitespace-pre-wrap">{report.aiSummary}</p>
                            </div>
                          )}
                          {report.fileUrl && (
                            <a href={report.fileUrl} download className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                              <Download className="w-4 h-4" /> Download Original Report
                            </a>
                          )}
                        </>
                      ) : (
                        <div className="space-y-4">
                          <div><h4 className="font-bold text-gray-800">Diagnosis</h4><p className="text-gray-600">{report.diagnosis}</p></div>
                          <div><h4 className="font-bold text-gray-800">Prescription</h4><p className="text-gray-600">{report.prescription}</p></div>
                          {report.symptoms && <div><h4 className="font-bold text-gray-800">Symptoms</h4><p className="text-gray-600">{report.symptoms}</p></div>}
                          {report.treatmentPlan && <div><h4 className="font-bold text-gray-800">Treatment Plan</h4><p className="text-gray-600">{report.treatmentPlan}</p></div>}
                          {report.notes && <div><h4 className="font-bold text-gray-800">Notes</h4><p className="text-gray-600">{report.notes}</p></div>}
                        </div>
                      )}

                      <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end items-center gap-3">
                        <select
                          value={targetLanguage}
                          onChange={(e) => setTargetLanguage(e.target.value)}
                          className="bg-white border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option>Tamil</option><option>Hindi</option><option>Telugu</option><option>Kannada</option><option>Malayalam</option><option>Bengali</option><option>Marathi</option><option>Gujarati</option>
                        </select>
                        <button
                          onClick={() => handleTranslate(report)}
                          disabled={translating}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
                        >
                          <Languages className="w-4 h-4" />
                          {translating ? 'Translating...' : 'Translate'}
                        </button>
                      </div>

                      {translating && <div className="text-center mt-4 text-sm text-gray-500">Translating report...</div>}
                      
                      {translatedReport && (
                        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                          <h4 className="font-bold text-gray-800">{targetLanguage} Translation</h4>
                          <p className="text-gray-700 whitespace-pre-wrap mt-2">{translatedReport}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalReportsPatient;
