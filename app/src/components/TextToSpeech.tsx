import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const TextToSpeech: React.FC<{
  text: string;
  setSpeechEnded: (bool: boolean) => void;
}> = ({ text, setSpeechEnded }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [currentWord, setCurrentWord] = useState<string>("");

  useEffect(() => {
    const synth = window.speechSynthesis;
    const updateVoices = () => {
      const availableVoices = synth.getVoices();
      setVoice(
        availableVoices.find((v) => v.name === "Google italiano") ||
          availableVoices[0] ||
          null
      );
    };

    updateVoices();
    if (synth.onvoiceschanged === null) {
      synth.onvoiceschanged = updateVoices;
    }

    return () => {
      synth.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    if (!text || !voice) return;
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.pitch = 1;
    u.rate = 1;
    u.volume = 1;
    u.text = text;
    u.addEventListener("end", () => {
      setSpeechEnded(true);
      setCurrentWord("");
    });

    u.addEventListener("boundary", (event) => {
      if (event.name === "word") {
        const charIndex = event.charIndex;
        const endCharIndex = text.indexOf(" ", charIndex);
        const word = text.substring(
          charIndex,
          endCharIndex !== -1 ? endCharIndex : text.length
        );
        setCurrentWord((prev) => `${prev} ${word}`.trim());
      }
    });

    handlePlay(u);
  }, [text, voice]);

  const handlePlay = (u: SpeechSynthesisUtterance) => {
    const synth = window.speechSynthesis;

    if (isPaused) {
      synth.resume();
    } else {
      synth.speak(u!);
    }
    setIsPaused(false);
  };

  return (
    <div className="flex flex-col items-start w-full text-[#67e8f9]">
      {(currentWord && currentWord) || (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            transition: { duration: 1.5, delay: 0.5 },
          }}
        >
          {text}
        </motion.div>
      )}
    </div>
  );
};

export default TextToSpeech;
