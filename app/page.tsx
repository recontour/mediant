"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { EmblaCarouselType } from "embla-carousel";
import Image from "next/image";
import { FaSpotify } from "react-icons/fa";
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
    spotify: "https://open.spotify.com/track/00mW3iKmQcA9By72L7pn46",
  },
  {
    id: 1,
    title: "Chakma",
    artist: "Mediant",
    url: "/songs/SpotiDownloader.com - Chakma - Mediant.mp3",
    cover: "/thumbnails/Cover of Chakma by Mediant.jpg",
    color: "#ffbf00",
    spotify: "https://open.spotify.com/track/14Rhp0ItTeC0oKG0jbB1WW",
  },
  {
    id: 2,
    title: "Naive - Remix",
    artist: "Mediant, Aizan",
    url: "/songs/SpotiDownloader.com - Naive - Aizan, Professor (ofc) Remix - Mediant.mp3",
    cover:
      "/thumbnails/Cover of Naive - Aizan, Professor (ofc) Remix by Mediant, Aizan, Professor (ofc).jpg",
    color: "#80ff00",
    spotify: "https://open.spotify.com/track/78j562eiIkuIgS9BGy7xW2",
  },
  {
    id: 3,
    title: "Samammish",
    artist: "Mediant",
    url: "/songs/SpotiDownloader.com - Samammish - Mediant.mp3",
    cover: "/thumbnails/Cover of Samammish by Mediant.jpg",
    color: "#00ff40",
    spotify: "https://open.spotify.com/track/1NJP0fEr3BvQkzapa5Vsi4",
  },
  {
    id: 4,
    title: "Stance",
    artist: "Mediant",
    url: "/songs/SpotiDownloader.com - Stance - Mediant.mp3",
    cover: "/thumbnails/Cover of Stance by Mediant.jpg",
    color: "#00ffff",
    spotify: "https://open.spotify.com/track/1rXxJseZ7XkVJ27Leu3SdH",
  },
  {
    id: 5,
    title: "Stance - Mixed",
    artist: "Mediant",
    url: "/songs/SpotiDownloader.com - Stance - Mixed - Mediant.mp3",
    cover: "/thumbnails/Cover of Stance - Mixed by Mediant.jpg",
    color: "#0040ff",
    spotify: "https://open.spotify.com/track/2Fy1WgF9kGlpNdjchXKyk3",
  },
  {
    id: 6,
    title: "Tangent",
    artist: "Mediant",
    url: "/songs/SpotiDownloader.com - Tangent - Mediant.mp3",
    cover: "/thumbnails/Cover of Tangent by Mediant.jpg",
    color: "#8000ff",
    spotify: "https://open.spotify.com/track/4jWQENCy0RYNRBgN4xIKOi",
  },
  {
    id: 7,
    title: "Tiamora - Remix",
    artist: "The Digital Blonde",
    url: "/songs/SpotiDownloader.com - Tiamora - Mediant Remix - The Digital Blonde.mp3",
    cover:
      "/thumbnails/Cover of Tiamora - Mediant Remix by The Digital Blonde, Mediant.jpg",
    color: "#ff00bf",
    spotify: "https://open.spotify.com/track/6pbzZJLh2CJTdKC3xQZf5k",
  },
  {
    id: 8,
    title: "We Are Satoshi",
    artist: "Mediant",
    url: "/songs/SpotiDownloader.com - We Are Satoshi - Mediant.mp3",
    cover: "/thumbnails/Cover of We Are Satoshi by Mediant.jpg",
    color: "#ff0040",
    spotify: "https://open.spotify.com/track/25B1W4tn4Ass0JTj4e3pRV",
  },
  {
    id: 9,
    title: "We Are Satoshi - Remix",
    artist: "Mediant, Tomy Wahl",
    url: "/songs/SpotiDownloader.com - We Are Satoshi - Tomy Wahl Remix - Mediant.mp3",
    cover:
      "/thumbnails/Cover of We Are Satoshi - Tomy Wahl Remix by Mediant, Tomy Wahl.jpg",
    color: "#ff8000",
    spotify: "https://open.spotify.com/track/1qyd7fUo2Tc5C9UlLeCWfM",
  },
];

