import NotificationService from '../services/NotificationService';
import { Appointment, MedicalReport, User } from '../types';

/**
 * Helper functions to create notifications for different events in the application
 */

/**
 * Create notifications when a new appointment is created
 * @param appointment The appointment that was created
 * @param patientId The ID of the patient
 * @param doctorId The ID of the doctor
 */
export const notifyNewAppointment = async (
  appointment: Appointment,
  patientId: string,
  doctorId: string
) => {
  try {
    // Notify the doctor
    await NotificationService.createAppointmentNotification(
      appointment,
      doctorId,
      true
    );
    
    // Notify the patient
    await NotificationService.createAppointmentNotification(
      appointment,
      patientId,
      false
    );
  } catch (error) {
    console.error('Error creating appointment notifications:', error);
  }
};

/**
 * Create notifications when an appointment status changes
 * @param appointment The updated appointment
 * @param patientId The ID of the patient
 * @param previousStatus The previous status of the appointment
 */
export const notifyAppointmentStatusChange = async (
  appointment: Appointment,
  patientId: string,
  previousStatus: string
) => {
  try {
    await NotificationService.createAppointmentStatusNotification(
      appointment,
      patientId,
      previousStatus
    );
  } catch (error) {
    console.error('Error creating appointment status notification:', error);
  }
};

/**
 * Create notifications when a new medical report is created
 * @param report The medical report that was created
 * @param patientId The ID of the patient
 */
export const notifyNewMedicalReport = async (
  report: MedicalReport,
  patientId: string
) => {
  try {
    await NotificationService.createMedicalReportNotification(
      report,
      patientId
    );
  } catch (error) {
    console.error('Error creating medical report notification:', error);
  }
};

/**
 * Create a system notification for all users of a specific role
 * @param title The notification title
 * @param message The notification message
 * @param role The role to target
 * @param users List of all users
 * @param link Optional link to navigate to
 */
export const notifyUsersByRole = async (
  title: string,
  message: string,
  role: 'patient' | 'doctor' | 'admin',
  users: User[],
  link?: string
) => {
  try {
    await NotificationService.createSystemNotificationForRole(
      title,
      message,
      role,
      users,
      link
    );
  } catch (error) {
    console.error('Error creating system notification for role:', error);
  }
};

/**
 * Create a notification for admins when a new user registers
 * @param newUser The newly registered user
 * @param adminIds List of admin user IDs
 */
export const notifyAdminsOfNewUser = async (
  newUser: User,
  adminIds: string[]
) => {
  try {
    await NotificationService.createNewUserNotification(
      newUser,
      adminIds
    );
  } catch (error) {
    console.error('Error creating new user notification:', error);
  }
};