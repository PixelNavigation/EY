import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Mic, Camera, Code, Eye, Timer, RefreshCw, Star, Building2 } from 'lucide-react';
import MonacoEditor from '@monaco-editor/react';
import * as faceapi from 'face-api.js';
import './AIMockInterview.css';
import { useNavigate } from 'react-router-dom';

const AIMockInterview = () => {
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [feedback, setFeedback] = useState({
        speech: '',
        eyeContact: '',
        technical: ''
    });
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [currentRound, setCurrentRound] = useState(0);
    const [interviewRounds, setInterviewRounds] = useState([]);
    const [questions, setQuestions] = useState([]); // Add missing state
    const [cameraActive, setCameraActive] = useState(false);
    const [showCodeEditor, setShowCodeEditor] = useState(false);
    const [code, setCode] = useState('');
    const [timer, setTimer] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [careerAmbition, setCareerAmbition] = useState('Software Developer');
    const [answers, setAnswers] = useState([]);
    const [interviewComplete, setInterviewComplete] = useState(false);
    const [speechRecognitionError, setSpeechRecognitionError] = useState(null);
    const [cameraError, setCameraError] = useState(null);
    const [fetchError, setFetchError] = useState(null); // Add state for fetch errors

    const COMPANIES = ['Google', 'Microsoft', 'Amazon'];

    const videoRef = useRef(null);
    const recognition = useRef(null);
    const timerRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const loadModels = async () => {
            try {
                await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
                await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
                setModelsLoaded(true);
            } catch (error) {
                console.error('Error loading face detection models:', error);
            }
        };
        loadModels();

        if ('webkitSpeechRecognition' in window) {
            recognition.current = new window.webkitSpeechRecognition();
            recognition.current.continuous = true;
            recognition.current.interimResults = true;

            recognition.current.onerror = (event) => {
                setSpeechRecognitionError('Speech recognition failed: ' + event.error);
                console.error('Speech recognition error:', event.error);
            };

            recognition.current.onresult = (event) => {
                const current = event.resultIndex;
                const transcript = event.results[current][0].transcript;
                setTranscript(transcript);
                analyzeSpeech(transcript);
            };
        } else {
            setSpeechRecognitionError('Speech recognition not supported in this browser.');
        }

        return () => {
            if (recognition.current) recognition.current.stop();
            stopCamera();
            clearInterval(timerRef.current);
        };
    }, []);

    useEffect(() => {
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

    const fetchDynamicQuestions = async (ambition) => {
        if (!ambition) return;  // Only check for ambition, remove selectedCompany check

        setIsLoading(true);
        setFetchError(null);
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/generate-questions`, {
                type: ambition,
                num_questions: 3
            });
            setQuestions(response.data);
            setCurrentQuestion(0);
            setShowCodeEditor(response.data[0].requiresCode || false);
        } catch (error) {
            console.error('Error fetching questions:', error);
            setFetchError('Failed to fetch questions. Please try again later.');
            setQuestions([{
                id: 1,
                type: ambition,
                question: 'Tell me about yourself.',
                requiresCode: false
            }]);
        }
        setIsLoading(false);
    };

    const fetchCompanyInterviewRounds = async (company) => {
        setIsLoading(true);
        setFetchError(null);
        try {
            console.log('Fetching questions for company:', company); // Debug log

            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/generate-questions`, {
                type: company,
                num_rounds: 3
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 10000 // 10 second timeout
            });

            console.log('API Response:', response.data); // Debug log

            if (response.data) {
                if (Array.isArray(response.data)) {
                    setInterviewRounds(response.data);
                    setCurrentRound(0);
                    setCurrentQuestion(0);
                    setShowCodeEditor(response.data[0]?.[0]?.requiresCode || false);
                } else {
                    throw new Error('Invalid response format');
                }
            } else {
                throw new Error('No data received from server');
            }
        } catch (error) {
            console.error('Error details:', error.response?.data || error.message);
            setFetchError(
                error.response?.data?.error ||
                'Failed to fetch interview rounds. Please try again later.'
            );
            setInterviewRounds([]);
        } finally {
            setIsLoading(false);
        }
    };

    const selectCompany = (company) => {
        setSelectedCompany(company);
        fetchCompanyInterviewRounds(company);
    };

    const renderCompanySelection = () => {
        return (
            <div className="company-selection">
                <h2>Select a Company for Mock Interview</h2>
                <div className="company-grid">
                    {COMPANIES.map(company => (
                        <button
                            key={company}
                            onClick={() => selectCompany(company)}
                            className="company-button"
                        >
                            <Building2 className="icon" />
                            {company}
                        </button>
                    ))}
                </div>
                {fetchError && <div className="error-message">{fetchError}</div>}
            </div>
        );
    };

    const renderInterviewRounds = () => {
        return interviewRounds.map((round, index) => (
            <div
                key={index}
                className={`round ${currentRound === index ? 'active' : ''}`}
            >
                {round.map((question, qIndex) => (
                    <div
                        key={qIndex}
                        className={`question ${currentQuestion === qIndex ? 'current' : ''}`}
                    >
                        {question.question}
                    </div>
                ))}
            </div>
        ));
    };

    const saveInterviewFeedback = async () => {
        try {
            await axios.post('/api/save-interview-feedback', {
                type: careerAmbition,
                feedback: {
                    transcript,
                    code,
                    feedbackItems: feedback,
                    questionsAndAnswers: answers
                }
            });
        } catch (error) {
            console.error('Error saving feedback:', error);
        }
    };

    const startInterview = async () => {
        if (isListening) {
            console.warn('SpeechRecognition is already running');
            return;
        }
        if (!modelsLoaded) {
            console.error('Models not loaded yet');
            return;
        }

        // Check if we have questions available
        if (!interviewRounds[currentRound] || !interviewRounds[currentRound][currentQuestion]) {
            console.error('No questions available');
            setFetchError('No questions available. Please try again.');
            return;
        }

        try {
            await startCamera();
            setCameraActive(true);
            setIsListening(true);
            recognition.current.start();
            startTimer();
            const currentQuestionText = interviewRounds[currentRound][currentQuestion].question;
            speakQuestion(currentQuestionText);
        } catch (error) {
            setFeedback(prev => ({
                ...prev,
                error: 'Error starting interview: ' + error.message
            }));
            console.error('Error starting interview:', error);
        }
    };

    const stopInterview = () => {
        if (recognition.current) recognition.current.stop();
        setIsListening(false);
        stopCamera();
        setCameraActive(false);
        clearInterval(timerRef.current);
        saveInterviewFeedback();
        setInterviewComplete(true);
    };

    const startNewInterview = () => {
        setTranscript('');
        setFeedback({
            speech: '',
            eyeContact: '',
            technical: ''
        });
        setCurrentQuestion(0);
        setCode('');
        setTimer(0);
        setAnswers([]);
        setInterviewComplete(false);
        setSpeechRecognitionError(null);
        setCameraError(null);

        if (careerAmbition) {
            fetchDynamicQuestions(careerAmbition);
        }
    };

    const provideFinalFeedback = () => {
        alert('Interview Complete! Detailed Feedback:\n' +
            `Total Questions: ${questions.length}\n` +
            `Total Time: ${timer} seconds\n` +
            `Feedback Details:\n` +
            `Speech Quality: ${feedback.speech}\n` +
            `Eye Contact: ${feedback.eyeContact}\n` +
            `Technical Assessment: ${feedback.technical}`
        );
    };

    const renderInterviewControls = () => {
        if (interviewComplete) {
            return (
                <div className="interview-complete-controls">
                    <button
                        className="button feedback"
                        onClick={provideFinalFeedback}
                    >
                        <Star className="icon" /> View Detailed Feedback
                    </button>
                    <button
                        className="button start"
                        onClick={startNewInterview}
                    >
                        <RefreshCw className="icon" /> Start New Interview
                    </button>
                </div>
            );
        }

        return (
            <div className="button-group">
                {speechRecognitionError && (
                    <div className="error-message">{speechRecognitionError}</div>
                )}
                {cameraError && (
                    <div className="error-message">{cameraError}</div>
                )}
                <button
                    onClick={isListening ? stopInterview : startInterview}
                    className={isListening ? 'button stop' : 'button start'}
                >
                    {isListening ? 'Stop Interview' : 'Start Interview'}
                </button>
                {isListening && (
                    <button className="button" onClick={handleStopRecording}>
                        Stop Recording
                    </button>
                )}
            </div>
        );
    };

    const nextQuestion = () => {
        if (!interviewRounds.length) {
            console.error('No interview rounds available');
            return;
        }

        const currentRoundQuestions = interviewRounds[currentRound];
        if (!currentRoundQuestions) {
            console.error('Current round not found');
            return;
        }

        if (currentQuestion < currentRoundQuestions.length - 1) {
            setCurrentQuestion(prev => prev + 1);
            setTranscript('');
            setCode('');
            const nextQuestion = currentRoundQuestions[currentQuestion + 1];
            setShowCodeEditor(nextQuestion?.requiresCode || false);
        } else if (currentRound < interviewRounds.length - 1) {
            setCurrentRound(prev => prev + 1);
            setCurrentQuestion(0);
            const nextRoundQuestions = interviewRounds[currentRound + 1];
            setShowCodeEditor(nextRoundQuestions[0]?.requiresCode || false);
        } else {
            stopInterview();
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoRef.current.srcObject = stream;
            analyzeEyeContact();
            setCameraError(null);
        } catch (error) {
            console.error('Error accessing camera:', error);
            setCameraError('Could not access camera. Please check permissions.');
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

    const startRecordingAfterDelay = () => {
        setTimeout(() => {
            if (!isListening) {
                recognition.current.start();
                setIsListening(true);
            }
        }, 5000);
    };

    const speakQuestion = (question) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(question);
            utterance.onend = () => {
                startRecordingAfterDelay();
            };
            window.speechSynthesis.speak(utterance);
        } else {
            console.error('Text-to-speech not supported.');
        }
    };

    const handleStopRecording = () => {
        if (!recognition.current) return;

        recognition.current.stop();
        setIsListening(false);

        const currentQuestionText = interviewRounds[currentRound]?.[currentQuestion]?.question;
        if (currentQuestionText) {
            setAnswers(prev => [...prev, {
                question: currentQuestionText,
                answer: transcript
            }]);
        }

        nextQuestion();
    };

    return (
        <div className="aimockinterview-container">
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">
                        {selectedCompany ? `${selectedCompany} Mock Interview` : 'AI Mock Interview'}
                    </h2>
                </div>
                <div className="card-content">
                    {!selectedCompany ? (
                        renderCompanySelection()
                    ) : (
                        <div className="grid">
                            <div className="left-column">
                                <div className="video-container">
                                    <video ref={videoRef} autoPlay playsInline muted className="video" />
                                </div>

                                {renderInterviewControls()}
                            </div>

                            <div className="right-column">
                                {isLoading ? (
                                    <div>Loading questions...</div>
                                ) : (
                                    <>
                                        <div className="question-container">
                                            <h3 className="question-title">Current Question:</h3>
                                            <p>
                                                {interviewRounds[currentRound]?.[currentQuestion]?.question ||
                                                    'No question available'}
                                            </p>
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
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIMockInterview;