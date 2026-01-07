"use client";

import React, { useState, useEffect, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import Visualizer from "./components/Visualizer";

// --- DATA ---
const TRACKS = [
  {
    id: 0,
    title: "Among Us",
    artist: "Mediant",
    url: "/songs/SpotiDownloader.com - Among Us - Mediant.mp3",
    cover: "/thumbnails/Cover of Among Us by Mediant.jpg",
    color: "#ff0000",
  },
  {
    id: 1,
    title: "Chakma",
    artist: "Mediant",
    url: "/songs/SpotiDownloader.com - Chakma - Mediant.mp3",
    cover: "/thumbnails/Cover of Chakma by Mediant.jpg",
    color: "#ffbf00",
  },
  {
    id: 2,
    title: "Naive - Remix",
    artist: "Mediant, Aizan",
    url: "/songs/SpotiDownloader.com - Naive - Aizan, Professor (ofc) Remix - Mediant.mp3",
    cover:
      "/thumbnails/Cover of Naive - Aizan, Professor (ofc) Remix by Mediant, Aizan, Professor (ofc).jpg",
    color: "#80ff00",
  },
  {
    id: 3,
    title: "Samammish",
    artist: "Mediant",
    url: "/songs/SpotiDownloader.com - Samammish - Mediant.mp3",
    cover: "/thumbnails/Cover of Samammish by Mediant.jpg",
    color: "#00ff40",
  },
  {
    id: 4,
    title: "Stance",
    artist: "Mediant",
    url: "/songs/SpotiDownloader.com - Stance - Mediant.mp3",
    cover: "/thumbnails/Cover of Stance by Mediant.jpg",
    color: "#00ffff",
  },
  {
    id: 5,
    title: "Stance - Mixed",
    artist: "Mediant",
    url: "/songs/SpotiDownloader.com - Stance - Mixed - Mediant.mp3",
    cover: "/thumbnails/Cover of Stance - Mixed by Mediant.jpg",
    color: "#0040ff",
  },
  {
    id: 6,
    title: "Tangent",
    artist: "Mediant",
    url: "/songs/SpotiDownloader.com - Tangent - Mediant.mp3",
    cover: "/thumbnails/Cover of Tangent by Mediant.jpg",
    color: "#8000ff",
  },
  {
    id: 7,
    title: "Tiamora - Remix",
    artist: "The Digital Blonde",
    url: "/songs/SpotiDownloader.com - Tiamora - Mediant Remix - The Digital Blonde.mp3",
    cover:
      "/thumbnails/Cover of Tiamora - Mediant Remix by The Digital Blonde, Mediant.jpg",
    color: "#ff00bf",
  },
  {
    id: 8,
    title: "We Are Satoshi",
    artist: "Mediant",
    url: "/songs/SpotiDownloader.com - We Are Satoshi - Mediant.mp3",
    cover: "/thumbnails/Cover of We Are Satoshi by Mediant.jpg",
    color: "#ff0040",
  },
  {
    id: 9,
    title: "We Are Satoshi - Remix",
    artist: "Mediant, Tomy Wahl",
    url: "/songs/SpotiDownloader.com - We Are Satoshi - Tomy Wahl Remix - Mediant.mp3",
    cover:
      "/thumbnails/Cover of We Are Satoshi - Tomy Wahl Remix by Mediant, Tomy Wahl.jpg",
    color: "#ff8000",
  },
];

export default function Home() {
  const [activeTrack, setActiveTrack] = useState(TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    containScroll: "trimSnaps",
  });

  useEffect(() => {
    if (!audioRef.current && typeof window !== "undefined") {
      audioRef.current = new Audio();
      audioRef.current.crossOrigin = "anonymous";
      audioRef.current.loop = true;
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const trackUrl = activeTrack.url;
    if (
      audio.src !== window.location.origin + trackUrl &&
      audio.src !== trackUrl
    ) {
      audio.src = trackUrl;
      audio.volume = 1.0;
      if (hasInteracted) {
        audio
          .play()
          .then(() => setIsPlaying(true))
          .catch((e) => console.log(e));
      }
    }
  }, [activeTrack, hasInteracted]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    setHasInteracted(true);
    if (audioRef.current.paused) {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.log(e));
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTileClick = (track: (typeof TRACKS)[0]) => {
    if (activeTrack.id === track.id) {
      togglePlay();
    } else {
      setActiveTrack(track);
      emblaApi?.scrollTo(track.id);
      setHasInteracted(true);
    }
  };

  return (
    // FIXED: bg-transparent instead of bg-black so we can see the visualizer behind it
    <main className="h-[100dvh] w-full bg-transparent text-white flex flex-col overflow-hidden font-sans select-none relative">
      {/* LAYER -50: The Void (Pitch Black Background) */}
      <div className="fixed inset-0 bg-black -z-50" />

      {/* LAYER 0: The 3D Visualizer */}
      {audioRef.current && (
        <Visualizer
          audioRef={audioRef}
          isPlaying={isPlaying}
          color={activeTrack.color}
          yOffset={1.5}
        />
      )}

      {/* LAYER 1: Ambient Atmosphere */}
      <div
        className="absolute inset-0 z-0 opacity-30 pointer-events-none mix-blend-overlay transition-colors duration-1000 ease-in-out"
        style={{
          background: `radial-gradient(circle at center, ${activeTrack.color}, transparent 70%)`,
        }}
      />

      {/* LAYER 2: Start Overlay */}
      {!hasInteracted && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md cursor-pointer transition-all duration-500 hover:bg-black/70"
        >
          <div className="text-center animate-pulse group">
            <div className="w-20 h-20 rounded-lg border border-white/20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <svg
                className="w-8 h-8 text-white pl-1"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold tracking-[0.2em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-400">
              Enter Experience
            </h2>
            <p className="text-xs text-neutral-500 mt-3 font-mono">
              INITIALIZE AUDIO REACTOR
            </p>
          </div>
        </div>
      )}

      {/* LAYER 3: HUD / Controls */}
      <div className="relative z-40 flex flex-col h-full justify-end pb-safe pointer-events-none">
        {/* PLAYER CARD */}
        <div className="px-6 mb-6 pointer-events-auto">
          <div
            className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-lg p-4 flex items-center gap-5 shadow-2xl transition-all duration-500"
            style={{
              boxShadow: isPlaying
                ? `0 0 40px -10px ${activeTrack.color}50`
                : "0 0 0 0 transparent",
              borderColor: isPlaying
                ? `${activeTrack.color}40`
                : "rgba(255,255,255,0.1)",
            }}
          >
            {/* Art */}
            <div
              onClick={togglePlay}
              className="relative w-16 h-16 rounded-sm overflow-hidden flex-shrink-0 cursor-pointer group"
            >
              <Image
                src={activeTrack.cover}
                alt="Art"
                fill
                className={`object-cover transition-transform duration-700 ease-out ${
                  isPlaying ? "scale-110" : "scale-100 grayscale"
                }`}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                {isPlaying ? (
                  <svg
                    className="w-5 h-5 text-white drop-shadow-md"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6 text-white drop-shadow-md pl-1"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </div>
            </div>

            {/* Text */}
            <div className="flex flex-col justify-center min-w-0">
              <h1 className="text-lg font-bold truncate leading-tight tracking-tight text-white/90">
                {activeTrack.title}
              </h1>
              <p
                className="text-xs font-bold uppercase tracking-widest truncate mt-1"
                style={{
                  color: activeTrack.color,
                  textShadow: `0 0 10px ${activeTrack.color}80`,
                }}
              >
                {activeTrack.artist}
              </p>
            </div>
          </div>
        </div>

        {/* CAROUSEL */}
        <section className="w-full pb-8 pt-2 pointer-events-auto">
          <div className="overflow-visible" ref={emblaRef}>
            <div className="flex touch-pan-y pl-6 items-center">
              {TRACKS.map((track) => (
                <div key={track.id} className="flex-[0_0_28%] min-w-0 pr-4">
                  <button
                    onClick={() => handleTileClick(track)}
                    className={`
                      relative w-full aspect-square rounded-sm overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                      ${
                        activeTrack.id === track.id
                          ? "scale-100 opacity-100 ring-1 ring-white/50 z-10"
                          : "scale-90 opacity-40 grayscale hover:opacity-70 hover:scale-95"
                      }
                    `}
                    style={{
                      boxShadow:
                        activeTrack.id === track.id
                          ? `0 10px 40px -10px ${track.color}80`
                          : "none",
                    }}
                  >
                    <Image
                      src={track.cover}
                      alt={track.title}
                      fill
                      className="object-cover"
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
