'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, IconButton, TextField, Paper, Typography, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import CloseIcon from '@mui/icons-material/Close';

interface ChatResponse {
  reply: string;
  navigateUrl?: string;
}

interface ChatBarProps {
  onSend: (message: string) => Promise<ChatResponse>;
}

export default function ChatBar({ onSend }: ChatBarProps) {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(!!SR);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = 'ja-JP';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognitionRef.current = recognition;

    let finalTranscript = '';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim = transcript;
        }
      }
      setInput((prev) => {
        const base = prev.endsWith(interim) ? prev.slice(0, -interim.length) : prev;
        return finalTranscript || base + interim;
      });
    };

    recognition.onend = () => {
      setIsListening(false);
      if (finalTranscript) {
        setInput((prev) => prev.trimEnd() ? prev : finalTranscript);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.start();
    setIsListening(true);
  }, [isListening]);

  const handleSend = async () => {
    if (isListening) {
      recognitionRef.current?.stop();
    }
    const message = input.trim();
    if (!message || loading) return;

    setLoading(true);
    setShowResponse(true);
    setResponse('');
    setInput('');

    try {
      const result = await onSend(message);
      setResponse(result.reply);
      if (result.navigateUrl) {
        router.push(result.navigateUrl);
      }
      router.refresh();
    } catch (err) {
      setResponse(err instanceof Error ? err.message : 'エラーが発生しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 56,
        left: 0,
        right: 0,
        zIndex: 1100,
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
      elevation={0}
    >
      {showResponse && (
        <Box
          sx={{
            px: 2,
            py: 1.5,
            maxHeight: 200,
            overflowY: 'auto',
            bgcolor: 'grey.50',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">
                考え中...
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', flex: 1 }}>
                {response}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setShowResponse(false)}
                sx={{ mt: -0.5, mr: -1, flexShrink: 0 }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', px: 1, py: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder={isListening ? '音声認識中...' : 'AIに指示を入力...'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              handleSend();
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              bgcolor: isListening ? 'error.50' : 'grey.100',
            },
          }}
        />
        {speechSupported && (
          <IconButton
            onClick={toggleListening}
            disabled={loading}
            sx={{
              ml: 0.5,
              color: isListening ? 'error.main' : 'action.active',
            }}
          >
            {isListening ? <MicOffIcon /> : <MicIcon />}
          </IconButton>
        )}
        <IconButton
          color="primary"
          onClick={handleSend}
          disabled={!input.trim() || loading}
          sx={{ ml: 0.5 }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
}
