'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AvatarState, Live2DAvatarController } from './Live2DTypes';

interface Live2DContextType {
  avatarState: AvatarState;
  setAvatarState: (state: AvatarState) => void;
  setMouthOpen: (value: number) => void;
  startSpeaking: (speechId: string, text?: string, audioUrl?: string) => void;
  stopSpeaking: (speechId?: string) => void;
  registerController: (controller: Live2DAvatarController) => void;
  controller: Live2DAvatarController | null;
}

const Live2DContext = createContext<Live2DContextType>({
  avatarState: 'idle',
  setAvatarState: () => {},
  setMouthOpen: () => {},
  startSpeaking: () => {},
  stopSpeaking: () => {},
  registerController: () => {},
  controller: null,
});

export const useLive2D = () => useContext(Live2DContext);

export const Live2DProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [avatarState, setAvatarStateInternal] = useState<AvatarState>('idle');
  const controllerRef = useRef<Live2DAvatarController | null>(null);

  const registerController = useCallback((controller: Live2DAvatarController) => {
    controllerRef.current = controller;
    console.log('[Live2DProvider] Live2D controller registered successfully.');
  }, []);

  const setAvatarState = useCallback((state: AvatarState) => {
    setAvatarStateInternal(state);
    if (controllerRef.current) {
      controllerRef.current.setAvatarState(state);
    }
  }, []);

  const setMouthOpen = useCallback((value: number) => {
    if (controllerRef.current) {
      controllerRef.current.setMouthOpen(value);
    }
  }, []);

  const startSpeaking = useCallback((speechId: string, text?: string, audioUrl?: string) => {
    if (controllerRef.current && controllerRef.current.startSpeaking) {
      controllerRef.current.startSpeaking(speechId, text, audioUrl);
    }
  }, []);

  const stopSpeaking = useCallback((speechId?: string) => {
    if (controllerRef.current && controllerRef.current.stopSpeaking) {
      controllerRef.current.stopSpeaking(speechId);
    }
  }, []);

  return (
    <Live2DContext.Provider
      value={{
        avatarState,
        setAvatarState,
        setMouthOpen,
        startSpeaking,
        stopSpeaking,
        registerController,
        controller: controllerRef.current,
      }}
    >
      {children}
    </Live2DContext.Provider>
  );
};
