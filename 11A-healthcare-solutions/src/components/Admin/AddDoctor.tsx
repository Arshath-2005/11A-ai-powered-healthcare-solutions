import React, { useState } from 'react';
import { UserPlus, Stethoscope, Save } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

const AddDoctor: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    specialization: '',
    experience: '',
    qualification: '',
    consultationFee: ''
  });

  const specializations = [
    'Cardiology', 'Dermatology', 'Orthopedics', 'Pediatrics', 'Neurology', 'Psychiatry',
    'Ophthalmology', 'ENT', 'General Medicine', 'Gynecology', 'Urology', 'Gastroenterology',
    'Pulmonology', 'Endocrinology', 'Nephrology', 'Oncology', 'Radiology', 'Anesthesiology',
    'Emergency Medicine', 'Family Medicine', 'Rheumatology', 'Infectious Disease', 'Pathology',
    'Physical Medicine', 'Plastic Surgery', 'General Surgery'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      
      // Create user profile in 'users' collection
      const userData = {
        uid: userCredential.user.uid,
        email: formData.email,
        name: formData.name,
        role: 'doctor',
        createdAt: new Date()
      };
      await setDoc(doc(db, 'users', userCredential.user.uid), userData);

      // Create doctor profile in 'doctors' collection
      const doctorData = {
        uid: userCredential.user.uid,
        name: formData.name,
        phone: formData.phone,
        specialization: formData.specialization,
        experience: parseInt(formData.experience, 10) || 0,
        qualification: formData.qualification,
        consultationFee: parseInt(formData.consultationFee, 10) || 0,
        availableSlots: [],
        rating: 0
      };
      await setDoc(doc(db, 'doctors', userCredential.user.uid), doctorData);
      
      alert('Doctor added successfully!');
      setFormData({
        email: '',
        password: '',
        name: '',
        phone: '',
        specialization: '',
        experience: '',
        qualification: '',
        consultationFee: ''
      });
    } catch (error: any) {
      console.error('Error adding doctor:', error);
      alert(error.message || 'Failed to add doctor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Add New Doctor</h2>
          <p className="text-gray-600">Create a new doctor account in the system</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Dr. John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="doctor@hospital.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Minimum 6 characters"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="+91 9876543210"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Specialization *</label>
              <select
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select Specialization</option>
                {specializations.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Experience (Years) *</label>
              <input
                type="number"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                required
                min="0"
                max="50"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Qualification *</label>
              <input
                type="text"
                name="qualification"
                value={formData.qualification}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="MBBS, MD"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Consultation Fee (₹) *</label>
              <input
                type="number"
                name="consultationFee"
                value={formData.consultationFee}
                onChange={handleChange}
                required
                min="100"
                max="5000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setFormData({
                email: '',
                password: '',
                name: '',
                phone: '',
                specialization: '',
                experience: '',
                qualification: '',
                consultationFee: ''
              })}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Adding...' : 'Add Doctor'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDoctor;