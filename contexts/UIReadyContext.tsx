import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { InteractionManager, AppState, AppStateStatus } from 'react-native';

interface UIReadyContextType {
  isUIReady: boolean;
  isAppActive: boolean;
  safelyShowAlert: (showFn: () => void) => void;
  safelyRequestPermission: (requestFn: () => Promise<any>) => Promise<any>;
}

const UIReadyContext = createContext<UIReadyContextType>({
  isUIReady: false,
  isAppActive: false,
  safelyShowAlert: () => {},
  safelyRequestPermission: async () => {},
});

export const useUIReady = () => useContext(UIReadyContext);

interface UIReadyProviderProps {
  children: ReactNode;
  minimumDelay?: number; // Minimum ms before UI is considered ready
}

export function UIReadyProvider({ children, minimumDelay = 2000 }: UIReadyProviderProps) {
  const [isUIReady, setIsUIReady] = useState(false);
  const [isAppActive, setIsAppActive] = useState(AppState.currentState === 'active');
  const isMountedRef = useRef(true);
  const pendingActionsRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    isMountedRef.current = true;

    // Wait for both InteractionManager AND a minimum delay
    const minDelayTimer = setTimeout(() => {
      InteractionManager.runAfterInteractions(() => {
        // Additional safety delay after interactions complete
        setTimeout(() => {
          if (isMountedRef.current) {
            setIsUIReady(true);
            if (__DEV__) {
              console.log('✅ UIReadyContext: UI is now ready for alerts and permissions');
            }
            // Execute any pending actions
            pendingActionsRef.current.forEach(action => action());
            pendingActionsRef.current = [];
          }
        }, 500);
      });
    }, minimumDelay);

    // Listen for app state changes
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (isMountedRef.current) {
        setIsAppActive(nextAppState === 'active');
      }
    });

    return () => {
      isMountedRef.current = false;
      clearTimeout(minDelayTimer);
      subscription.remove();
    };
  }, [minimumDelay]);

  const safelyShowAlert = (showFn: () => void) => {
    if (isUIReady && isAppActive) {
      InteractionManager.runAfterInteractions(() => {
        showFn();
      });
    } else {
      // Queue for later execution when UI is ready
      if (__DEV__) {
        console.log('⏳ UIReadyContext: Queuing alert for later');
      }
      pendingActionsRef.current.push(() => {
        InteractionManager.runAfterInteractions(() => {
          showFn();
        });
      });
    }
  };

  const safelyRequestPermission = async (requestFn: () => Promise<any>): Promise<any> => {
    return new Promise((resolve) => {
      const executeRequest = async () => {
        InteractionManager.runAfterInteractions(async () => {
          try {
            const result = await requestFn();
            resolve(result);
          } catch (error) {
            if (__DEV__) {
              console.warn('Permission request failed:', error);
            }
            resolve(null);
          }
        });
      };

      if (isUIReady && isAppActive) {
        executeRequest();
      } else {
        if (__DEV__) {
          console.log('⏳ UIReadyContext: Queuing permission request for later');
        }
        pendingActionsRef.current.push(executeRequest);
      }
    });
  };

  return (
    <UIReadyContext.Provider value={{ isUIReady, isAppActive, safelyShowAlert, safelyRequestPermission }}>
      {children}
    </UIReadyContext.Provider>
  );
}

