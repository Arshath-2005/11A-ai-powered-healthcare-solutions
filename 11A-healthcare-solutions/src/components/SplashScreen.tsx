import React from 'react';
import Lottie from 'lottie-react';
import hospitalAnimation from '../assets/animations/hospital.json'; 
import { Stethoscope } from 'lucide-react';

const SplashScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-100 to-green-300 text-center">
      <div className="w-40 h-40 mb-6">
        <Lottie animationData={hospitalAnimation} loop={true} />
      </div>
      <div className="flex items-center gap-2 text-green-900">
        <Stethoscope size={32} />
        <h1 className="text-3xl font-bold">11A Healthcare Solutions</h1>
      </div>
      <p className="text-lg mt-2 text-green-800">Connecting Patients with Doctors Seamlessly</p>
      <div className="w-64 mt-10 h-2 bg-white rounded-full overflow-hidden">
        <div className="h-full bg-green-700 animate-loading-bar"></div>
      </div>
    </div>
  );
};

export default SplashScreen;
