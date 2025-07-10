import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Medal, Target, Clock, Users, TrendingUp, Lock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  difficulty: string;
  points: number;
  requirement: number;
}

interface UserAchievement extends Achievement {
  progress: number;
  isCompleted: boolean;
  completedAt?: string;
}

interface UserStats {
  totalPoints: number;
  chartsGenerated: number;
  chartsDrilled: number;
  messagesExchanged: number;
  sessionTime: number;
  uniqueChartTypes: number;
  documentsAnalyzed: number;
  insightsDiscovered: number;
  streakDays: number;
}

interface AchievementPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userAchievements: UserAchievement[];
  userStats: UserStats;
}

export const AchievementPanel: React.FC<AchievementPanelProps> = ({
  isOpen,
  onClose,
  userAchievements,
  userStats
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categoryIcons: Record<string, React.ReactNode> = {
    explorer: <Target className="w-4 h-4" />,
    analyst: <TrendingUp className="w-4 h-4" />,
    master: <Medal className="w-4 h-4" />,
    social: <Users className="w-4 h-4" />,
    speed: <Clock className="w-4 h-4" />
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'bronze': return 'text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-900/20';
      case 'silver': return 'text-gray-600 border-gray-300 bg-gray-50 dark:bg-gray-900/20';
      case 'gold': return 'text-yellow-600 border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20';
      case 'platinum': return 'text-purple-600 border-purple-300 bg-purple-50 dark:bg-purple-900/20';
      default: return 'text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const getDifficultyBadgeColor = (difficulty: string) => {
    switch (difficulty) {
      case 'bronze': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      case 'silver': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'gold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'platinum': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
  };

  const filteredAchievements = selectedCategory === 'all' 
    ? userAchievements 
    : userAchievements.filter(a => a.category === selectedCategory);

  const completedAchievements = userAchievements.filter(a => a.isCompleted);
  const completionRate = userAchievements.length > 0 ? (completedAchievements.length / userAchievements.length) * 100 : 0;

  const categories = [
    { id: 'all', name: 'All', icon: <Trophy className="w-4 h-4" /> },
    { id: 'explorer', name: 'Explorer', icon: categoryIcons.explorer },
    { id: 'analyst', name: 'Analyst', icon: categoryIcons.analyst },
    { id: 'master', name: 'Master', icon: categoryIcons.master },
    { id: 'social', name: 'Social', icon: categoryIcons.social },
    { id: 'speed', name: 'Speed', icon: categoryIcons.speed }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden border"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Achievements
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Your data exploration journey
                  </p>
                </div>
              </div>
              
              <Button variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
                ✕
              </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{userStats.totalPoints}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{completedAchievements.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{Math.round(completionRate)}%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{userStats.streakDays}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Day Streak</div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="h-full flex flex-col">
              {/* Category Tabs */}
              <div className="px-6 pt-4">
                <TabsList className="grid grid-cols-6 w-full">
                  {categories.map((category) => (
                    <TabsTrigger 
                      key={category.id} 
                      value={category.id}
                      className="flex items-center gap-1 text-xs"
                    >
                      {category.icon}
                      <span className="hidden sm:inline">{category.name}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* Achievement Grid */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredAchievements.map((achievement) => (
                    <motion.div
                      key={achievement.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`
                        relative p-4 rounded-lg border-2 transition-all duration-200
                        ${achievement.isCompleted 
                          ? getDifficultyColor(achievement.difficulty) 
                          : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
                        }
                        ${achievement.isCompleted ? 'shadow-md hover:shadow-lg' : 'opacity-75'}
                      `}
                    >
                      {/* Completion Status */}
                      <div className="absolute top-2 right-2">
                        {achievement.isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <Lock className="w-5 h-5 text-gray-400" />
                        )}
                      </div>

                      {/* Achievement Icon */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`
                          text-2xl p-2 rounded-lg
                          ${achievement.isCompleted 
                            ? 'bg-white/50 backdrop-blur-sm' 
                            : 'bg-gray-200 dark:bg-gray-700'
                          }
                        `}>
                          {achievement.icon}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className={`
                            font-semibold text-sm mb-1
                            ${achievement.isCompleted 
                              ? 'text-gray-900 dark:text-white' 
                              : 'text-gray-600 dark:text-gray-400'
                            }
                          `}>
                            {achievement.name}
                          </h3>
                          <p className={`
                            text-xs line-clamp-2
                            ${achievement.isCompleted 
                              ? 'text-gray-700 dark:text-gray-300' 
                              : 'text-gray-500 dark:text-gray-500'
                            }
                          `}>
                            {achievement.description}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className={achievement.isCompleted ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500'}>
                            Progress
                          </span>
                          <span className={achievement.isCompleted ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500'}>
                            {Math.min(achievement.progress, achievement.requirement)}/{achievement.requirement}
                          </span>
                        </div>
                        <Progress 
                          value={(achievement.progress / achievement.requirement) * 100} 
                          className="h-2"
                        />
                      </div>

                      {/* Difficulty and Points */}
                      <div className="flex items-center justify-between">
                        <Badge className={getDifficultyBadgeColor(achievement.difficulty)}>
                          {achievement.difficulty}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-yellow-600">
                          <Star className="w-3 h-3" />
                          <span>{achievement.points}</span>
                        </div>
                      </div>

                      {/* Completion Date */}
                      {achievement.isCompleted && achievement.completedAt && (
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          Completed {new Date(achievement.completedAt).toLocaleDateString()}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {filteredAchievements.length === 0 && (
                  <div className="text-center py-12">
                    <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                      No achievements in this category yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-500">
                      Keep exploring to unlock your first achievement!
                    </p>
                  </div>
                )}
              </div>
            </Tabs>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};