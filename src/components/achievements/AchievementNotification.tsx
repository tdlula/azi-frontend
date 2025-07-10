import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  difficulty: string;
  points: number;
}

interface AchievementNotificationProps {
  achievement: Achievement | null;
  isVisible: boolean;
  onClose: () => void;
}

export const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  isVisible,
  onClose
}) => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isVisible && achievement) {
      setShouldRender(true);
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, achievement, onClose]);

  const handleAnimationComplete = () => {
    if (!isVisible) {
      setShouldRender(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'bronze': return 'from-amber-600 to-amber-800';
      case 'silver': return 'from-gray-400 to-gray-600';
      case 'gold': return 'from-yellow-400 to-yellow-600';
      case 'platinum': return 'from-purple-400 to-purple-600';
      default: return 'from-blue-400 to-blue-600';
    }
  };

  const getDifficultyGlow = (difficulty: string) => {
    switch (difficulty) {
      case 'bronze': return 'shadow-amber-500/30';
      case 'silver': return 'shadow-gray-500/30';
      case 'gold': return 'shadow-yellow-500/40';
      case 'platinum': return 'shadow-purple-500/40';
      default: return 'shadow-blue-500/30';
    }
  };

  if (!shouldRender || !achievement) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.9 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            duration: 0.6 
          }}
          onAnimationComplete={handleAnimationComplete}
          className="fixed top-4 right-4 z-50 max-w-sm"
        >
          <div className={`
            relative overflow-hidden rounded-xl border
            bg-gradient-to-br ${getDifficultyColor(achievement.difficulty)}
            shadow-xl ${getDifficultyGlow(achievement.difficulty)}
            backdrop-blur-sm
          `}>
            {/* Sparkle animations */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full opacity-70"
                  initial={{ 
                    x: Math.random() * 300, 
                    y: Math.random() * 200,
                    scale: 0 
                  }}
                  animate={{ 
                    scale: [0, 1, 0],
                    rotate: 360,
                    opacity: [0, 1, 0]
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.2,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                />
              ))}
            </div>

            <div className="relative p-6 text-white">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Achievement Unlocked!</h3>
                    <p className="text-white/80 text-sm capitalize">
                      {achievement.difficulty} • {achievement.category}
                    </p>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Achievement Content */}
              <div className="flex items-center gap-4">
                <div className="text-4xl bg-white/20 rounded-xl p-3 backdrop-blur-sm">
                  {achievement.icon}
                </div>
                
                <div className="flex-1">
                  <h4 className="font-semibold text-xl mb-1">
                    {achievement.name}
                  </h4>
                  <p className="text-white/90 text-sm mb-2">
                    {achievement.description}
                  </p>
                  <div className="flex items-center gap-2 text-white/80">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-medium">+{achievement.points} points</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Animated border glow */}
            <motion.div
              className="absolute inset-0 rounded-xl border-2 border-white/30"
              animate={{
                boxShadow: [
                  '0 0 20px rgba(255,255,255,0.3)',
                  '0 0 40px rgba(255,255,255,0.5)',
                  '0 0 20px rgba(255,255,255,0.3)'
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};