import React, { useEffect, useState } from 'react';
import {
  User, Mail, Phone, Stethoscope, GraduationCap, Calendar, IndianRupee, Save, Edit2
} from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface DoctorProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  experience: string;
  qualification: string;
  consultationFee: string;
}

const DoctorProfile: React.FC = () => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [formData, setFormData] = useState<Partial<DoctorProfile>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser) return;
      try {
        const docSnap = await getDoc(doc(db, 'users', currentUser.uid));
        if (docSnap.exists()) {
          const data = docSnap.data() as DoctorProfile;
          setProfile(data);
          setFormData(data);
        }
      } catch (error) {
        console.error('Error loading doctor profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      const updatedProfile = {
        ...formData,
        uid: currentUser.uid,
        email: currentUser.email
      };

      await updateDoc(doc(db, 'users', currentUser.uid), updatedProfile);
      setProfile(updatedProfile as DoctorProfile);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{profile?.name || 'Doctor Profile'}</h1>
              <p className="text-gray-600">Manage your professional information</p>
            </div>
          </div>
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            {isEditing ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
            <span>{saving ? 'Saving...' : isEditing ? 'Save' : 'Edit'}</span>
          </button>
        </div>

        {/* Profile Form */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field
              label="Full Name"
              icon={<User className="w-4 h-4" />}
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              disabled={!isEditing}
            />
            <Field
              label="Email"
              icon={<Mail className="w-4 h-4" />}
              name="email"
              value={formData.email || ''}
              disabled
            />
            <Field
              label="Phone Number"
              icon={<Phone className="w-4 h-4" />}
              name="phone"
              value={formData.phone || ''}
              onChange={handleChange}
              disabled={!isEditing}
            />
            <Field
              label="Specialization"
              icon={<Stethoscope className="w-4 h-4" />}
              name="specialization"
              value={formData.specialization || ''}
              onChange={handleChange}
              disabled={!isEditing}
            />
            <Field
              label="Years of Experience"
              icon={<Calendar className="w-4 h-4" />}
              name="experience"
              value={formData.experience || ''}
              onChange={handleChange}
              disabled={!isEditing}
            />
            <Field
              label="Qualification"
              icon={<GraduationCap className="w-4 h-4" />}
              name="qualification"
              value={formData.qualification || ''}
              onChange={handleChange}
              disabled={!isEditing}
            />
            <Field
              label="Consultation Fee (₹)"
              icon={<IndianRupee className="w-4 h-4" />}
              name="consultationFee"
              value={formData.consultationFee || ''}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface FieldProps {
  label: string;
  icon: React.ReactNode;
  name: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

const Field: React.FC<FieldProps> = ({ label, icon, name, value, onChange, disabled }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">{icon}</div>
        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            disabled ? 'bg-gray-50' : ''
          }`}
        />
      </div>
    </div>
  );
};

export default DoctorProfile;
