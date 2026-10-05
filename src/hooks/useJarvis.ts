import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatMessage } from '@/types/chat';
import { JarvisState } from '@/types/jarvis';
import { formatTime } from '@/lib/utils';
import { jarvisWsManager } from '@/lib/jarvis/websocket';
import { jarvisApi } from '@/lib/jarvis/api';
import {
  WebSocketConnectionState,
  WebSocketServerEvent,
} from '@/lib/jarvis/types';

export interface PerformanceMetrics {
  websocketConnectTime: number | null; // ms
  firstEventTime: number | null; // ms
  firstChunkReceiveTime: number | null; // ms
  frontendRenderDelay: number | null; // ms
  commandRequestOverhead: number | null; // ms
}

export function useJarvis() {
  const [connectionState, setConnectionState] =
    useState<WebSocketConnectionState>('DISCONNECTED');
  const [jarvisState, setJarvisState] = useState<JarvisState>('listening');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'jarvis',
      content: 'JARVIS core online. Connected to backend assistant engine.',
      timestamp: formatTime(),
    },
  ]);

  const [activeStreamingText, setActiveStreamingText] = useState<string>('');

  // Map tracking request_id -> message lifecycle to guarantee ONE assistant message bubble per turn
  const requestMessageMapRef = useRef<
    Map<string, { messageId: string; isFinalized: boolean; chunks: string[] }>
  >(new Map());
  const activeRequestIdRef = useRef<string | null>(null);
  const connectStartTimeRef = useRef<number | null>(null);
  const commandSentTimeRef = useRef<number | null>(null);

  // Performance telemetry counters
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    websocketConnectTime: null,
    firstEventTime: null,
    firstChunkReceiveTime: null,
    frontendRenderDelay: null,
    commandRequestOverhead: null,
  });

  const [lastSpeechEvent, setLastSpeechEvent] = useState<{
    type: 'start' | 'end';
    speechId: string;
    text?: string;
    audioUrl?: string;
  } | null>(null);

  // Helper function to get or create exactly ONE assistant message object for a given request_id
  const getOrCreateAssistantMessage = useCallback(
    (reqId: string, initialContent: string = '...'): string => {
      let entry = requestMessageMapRef.current.get(reqId);
      if (entry) {
        return entry.messageId;
      }

      const assistantMsgId = `jarvis-${reqId}`;
      entry = { messageId: assistantMsgId, isFinalized: false, chunks: [] };
      requestMessageMapRef.current.set(reqId, entry);
      activeRequestIdRef.current = reqId;

      const initialMsg: ChatMessage = {
        id: assistantMsgId,
        sender: 'jarvis',
        content: initialContent,
        timestamp: formatTime(),
      };

      setMessages((prev) => {
        if (prev.some((m) => m.id === assistantMsgId)) {
          return prev;
        }
        return [...prev, initialMsg];
      });

      return assistantMsgId;
    },
    []
  );

  // 1. Initialize WebSocket Connection Lifecycle
  useEffect(() => {
    connectStartTimeRef.current = performance.now();
    jarvisWsManager.connect();

    const unsubscribeState = jarvisWsManager.subscribeState((newState) => {
      setConnectionState(newState);
      if (newState === 'CONNECTED' && connectStartTimeRef.current) {
        const connectDuration = Math.round(
          performance.now() - connectStartTimeRef.current
        );
        setMetrics((prev) => ({ ...prev, websocketConnectTime: connectDuration }));
      } else if (newState === 'DISCONNECTED' || newState === 'ERROR') {
        setJarvisState('offline');
      }
    });

    return () => {
      unsubscribeState();
    };
  }, []);

  // 2. Handle Real-Time Streaming WebSocket Events with Stable Ref Subscription
  useEffect(() => {
    const unsubscribeEvents = jarvisWsManager.subscribeEvents(
      (event: WebSocketServerEvent) => {
        const receiveTime = performance.now();

        if (commandSentTimeRef.current && !metrics.firstEventTime) {
          const firstEventDuration = Math.round(
            receiveTime - commandSentTimeRef.current
          );
          setMetrics((prev) => ({ ...prev, firstEventTime: firstEventDuration }));
        }

        const reqId = event.request_id || activeRequestIdRef.current || 'req_active';

        switch (event.type) {
          case 'response_start': {
            setJarvisState('thinking');
            setActiveStreamingText('');
            getOrCreateAssistantMessage(reqId, '...');
            break;
          }

          case 'response_chunk': {
            if (!event.text) break;
            const chunkText = event.text;

            const entry = requestMessageMapRef.current.get(reqId);
            const isFirstChunk = !entry || entry.chunks.length === 0;

            // Measure First Chunk Latency
            if (commandSentTimeRef.current && isFirstChunk) {
              const firstChunkLatency = Math.round(
                receiveTime - commandSentTimeRef.current
              );
              const renderStart = performance.now();
              setMetrics((prev) => ({
                ...prev,
                firstChunkReceiveTime: firstChunkLatency,
                frontendRenderDelay: Math.round(
                  performance.now() - renderStart
                ),
              }));
            }

            setJarvisState('speaking');
            const msgId = getOrCreateAssistantMessage(reqId, chunkText);
            const currentEntry = requestMessageMapRef.current.get(reqId);
            if (currentEntry) {
              currentEntry.chunks.push(chunkText);
              const updatedFullText = currentEntry.chunks.join(' ');
              setActiveStreamingText(updatedFullText);

              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === msgId ? { ...msg, content: updatedFullText } : msg
                )
              );
            }
            break;
          }

          case 'response_end': {
            const entry = requestMessageMapRef.current.get(reqId);
            const accumulatedText = entry ? entry.chunks.join(' ') : '';
            const finalText = event.full_text || accumulatedText;

            const msgId = getOrCreateAssistantMessage(reqId, finalText || 'Command executed.');
            if (entry) {
              entry.isFinalized = true;
            }

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === msgId
                  ? { ...msg, content: finalText || 'Command executed.' }
                  : msg
              )
            );

            setActiveStreamingText(finalText || '');
            setJarvisState('listening');
            break;
          }

          case 'wake_detected': {
            setJarvisState('wake_detected');
            break;
          }

          case 'speaking_start': {
            const speechId = event.speech_id || `speech_${Date.now()}`;
            console.log(
              `[WS_RX] event=speaking_start speech_id=${speechId} req_id=${event.request_id || ''} text=${event.text || ''}`
            );
            setJarvisState('speaking');
            setLastSpeechEvent({
              type: 'start',
              speechId,
              text: event.text,
              audioUrl: event.audio_url,
            });
            const displayText = (event.text_display || event.text || '').trim();
            if (displayText) {
              setActiveStreamingText(displayText);
            }

            // CRITICAL: Check if request_id is already mapped to an assistant message
            const mappedReqId = event.request_id || activeRequestIdRef.current;
            if (mappedReqId) {
              const existingEntry = requestMessageMapRef.current.get(mappedReqId);
              if (existingEntry) {
                // Message for this request turn already exists (or is finalized).
                // Do NOT create a duplicate chat bubble!
                break;
              }
            }

            // Fallback for standalone voice notifications without request_id
            if (displayText) {
              const standaloneReqId = `voice-${Date.now()}`;
              getOrCreateAssistantMessage(standaloneReqId, displayText);
            }
            break;
          }

          case 'speaking_end': {
            const speechId = event.speech_id || '';
            console.log(`[WS_RX] event=speaking_end speech_id=${speechId}`);
            setJarvisState('listening');
            setLastSpeechEvent({
              type: 'end',
              speechId,
            });
            break;
          }

          case 'state': {
            if (event.state) {
              const s = event.state.toLowerCase();
              if (s === 'wake_detected') setJarvisState('wake_detected');
              else if (s === 'listening') setJarvisState('listening');
              else if (s === 'thinking') setJarvisState('thinking');
              else if (s === 'processing') setJarvisState('processing');
              else if (s === 'speaking') setJarvisState('speaking');
              else if (s === 'video_analyzing') setJarvisState('video_analyzing');
              else if (s === 'video_editing') setJarvisState('video_editing');
              else if (s === 'video_exporting') setJarvisState('video_exporting');
              else if (s === 'completed') setJarvisState('completed');
              else if (s === 'error') setJarvisState('error');
              else if (s === 'idle' || s === 'wake_mode') setJarvisState('idle');
            }
            break;
          }

          case 'video_progress': {
            if (
              event.stage === 'scene_analysis_started' ||
              event.stage === 'source_media_found' ||
              event.stage === 'clip_scoring_started'
            ) {
              setJarvisState('video_analyzing');
            } else if (
              event.stage === 'timeline_building' ||
              event.stage === 'editing' ||
              event.stage === 'premiere_launching' ||
              event.stage === 'media_importing'
            ) {
              setJarvisState('video_editing');
            } else if (
              event.stage === 'exporting' ||
              event.stage === 'verification_started'
            ) {
              setJarvisState('video_exporting');
            } else if (
              event.stage === 'completed' ||
              event.stage === 'video_complete'
            ) {
              setJarvisState('completed');
            }
            break;
          }

          case 'completed': {
            setJarvisState('completed');
            break;
          }

          case 'cancelled': {
            const entry = requestMessageMapRef.current.get(reqId);
            if (entry) {
              entry.isFinalized = true;
              const msgId = entry.messageId;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === msgId
                    ? { ...msg, content: '[Response Cancelled]' }
                    : msg
                )
              );
            }
            setJarvisState('listening');
            setActiveStreamingText('');
            break;
          }

          case 'error': {
            const errorMsg =
              event.error?.message || 'An error occurred processing command.';
            const msgId = getOrCreateAssistantMessage(reqId, `⚠️ ${errorMsg}`);
            const entry = requestMessageMapRef.current.get(reqId);
            if (entry) {
              entry.isFinalized = true;
            }

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === msgId ? { ...msg, content: `⚠️ ${errorMsg}` } : msg
              )
            );

            setJarvisState('error');
            setActiveStreamingText('');
            break;
          }
        }
      }
    );

    return () => {
      unsubscribeEvents();
    };
  }, [getOrCreateAssistantMessage, metrics.firstEventTime]);

  // 3. Command Dispatching (WebSocket primary, REST fallback)
  const sendCommand = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const trimmedText = text.trim();
      const sendStart = performance.now();
      commandSentTimeRef.current = sendStart;

      const reqId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      activeRequestIdRef.current = reqId;

      // Append User message to chat history
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        content: trimmedText,
        timestamp: formatTime(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setJarvisState('thinking');

      // Attempt WebSocket transmission first with explicit reqId
      const sentViaWs = jarvisWsManager.sendCommand(trimmedText, true, reqId);
      const overhead = Math.round(performance.now() - sendStart);
      setMetrics((prev) => ({ ...prev, commandRequestOverhead: overhead }));

      // REST fallback if WebSocket connection is closed
      if (!sentViaWs) {
        try {
          const res = await jarvisApi.executeCommand(trimmedText, false);
          setJarvisState('speaking');
          setActiveStreamingText(res.text);

          const assistantMsg: ChatMessage = {
            id: `jarvis-rest-${Date.now()}`,
            sender: 'jarvis',
            content: res.text,
            timestamp: formatTime(),
          };
          setMessages((prev) => [...prev, assistantMsg]);

          setTimeout(() => {
            setJarvisState('listening');
            setActiveStreamingText('');
          }, 3000);
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : 'Failed to reach Jarvis service.';
          setJarvisState('offline');
          const errMessage: ChatMessage = {
            id: `err-${Date.now()}`,
            sender: 'jarvis',
            content: `⚠️ Connection Error: ${message}`,
            timestamp: formatTime(),
          };
          setMessages((prev) => [...prev, errMessage]);
          setTimeout(() => setJarvisState('listening'), 4000);
        }
      }
    },
    []
  );

  // 4. Cancel Speech & Active Command
  const cancelCommand = useCallback(async () => {
    jarvisWsManager.sendCancel();
    try {
      await jarvisApi.cancelSpeech();
    } catch {
      // Ignore if REST fails when WS already succeeded
    }

    const activeReqId = activeRequestIdRef.current;
    if (activeReqId) {
      const entry = requestMessageMapRef.current.get(activeReqId);
      if (entry) {
        entry.isFinalized = true;
        const msgId = entry.messageId;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === msgId ? { ...msg, content: '[Response Cancelled]' } : msg
          )
        );
      }
    }

    setJarvisState('listening');
    setActiveStreamingText('');
  }, []);

  return {
    connectionState,
    jarvisState,
    messages,
    activeStreamingText,
    sendCommand,
    cancelCommand,
    metrics,
    lastSpeechEvent,
  };
}
