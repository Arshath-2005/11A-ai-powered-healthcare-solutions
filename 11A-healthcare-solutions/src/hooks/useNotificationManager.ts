import { useCallback } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import NotificationService from '../services/NotificationService';
import { Appointment, MedicalReport } from '../types';

/**
 * Hook for managing notifications in different components
 */
const useNotificationManager = () => {
  const { addNotification } = useNotifications();
  const { userProfile } = useAuth();

  /**
   * Create a notification for the current user
   */
  const notifyCurrentUser = useCallback(
    async (
      title: string,
      message: string,
      type: 'appointment' | 'medical' | 'system' | 'message',
      relatedId?: string,
      link?: string
    ) => {
      if (!userProfile) return;

      try {
        await addNotification({
          userId: userProfile.uid,
          title,
          message,
          type,
          read: false,
          relatedId,
          link
        });
      } catch (error) {
        console.error('Error creating notification for current user:', error);
      }
    },
    [addNotification, userProfile]
  );

  /**
   * Notify about a new appointment
   */
  const notifyAppointment = useCallback(
    async (appointment: Appointment, isForDoctor: boolean) => {
      if (!userProfile) return;

      try {
        const recipientId = isForDoctor ? appointment.doctorId : appointment.patientId;
        await NotificationService.createAppointmentNotification(
          appointment,
          recipientId,
          isForDoctor
        );
      } catch (error) {
        console.error('Error creating appointment notification:', error);
      }
    },
    [userProfile]
  );

  /**
   * Notify about an appointment status change
   */
  const notifyAppointmentStatusChange = useCallback(
    async (appointment: Appointment, previousStatus: string) => {
      if (!userProfile) return;

      try {
        await NotificationService.createAppointmentStatusNotification(
          appointment,
          appointment.patientId,
          previousStatus
        );
      } catch (error) {
        console.error('Error creating appointment status notification:', error);
      }
    },
    [userProfile]
  );

  /**
   * Notify about a new medical report
   */
  const notifyMedicalReport = useCallback(
    async (report: MedicalReport) => {
      if (!userProfile) return;

      try {
        await NotificationService.createMedicalReportNotification(
          report,
          report.patientId
        );
      } catch (error) {
        console.error('Error creating medical report notification:', error);
      }
    },
    [userProfile]
  );

  return {
    notifyCurrentUser,
    notifyAppointment,
    notifyAppointmentStatusChange,
    notifyMedicalReport
  };
};

export default useNotificationManager;