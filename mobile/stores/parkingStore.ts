import { create } from 'zustand';
import {
  ParkingSession,
  ParkingStatus,
  ParkingState,
  Coordinates,
  SavedLocation,
  PaymentMethod,
} from '@/types';
import { parkingService } from '@/services/api';

interface ParkingStore extends ParkingState {
  // Session actions
  fetchCurrentSession: () => Promise<void>;
  createSession: (coordinates: Coordinates, detectionMethod: 'manual' | 'bluetooth' | 'activity_recognition') => Promise<void>;
  endSession: () => Promise<void>;
  updateSessionLocation: (coordinates: Coordinates) => Promise<void>;
  
  // Payment actions
  confirmPayment: (method: PaymentMethod, durationMinutes: number) => Promise<void>;
  
  // History actions
  fetchHistory: (page?: number) => Promise<void>;
  
  // Location actions
  setCurrentLocation: (coordinates: Coordinates) => void;
  fetchSavedLocations: () => Promise<void>;
  addSavedLocation: (location: Omit<SavedLocation, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  removeSavedLocation: (id: string) => Promise<void>;
  
  // Reset
  reset: () => void;
}

const initialState: ParkingState = {
  currentSession: null,
  isSessionActive: false,
  currentStatus: null,
  statusReason: null,
  sessionHistory: [],
  historyLoading: false,
  currentLocation: null,
  savedLocations: [],
  isLoading: false,
  isCreatingSession: false,
  isEndingSession: false,
};

export const useParkingStore = create<ParkingStore>((set, get) => ({
  ...initialState,

  // Fetch current active session
  fetchCurrentSession: async () => {
    try {
      set({ isLoading: true });

      const session = await parkingService.getCurrentSession();

      if (session) {
        set({
          currentSession: session,
          isSessionActive: true,
          currentStatus: session.status,
          statusReason: session.statusReason,
        });
      } else {
        set({
          currentSession: null,
          isSessionActive: false,
          currentStatus: null,
          statusReason: null,
        });
      }
    } catch (error) {
      console.error('Error fetching current session:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Create new parking session
  createSession: async (coordinates, detectionMethod) => {
    try {
      set({ isCreatingSession: true });

      const session = await parkingService.createSession({
        coordinates,
        detectionMethod,
      });

      set({
        currentSession: session,
        isSessionActive: true,
        currentStatus: session.status,
        statusReason: session.statusReason,
      });
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    } finally {
      set({ isCreatingSession: false });
    }
  },

  // End current session
  endSession: async () => {
    try {
      set({ isEndingSession: true });

      const { currentSession } = get();
      if (!currentSession) return;

      await parkingService.endSession(currentSession.id);

      // Add to history
      const endedSession = { ...currentSession, endedAt: new Date().toISOString() };
      
      set((state) => ({
        currentSession: null,
        isSessionActive: false,
        currentStatus: null,
        statusReason: null,
        sessionHistory: [endedSession, ...state.sessionHistory],
      }));
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    } finally {
      set({ isEndingSession: false });
    }
  },

  // Update session location (when user moves car)
  updateSessionLocation: async (coordinates) => {
    try {
      set({ isLoading: true });

      const { currentSession } = get();
      if (!currentSession) return;

      const updatedSession = await parkingService.updateSessionLocation(
        currentSession.id,
        coordinates
      );

      set({
        currentSession: updatedSession,
        currentStatus: updatedSession.status,
        statusReason: updatedSession.statusReason,
      });
    } catch (error) {
      console.error('Error updating session location:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Confirm payment
  confirmPayment: async (method, durationMinutes) => {
    try {
      set({ isLoading: true });

      const { currentSession } = get();
      if (!currentSession) return;

      const updatedSession = await parkingService.confirmPayment(
        currentSession.id,
        { method, durationMinutes }
      );

      set({
        currentSession: updatedSession,
        currentStatus: updatedSession.status,
        statusReason: updatedSession.statusReason,
      });
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch parking history
  fetchHistory: async (page = 1) => {
    try {
      set({ historyLoading: true });

      const response = await parkingService.getHistory(page);

      if (page === 1) {
        set({ sessionHistory: response.items });
      } else {
        set((state) => ({
          sessionHistory: [...state.sessionHistory, ...response.items],
        }));
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      set({ historyLoading: false });
    }
  },

  // Set current location
  setCurrentLocation: (coordinates) => {
    set({ currentLocation: coordinates });
  },

  // Fetch saved locations
  fetchSavedLocations: async () => {
    try {
      const locations = await parkingService.getSavedLocations();
      set({ savedLocations: locations });
    } catch (error) {
      console.error('Error fetching saved locations:', error);
    }
  },

  // Add saved location
  addSavedLocation: async (location) => {
    try {
      const newLocation = await parkingService.addSavedLocation(location);
      set((state) => ({
        savedLocations: [...state.savedLocations, newLocation],
      }));
    } catch (error) {
      console.error('Error adding saved location:', error);
      throw error;
    }
  },

  // Remove saved location
  removeSavedLocation: async (id) => {
    try {
      await parkingService.removeSavedLocation(id);
      set((state) => ({
        savedLocations: state.savedLocations.filter((loc) => loc.id !== id),
      }));
    } catch (error) {
      console.error('Error removing saved location:', error);
      throw error;
    }
  },

  // Reset store
  reset: () => {
    set(initialState);
  },
}));

// Selector hooks
export const useCurrentSession = () => useParkingStore((state) => state.currentSession);
export const useIsSessionActive = () => useParkingStore((state) => state.isSessionActive);
export const useParkingStatus = () => useParkingStore((state) => ({
  status: state.currentStatus,
  reason: state.statusReason,
}));
export const useParkingHistory = () => useParkingStore((state) => state.sessionHistory);
