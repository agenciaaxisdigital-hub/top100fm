import { useState, useEffect, useCallback, type ChangeEvent } from "react";
import { Link, useLoaderData } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import topLogo from "@/assets/top100-logo.png";
import { radioAudio } from "@/lib/radio-audio";
import { AudioVisualizer } from "@/components/AudioVisualizer";

export function SiteHeader() {
  const { settings } = useLoaderData({ from: "__root__" }) as { settings?: Record<string, any> };
  const [isActive, setIsActive] = useState(false); // playing or buffering
  const [isPlaying, setIsPlaying] = useState(false); // strictly playing (for button icon)
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    if (settings?.stream_url) {
      radioAudio.setStreamUrl(settings.stream_url);
    }
    const sync = () => {
      const s = radioAudio.getState();
      setIsPlaying(s.isPlaying);
      setIsActive(s.isPlaying || s.isBuffering);
      setVolume(s.volume);
    };
    sync();
    const unsub = radioAudio.subscribe(sync);
    radioAudio.autoStart();
    return unsub;
  }, []);

  const togglePlay = useCallback(() => radioAudio.toggle(), []);
  const handleVolume = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    radioAudio.setVolume(v);
  }, []);

  return (
    <motion.header 
      className="site-header"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      <div className="site-header-inner">
        {/* Logo (left) */}
        <Link to="/" className="header-logo-wrap" aria-label={`${settings?.radio_name || "TOP100 FM"} Home`}>
          <motion.img 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            src={settings?.logo_url || topLogo} 
            alt={settings?.radio_name || "TOP100 FM"} 
            className="site-header-logo-img" 
          />
        </Link>

        {/* Centered nav (desktop) */}
        <nav className="header-nav-desktop" aria-label="Principal">
          <Link to="/" className="header-nav-link" activeProps={{ className: "header-nav-link active" }} activeOptions={{ exact: true }}>
            <motion.span whileHover={{ y: -2 }}>HOME</motion.span>
          </Link>
          <Link to="/noticias" className="header-nav-link" activeProps={{ className: "header-nav-link active" }}>
            <motion.span whileHover={{ y: -2 }}>NOTÍCIAS</motion.span>
          </Link>
          <Link to="/programacao" className="header-nav-link" activeProps={{ className: "header-nav-link active" }}>
            <motion.span whileHover={{ y: -2 }}>PROGRAMAÇÃO</motion.span>
          </Link>
          <Link to="/promocoes" className="header-nav-link" activeProps={{ className: "header-nav-link active" }}>
            <motion.span whileHover={{ y: -2 }}>PROMOÇÃO</motion.span>
          </Link>
          <Link to="/contato" className="header-nav-link" activeProps={{ className: "header-nav-link active" }}>
            <motion.span whileHover={{ y: -2 }}>CONTATO</motion.span>
          </Link>
        </nav>

        {/* Player original (right) */}
        <div className={`header-player ${isActive ? "is-playing" : ""}`}>
          <motion.button
            onClick={togglePlay}
            className="header-play-btn"
            aria-label={isActive ? "Pausar" : "Tocar"}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence mode="popLayout">
              {isActive ? (
                <motion.svg 
                  key="pause"
                  initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
                  width="22" height="22" viewBox="0 0 24 24" fill="currentColor"
                >
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </motion.svg>
              ) : (
                <motion.svg 
                  key="play"
                  initial={{ opacity: 0, scale: 0.5, rotate: 90 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5, rotate: -90 }}
                  width="22" height="22" viewBox="0 0 24 24" fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </motion.svg>
              )}
            </AnimatePresence>
          </motion.button>
          <span className="viz-desktop"><AudioVisualizer active={isActive} bars={6} intensity={volume} /></span>
          <span className="viz-mobile"><AudioVisualizer active={isActive} bars={28} intensity={volume} /></span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolume}
            className="header-vol"
            aria-label="Volume"
          />
          <div className="header-live">
            <motion.span
              className="header-live-dot"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
            <span className="header-live-label">AO VIVO</span>
          </div>
        </div>
      </div>

      {/* Mobile pills */}
      <nav className="header-nav-mobile" aria-label="Principal">
        <Link to="/" className="header-pill" activeProps={{ className: "header-pill active" }} activeOptions={{ exact: true }}>Home</Link>
        <Link to="/noticias" className="header-pill" activeProps={{ className: "header-pill active" }}>Notícias</Link>
        <Link to="/programacao" className="header-pill" activeProps={{ className: "header-pill active" }}>Programação</Link>
        <Link to="/promocoes" className="header-pill" activeProps={{ className: "header-pill active" }}>Promoção</Link>
        <Link to="/contato" className="header-pill" activeProps={{ className: "header-pill active" }}>Contato</Link>
      </nav>
    </motion.header>
  );
}
