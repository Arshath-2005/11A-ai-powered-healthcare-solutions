import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Upload, X, Edit2 } from 'lucide-react';
import { db } from '../../config/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';

// ----------------------
// ✅ Type Definitions
// ----------------------

type AdminProfile = {
  uid: string;
  fullName: string;
  email: string;
  password: string;
  profilePic: string;
};

type HospitalConfig = {
  name: string;
  workingHours: {
    from: string;
    to: string;
  };
  departments: string[];
  maxAppointments: number;
};

// ----------------------
// ✅ Component
// ----------------------

const AdminSettings: React.FC = () => {
  const [profile, setProfile] = useState<AdminProfile>({
    uid: '',
    fullName: '',
    email: '',
    password: '',
    profilePic: 'https://via.placeholder.com/150',
  });
  const [showPassword, setShowPassword] = useState(false);

  const [hospitalConfig, setHospitalConfig] = useState<HospitalConfig>({
    name: '',
    workingHours: { from: '', to: '' },
    departments: [],
    maxAppointments: 0,
  });

  const [newDepartment, setNewDepartment] = useState('');
  const [editingDepartment, setEditingDepartment] = useState<number | null>(null);
  const [editedDepartmentName, setEditedDepartmentName] = useState('');

  useEffect(() => {
    fetchAdminProfile();
    fetchHospitalConfig();
  }, []);

  const fetchAdminProfile = async () => {
    const q = query(collection(db, 'users'), where('role', '==', 'admin'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const adminDoc = snap.docs[0];
      const data = adminDoc.data();
      setProfile({
        uid: adminDoc.id,
        fullName: data.fullName || '',
        email: data.email || '',
        password: data.password || '',
        profilePic: data.profilePic || 'https://via.placeholder.com/150',
      });
    }
  };

  const fetchHospitalConfig = async () => {
    const configRef = doc(db, 'settings', 'hospitalConfig');
    const snap = await getDoc(configRef);
    if (snap.exists()) {
      setHospitalConfig(snap.data() as HospitalConfig);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfile({ ...profile, profilePic: event.target?.result as string });
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleConfigChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'from' || name === 'to') {
      setHospitalConfig((prev) => ({
        ...prev,
        workingHours: {
          ...prev.workingHours,
          [name]: value,
        },
      }));
    } else if (name === 'maxAppointments') {
      setHospitalConfig((prev) => ({
        ...prev,
        maxAppointments: Number(value),
      }));
    } else {
      setHospitalConfig((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const addDepartment = () => {
    if (newDepartment.trim() !== '') {
      setHospitalConfig((prev) => ({
        ...prev,
        departments: [...prev.departments, newDepartment.trim()],
      }));
      setNewDepartment('');
    }
  };

  const deleteDepartment = (index: number) => {
    setHospitalConfig((prev) => ({
      ...prev,
      departments: prev.departments.filter((_, i) => i !== index),
    }));
  };

  const startEditingDepartment = (index: number) => {
    setEditingDepartment(index);
    setEditedDepartmentName(hospitalConfig.departments[index]);
  };

  const saveEditedDepartment = (index: number) => {
    const updated = [...hospitalConfig.departments];
    updated[index] = editedDepartmentName;
    setHospitalConfig((prev) => ({
      ...prev,
      departments: updated,
    }));
    setEditingDepartment(null);
    setEditedDepartmentName('');
  };

  const saveProfileChanges = async () => {
    if (profile.uid) {
      await updateDoc(doc(db, 'users', profile.uid), {
        fullName: profile.fullName,
        email: profile.email,
        password: profile.password,
        profilePic: profile.profilePic,
      });
      alert('Profile updated successfully!');
    }
  };

  const saveHospitalConfig = async () => {
    const configRef = doc(db, 'settings', 'hospitalConfig');
    await updateDoc(configRef, hospitalConfig);
    alert('Hospital configuration saved!');
  };

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Admin Settings</h1>

      {/* Profile Settings */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Profile Settings</h2>

        <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
          <img src={profile.profilePic} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
          <div>
            <label htmlFor="profilePicUpload" className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center gap-2">
              <Upload size={18} />
              Upload New Picture
            </label>
            <input id="profilePicUpload" type="file" className="hidden" onChange={handleProfilePicChange} accept="image/*" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
            <input type="text" name="fullName" value={profile.fullName} onChange={handleProfileChange} className="w-full p-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
            <input type="email" name="email" value={profile.email} onChange={handleProfileChange} className="w-full p-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} name="password" value={profile.password} onChange={handleProfileChange} className="w-full p-2 border rounded-md" />
              <button onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 text-gray-500">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <button onClick={saveProfileChanges} className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">Save Changes</button>
          <button className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">Change Password</button>
        </div>
      </div>

      {/* Hospital Configuration */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Hospital Configuration</h2>

        <div className="space-y-6">
          <div className="p-4 border rounded-md">
            <label className="block text-sm font-medium text-gray-600 mb-1">Hospital Name</label>
            <input type="text" name="name" value={hospitalConfig.name} onChange={handleConfigChange} className="w-full p-2 border rounded-md" />
          </div>

          <div className="p-4 border rounded-md">
            <label className="block text-sm font-medium text-gray-600 mb-2">Working Hours</label>
            <div className="flex items-center gap-4">
              <input type="time" name="from" value={hospitalConfig.workingHours.from} onChange={handleConfigChange} className="w-full p-2 border rounded-md" />
              <span>to</span>
              <input type="time" name="to" value={hospitalConfig.workingHours.to} onChange={handleConfigChange} className="w-full p-2 border rounded-md" />
            </div>
          </div>

          <div className="p-4 border rounded-md">
            <label className="block text-sm font-medium text-gray-600 mb-1">Departments</label>
            <div className="flex gap-2 mb-2">
              <input type="text" value={newDepartment} onChange={(e) => setNewDepartment(e.target.value)} placeholder="Add new department" className="w-full p-2 border rounded-md" />
              <button onClick={addDepartment} className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">Add</button>
            </div>
            <ul className="space-y-2">
              {hospitalConfig.departments.map((dept, index) => (
                <li key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
                  {editingDepartment === index ? (
                    <input
                      type="text"
                      value={editedDepartmentName}
                      onChange={(e) => setEditedDepartmentName(e.target.value)}
                      className="w-full p-1 border rounded-md"
                    />
                  ) : (
                    <span>{dept}</span>
                  )}
                  <div className="flex gap-2">
                    {editingDepartment === index ? (
                      <button onClick={() => saveEditedDepartment(index)} className="text-green-500 hover:text-green-700">Save</button>
                    ) : (
                      <button onClick={() => startEditingDepartment(index)} className="text-blue-500 hover:text-blue-700">
                        <Edit2 size={18} />
                      </button>
                    )}
                    <button onClick={() => deleteDepartment(index)} className="text-red-500 hover:text-red-700">
                      <X size={18} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 border rounded-md">
            <label className="block text-sm font-medium text-gray-600 mb-1">Max Appointments per Doctor per Day</label>
            <input type="number" name="maxAppointments" value={hospitalConfig.maxAppointments} onChange={handleConfigChange} className="w-full p-2 border rounded-md" />
          </div>
        </div>

        <div className="mt-6">
          <button onClick={saveHospitalConfig} className="w-full bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">Save Configuration</button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
