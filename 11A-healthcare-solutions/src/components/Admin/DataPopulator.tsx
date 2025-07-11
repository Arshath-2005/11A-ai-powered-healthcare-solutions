import React, { useState } from 'react';
import { Database, Upload, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { populateFirebaseWithDummyData } from '../../utils/dummyData';

const DataPopulator: React.FC = () => {
  const [isPopulating, setIsPopulating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handlePopulateData = async () => {
    setIsPopulating(true);
    setResult(null);
    
    try {
      const result = await populateFirebaseWithDummyData();
      setResult(result);
    } catch (error) {
      setResult({
        success: false,
        message: 'An unexpected error occurred',
        error
      });
    } finally {
      setIsPopulating(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Database className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Populate Database</h2>
          <p className="text-gray-600">
            This will add 1000 doctors, 1000 patients, and related data to your Firebase database
          </p>
        </div>

        {!result && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-800">Important Notice</h3>
                <p className="text-yellow-700 text-sm mt-1">
                  This will add a large amount of data to your Firebase database. 
                  Make sure you have sufficient quota and this action cannot be easily undone.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="font-medium text-gray-700">Doctors:</span>
              <span className="text-gray-600 ml-2">1,000 entries</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="font-medium text-gray-700">Patients:</span>
              <span className="text-gray-600 ml-2">1,000 entries</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="font-medium text-gray-700">Appointments:</span>
              <span className="text-gray-600 ml-2">2,000 entries</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="font-medium text-gray-700">Medical Reports:</span>
              <span className="text-gray-600 ml-2">1,500 entries</span>
            </div>
          </div>
        </div>

        {result && (
          <div className={`p-4 rounded-lg mb-6 ${
            result.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start space-x-3">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div>
                <h3 className={`font-medium ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.success ? 'Success!' : 'Error'}
                </h3>
                <p className={`text-sm mt-1 ${
                  result.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {result.message}
                </p>
                {result.success && result.counts && (
                  <div className="mt-2 text-sm text-green-700">
                    <p>Added: {result.counts.doctors} doctors, {result.counts.patients} patients, {result.counts.appointments} appointments, {result.counts.medicalReports} reports</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handlePopulateData}
          disabled={isPopulating || (result && result.success)}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isPopulating ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>Populating Database...</span>
            </>
          ) : result && result.success ? (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>Data Successfully Added</span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              <span>Populate Database</span>
            </>
          )}
        </button>

        {isPopulating && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              This may take a few minutes. Please don't close this page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataPopulator;