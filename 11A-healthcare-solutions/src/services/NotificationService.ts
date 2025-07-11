import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Appointment, MedicalReport, User } from '../types';

/**
 * Service for handling notification operations
 */
class NotificationService {
  /**
   * Create a notification for a user
   */
  static async createNotification(
    userId: string,
    title: string,
    message: string,
    type: 'appointment' | 'medical' | 'system' | 'message',
    relatedId?: string,
    link?: string
  ) {
    try {
      // Create notification data object with required fields
      const notificationData: any = {
        userId,
        title,
        message,
        type,
        read: false,
        createdAt: Timestamp.now()
      };
      
      // Only add optional fields if they are defined
      if (relatedId !== undefined) {
        notificationData.relatedId = relatedId;
      }
      
      if (link !== undefined) {
        notificationData.link = link;
      }
      
      await addDoc(collection(db, 'notifications'), notificationData);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create an appointment notification
   */
  static async createAppointmentNotification(
    appointment: Appointment,
    recipientId: string,
    isForDoctor: boolean
  ) {
    const title = isForDoctor
      ? 'New Appointment'
      : 'Appointment Confirmation';
    
    const message = isForDoctor
      ? `You have a new appointment with ${appointment.patientName} on ${appointment.date.toLocaleDateString()} at ${appointment.time}`
      : `Your appointment with Dr. ${appointment.doctorName} is confirmed for ${appointment.date.toLocaleDateString()} at ${appointment.time}`;
    
    const link = isForDoctor
      ? `/doctor/appointments`
      : `/patient/appointments`;
    
    await this.createNotification(
      recipientId,
      title,
      message,
      'appointment',
      appointment.id,
      link
    );
  }

  /**
   * Create a notification for appointment status change
   */
  static async createAppointmentStatusNotification(
    appointment: Appointment,
    recipientId: string,
    previousStatus: string
  ) {
    let title = 'Appointment Update';
    let message = '';
    
    switch (appointment.status) {
      case 'completed':
        message = `Your appointment with ${appointment.doctorName} on ${appointment.date.toLocaleDateString()} has been marked as completed`;
        break;
      case 'cancelled':
        message = `Your appointment with ${appointment.doctorName} on ${appointment.date.toLocaleDateString()} has been cancelled`;
        break;
      default:
        message = `Your appointment status has been updated from ${previousStatus} to ${appointment.status}`;
    }
    
    await this.createNotification(
      recipientId,
      title,
      message,
      'appointment',
      appointment.id,
      '/patient/appointments'
    );
  }

  /**
   * Create a medical report notification
   */
  static async createMedicalReportNotification(
    report: MedicalReport,
    patientId: string
  ) {
    const title = 'New Medical Report';
    const message = `Dr. ${report.doctorName} has created a new medical report for you`;
    
    await this.createNotification(
      patientId,
      title,
      message,
      'medical',
      report.id,
      '/patient/medical-reports'
    );
  }

  /**
   * Create a system notification for all users of a specific role
   */
  static async createSystemNotificationForRole(
    title: string,
    message: string,
    role: 'patient' | 'doctor' | 'admin',
    users: User[],
    link?: string
  ) {
    const filteredUsers = users.filter(user => user.role === role);
    
    const promises = filteredUsers.map(user => 
      this.createNotification(
        user.uid,
        title,
        message,
        'system',
        undefined,
        link
      )
    );
    
    await Promise.all(promises);
  }

  /**
   * Create a notification for new user registration (admin only)
   */
  static async createNewUserNotification(
    newUser: User,
    adminIds: string[]
  ) {
    const title = 'New User Registration';
    const message = `${newUser.name} has registered as a ${newUser.role}`;
    
    const promises = adminIds.map(adminId => 
      this.createNotification(
        adminId,
        title,
        message,
        'system',
        newUser.uid,
        '/admin/settings'
      )
    );
    
    await Promise.all(promises);
  }
}

export default NotificationService;