import { collection, addDoc, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from "../config/firebase";

// Utility functions
const getRandomElement = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)];
const getRandomElements = <T>(array: T[], count: number): T[] => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
const getRandomNumber = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const getRandomDate = (start: Date, end: Date): Date =>
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// Dummy data arrays
const firstNames = ['John', 'Jane'];
const lastNames = ['Doe', 'Smith'];
const bloodGroups = ['A+', 'O-'];
const cities = ['Mumbai', 'Delhi'];
const symptoms = ['Headache', 'Fever'];
const diagnoses = ['Migraine', 'Common Cold'];
const prescriptions = ['Paracetamol 500mg', 'Ibuprofen 400mg'];
const medicalHistory = ['Hypertension', 'Diabetes'];
const allergies = ['Peanuts', 'Penicillin'];

// Types
interface Doctor {
  uid: string;
  name: string;
  specialization: string;
  experience: number;
  qualification: string;
  consultationFee: number;
  rating: number;
}

interface Patient {
  uid: string;
  email: string;
  name: string;
  phone: string;
  role: 'patient';
  age: number;
  dateOfBirth: string;
  bloodGroup: string;
  address: string;
  emergencyContact: string;
  medicalHistory: string[];
  allergies: string[];
  createdAt: Date;
  profilePicture: string;
}

interface Appointment {
  doctorId: string;
  patientId: string;
  date: Date;
  time: string;
  status: string;
  reason: string;
  createdAt: Date;
}

interface MedicalReport {
  doctorId: string;
  patientId: string;
  date: Date;
  diagnosis: string;
  prescription: string[];
  notes: string;
  createdAt: Date;
}

interface MedicalRecord {
  doctorId: string;
  patientId: string;
  visitDate: Date;
  diagnosis: string;
  treatment: string;
  followUpRequired: boolean;
  createdAt: Date;
}

// Generate dummy patients
export const generatePatients = (count: number = 1000): Patient[] => {
  const patients: Patient[] = [];
  for (let i = 0; i < count; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const age = getRandomNumber(1, 90);
    const birthYear = new Date().getFullYear() - age;
    const birthMonth = getRandomNumber(1, 12);
    const birthDay = getRandomNumber(1, 28);
    patients.push({
      uid: `patient_${i + 1}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i + 1}@email.com`,
      name: `${firstName} ${lastName}`,
      phone: `+91${getRandomNumber(7000000000, 9999999999)}`,
      role: 'patient',
      age,
      dateOfBirth: `${birthYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay
        .toString()
        .padStart(2, '0')}`,
      bloodGroup: getRandomElement(bloodGroups),
      address: `${getRandomNumber(1, 999)} ${getRandomElement(['MG Road', 'Main Street'])}, ${getRandomElement(
        cities
      )}`,
      emergencyContact: `+91${getRandomNumber(7000000000, 9999999999)}`,
      medicalHistory: getRandomElements(medicalHistory, getRandomNumber(0, 2)),
      allergies: getRandomElements(allergies, getRandomNumber(0, 1)),
      createdAt: getRandomDate(new Date(2020, 0, 1), new Date()),
      profilePicture: `https://images.unsplash.com/photo-${getRandomNumber(1494790108, 1494790999)}-${getRandomNumber(
        100000,
        999999
      )}?w=150&h=150&fit=crop&crop=face`,
    });
  }
  return patients;
};

// Generate appointments
const generateAppointments = (doctors: Doctor[], patients: Patient[], count = 2000): Appointment[] => {
  const appointments: Appointment[] = [];
  for (let i = 0; i < count; i++) {
    const doctor = getRandomElement(doctors);
    const patient = getRandomElement(patients);
    appointments.push({
      doctorId: doctor.uid,
      patientId: patient.uid,
      date: getRandomDate(new Date(2022, 0, 1), new Date()),
      time: `${getRandomNumber(9, 17)}:${getRandomNumber(0, 59).toString().padStart(2, '0')}`,
      status: getRandomElement(['Scheduled', 'Completed', 'Cancelled']),
      reason: getRandomElement(symptoms),
      createdAt: new Date(),
    });
  }
  return appointments;
};

// Generate reports
const generateMedicalReports = (doctors: Doctor[], patients: Patient[], count = 1500): MedicalReport[] => {
  const reports: MedicalReport[] = [];
  for (let i = 0; i < count; i++) {
    const doctor = getRandomElement(doctors);
    const patient = getRandomElement(patients);
    reports.push({
      doctorId: doctor.uid,
      patientId: patient.uid,
      date: getRandomDate(new Date(2022, 0, 1), new Date()),
      diagnosis: getRandomElement(diagnoses),
      prescription: getRandomElements(prescriptions, getRandomNumber(1, 2)),
      notes: 'Prescribed rest and follow-up after 1 week.',
      createdAt: new Date(),
    });
  }
  return reports;
};

// Generate records
const generateMedicalRecords = (doctors: Doctor[], patients: Patient[], count = 1200): MedicalRecord[] => {
  const records: MedicalRecord[] = [];
  for (let i = 0; i < count; i++) {
    const doctor = getRandomElement(doctors);
    const patient = getRandomElement(patients);
    records.push({
      doctorId: doctor.uid,
      patientId: patient.uid,
      visitDate: getRandomDate(new Date(2021, 0, 1), new Date()),
      diagnosis: getRandomElement(diagnoses),
      treatment: `Treated with ${getRandomElement(prescriptions)}`,
      followUpRequired: Math.random() > 0.5,
      createdAt: new Date(),
    });
  }
  return records;
};

// ✅ Final populate function (without generating/uploading doctors)
export const populateFirebaseWithDummyData = async () => {
  try {
    console.log('Fetching existing doctors...');
    const doctorsSnapshot = await getDocs(collection(db, 'doctors'));
    const doctors: Doctor[] = [];

    doctorsSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      doctors.push({
        uid: data.uid,
        name: data.name,
        specialization: data.specialization,
        experience: data.experience,
        qualification: data.qualification,
        consultationFee: data.consultationFee,
        rating: data.rating,
      });
    });

    console.log('Generating data...');
    const patients = generatePatients();
    const appointments = generateAppointments(doctors, patients);
    const reports = generateMedicalReports(doctors, patients);
    const records = generateMedicalRecords(doctors, patients);

    console.log('Uploading patients...');
    for (const pat of patients) {
      await setDoc(doc(db, 'users', pat.uid), pat);
    }

    console.log('Uploading appointments...');
    for (const appt of appointments) {
      await addDoc(collection(db, 'appointments'), appt);
    }

    console.log('Uploading reports...');
    for (const report of reports) {
      await addDoc(collection(db, 'medicalReports'), report);
    }

    console.log('Uploading records...');
    for (const rec of records) {
      await addDoc(collection(db, 'medicalRecords'), rec);
    }

    console.log('✅ Dummy data added successfully!');
    return { success: true, message: 'Firebase populated with dummy data (doctors skipped).' };
  } catch (error) {
    console.error('❌ Error populating Firebase:', error);
    return { success: false, error };
  }
};
