import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Doctor } from '../types';

export const fetchDoctorsBySpecialization = async (specializations: string[]): Promise<Doctor[]> => {
  try {
    const doctors: Doctor[] = [];
    
    // Create queries for each specialization without orderBy to avoid composite index requirement
    for (const specialization of specializations) {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'doctor'),
        where('specialization', '==', specialization),
        limit(10) // Get more to allow for sorting later
      );
      
      const snapshot = await getDocs(q);
      const specDoctors = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Doctor));
      
      doctors.push(...specDoctors);
    }
    
    // If no doctors found for specific specializations, get general doctors
    if (doctors.length === 0) {
      const generalQuery = query(
        collection(db, 'users'),
        where('role', '==', 'doctor'),
        limit(10)
      );
      
      const generalSnapshot = await getDocs(generalQuery);
      const generalDoctors = generalSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Doctor));
      
      doctors.push(...generalDoctors);
    }
    
    // Remove duplicates and sort by experience in memory
    const uniqueDoctors = doctors.filter((doctor, index, self) => 
      index === self.findIndex(d => d.id === doctor.id)
    );
    
    return uniqueDoctors
      .sort((a, b) => (b.experience || 0) - (a.experience || 0))
      .slice(0, 3);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return [];
  }
};

export const getAllDoctors = async (): Promise<Doctor[]> => {
  try {
    // Remove orderBy to avoid index requirement, sort in memory instead
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'doctor')
    );
    
    const snapshot = await getDocs(q);
    const doctors = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Doctor));
    
    // Sort by experience in memory
    return doctors.sort((a, b) => (b.experience || 0) - (a.experience || 0));
  } catch (error) {
    console.error('Error fetching all doctors:', error);
    return [];
  }
};

export const searchDoctors = async (searchTerm: string): Promise<Doctor[]> => {
  try {
    const doctors = await getAllDoctors();
    
    return doctors.filter(doctor => 
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase())
    );
  } catch (error) {
    console.error('Error searching doctors:', error);
    return [];
  }
};