export default function Home() {
  const [activeTrack, setActiveTrack] = useState(TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    skipSnaps: false,
    dragFree: false,
  });

  // --- 1. VISUAL SCALER (Appearance Only) ---
  const [tweenValues, setTweenValues] = useState<number[]>([]);

  const onScroll = useCallback((emblaApi: EmblaCarouselType) => {
    const engine = emblaApi.internalEngine();
    const scrollProgress = emblaApi.scrollProgress();

    const styles = emblaApi.scrollSnapList().map((scrollSnap, index) => {
      let diffToTarget = scrollSnap - scrollProgress;
      const slidesInSnap = engine.slideRegistry[index];

      slidesInSnap.forEach((slideIndex) => {
        if (engine.options.loop) {
          engine.slideLooper.loopPoints.forEach((loopItem) => {
            const target = loopItem.target();
            if (slideIndex === loopItem.index && target !== 0) {
              const sign = Math.sign(target);
              if (sign === -1) diffToTarget = scrollSnap - (1 + scrollProgress);
              if (sign === 1) diffToTarget = scrollSnap + (1 - scrollProgress);
            }
          });
        }
      });
      const tweenValue = 1 - Math.abs(diffToTarget * 2);
      return Math.max(0, Math.min(1, tweenValue));
    });
    setTweenValues(styles);
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    onScroll(emblaApi);
    emblaApi.on("scroll", () => onScroll(emblaApi));
    emblaApi.on("reInit", () => onScroll(emblaApi));
  }, [emblaApi, onScroll]);

  // --- 2. AUDIO ENGINE & EVENT LISTENERS ---
  useEffect(() => {
    if (!audioRef.current && typeof window !== "undefined") {
      audioRef.current = new Audio();
      audioRef.current.crossOrigin = "anonymous";
      audioRef.current.loop = true;

      const audio = audioRef.current;

      // Sync React state with Audio Events
      const setPlay = () => setIsPlaying(true);
      const setPause = () => setIsPlaying(false);
      const setLoading = () => setIsLoading(true);
      const setReady = () => setIsLoading(false);

      audio.addEventListener("play", setPlay);
      audio.addEventListener("pause", setPause);
      audio.addEventListener("waiting", setLoading);
      audio.addEventListener("playing", setReady);
      audio.addEventListener("canplay", setReady);
      audio.addEventListener("error", () => {
        setReady();
        setPause();
      });

      return () => {
        audio.removeEventListener("play", setPlay);
        audio.removeEventListener("pause", setPause);
        audio.removeEventListener("waiting", setLoading);
        audio.removeEventListener("playing", setReady);
        audio.removeEventListener("canplay", setReady);
      };
    }
  }, []);

  // --- 3. TRACK LOADER (Effect) ---
  // This watches 'activeTrack'. If it changes, it loads the new one.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Only load if it's actually a different file
    if (!audio.src.includes(activeTrack.url)) {
      setIsLoading(true);
      audio.src = activeTrack.url;
      audio.volume = 1.0;

      // If we have interacted previously, autoplay the new track
      if (hasInteracted) {
        audio.play().catch((e) => console.log("Playback failed", e));
      }
    }
  }, [activeTrack, hasInteracted]);

  // --- 4. INTERACTION LOGIC ---
  const handleTileClick = (index: number) => {
    if (!emblaApi) return;
    setHasInteracted(true);

    const isCentered = index === emblaApi.selectedScrollSnap();
    const selectedTrack = TRACKS[index];

    if (!isCentered) {
      // CASE 1: Clicked a side tile -> Just Scroll
      emblaApi.scrollTo(index);
    } else {
      // CASE 2: Clicked the center tile
      if (selectedTrack.id === activeTrack.id) {
        // Sub-case 2A: It's the current song -> Toggle Play/Pause
        togglePlay();
      } else {
        // Sub-case 2B: It's a new song (scrolled to but not clicked yet) -> Load it
        setActiveTrack(selectedTrack);
      }
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    setHasInteracted(true);

    if (audioRef.current.paused) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  };

  return (
    <main className="h-[100dvh] w-full bg-transparent text-white flex flex-col overflow-hidden font-sans select-none relative">
      {/* BACKGROUNDS */}
      <div className="fixed inset-0 bg-black -z-50" />
      {audioRef.current && (
        <Visualizer
          audioRef={audioRef}
          isPlaying={isPlaying}
          color={activeTrack.color}
          yOffset={1.5}
        />
      )}
      <div
        className="absolute inset-0 z-0 opacity-30 pointer-events-none mix-blend-overlay transition-colors duration-1000 ease-in-out"
        style={{
          background: `radial-gradient(circle at center, ${activeTrack.color}, transparent 70%)`,
        }}
      />

      {/* START OVERLAY */}
      {!hasInteracted && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md cursor-pointer transition-all duration-500 hover:bg-black/70"
        >
          <div className="text-center animate-pulse group">
            <div className="w-20 h-20 rounded-full border border-white/20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
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
          </div>
        </div>
      )}

      {/* CONTENT UI */}
      <div className="relative z-40 flex flex-col h-full justify-end pb-safe pointer-events-none">
        {/* PLAYER CARD */}
        <div className="px-6 mb-6 pointer-events-auto">
          <div
            className="backdrop-blur-xl bg-black/10 border border-white/10 rounded-xl p-4 flex items-center gap-5 shadow-2xl transition-all duration-500"
            style={{
              boxShadow: isPlaying
                ? `0 0 40px -10px ${activeTrack.color}50`
                : "0 0 0 0 transparent",
              borderColor: isPlaying
                ? `${activeTrack.color}40`
                : "rgba(255,255,255,0.1)",
            }}
          >
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

              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                {isLoading ? (
                  <svg
                    className="animate-spin w-6 h-6 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : isPlaying ? (
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
                {isLoading ? "LOADING..." : activeTrack.artist}
              </p>
            </div>

            {/* Spotify Button */}
            {activeTrack.spotify && (
              <a
                href={activeTrack.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto p-3 rounded-full bg-black/20 hover:bg-black/40 text-[#1DB954] hover:text-[#1ed760] transition-colors border border-white/5"
                onClick={(e) => e.stopPropagation()}
              >
                <FaSpotify size={24} />
              </a>
            )}
          </div>
        </div>

        {/* SMART CAROUSEL */}
        <section className="w-full pb-8 pt-2 pointer-events-auto">
          <div className="overflow-visible" ref={emblaRef}>
            <div className="flex touch-pan-y items-center">
              {TRACKS.map((track, index) => {
                const scaleFactor = tweenValues[index] || 0;
                const isCenter = scaleFactor > 0.8;

                // LOGIC: Show loader ONLY if this specific track is the active one AND loading
                const isThisTrackLoading =
                  isLoading && activeTrack.id === track.id;
                const isThisTrackPlaying =
                  isPlaying && activeTrack.id === track.id;

                return (
                  <div
                    key={track.id}
                    className="flex-[0_0_30%] min-w-0 px-2 relative"
                  >
                    <button
                      onClick={() => handleTileClick(index)}
                      className="relative w-full aspect-square rounded-sm overflow-hidden transition-all duration-75 ease-out"
                      style={{
                        transform: `scale(${0.8 + scaleFactor * 0.35})`,
                        opacity: 0.4 + scaleFactor * 0.6,
                        boxShadow:
                          isCenter && (isThisTrackPlaying || isThisTrackLoading)
                            ? `0 10px 30px -5px ${track.color}80`
                            : "none",
                        border: isCenter
                          ? "2px solid rgba(255,255,255,0.8)"
                          : "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      <Image
                        src={track.cover}
                        alt={track.title}
                        fill
                        className={`object-cover ${
                          isCenter ? "" : "grayscale"
                        }`}
                      />

                      {/* LOADER */}
                      {isThisTrackLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                          <svg
                            className="animate-spin w-8 h-8 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        </div>
                      )}

                      {/* PLAY ICON (Center & Idle) */}
                      {isCenter &&
                        !isThisTrackPlaying &&
                        !isThisTrackLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <svg
                              className="w-8 h-8 text-white/80 drop-shadow-md pl-1"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}