import React from 'react';
import { User, Stethoscope, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const RoleSelector: React.FC = () => {
  const roles = [
    {
      id: 'patient' as const,
      title: 'Patient',
      description: 'Book appointments, view medical records, and chat with AI assistant',
      icon: User,
      color: 'bg-blue-600 hover:bg-blue-700',
      borderColor: 'border-blue-200 hover:border-blue-300'
    },
    {
      id: 'doctor' as const,
      title: 'Doctor',
      description: 'Manage patients, view appointments, and create medical reports',
      icon: Stethoscope,
      color: 'bg-green-600 hover:bg-green-700',
      borderColor: 'border-green-200 hover:border-green-300'
    },
    {
      id: 'admin' as const,
      title: 'Admin',
      description: 'Manage hospital operations, doctors, and patient records',
      icon: Shield,
      color: 'bg-purple-600 hover:bg-purple-700',
      borderColor: 'border-purple-200 hover:border-purple-300'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            11A Healthcare Solutions<span className="text-blue-600">+</span>
          </h1>
          <p className="text-gray-600">Choose your role to continue</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((role) => (
            <Link
              to={`/login/${role.id}`}
              key={role.id}
              className={`p-6 rounded-xl border-2 ${role.borderColor} hover:shadow-lg transition-all duration-200 group block`}
            >
              <div className={`w-16 h-16 ${role.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                <role.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2 text-center">{role.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed text-center">{role.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoleSelector;