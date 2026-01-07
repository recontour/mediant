"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { EmblaCarouselType } from "embla-carousel";
import Image from "next/image";
import { FaSpotify, FaInstagram } from "react-icons/fa"; // Make sure to install: npm install react-icons
import Visualizer from "./components/Visualizer";
import icon from "./icon.png";

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
  const [showWelcome, setShowWelcome] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showEnter, setShowEnter] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Sequence the animations
    const t1 = setTimeout(() => setShowWelcome(true), 500);
    const t2 = setTimeout(() => setShowHint(true), 1500);
    const t3 = setTimeout(() => setShowEnter(true), 3000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    skipSnaps: false,
    dragFree: false, // Strict snapping helps stability
    containScroll: false, // Allows the 'center' logic to work perfectly
  });

  // --- 1. VISUAL SCALER (Direct DOM for Performance) ---
  const onScroll = useCallback((emblaApi: EmblaCarouselType) => {
    const engine = emblaApi.internalEngine();
    const scrollProgress = emblaApi.scrollProgress();
    const slides = emblaApi.slideNodes();

    emblaApi.scrollSnapList().forEach((scrollSnap, index) => {
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

      // MATH: Create a bell curve for the scale
      const tweenValue = 1 - Math.abs(diffToTarget * 1.5); // 1.5 multiplier tightens the curve
      const clampedTween = Math.max(0, Math.min(1, tweenValue));

      // Scale: 0.85 (edges) -> 1.0 (center)
      const scale = 0.85 + clampedTween * 0.15;
      const opacity = 0.5 + clampedTween * 0.5;
      const isCenter = clampedTween > 0.9; // Strict center check

      const slideNode = slides[index];

      // We set z-index so the center tile visually pops OVER the side tiles
      slideNode.style.zIndex = isCenter ? "10" : "1";

      const innerButton = slideNode.querySelector(
        ".carousel-tile"
      ) as HTMLElement;
      const innerImage = slideNode.querySelector(
        ".carousel-image"
      ) as HTMLElement;

      if (innerButton) {
        // PERFORMANCE: Direct transform update.
        // Ensure CSS does NOT have 'transition: all' or 'transition: transform'
        innerButton.style.transform = `scale(${scale})`;
        innerButton.style.opacity = `${opacity}`;

        const trackColor = TRACKS[index].color;
        if (isCenter) {
          innerButton.style.border = `2px solid ${trackColor}`;
          innerButton.style.boxShadow = `0 10px 40px -10px ${trackColor}60`;
        } else {
          innerButton.style.border = `1px solid ${trackColor}20`;
          innerButton.style.boxShadow = `none`;
        }
      }

      if (innerImage) {
        innerImage.style.filter = isCenter
          ? "none"
          : "grayscale(100%) brightness(50%)";
      }
    });
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
      audioRef.current.loop = false;
    }
  }, []);

  // Attach Event Listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setPlay = () => setIsPlaying(true);
    const setPause = () => setIsPlaying(false);
    const setLoading = () => setIsLoading(true);
    const setReady = () => setIsLoading(false);

    // Auto-Next Logic
    const handleEnded = () => {
      const currentIndex = TRACKS.findIndex((t) => t.id === activeTrack.id);
      const nextIndex = (currentIndex + 1) % TRACKS.length;
      const nextTrack = TRACKS[nextIndex];

      // Update active track AND scroll to it
      setActiveTrack(nextTrack);
      if (emblaApi) emblaApi.scrollTo(nextIndex);
    };

    audio.addEventListener("play", setPlay);
    audio.addEventListener("pause", setPause);
    audio.addEventListener("waiting", setLoading);
    audio.addEventListener("playing", setReady);
    audio.addEventListener("canplay", setReady);
    audio.addEventListener("ended", handleEnded);
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
      audio.removeEventListener("ended", handleEnded);
    };
  }, [activeTrack, emblaApi]);

  // --- 3. TRACK LOADER ---
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.src.includes(activeTrack.url)) {
      setIsLoading(true);
      audio.src = activeTrack.url;
      audio.volume = 1.0;

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
      // Just Scroll
      emblaApi.scrollTo(index);
    } else {
      // Action
      if (selectedTrack.id === activeTrack.id) {
        togglePlay();
      } else {
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
          yOffset={2}
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
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md cursor-pointer transition-colors duration-500 hover:bg-black/80"
        >
          <div className="text-center mb-8">
            <h1
              className={`text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight transition-opacity duration-1000 ${
                showWelcome ? "opacity-100" : "opacity-0"
              }`}
            >
              Welcome
            </h1>
            <p
              className={`text-neutral-400 font-thin italic tracking-widest text-sm md:text-base transition-all duration-1000 transform ${
                showHint
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-10"
              }`}
            >
              Best experienced with headphones
            </p>
          </div>

          <div
            className={`transition-all duration-1000 transform ${
              showEnter
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8 pointer-events-none"
            }`}
          >
            <div className="text-center animate-pulse group">
              <div className="w-20 h-20 rounded-full border border-white/20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform bg-white/5">
                <p className="text-4xl">🎧</p>
              </div>
              <h2 className="text-xl font-bold tracking-[0.2em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-400">
                Enter Experience
              </h2>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT UI */}
      <div className="relative z-40 flex flex-col h-full justify-end pb-safe pointer-events-none">
        {/* SOCIAL BADGES */}
        <div className="absolute top-6 left-6 pointer-events-auto">
          <a
            href="https://www.instagram.com/mediant__official?igsh=Zm0yeGxudGdvcGcy"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-12 h-12 rounded-full bg-black/1 backdrop-blur-md border border-white/10 text-white/90 hover:bg-black/10 hover:scale-105 transition-all duration-300 shadow-lg"
          >
            <FaInstagram size={24} />
          </a>
        </div>

        {/* PLAYER CARD */}
        <div className="px-6 mb-6 pointer-events-auto">
          <div
            className="backdrop-blur-xl bg-black/1 border border-white/10 rounded-2xl p-3 flex items-center gap-3 shadow-2xl transition-all duration-500"
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

              <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/10 transition-colors">
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

            {/* Spotify Button - Redirects to the currently playing song */}
            {activeTrack.spotify && (
              <a
                href={activeTrack.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto relative w-[56px] h-[56px] rounded-sm overflow-hidden border border-white/10 shadow-lg active:scale-95 transition-transform"
                onClick={(e) => e.stopPropagation()}
              >
                <Image src={icon} alt="Spotify" fill className="object-cover" />
                <div className="absolute bottom-0.5 right-0.5 text-[#1DB954] drop-shadow-md bg-black rounded-full">
                  <FaSpotify size={16} />
                </div>
              </a>
            )}
          </div>
        </div>

        {/* CAROUSEL */}
        <section className="w-full pb-4 pointer-events-auto">
          <div className="overflow-visible" ref={emblaRef}>
            <div className="flex touch-pan-y items-center">
              {TRACKS.map((track, index) => {
                const isThisTrackLoading =
                  isLoading && activeTrack.id === track.id;
                const isThisTrackPlaying =
                  isPlaying && activeTrack.id === track.id;
                const isSelected = activeTrack.id === track.id;

                return (
                  // Width: 65% ensures One Center + Two Side Edges on mobile
                  <div
                    key={track.id}
                    className="flex-[0_0_30%] min-w-0 px-2 relative transition-all"
                  >
                    <button
                      onClick={() => handleTileClick(index)}
                      className="carousel-tile relative w-full aspect-square rounded-sm overflow-hidden transition-colors duration-300"
                      // NOTE: We REMOVED transition-all/transition-transform to prevent shaking.
                      // Only opacity and border/colors are animated by CSS.
                      // Transform is handled 100% by JS in onScroll.
                    >
                      <Image
                        src={track.cover}
                        alt={track.title}
                        fill
                        className="carousel-image object-cover transition-[filter] duration-300"
                      />

                      {/* LOADER */}
                      {isThisTrackLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20 backdrop-blur-sm">
                          <svg
                            className="animate-spin w-10 h-10 text-white"
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
                      {isSelected &&
                        !isThisTrackPlaying &&
                        !isThisTrackLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10">
                            <svg
                              className="w-12 h-12 text-white/90 drop-shadow-lg pl-1"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        )}

                      {/* PAUSE ICON (Center & Playing) */}
                      {isSelected &&
                        isThisTrackPlaying &&
                        !isThisTrackLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10">
                            <svg
                              className="w-12 h-12 text-white/90 drop-shadow-lg"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
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
