import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Send, Bot, User, Sparkles, Star, MessageCircle, X, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';

interface ChatMessage {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
  recommendations?: any[];
  isLoading?: boolean;
}

export const FloatingMentorChatbot = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState<'greeting' | 'skills' | 'experience' | 'goals' | 'budget' | 'recommendations'>('greeting');
  const [userRequirements, setUserRequirements] = useState({
    skills: [] as string[],
    experience: '',
    goals: '',
    budget: { min: 0, max: 200 }
  });
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const botResponses = {
    greeting: [
      "Hi there! 👋 I'm your AI mentor matchmaker. I'll help you find the perfect mentor based on your needs.",
      "Hello! I'm here to help you discover amazing mentors. Let's start by understanding what you're looking for.",
      "Welcome! I'm your personal mentor recommendation assistant. Ready to find your ideal mentor?"
    ],
    skills: [
      "Great! What skills or technologies would you like to learn? You can mention multiple skills like 'React, TypeScript, Node.js'",
      "Perfect! Tell me about the skills you want to develop. For example: 'Python, Machine Learning, Data Science'",
      "Awesome! What technical skills are you looking to master? Feel free to list several."
    ],
    experience: [
      "Got it! What's your current experience level? Beginner (0-1 years), Intermediate (1-3 years), or Advanced (3+ years)?",
      "Thanks! How would you describe your current skill level? Beginner, Intermediate, or Advanced?",
      "Perfect! What's your experience level? Beginner, Intermediate, or Advanced?"
    ],
    goals: [
      "Excellent! What are your learning goals? For example: 'Build a full-stack app', 'Prepare for interviews', 'Learn advanced patterns'",
      "Great! What do you want to achieve? Tell me about your specific goals.",
      "Wonderful! What are you hoping to accomplish with your mentor?"
    ],
    budget: [
      "Almost there! What's your budget range per hour? You can say something like '50-150' or 'under 100'",
      "Perfect! What's your hourly budget for mentoring? Give me a range like '30-200'",
      "Great! What's your budget per session? Tell me your preferred range."
    ]
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addBotMessage(botResponses.greeting[Math.floor(Math.random() * botResponses.greeting.length)]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const addBotMessage = (content: string, recommendations?: any[]) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'bot',
      content,
      timestamp: new Date(),
      recommendations
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addUserMessage = (content: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const simulateTyping = async (callback: () => void) => {
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    setIsTyping(false);
    callback();
  };

  const processUserInput = async (input: string) => {
    addUserMessage(input);
    setInputValue('');

    await simulateTyping(async () => {
      switch (currentStep) {
        case 'greeting':
          handleSkillsStep();
          break;
        case 'skills':
          handleSkillsInput(input);
          break;
        case 'experience':
          handleExperienceInput(input);
          break;
        case 'goals':
          handleGoalsInput(input);
          break;
        case 'budget':
          handleBudgetInput(input);
          break;
      }
    });
  };

  const handleSkillsStep = () => {
    setCurrentStep('skills');
    addBotMessage(botResponses.skills[Math.floor(Math.random() * botResponses.skills.length)]);
  };

  const handleSkillsInput = (input: string) => {
    const skills = input
      .toLowerCase()
      .split(/[,.\s]+/)
      .filter(skill => skill.length > 2)
      .map(skill => skill.trim());

    setUserRequirements(prev => ({ ...prev, skills }));
    
    setCurrentStep('experience');
    addBotMessage(botResponses.experience[Math.floor(Math.random() * botResponses.experience.length)]);
  };

  const handleExperienceInput = (input: string) => {
    const experience = input.toLowerCase().includes('beginner') ? 'beginner' :
                      input.toLowerCase().includes('intermediate') ? 'intermediate' :
                      input.toLowerCase().includes('advanced') ? 'advanced' : 'intermediate';

    setUserRequirements(prev => ({ ...prev, experience }));
    
    setCurrentStep('goals');
    addBotMessage(botResponses.goals[Math.floor(Math.random() * botResponses.goals.length)]);
  };

  const handleGoalsInput = (input: string) => {
    setUserRequirements(prev => ({ ...prev, goals: input }));
    
    setCurrentStep('budget');
    addBotMessage(botResponses.budget[Math.floor(Math.random() * botResponses.budget.length)]);
  };

  const handleBudgetInput = async (input: string) => {
    const numbers = input.match(/\d+/g)?.map(Number) || [0, 200];
    const budget = {
      min: Math.min(...numbers),
      max: Math.max(...numbers)
    };

    setUserRequirements(prev => ({ ...prev, budget }));
    
    setCurrentStep('recommendations');
    
    addBotMessage("Perfect! Let me analyze thousands of successful mentor-mentee relationships to find your perfect match... 🤖✨");
    
    await getRecommendations();
  };

  const getRecommendations = async () => {
    try {
      const loadingMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'bot',
        content: "🔍 Searching for mentors...",
        timestamp: new Date(),
        isLoading: true
      };
      setMessages(prev => [...prev, loadingMessage]);

      const { data, error } = await supabase
        .rpc('get_mentor_recommendations', {
          p_skills_needed: userRequirements.skills,
          p_experience_level: userRequirements.experience,
          p_budget_min: userRequirements.budget.min,
          p_budget_max: userRequirements.budget.max,
          p_limit: 3
        });

      setMessages(prev => prev.filter(msg => !msg.isLoading));

      if (error) throw error;

      await loadMentorData(data || []);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      setMessages(prev => prev.filter(msg => !msg.isLoading));
      addBotMessage("I'm sorry, I encountered an issue while searching for mentors. Let me try a different approach...");
      
      setTimeout(() => {
        addBotMessage("Here are some great mentors I found for you:", []);
      }, 2000);
    }
  };

  const loadMentorData = async (recommendationData: any[]) => {
    if (recommendationData.length === 0) {
      addBotMessage("I couldn't find any mentors matching your exact criteria, but here are some excellent mentors you might like:", []);
      return;
    }

    const mentorIds = recommendationData.map(r => r.mentor_id);
    
    const { data: mentorsData, error: mentorsError } = await supabase
      .from('mentors')
      .select(`
        *,
        users (
          first_name,
          last_name,
          profile_image
        ),
        mentor_expertise (
          expertise_areas (
            name,
            description
          )
        )
      `)
      .in('mentor_id', mentorIds);

    if (mentorsError) throw mentorsError;

    const fullRecommendations = recommendationData.map(rec => {
      const mentor = mentorsData?.find(m => m.mentor_id === rec.mentor_id);
      if (mentor) {
        const fixedMentor = {
          ...mentor,
          total_sessions_completed: mentor.total_sessions || mentor.total_sessions_completed || 0,
          total_sessions: mentor.total_sessions || mentor.total_sessions_completed || 0
        };
        return {
          ...rec,
          mentor: fixedMentor
        };
      }
      return null;
    }).filter(rec => rec !== null);

    const matchCount = fullRecommendations.length;
    const topMatch = fullRecommendations[0];
    
    addBotMessage(
      `🎉 I found ${matchCount} amazing mentors for you! Here's my top recommendation with ${Math.round(topMatch?.similarity_score * 100)}% match:`,
      fullRecommendations
    );
  };

  const handleBookSession = (mentorId: string) => {
    addBotMessage(`Great choice! I'll help you book a session with this mentor. You can click on their profile to get started.`);
  };

  const resetChat = () => {
    setMessages([]);
    setCurrentStep('greeting');
    setUserRequirements({
      skills: [],
      experience: '',
      goals: '',
      budget: { min: 0, max: 200 }
    });
    addBotMessage(botResponses.greeting[Math.floor(Math.random() * botResponses.greeting.length)]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      processUserInput(inputValue.trim());
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-brand-sunshine-yellow hover:bg-brand-marigold-yellow text-brand-charcoal shadow-lg"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="w-96 h-[500px] shadow-xl border-2 border-brand-sunshine-yellow/20">
        <CardContent className="p-0 h-full flex flex-col">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-brand-charcoal to-gray-800 text-white p-3 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 bg-brand-sunshine-yellow">
                  <Bot className="h-5 w-5 text-brand-charcoal" />
                </Avatar>
                <div>
                  <h3 className="font-semibold text-sm">AI Mentor Matchmaker</h3>
                  <p className="text-xs text-gray-300">Powered by ML</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  onClick={resetChat}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10 h-8 w-8 p-0"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10 h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-3">
            <div className="space-y-3">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-2 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <Avatar className={`h-6 w-6 ${message.type === 'user' ? 'bg-brand-sunshine-yellow' : 'bg-brand-charcoal'}`}>
                      {message.type === 'user' ? (
                        <User className="h-3 w-3 text-brand-charcoal" />
                      ) : (
                        <Bot className="h-3 w-3 text-white" />
                      )}
                    </Avatar>
                    <div className={`rounded-lg p-2 text-xs ${
                      message.type === 'user' 
                        ? 'bg-brand-sunshine-yellow text-brand-charcoal' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p>{message.content}</p>
                      
                      {/* Recommendations Display */}
                      {message.recommendations && message.recommendations.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {message.recommendations.slice(0, 2).map((rec, index) => (
                            <Card key={rec.mentor_id} className="border border-gray-200 shadow-sm">
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={rec.mentor.users?.profile_image} />
                                      <AvatarFallback className="text-xs">
                                        {rec.mentor.users?.first_name?.[0]}{rec.mentor.users?.last_name?.[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <h4 className="font-semibold text-xs">
                                        {rec.mentor.users?.first_name} {rec.mentor.users?.last_name}
                                      </h4>
                                      <p className="text-xs text-gray-600">
                                        ${rec.mentor.hourly_rate}/hr
                                      </p>
                                    </div>
                                  </div>
                                  <Badge className="bg-brand-sunshine-yellow text-brand-charcoal text-xs">
                                    <Star className="h-2 w-2 mr-1" />
                                    {Math.round(rec.similarity_score * 100)}%
                                  </Badge>
                                </div>
                                <Button
                                  onClick={() => handleBookSession(rec.mentor_id)}
                                  className="w-full bg-black hover:bg-gray-800 text-white text-xs h-6"
                                  size="sm"
                                >
                                  Book Session
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex gap-2">
                    <Avatar className="h-6 w-6 bg-brand-charcoal">
                      <Bot className="h-3 w-3 text-white" />
                    </Avatar>
                    <div className="bg-gray-100 rounded-lg p-2">
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Chat Input */}
          <div className="border-t p-3">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 text-xs"
                disabled={isTyping}
              />
              <Button
                onClick={() => inputValue.trim() && processUserInput(inputValue.trim())}
                disabled={!inputValue.trim() || isTyping}
                className="bg-black hover:bg-gray-800 text-white h-8 w-8 p-0"
              >
                <Send className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 