
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { Chrome, ArrowLeft } from 'lucide-react';


interface AuthFormProps {
  mode: 'login' | 'signup';
}

export const AuthForm = ({ mode }: AuthFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
      
      // The redirect will happen automatically
      console.log('Google OAuth initiated:', data);
    } catch (error: any) {
      console.error('Google OAuth error:', error);
      toast({
        title: "Google Sign-In Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=login`,
      });

      if (error) throw error;

      setResetEmailSent(true);
      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for a link to reset your password",
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: "Password Reset Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);

    try {
      console.log('Starting authentication process...');
      
      if (mode === 'signup') {
        console.log('Creating new account...');
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              first_name: firstName,
              last_name: lastName,
            }
          }
        });

        console.log('Signup response:', { data, error });

        if (error) throw error;
        
        console.log('Signup successful, creating user profile...');
        
        // Create user profile in users table
        if (data.user) {
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              user_id: data.user.id,
              first_name: firstName,
              last_name: lastName,
              email: email,
              profile_image: ''
            });

          if (profileError) {
            console.error('Error creating user profile:', profileError);
          } else {
            console.log('User profile created successfully');
          }

          // Don't create role or profile yet - let user choose in role selection modal
          console.log('User account created successfully, role selection will be handled later');
        }
        
        toast({
          title: "Account created successfully!",
          description: "Please check your email for verification. After verification, you'll be asked to choose your role."
        });
        navigate('/dashboard');
      } else {
        console.log('Attempting login...');
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        console.log('Login response:', { data, error });

        if (error) throw error;
        
        console.log('Login successful, checking user profile...');
        
        // Check if user has a profile and role
        if (data.user) {
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', data.user.id)
            .single();

          console.log('Profile check:', { profile, profileError });

          // If no profile exists, create one
          if (profileError && profileError.code === 'PGRST116') {
            console.log('Creating missing user profile...');
            const { error: createProfileError } = await supabase
              .from('users')
                          .insert({
              user_id: data.user.id,
              first_name: data.user.user_metadata?.first_name || 'User',
              last_name: data.user.user_metadata?.last_name || 'Name',
              email: data.user.email || '',
              profile_image: ''
            });

            if (createProfileError) {
              console.error('Error creating profile:', createProfileError);
            }
          }

          // Check if user has a role
          const { data: roles, error: rolesError } = await supabase
            .from('user_roles')
            .select('*')
            .eq('user_id', data.user.id);

          console.log('Roles check:', { roles, rolesError });

          // If no roles exist, create a default mentee role
          if (!roles || roles.length === 0) {
            console.log('Creating default mentee role...');
            const { error: createRoleError } = await supabase
              .from('user_roles')
              .insert({
                user_id: data.user.id,
                role: 'mentee'
              });

            if (createRoleError) {
              console.error('Error creating default role:', createRoleError);
            }
          }
        }
        
        toast({
          title: "Welcome back!",
          description: "You've successfully signed in."
        });
        
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Password Reset Form
  if (showPasswordReset) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPasswordReset(false)}
              className="p-0 h-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Sign In
            </Button>
          </div>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resetEmailSent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Check Your Email</h3>
                <p className="text-gray-600 text-sm">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPasswordReset(false);
                  setResetEmailSent(false);
                }}
                className="w-full"
              >
                Back to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetEmail">Email Address</Label>
                <Input
                  id="resetEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={resetLoading}>
                {resetLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    );
  }



  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{mode === 'login' ? 'Sign In' : 'Create Account'}</CardTitle>
        <CardDescription>
          {mode === 'login' 
            ? 'Enter your credentials to access your account' 
            : 'Create your MentorSES account to get started'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Google OAuth Button */}
        <Button 
          type="button" 
          variant="outline" 
          className="w-full mb-4" 
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
        >
          <Chrome className="mr-2 h-4 w-4" />
          {googleLoading ? 'Signing in...' : 'Continue with Google'}
        </Button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </Button>
          
          {mode === 'login' && (
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                className="text-sm text-blue-600 hover:text-blue-800"
                onClick={() => setShowPasswordReset(true)}
              >
                Forgot your password?
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};
