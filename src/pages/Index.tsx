
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Star, Calendar, MessageCircle, TrendingUp, Shield, CheckCircle, ArrowRight, Play, Zap, Target, Award } from 'lucide-react';
import { Logo } from '@/components/ui/logo';

const Index = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    // Trigger initial animations
    const timer = setTimeout(() => setIsVisible(true), 100);
    const statsTimer = setTimeout(() => setStatsVisible(true), 800);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(statsTimer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <header className="bg-white text-brand-charcoal relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-sunshine-yellow/5 via-brand-marigold-yellow/3 to-transparent"></div>
        
        {/* Decorative Elements */}
        <div className="absolute top-20 right-10 w-32 h-32 bg-brand-sunshine-yellow/10 rounded-full blur-xl animate-float"></div>
        <div className="absolute bottom-20 left-10 w-24 h-24 bg-brand-marigold-yellow/10 rounded-full blur-lg animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-brand-sunshine-yellow/8 rounded-full blur-md animate-float" style={{animationDelay: '2s'}}></div>
        
        {/* Subtle geometric shapes */}
        <div className="absolute top-40 right-20 w-20 h-20 border-2 border-brand-sunshine-yellow/20 rounded-lg rotate-12"></div>
        <div className="absolute bottom-40 left-20 w-16 h-16 border-2 border-brand-marigold-yellow/20 rounded-full"></div>
        
        <div className="px-4 relative">
          <nav className="flex items-center justify-between h-20 bg-white/80 backdrop-blur-sm rounded-lg p-4 mx-4 mt-4 shadow-sm">
            <div className="flex items-center animate-slide-in-left">
              <Logo size="xl" variant="gradient" />
            </div>
            <div className="flex items-center space-x-4 animate-slide-in-right">
              <Link to="/auth">
                <Button variant="secondary" className="bg-brand-charcoal/10 hover:bg-brand-charcoal/20 text-brand-charcoal border-brand-charcoal/20 hover:scale-105 transition-all duration-200">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-brand-charcoal text-brand-sunshine-yellow hover:bg-brand-dark-grey hover:scale-105 transition-all duration-200">
                  Get Started
                </Button>
              </Link>
            </div>
          </nav>
          
          <div className="py-16 md:py-24">
            <div className="text-center max-w-4xl mx-auto">
              <Badge 
                variant="secondary" 
                className={`mb-6 bg-brand-charcoal text-brand-sunshine-yellow border-0 hover:bg-brand-dark-grey transition-all duration-700 px-4 py-2 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                🚀 Trusted by 10,000+ professionals
              </Badge>
              <h1 className={`text-4xl md:text-6xl lg:text-7xl font-bold mb-6 md:mb-8 leading-tight transition-all duration-1000 delay-200 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}>
                Find Your Perfect
                <span className="block bg-gradient-to-r from-brand-sunshine-yellow to-brand-marigold-yellow bg-clip-text text-transparent animate-pulse">
                  Career Mentor
                </span>
              </h1>
              <p className={`text-lg md:text-xl lg:text-2xl mb-12 text-brand-charcoal leading-relaxed font-medium px-4 transition-all duration-1000 delay-400 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}>
                Connect with industry experts who've been there. Get personalized guidance, 
                career advice, and accelerate your professional growth.
              </p>
              <div className={`flex flex-col sm:flex-row gap-6 justify-center mb-16 px-4 transition-all duration-1000 delay-600 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}>
                <Link to="/mentors">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-brand-sunshine-yellow to-brand-marigold-yellow text-brand-charcoal hover:from-brand-marigold-yellow hover:to-brand-sunshine-yellow hover:shadow-lg transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 px-8 py-4 text-lg font-semibold focus:ring-4 focus:ring-brand-sunshine-yellow/30 shadow-md"
                    aria-label="Find your perfect mentor"
                  >
                    Find Your Mentor
                    <ArrowRight className="ml-2 h-5 w-5 animate-pulse" />
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-2 border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal hover:text-brand-sunshine-yellow hover:scale-105 px-8 py-4 text-lg font-semibold transition-all duration-300 focus:ring-4 focus:ring-brand-charcoal/30 bg-white/80 backdrop-blur-sm"
                    aria-label="Browse mentor categories"
                  >
                    <Play className="mr-2 h-5 w-5 animate-pulse" />
                    Browse Categories
                  </Button>
                </Link>
              </div>
              
              {/* Stats */}
              <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mt-16 md:mt-20 pt-8 px-4 transition-all duration-1000 delay-800 ${
                statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}>
                <div className="text-center group hover:transform hover:scale-105 transition-all duration-300 animate-fade-in-up bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-brand-sunshine-yellow/20">
                  <div className="text-3xl md:text-4xl font-bold mb-2 md:mb-3 text-brand-charcoal animate-pulse">500+</div>
                  <div className="text-brand-charcoal/90 font-medium text-sm md:text-base">Expert Mentors</div>
                </div>
                <div className="text-center group hover:transform hover:scale-105 transition-all duration-300 animate-fade-in-up bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-brand-marigold-yellow/20" style={{animationDelay: '0.2s'}}>
                  <div className="text-3xl md:text-4xl font-bold mb-2 md:mb-3 text-brand-charcoal animate-pulse">10,000+</div>
                  <div className="text-brand-charcoal/90 font-medium text-sm md:text-base">Successful Sessions</div>
                </div>
                <div className="text-center group hover:transform hover:scale-105 transition-all duration-300 animate-fade-in-up bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-brand-sunshine-yellow/20" style={{animationDelay: '0.4s'}}>
                  <div className="text-3xl md:text-4xl font-bold mb-2 md:mb-3 text-brand-charcoal flex items-center justify-center">
                    4.9<Star className="h-5 w-5 md:h-6 md:w-6 text-brand-sunshine-yellow ml-1 animate-spin" style={{animationDuration: '3s'}} />
                  </div>
                  <div className="text-brand-charcoal/90 font-medium text-sm md:text-base">Average Rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
                              Why Choose MentorSES?
            </h2>
            <p className="text-xl text-gray-600">
              We've built the most comprehensive mentorship platform to help you achieve your career goals
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-brand-sunshine-yellow rounded-full flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-brand-charcoal" />
                </div>
                <CardTitle className="text-xl">Expert Mentors</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">
                  Connect with verified industry professionals who have real-world experience in your field
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-brand-marigold-yellow rounded-full flex items-center justify-center mb-4">
                  <Target className="h-8 w-8 text-brand-charcoal" />
                </div>
                <CardTitle className="text-xl">Personalized Matching</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">
                  Our AI-powered system matches you with mentors based on your goals, experience, and preferences
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-brand-sunshine-yellow rounded-full flex items-center justify-center mb-4">
                  <Zap className="h-8 w-8 text-brand-charcoal" />
                </div>
                <CardTitle className="text-xl">Flexible Sessions</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">
                  Book sessions that fit your schedule - 1-on-1 calls, group workshops, or ongoing mentorship
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-brand-marigold-yellow rounded-full flex items-center justify-center mb-4">
                  <Shield className="h-8 w-8 text-brand-charcoal" />
                </div>
                <CardTitle className="text-xl">Secure Platform</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">
                  Your data and conversations are protected with enterprise-grade security and privacy controls
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-brand-sunshine-yellow rounded-full flex items-center justify-center mb-4">
                  <Award className="h-8 w-8 text-brand-charcoal" />
                </div>
                <CardTitle className="text-xl">Proven Results</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">
                  85% of mentees report career advancement within 6 months of starting mentorship
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-brand-marigold-yellow rounded-full flex items-center justify-center mb-4">
                  <MessageCircle className="h-8 w-8 text-brand-charcoal" />
                </div>
                <CardTitle className="text-xl">Ongoing Support</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">
                  Get continuous guidance and support between sessions through our messaging platform
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get started with mentorship in just 3 simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mx-auto w-20 h-20 bg-brand-charcoal rounded-full flex items-center justify-center mb-6 text-brand-sunshine-yellow text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-4">Create Your Profile</h3>
              <p className="text-gray-600">
                Tell us about your career goals, experience level, and what you want to achieve
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto w-20 h-20 bg-brand-sunshine-yellow rounded-full flex items-center justify-center mb-6 text-brand-charcoal text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-4">Find Your Mentor</h3>
              <p className="text-gray-600">
                Browse our curated list of mentors or let our AI recommend the perfect match
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto w-20 h-20 bg-brand-marigold-yellow rounded-full flex items-center justify-center mb-6 text-brand-charcoal text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-4">Start Learning</h3>
              <p className="text-gray-600">
                Book your first session and begin your journey to career success
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600">
              Real stories from real people who transformed their careers
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex text-brand-sunshine-yellow">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 mb-6">
                  "My mentor helped me transition from a junior developer to a senior role in just 6 months. 
                  The personalized guidance was exactly what I needed."
                </p>
                <div className="flex items-center">
                  <Avatar className="h-12 w-12 mr-4">
                    <AvatarFallback className="bg-brand-sunshine-yellow text-brand-charcoal">SM</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">Sarah Mitchell</div>
                    <div className="text-sm text-gray-500">Senior Software Engineer</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex text-brand-sunshine-yellow">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 mb-6">
                  "The platform made it so easy to find a mentor who understood my specific industry. 
                  I got promoted within 3 months of starting mentorship."
                </p>
                <div className="flex items-center">
                  <Avatar className="h-12 w-12 mr-4">
                    <AvatarFallback className="bg-brand-marigold-yellow text-brand-charcoal">JD</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">James Davis</div>
                    <div className="text-sm text-gray-500">Product Manager</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex text-brand-sunshine-yellow">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 mb-6">
                  "As a mentor, I love how the platform connects me with mentees who are genuinely 
                  committed to growth. It's rewarding to see their progress."
                </p>
                <div className="flex items-center">
                  <Avatar className="h-12 w-12 mr-4">
                    <AvatarFallback className="bg-brand-sunshine-yellow text-brand-charcoal">EL</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">Emily Lopez</div>
                    <div className="text-sm text-gray-500">Tech Lead & Mentor</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-brand-charcoal to-brand-dark-grey text-brand-sunshine-yellow">
        <div className="px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your Career?
          </h2>
          <p className="text-xl mb-8 text-brand-sunshine-yellow/90">
            Join thousands of professionals who have accelerated their careers with personalized mentorship
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="bg-brand-sunshine-yellow text-brand-charcoal hover:bg-brand-marigold-yellow px-8 py-4 text-lg">
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-brand-sunshine-yellow/30 text-brand-sunshine-yellow hover:bg-brand-sunshine-yellow/10 px-8 py-4 text-lg">
              Become a Mentor
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
                              <h3 className="text-2xl font-bold mb-4">MentorSES</h3>
              <p className="text-gray-400">
                Connecting ambitious professionals with expert mentors to accelerate career growth.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Find Mentors</a></li>
                <li><a href="#" className="hover:text-white">Become a Mentor</a></li>
                <li><a href="#" className="hover:text-white">How It Works</a></li>
                <li><a href="#" className="hover:text-white">Success Stories</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Twitter</a></li>
                <li><a href="#" className="hover:text-white">LinkedIn</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Newsletter</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                            <p>&copy; 2024 MentorSES. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
