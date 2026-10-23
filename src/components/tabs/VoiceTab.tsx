import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Square, Volume2, Sparkles, MessageSquare, AlertCircle, Radio } from 'lucide-react';
import { LanguageMode } from '../../types';
import { queryMentorApi } from '../../services/api';
import { AudioWaveform } from '../AudioWaveform';

interface VoiceTabProps {
  userId: string;
  activeSubject: string;
  activeDocId: string | null;
  language: LanguageMode;
  onGrantXp: (amount: number) => void;
}

export const VoiceTab: React.FC<VoiceTabProps> = ({
  userId,
  activeSubject,
  activeDocId,
  language,
  onGrantXp
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentSpokenChunk, setCurrentSpokenChunk] = useState<string>('');
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [voiceLog, setVoiceLog] = useState<Array<{ role: 'student' | 'mentor'; text: string }>>([]);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'Hindi' ? 'hi-IN' : language === 'Hinglish' ? 'en-IN' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone access was denied. Please allow microphone permissions in your browser.');
        } else if (event.error !== 'no-speech') {
          setSpeechError(`Voice input notice: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechError('Speech Recognition is not supported on this browser. Try Chrome or Edge.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      stopAudio();
    };
  }, [language]);

  const toggleListening = () => {
    if (isPlayingAudio) {
      stopAudio();
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      if (transcript.trim()) {
        processVoiceQuery(transcript.trim());
      }
    } else {
      setTranscript('');
      setSpeechError(null);
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.warn('Recognition start caught', e);
      }
    }
  };

  const processVoiceQuery = async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsProcessing(true);
    setVoiceLog(prev => [...prev, { role: 'student', text: queryText }]);

    try {
      const res = await queryMentorApi({
        user_id: userId,
        subject: activeSubject,
        doc_id: activeDocId,
        query: queryText,
        language: language
      });

      setAiResponse(res.answer);
      setVoiceLog(prev => [...prev, { role: 'mentor', text: res.answer }]);
      onGrantXp(20);

      // Play audio chunked by sentences as strictly required by prompt
      speakResponseChunked(res.answer);
    } catch {
      const errorMsg = 'Could not generate speech response right now. Please try again.';
      setAiResponse(errorMsg);
      setVoiceLog(prev => [...prev, { role: 'mentor', text: errorMsg }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Crucial Prompt Requirement: Chunk response by sentences to prevent browser thread freeze!
  const speakResponseChunked = (rawText: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const cleanText = rawText
      .replace(/\*\*/g, '')
      .replace(/###/g, '')
      .replace(/🎯 Active-Recall Checkpoint[\s\S]*/i, '')
      .replace(/\$\$[\s\S]*?\$\$/g, 'Formula')
      .replace(/\$[^$]+\$/g, 'Formula');

    const sentenceChunks = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];

    if (sentenceChunks.length === 0) return;

    setIsPlayingAudio(true);

    sentenceChunks.forEach((chunk, index) => {
      const utterance = new SpeechSynthesisUtterance(chunk.trim());
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      if (language === 'Hindi') {
        utterance.lang = 'hi-IN';
      }

      utterance.onstart = () => {
        setCurrentSpokenChunk(chunk.trim());
      };

      if (index === sentenceChunks.length - 1) {
        utterance.onend = () => {
          setIsPlayingAudio(false);
          setCurrentSpokenChunk('');
        };
        utterance.onerror = () => {
          setIsPlayingAudio(false);
          setCurrentSpokenChunk('');
        };
      }

      window.speechSynthesis.speak(utterance);
    });
  };

  const stopAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    setCurrentSpokenChunk('');
  };

  return (
    <div className="space-y-6">
      {/* Voice Stage Container */}
      <div className="bg-white/85 backdrop-blur-md rounded-3xl p-8 sm:p-12 border border-[#8C6D23]/20 shadow-xl text-center relative overflow-hidden">
        {/* Decorative background glow */}
        <div className={`absolute inset-0 bg-gradient-to-b from-[#284E38]/5 to-transparent transition-opacity duration-500 ${isListening ? 'opacity-100' : 'opacity-0'}`} />

        <div className="relative z-10 max-w-xl mx-auto space-y-6">
          <div>
            <span className="text-xs font-bold text-[#8C6D23] uppercase tracking-wider bg-[#FCECD4] px-3 py-1 rounded-full border border-[#8C6D23]/20">
              🎙️ Bilingual Voice Tutoring ({language})
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#284E38] mt-3">
              Talk Live with your Guru
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Speak naturally about {activeSubject}. Eklavya listens, consults your textbook vectors, and answers aloud.
            </p>
          </div>

          {/* Live Audio Waveform when Speaking or Listening */}
          <div className="h-10 flex items-center justify-center">
            <AudioWaveform
              isActive={isListening || isPlayingAudio}
              color={isListening ? '#B85C38' : '#284E38'}
              barCount={24}
              height={32}
            />
          </div>

          {/* Massive Pulsing Microphone Button with 3D Depth */}
          <div className="py-4 flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center">
              {/* Outer Pulse Rings when Listening */}
              {isListening && (
                <>
                  <div className="absolute w-48 h-48 rounded-full bg-[#B85C38]/20 animate-ping duration-1000" />
                  <div className="absolute w-40 h-40 rounded-full bg-[#B85C38]/30 animate-pulse" />
                </>
              )}

              {/* Pulsing Audio Ring when Speaking */}
              {isPlayingAudio && (
                <>
                  <div className="absolute w-48 h-48 rounded-full bg-[#284E38]/20 animate-pulse duration-700" />
                  <div className="absolute w-40 h-40 rounded-full bg-[#8C6D23]/20 animate-ping duration-1500" />
                </>
              )}

              <button
                type="button"
                onClick={toggleListening}
                className={`relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center text-white shadow-2xl transition-all duration-300 cursor-pointer ${
                  isListening
                    ? 'bg-[#B85C38] scale-110 ring-8 ring-[#B85C38]/25'
                    : isPlayingAudio
                    ? 'bg-[#284E38] ring-8 ring-[#284E38]/25'
                    : 'bg-[#284E38] hover:bg-[#1E3B2A] hover:scale-105'
                }`}
              >
                {isListening ? (
                  <>
                    <Mic className="w-10 h-10 animate-bounce" />
                    <span className="text-[11px] font-bold mt-1">Listening...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-10 h-10" />
                    <span className="text-[11px] font-bold mt-1">Tap to Speak</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-stone-500 font-medium mt-4">
              {isListening
                ? 'Listening... Tap again when finished speaking'
                : isProcessing
                ? 'Synthesizing voice response...'
                : isPlayingAudio
                ? 'Speaking sentence chunk aloud...'
                : 'Tap to ask: "Explain the Pythagorean theorem with a real-life example"'}
            </p>
          </div>

          {/* Currently Spoken Sentence Chunk Highlighter */}
          {isPlayingAudio && currentSpokenChunk && (
            <div className="p-4 rounded-2xl bg-[#FCECD4]/80 border border-[#8C6D23]/30 text-xs sm:text-sm text-[#284E38] font-bold italic animate-in fade-in">
              <span className="text-[10px] uppercase font-mono text-[#8C6D23] not-italic block mb-1">
                Currently Speaking:
              </span>
              &ldquo;{currentSpokenChunk}&rdquo;
            </div>
          )}

          {/* Transcript / Status Box */}
          {transcript && (
            <div className="bg-[#FAF9F5] rounded-2xl p-4 border border-[#8C6D23]/20 text-left animate-in fade-in">
              <span className="text-[10px] font-bold text-[#8C6D23] uppercase tracking-wider block mb-1">
                Live Speech Recognition:
              </span>
              <p className="text-sm font-semibold text-[#1E2922] italic">
                &ldquo;{transcript}&rdquo;
              </p>
            </div>
          )}

          {speechError && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{speechError}</span>
            </div>
          )}

          {/* Stop Audio Button */}
          {isPlayingAudio && (
            <div className="flex justify-center animate-in fade-in duration-150">
              <button
                type="button"
                onClick={stopAudio}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Stop Audio Playback</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Voice Conversation History */}
      {voiceLog.length > 0 && (
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-stone-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <h3 className="text-sm font-bold text-[#284E38] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#8C6D23]" />
              Recent Voice Conversation Log
            </h3>
            {isPlayingAudio && (
              <span className="text-xs font-semibold text-[#284E38] flex items-center gap-1.5 animate-pulse">
                <Volume2 className="w-4 h-4" /> Speaking...
              </span>
            )}
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
            {voiceLog.map((log, index) => (
              <div
                key={index}
                className={`p-3.5 rounded-2xl text-xs sm:text-sm text-left ${
                  log.role === 'student'
                    ? 'bg-[#284E38] text-white ml-8 sm:ml-16 font-medium'
                    : 'bg-[#FAF9F5] border border-stone-200 text-stone-800 mr-8 sm:mr-16 leading-relaxed'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70">
                  {log.role === 'student' ? 'Student' : 'Eklavya Voice'}
                </div>
                <div className="whitespace-pre-wrap">{log.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
