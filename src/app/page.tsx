"use client";

import "regenerator-runtime/runtime";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";

const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

const questions = [
  "Hi there! I’m excited to help you explore how AI can work for your business. To get started, can you tell me a bit about what your company does and the main goals you’re aiming to achieve right now?",
  "Awesome, thanks for that! Next, I’d love to know—do you currently use any AI tools or technologies in your operations, even something small like chatbots or data analytics?",
  "Okay, cool! Now, let’s talk about your team. Do you have people in-house who handle tech projects—like data scientists, IT staff, or developers—or do you mostly rely on external partners for that kind of work?",
  "Nice, thanks for sharing that! What about data—do you collect and store a lot of it, like customer info, sales numbers, or operational metrics? And if so, how organized would you say it is?",
  "Great, we’re making good progress here! Are there any specific challenges or pain points in your business right now—like inefficiencies, costs, or customer experience issues—that you’d love AI to help solve?",
  "Love that insight! Okay, how comfortable would you say your leadership team is with adopting new technology? Are they all in, or might there be some convincing to do?",
  "Almost there! Budget-wise, have you set aside funds for AI projects, or are we starting from scratch and need to explore cost-effective options?",
  "Last big question—any major timelines or deadlines driving this? Like, are you hoping to see AI in action within a few months, a year, or is it more of a long-term vision?",
  "Thanks so much for walking through all that with me—you’ve given me a ton to work with! I’ll put together a detailed AI readiness report based on everything we’ve talked about. To send it your way, could you please share your company name and a company email address?"
];

export default function VoiceAgent() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [started, setStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const { transcript, resetTranscript } = useSpeechRecognition();
  const hasSpokenRef = useRef(false);
  const recognitionTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
      alert("Your browser does not support speech recognition. Please use Chrome.");
    }
  }, []);

  const speakQuestion = (question: string) => {
    if (synth) {
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(question);
      utterance.voice = synth.getVoices().find(voice => voice.name.includes("Female")) || synth.getVoices()[0];
      utterance.onend = () => setTimeout(startListening, 1000); // Ensures a pause before listening
      synth.speak(utterance);
    }
  };

  const startAgent = () => {
    setStarted(true);
    speakQuestion(questions[currentQuestionIndex]);
  };

  useEffect(() => {
    if (started && synth && !hasSpokenRef.current) {
      speakQuestion(questions[currentQuestionIndex]);
      hasSpokenRef.current = true;
    }
  }, [currentQuestionIndex, started, speakQuestion]);

  const startListening = () => {
    setIsListening(true);
    resetTranscript();
    SpeechRecognition.startListening({ continuous: true, language: "en-US" });
  };

  const stopListening = () => {
    setIsListening(false);
    SpeechRecognition.stopListening();
  };

  useEffect(() => {
    if (transcript.trim() && isListening) {
      if (recognitionTimeout.current) clearTimeout(recognitionTimeout.current);
      recognitionTimeout.current = setTimeout(() => {
        handleNextQuestion(transcript.trim());
      }, 3000); // Increased delay for longer responses
    }
  }, [transcript]);

  const handleNextQuestion = (answer: string) => {
    if (answer.length > 0 && !responses.includes(answer)) {
      setResponses((prev) => [...prev, answer]);
      resetTranscript();
      hasSpokenRef.current = false;
      stopListening();
      
      if (currentQuestionIndex < questions.length - 1) {
        setTimeout(() => {
          setCurrentQuestionIndex((prev) => prev + 1);
          speakQuestion(questions[currentQuestionIndex + 1]);
        }, 1500);
      } else {
        submitResponses();
      }
    }
  };

  const submitResponses = async () => {
    console.log("Submitting responses:", responses);
    setIsCompleted(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#ffffff] text-[#000000] p-4">
      <motion.h1 className="text-3xl font-bold mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        Ready to see how AI ready you are?
      </motion.h1>

      <Card className="w-full max-w-lg p-6 bg-gray-800 rounded-lg shadow-lg">
        <CardContent className="flex flex-col items-center">
          {!started ? (
            <Button onClick={startAgent} className="bg-[#74aab5] text-xl px-6 py-3 rounded-lg shadow-lg hover:bg-[#5b8f99] transition-all duration-300 mb-4">
              Let&rsquo;s Get Started
            </Button>
          ) : isCompleted ? (
            <p className="text-xl mb-4">Thank you! Your AI Readiness Report is being prepared.</p>
          ) : (
            <>
              <p className="text-xl mb-4">{responses[currentQuestionIndex] || "Listening..."}</p>
              <p className="text-green-400 mb-4">{transcript}</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
