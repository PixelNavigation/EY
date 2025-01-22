import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Mic, Camera, Code, Eye, Timer } from 'lucide-react';
import { DebounceInput } from 'react-debounce-input';
import MonacoEditor from '@monaco-editor/react';
import * as faceapi from 'face-api.js';
import './AIMockInterview.css';

const AIMockInterview = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [feedback, setFeedback] = useState({ speech: '', eyeContact: '', technical: '' });
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [cameraActive, setCameraActive] = useState(false);
    const [showCodeEditor, setShowCodeEditor] = useState(false);
    const [code, setCode] = useState('');
    const [timer, setTimer] = useState(0);
    const videoRef = useRef(null);
    const recognition = useRef(null);
    const timerRef = useRef(null);

    const questions = [
        {
            id: 1,
            type: 'behavioral',
            question: 'Tell me about a challenging project you worked on.',
        },
        {
            id: 2,
            type: 'technical',
            question: 'Write a function to reverse a string without using built-in methods.',
            requiresCode: true,
        },
        {
            id: 3,
            type: 'behavioral',
            question: 'How do you handle conflicts in a team?',
        },
    ];

    useEffect(() => {
        const loadModels = async () => {
            await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
            await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        };
        loadModels();

        if ('webkitSpeechRecognition' in window) {
            recognition.current = new window.webkitSpeechRecognition();
            recognition.current.continuous = true;
            recognition.current.interimResults = true;

            recognition.current.onresult = (event) => {
                const current = event.resultIndex;
                const transcript = event.results[current][0].transcript;
                setTranscript(transcript);
                analyzeSpeech(transcript);
            };
        }

        return () => {
            if (recognition.current) {
                recognition.current.stop();
            }
            if (cameraActive) {
                stopCamera();
            }
            clearInterval(timerRef.current);
        };
    }, []);

    const startInterview = async () => {
        try {
            await startCamera();
            setCameraActive(true);
            setIsListening(true);
            recognition.current.start();
            startTimer();
        } catch (error) {
            setFeedback((prev) => ({
                ...prev,
                technical: 'Error accessing camera or microphone. Please check permissions.',
            }));
        }
    };

    const stopInterview = () => {
        recognition.current.stop();
        setIsListening(false);
        stopCamera();
        setCameraActive(false);
        clearInterval(timerRef.current);
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoRef.current.srcObject = stream;
            analyzeEyeContact();
        } catch (error) {
            console.error('Error accessing camera:', error);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
        }
    };

    const startTimer = () => {
        setTimer(0);
        timerRef.current = setInterval(() => {
            setTimer((prev) => prev + 1);
        }, 1000);
    };

    const analyzeSpeech = (text) => {
        const wordsPerMinute = (text.split(' ').length / (timer || 1)) * 60;
        let speechFeedback = '';

        if (wordsPerMinute < 120) {
            speechFeedback = 'Try speaking a bit faster and more confidently.';
        } else if (wordsPerMinute > 180) {
            speechFeedback = 'Slow down a bit to maintain clarity.';
        } else {
            speechFeedback = 'Good speaking pace!';
        }

        setFeedback((prev) => ({
            ...prev,
            speech: speechFeedback,
        }));
    };

    const analyzeEyeContact = () => {
        const detectFaces = async () => {
            if (videoRef.current) {
                const detections = await faceapi.detectAllFaces(
                    videoRef.current,
                    new faceapi.TinyFaceDetectorOptions()
                );
                setFeedback((prev) => ({
                    ...prev,
                    eyeContact: detections.length ? 'Good eye contact!' : 'Maintain eye contact with the camera.',
                }));
            }
        };
        setInterval(detectFaces, 2000);
    };

    const analyzeCode = () => {
        let technicalFeedback = '';

        if (code.includes('for') || code.includes('while')) {
            technicalFeedback = 'Consider using more efficient methods. Try string manipulation without loops.';
        } else if (!code.includes('return')) {
            technicalFeedback = 'Make sure to return the final result.';
        } else {
            technicalFeedback = 'Good approach! Consider adding error handling.';
        }

        setFeedback((prev) => ({
            ...prev,
            technical: technicalFeedback,
        }));
    };

    const nextQuestion = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion((prev) => prev + 1);
            setTranscript('');
            setCode('');
            setShowCodeEditor(questions[currentQuestion + 1].requiresCode || false);
            clearInterval(timerRef.current);
            startTimer();
        }
    };

    return (
        <div className="aimockinterview-container">
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">AI Mock Interview</h2>
                </div>
                <div className="card-content">
                    <div className="grid">
                        <div className="left-column">
                            <div className="video-container">
                                <video ref={videoRef} autoPlay playsInline muted className="video" />
                            </div>

                            <div className="button-group">
                                <button
                                    onClick={isListening ? stopInterview : startInterview}
                                    className={isListening ? 'button stop' : 'button start'}
                                >
                                    {isListening ? 'Stop Interview' : 'Start Interview'}
                                </button>
                                <button className="button" onClick={nextQuestion}>Next Question</button>
                            </div>
                        </div>

                        <div className="right-column">
                            <div className="question-container">
                                <h3 className="question-title">Current Question:</h3>
                                <p>{questions[currentQuestion].question}</p>
                            </div>

                            {showCodeEditor && (
                                <div className="code-editor-container">
                                    <MonacoEditor
                                        height="200px"
                                        language="javascript"
                                        value={code}
                                        onChange={(value) => setCode(value)}
                                    />
                                    <button className="button" onClick={analyzeCode}>Analyze Code</button>
                                </div>
                            )}

                            <div className="feedback-container">
                                {feedback.speech && (
                                    <div className="alert">
                                        <Mic className="icon" />
                                        <p className="alert-description">{feedback.speech}</p>
                                    </div>
                                )}
                                {feedback.eyeContact && (
                                    <div className="alert">
                                        <Eye className="icon" />
                                        <p className="alert-description">{feedback.eyeContact}</p>
                                    </div>
                                )}
                                {feedback.technical && (
                                    <div className="alert">
                                        <Code className="icon" />
                                        <p className="alert-description">{feedback.technical}</p>
                                    </div>
                                )}
                            </div>

                            <div className="timer-container">
                                <h3 className="timer">Timer: {timer}s</h3>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIMockInterview;
