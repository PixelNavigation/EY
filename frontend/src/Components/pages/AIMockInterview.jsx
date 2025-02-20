import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Mic, Camera, Code, Eye, Timer } from 'lucide-react';
import MonacoEditor from '@monaco-editor/react';
import * as faceapi from 'face-api.js';
import './AIMockInterview.css';
import { useNavigate } from 'react-router-dom';

const AIMockInterview = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [feedback, setFeedback] = useState({
        speech: '',
        eyeContact: '',
        technical: ''
    });
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [questions, setQuestions] = useState([]);
    const [cameraActive, setCameraActive] = useState(false);
    const [showCodeEditor, setShowCodeEditor] = useState(false);
    const [code, setCode] = useState('');
    const [timer, setTimer] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [careerAmbition, setCareerAmbition] = useState('Software Developer');

    const videoRef = useRef(null);
    const recognition = useRef(null);
    const timerRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const loadModels = async () => {
            await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
            await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
            setModelsLoaded(true);
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
            if (recognition.current) recognition.current.stop();
            stopCamera();
            clearInterval(timerRef.current);
        };
    }, []);

    useEffect(() => {
        // Fetch user profile to get careerAmbition
        const fetchUserCareerAmbition = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/profile`);
                setCareerAmbition(response.data.careerAmbition || 'Software Developer');
            } catch (error) {
                console.error('Error fetching user profile:', error);
                if (error.response && error.response.status === 401) {
                    navigate('/login');
                }
            }
        };
        fetchUserCareerAmbition();
    }, []);

    useEffect(() => {
        // Fetch questions based on user’s careerAmbition
        if (careerAmbition) {
            fetchDynamicQuestions(careerAmbition);
        }
    }, [careerAmbition]);

    const fetchDynamicQuestions = async (ambition) => {
        setIsLoading(true);
        try {
            const response = await axios.post('/api/generate-questions', {
                type: ambition,  // use the careerAmbition
                num_questions: 3
            });
            setQuestions(response.data);
            setCurrentQuestion(0);
            setShowCodeEditor(response.data[0].requiresCode || false);
        } catch (error) {
            console.error('Error fetching questions:', error);
            setQuestions([{
                id: 1,
                type: ambition,
                question: 'Tell me about yourself.',
                requiresCode: false
            }]);
        }
        setIsLoading(false);
    };

    const saveInterviewFeedback = async () => {
        try {
            await axios.post('/api/save-interview-feedback', {
                type: careerAmbition,
                feedback: {
                    transcript,
                    code,
                    feedbackItems: feedback
                }
            });
        } catch (error) {
            console.error('Error saving feedback:', error);
        }
    };

    const startInterview = async () => {
        if (!modelsLoaded) {
            console.error('Models not loaded yet');
            return;
        }
        try {
            await startCamera();
            setCameraActive(true);
            setIsListening(true);
            recognition.current.start();
            startTimer();
            speakQuestion(questions[currentQuestion].question);
        } catch (error) {
            setFeedback(prev => [
                ...prev,
                { type: 'technical', message: 'Error accessing camera or microphone.' }
            ]);
        }
    };

    const stopInterview = () => {
        recognition.current.stop();
        setIsListening(false);
        stopCamera();
        setCameraActive(false);
        clearInterval(timerRef.current);
        saveInterviewFeedback();
        alert('Interview Complete! Feedback has been saved.');
    };

    const nextQuestion = () => {
        if (currentQuestion < questions.length - 1) {
            const nextQuestionIndex = currentQuestion + 1;
            setCurrentQuestion(nextQuestionIndex);
            setTranscript('');
            setCode('');
            setShowCodeEditor(questions[nextQuestionIndex].requiresCode || false);
            clearInterval(timerRef.current);
            startTimer();
            speakQuestion(questions[nextQuestionIndex].question);
        } else {
            stopInterview();
        }
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

    const updateFeedback = (type, message) => {
        setFeedback(prev => ({
            ...prev,
            [type]: message
        }));
    };

    const analyzeSpeech = (text) => {
        const wordsPerMinute = (text.split(' ').length / (timer || 1)) * 60;
        const speechFeedback =
            wordsPerMinute < 120
                ? 'Try speaking a bit faster and more confidently.'
                : wordsPerMinute > 180
                    ? 'Slow down a bit to maintain clarity.'
                    : 'Good speaking pace!';

        updateFeedback('speech', speechFeedback);
    };

    const analyzeEyeContact = () => {
        const detectFaces = async () => {
            if (videoRef.current) {
                const detections = await faceapi.detectAllFaces(
                    videoRef.current,
                    new faceapi.TinyFaceDetectorOptions()
                );
                const eyeFeedback = detections.length
                    ? 'Good eye contact!'
                    : 'Maintain eye contact with the camera.';
                updateFeedback('eyeContact', eyeFeedback);
            }
        };
        setInterval(detectFaces, 2000);
    };

    const analyzeCode = () => {
        const technicalFeedback = code.includes('return')
            ? 'Good approach! Consider optimizing for edge cases.'
            : 'Make sure to return the result.';
        updateFeedback('technical', technicalFeedback);
    };

    const speakQuestion = (question) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(question);
            window.speechSynthesis.speak(utterance);
        } else {
            console.error('Text-to-speech not supported.');
        }
    };

    const provideFinalFeedback = () => {
        alert('Interview Complete! Review your feedback: ' + JSON.stringify(feedback, null, 2));
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
                                {isListening && (
                                    <button className="button" onClick={nextQuestion}>
                                        Next Question
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="right-column">
                            {isLoading ? (
                                <div>Loading questions...</div>
                            ) : (
                                <>
                                    <div className="question-container">
                                        <h3 className="question-title">Current Question:</h3>
                                        <p>{questions[currentQuestion]?.question}</p>
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
                                        {Object.entries(feedback).map(([type, message]) => (
                                            message && (
                                                <div key={type} className="alert">
                                                    {type === 'speech' && <Mic className="icon" />}
                                                    {type === 'eyeContact' && <Eye className="icon" />}
                                                    {type === 'technical' && <Code className="icon" />}
                                                    <p className="alert-description">{message}</p>
                                                </div>
                                            )
                                        ))}
                                    </div>

                                    <div className="timer-container">
                                        <h3 className="timer">Timer: {timer}s</h3>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIMockInterview;