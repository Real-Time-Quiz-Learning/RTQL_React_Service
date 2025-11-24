"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createStudentSocket, setSocket, getSocket } from '~/lib/socketClient';

const JoinGameSection: React.FC = () => {
  const [userName, setUserName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const navigate = useNavigate();

  const [joinStatus, setJoinStatus] = useState<string>('');
  const [lastEvent, setLastEvent] = useState<string>('');

  const handleJoinGame = () => {
  const trimmedUserName = userName.trim();
  // Preserve the room code exactly as entered by the user (do not force upper/lower case)
  const trimmedRoomCode = roomCode.trim();

    if (!trimmedUserName) {
      alert('Please enter your name.');
      return;
    }

    if (!trimmedRoomCode) {
      alert('Please enter a room code.');
      return;
    }

      try {
      // If there's an existing shared socket, disconnect it first to ensure a clean join
      const existing = getSocket();
      if (existing) {
        try { existing.disconnect(); } catch (e) { /* ignore */ }
        setSocket(null);
      }
      // Create the socket and store it in a shared module so it survives route changes.
      const socket = createStudentSocket('http://64.181.233.131:3677/student');
      setSocket(socket);
      console.log('[Join] Created student socket, connected=', socket.connected);
      setJoinStatus('socket-created');

      if (typeof (socket as any).onAny === 'function') {
        const containsJoinInfo = (payload: any): boolean => {
          if (!payload) return false;
          try {
            if (typeof payload === 'string') {
              // try parse JSON
              try {
                const parsed = JSON.parse(payload);
                return containsJoinInfo(parsed);
              } catch (e) {
                const lower = payload.toLowerCase();
                return lower.includes('joined') || lower.includes(trimmedRoomCode.toLowerCase()) || lower.includes(trimmedUserName.toLowerCase());
              }
            }
            if (Array.isArray(payload)) {
              return payload.some(p => containsJoinInfo(p));
            }
            if (typeof payload === 'object') {
              for (const k of Object.keys(payload)) {
                const v = (payload as any)[k];
                if (typeof v === 'string') {
                  const low = v.toLowerCase();
                  if (low.includes(trimmedRoomCode.toLowerCase()) || low.includes(trimmedUserName.toLowerCase()) || low.includes('joined')) return true;
                }
                if (containsJoinInfo(v)) return true;
              }
            }
          } catch (e) {
            return false;
          }
          return false;
        };

        (socket as any).onAny((event: string, ...args: any[]) => {
          console.log('[Join] socket event ->', event, args);
          setLastEvent(`${event} ${JSON.stringify(args)}`);

          const payload = args && args.length ? args[0] : null;

          // If server returned an explicit error message, treat as failure
          try {
            if (payload && typeof payload === 'object' && (payload.type === 'error' || payload.error || payload.err || /no such room/i.test(String(payload.message || '')))) {
              const reason = String(payload.message || payload.error || payload.err || 'Server reported an error');
              console.warn('[Join] Server reported error during join:', reason);
              setJoinStatus('failed');
              cleanupOnFailure(reason);
              return;
            }
          } catch (e) {
            // ignore
          }

          if (containsJoinInfo(payload)) {
            console.log('[Join] Detected join info in event', event, payload);
            setJoinStatus('ack-received-via-event');
            // call onJoinAck if defined later; use setTimeout to ensure onJoinAck exists
            setTimeout(() => {
              try { if (typeof (window as any) !== 'undefined') { /* noop */ } } catch {};
              try { (onJoinAck as any)(payload); } catch (e) { /* if onJoinAck not defined yet, ignore */ }
            }, 0);
          }
        });
      }

  // Prepare a safe join flow: emit join and only navigate after server ack or explicit join event.
  // Also add an optimistic fallback navigation in case the server does not send a client ack
  // but still registers the student (teacher/overseer may see the join).
  let joinTimeout: any = null;
  let optimisticNavTimer: any = null;
  let navigated = false;

      const cleanupOnFailure = (reason?: string) => {
        try { socket.disconnect(); } catch (e) {}
        setSocket(null);
        setJoinStatus('failed');
        if (reason) alert('Failed to join room: ' + reason);
      };

      // Prepare handlers so we can remove them from multiple places
      const onConnectError = (err: any) => {
        if (joinTimeout) clearTimeout(joinTimeout);
        console.error('Socket connect error', err);
        cleanupOnFailure(String(err?.message || err));
      };

      const onJoinAck = (payload?: any) => {
        if (joinTimeout) clearTimeout(joinTimeout);
        if (optimisticNavTimer) clearTimeout(optimisticNavTimer);
        socket.off('connect_error', onConnectError);
        socket.off('connect', emitJoin);
        if (navigated) return;
        navigated = true;
        // Navigate with both location state and URL query params so the student page can
        // recover join info even if navigation state is lost during route transitions.
        const url = `/student?room=${encodeURIComponent(trimmedRoomCode)}&name=${encodeURIComponent(trimmedUserName)}`;
        navigate(url, { state: { room: trimmedRoomCode, name: trimmedUserName } });
      };

      const emitJoin = () => {
        console.log('[Join] emitJoin() called; socket.connected=', socket.connected);
        // Use positional args (room, name, ack)
        socket.emit('quizRoomJoin', trimmedRoomCode, trimmedUserName, (ack: any) => {
          console.log('[Join] join ack received:', ack);
          setJoinStatus('ack-received');
          if (joinTimeout) clearTimeout(joinTimeout);
          if (optimisticNavTimer) clearTimeout(optimisticNavTimer);
          socket.off('quizRoomJoinAck', onJoinAck);
          socket.off('connect_error', onConnectError);

          // Treat ack as success unless the server explicitly reports an error
          let isSuccess = false;
          try {
            if (ack === true) isSuccess = true;
            else if (!ack) isSuccess = false;
            else if (typeof ack === 'string') isSuccess = ['ok', 'joined', 'success'].includes(ack.toLowerCase());
            else if (typeof ack === 'object') {
              if (ack.error || ack.err) isSuccess = false;
              else if (ack.ok === false || ack.success === false) isSuccess = false;
              else isSuccess = true;
            }
          } catch (e) {
            isSuccess = false;
          }

          if (isSuccess) {
            if (!navigated) {
              navigated = true;
              console.log('[Join] ack treated as success, navigating to /student');
              const url = `/student?room=${encodeURIComponent(trimmedRoomCode)}&name=${encodeURIComponent(trimmedUserName)}`;
              setTimeout(() => navigate(url, { state: { room: trimmedRoomCode, name: trimmedUserName } }), 100);
            }
          } else {
            console.warn('[Join] ack indicates failure', ack);
            cleanupOnFailure(ack?.reason || 'Unknown acknowledgement response from server');
          }
        });

        // Optimistic fallback: if we don't get an ack within a short window but the socket
        // is connected, navigate anyway (server may have registered the join but not ACKed client).
        optimisticNavTimer = setTimeout(() => {
          if (!navigated && socket.connected) {
            navigated = true;
            console.warn('[Join] optimistic fallback navigation (no client ack received)');
            const url = `/student?room=${encodeURIComponent(trimmedRoomCode)}&name=${encodeURIComponent(trimmedUserName)}`;
            navigate(url, { state: { room: trimmedRoomCode, name: trimmedUserName } });
          }
        }, 700);
      };

      if (socket.connected) {
        emitJoin();
      } else {
        // Ensure we emit after the socket connects
        socket.once('connect', emitJoin);
      }

      socket.once('connect_error', onConnectError);
  // Register explicit join ack fallback and common alternative event names used by servers
  socket.once('quizRoomJoinAck', onJoinAck);
  socket.once('userJoin', onJoinAck);
  socket.once('joined', onJoinAck);
  socket.once('joinedRoom', onJoinAck);
  socket.once('roomJoined', onJoinAck);
  socket.once('joinSuccess', onJoinAck);
  socket.once('joined-room', onJoinAck);

      // If nothing happens within 7 seconds, assume join failed
      joinTimeout = setTimeout(() => {
        socket.off('quizRoomJoinAck', onJoinAck);
        socket.off('connect_error', onConnectError);
        cleanupOnFailure('Timed out waiting for server response');
      }, 7000);
    } catch (err) {
      console.error('Error while joining quiz', err);
      alert('Unexpected error while attempting to join. See console for details.');
    }
  };

  return (
    <section className="min-h-[70vh] flex items-center justify-center py-16 sm:py-24 bg-gradient-to-br from-indigo-50 to-white">
      <div className="w-full max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-2xl border-4 border-indigo-200/50 transform transition-all duration-300 hover:shadow-indigo-300/60">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-gray-900 mb-2">JOIN A QUIZ</h1>
          <p className="text-center text-gray-600 mb-8">Enter the 4-letter room code and your name to start playing!</p>

          <div className="mb-6">
            <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
            <input
              type="text"
              id="userName"
              placeholder="e.g., CoolLearner"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 text-lg text-gray-900 shadow-sm transition duration-150"
              maxLength={15}
            />
          </div>

          <div className="mb-8">
            <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700 mb-2">Room Code</label>
            <input
              type="text"
              id="roomCode"
              placeholder="Get from Teacher"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 text-lg text-gray-900 font-mono font-bold shadow-sm transition duration-150"
            />
          </div>

          <button
            onClick={handleJoinGame}
            disabled={!userName.trim() || roomCode.trim().length === 0}
            className="w-full flex items-center justify-center space-x-2 px-10 py-4 text-xl font-bold text-white rounded-xl shadow-lg transition duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: (!userName.trim() || roomCode.trim().length === 0) ? '#9CA3AF' : '#4F46E5',
              boxShadow: (!userName.trim() || roomCode.trim().length === 0) ? 'none' : '0 10px 15px -3px rgba(79, 70, 229, 0.5), 0 4px 6px -2px rgba(79, 70, 229, 0.05)'
            }}
          >
            <span>JOIN QUIZ</span>
          </button>
          {joinStatus && (
            <div className="mt-4 text-sm text-left text-gray-600">
              <p><strong>Join status:</strong> {joinStatus}</p>
              <p className="truncate"><strong>Last event:</strong> {lastEvent}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default JoinGameSection;