"use client";

import React from "react";
import {
  OpenAI,
  Claude,
  Perplexity,
  Meta,
  Mistral,
  Gemma,
  Gemini,
  DeepSeek,
  Qwen,
  Groq,
  Vercel,
  Exa
} from "@lobehub/icons";

// Simple CSS-based marquee without complex animations
export const IconMarquee: React.FC = () => {
  // Array of icons to display
  const icons = [
    { name: "OpenAI", Icon: OpenAI.Combine },
    { name: "Claude", Icon: Claude.Combine },
    { name: "Perplexity", Icon: Perplexity.Combine },
    { name: "Meta Llama", Icon: Meta.Combine },
    { name: "Mistral", Icon: Mistral.Combine },
    { name: "Gemma", Icon: Gemma.Combine },
    { name: "Gemini", Icon: Gemini.Combine },
    { name: "DeepSeek", Icon: DeepSeek.Combine },
    { name: "Qwen", Icon: Qwen.Combine },
    { name: "Groq", Icon: Groq.Combine },
    { name: "Vercel", Icon: Vercel.Combine },
    { name: "Exa", Icon: Exa.Combine }

  ];

  return (
    <div className="relative w-full overflow-hidden py-6">
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-250px * 11));
          }
        }
        .marquee {
          overflow: hidden;
          position: relative;
          width: 100%;
        }
        .track {
          animation: scroll 30s linear infinite;
          display: flex;
          width: calc(250px * 22);
        }
        .item {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 250px;
          flex-shrink: 0;
        }
      `}</style>

      <div className="marquee">
        <div className="track">
          {/* First set of icons */}
          {icons.map((icon, index) => (
            <div key={`${icon.name}-${index}`} className="item">
              <icon.Icon 
                size={32}
                className="text-white/50 hover:text-white/70 text-opacity-75 transition-colors" 
              />
            </div>
          ))}
          
          {/* Duplicate set for seamless looping */}
          {icons.map((icon, index) => (
            <div key={`${icon.name}-repeat-${index}`} className="item">
              <icon.Icon 
                size={32}
                className="text-white/50 hover:text-white/70 text-opacity-75 transition-colors" 
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Gradient overlays for smooth fade effect */}
      <div className="absolute left-0 top-0 w-20 h-full bg-gradient-to-r from-background to-transparent z-10" />
      <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-l from-background to-transparent z-10" />
    </div>
  );
}; 