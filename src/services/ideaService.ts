import { supabase } from '@/integrations/supabase/client';

export interface Idea {
  id: string;
  mentee_id: string;
  title: string;
  description: string;
  industry?: string;
  stage: 'idea' | 'prototype' | 'mvp' | 'early_traction' | 'scaling';
  funding_needed?: number;
  equity_offered?: number;
  contact_email?: string;
  contact_phone?: string;
  is_active: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
  mentee?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface IdeaContact {
  id: string;
  idea_id: string;
  mentor_id: string;
  message: string;
  contact_method: 'email' | 'phone' | 'platform';
  status: 'pending' | 'accepted' | 'declined' | 'contacted';
  created_at: string;
  updated_at: string;
  mentor?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface CreateIdeaData {
  title: string;
  description: string;
  industry?: string;
  stage: 'idea' | 'prototype' | 'mvp' | 'early_traction' | 'scaling';
  funding_needed?: number;
  equity_offered?: number;
  contact_email?: string;
  contact_phone?: string;
}

export interface ContactIdeaData {
  idea_id: string;
  message: string;
  contact_method: 'email' | 'phone' | 'platform';
}

export class IdeaService {
  // Get all active ideas with mentee information
  static async getActiveIdeas(): Promise<Idea[]> {
    const { data: ideas, error: ideasError } = await supabase
      .from('ideas')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (ideasError) {
      console.error('Error fetching active ideas:', ideasError);
      throw ideasError;
    }

    if (!ideas || ideas.length === 0) {
      return [];
    }

    // Get user information for all mentees
    const menteeIds = [...new Set(ideas.map(idea => idea.mentee_id))];
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('user_id, first_name, last_name, email')
      .in('user_id', menteeIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    // Create a map of user_id to user data
    const userMap = new Map(users?.map(user => [user.user_id, user]) || []);

    // Transform the data to match the expected interface
    return (ideas || []).map(idea => ({
      ...idea,
      mentee: userMap.get(idea.mentee_id) || null
    }));
  }

  // Get ideas by mentee
  static async getIdeasByMentee(menteeId: string): Promise<Idea[]> {
    const { data: ideas, error: ideasError } = await supabase
      .from('ideas')
      .select('*')
      .eq('mentee_id', menteeId)
      .order('created_at', { ascending: false });

    if (ideasError) {
      console.error('Error fetching mentee ideas:', ideasError);
      throw ideasError;
    }

    if (!ideas || ideas.length === 0) {
      return [];
    }

    // Get user information for the mentee
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('user_id, first_name, last_name, email')
      .eq('user_id', menteeId)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      throw userError;
    }

    // Transform the data to match the expected interface
    return (ideas || []).map(idea => ({
      ...idea,
      mentee: user
    }));
  }

  // Get single idea by ID
  static async getIdeaById(ideaId: string): Promise<Idea | null> {
    const { data: idea, error: ideaError } = await supabase
      .from('ideas')
      .select('*')
      .eq('id', ideaId)
      .single();

    if (ideaError) {
      console.error('Error fetching idea:', ideaError);
      throw ideaError;
    }

    if (!idea) {
      return null;
    }

    // Get user information for the mentee
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('user_id, first_name, last_name, email')
      .eq('user_id', idea.mentee_id)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      throw userError;
    }

    // Transform the data to match the expected interface
    return {
      ...idea,
      mentee: user
    };
  }

  // Create new idea
  static async createIdea(ideaData: CreateIdeaData): Promise<Idea> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user is a mentee
    const { data: menteeData, error: menteeError } = await supabase
      .from('mentees')
      .select('mentee_id')
      .eq('mentee_id', user.id)
      .single();

    if (menteeError || !menteeData) {
      throw new Error('User is not a mentee');
    }

    const { data, error } = await supabase
      .from('ideas')
      .insert({
        ...ideaData,
        mentee_id: user.id, // Use user.id directly as mentee_id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating idea:', error);
      throw error;
    }

    return data;
  }

  // Update idea
  static async updateIdea(ideaId: string, updates: Partial<CreateIdeaData>): Promise<Idea> {
    const { data, error } = await supabase
      .from('ideas')
      .update(updates)
      .eq('id', ideaId)
      .select()
      .single();

    if (error) {
      console.error('Error updating idea:', error);
      throw error;
    }

    return data;
  }

  // Delete idea
  static async deleteIdea(ideaId: string): Promise<void> {
    const { error } = await supabase
      .from('ideas')
      .delete()
      .eq('id', ideaId);

    if (error) {
      console.error('Error deleting idea:', error);
      throw error;
    }
  }

  // Toggle idea active status
  static async toggleIdeaStatus(ideaId: string): Promise<Idea> {
    const { data: currentIdea } = await supabase
      .from('ideas')
      .select('is_active')
      .eq('id', ideaId)
      .single();

    const { data, error } = await supabase
      .from('ideas')
      .update({ is_active: !currentIdea?.is_active })
      .eq('id', ideaId)
      .select()
      .single();

    if (error) {
      console.error('Error toggling idea status:', error);
      throw error;
    }

    return data;
  }

  // Record idea view
  static async recordIdeaView(ideaId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return; // Don't record view for anonymous users
    }

    const { error } = await supabase
      .from('idea_views')
      .insert({
        idea_id: ideaId,
        viewer_id: user.id,
      })
      .single();

    if (error && error.code !== '23505') { // Ignore unique constraint violations
      console.error('Error recording idea view:', error);
    }
  }

  // Contact mentee about idea
  static async contactIdea(contactData: ContactIdeaData): Promise<IdeaContact> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user is a mentor
    const { data: mentorData, error: mentorError } = await supabase
      .from('mentors')
      .select('mentor_id')
      .eq('mentor_id', user.id)
      .single();

    if (mentorError || !mentorData) {
      throw new Error('User is not a mentor');
    }

    const { data, error } = await supabase
      .from('idea_contacts')
      .select()
      .insert({
        ...contactData,
        mentor_id: user.id, // Use user.id directly as mentor_id
      })
      .single();

    if (error) {
      console.error('Error creating idea contact:', error);
      throw error;
    }

    return data;
  }

  // Get contacts for an idea (for mentees)
  static async getIdeaContacts(ideaId: string): Promise<IdeaContact[]> {
    const { data: contacts, error: contactsError } = await supabase
      .from('idea_contacts')
      .select('*')
      .eq('idea_id', ideaId)
      .order('created_at', { ascending: false });

    if (contactsError) {
      console.error('Error fetching idea contacts:', contactsError);
      throw contactsError;
    }

    if (!contacts || contacts.length === 0) {
      return [];
    }

    // Get user information for all mentors
    const mentorIds = [...new Set(contacts.map(contact => contact.mentor_id))];
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('user_id, first_name, last_name, email')
      .in('user_id', mentorIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    // Create a map of user_id to user data
    const userMap = new Map(users?.map(user => [user.user_id, user]) || []);

    // Transform the data to match the expected interface
    return (contacts || []).map(contact => ({
      ...contact,
      mentor: userMap.get(contact.mentor_id) || null
    }));
  }

  // Get contacts made by mentor
  static async getMentorContacts(): Promise<IdeaContact[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: contacts, error: contactsError } = await supabase
      .from('idea_contacts')
      .select('*')
      .eq('mentor_id', user.id)
      .order('created_at', { ascending: false });

    if (contactsError) {
      console.error('Error fetching mentor contacts:', contactsError);
      throw contactsError;
    }

    if (!contacts || contacts.length === 0) {
      return [];
    }

    // Get idea information for all contacts
    const ideaIds = [...new Set(contacts.map(contact => contact.idea_id))];
    const { data: ideas, error: ideasError } = await supabase
      .from('ideas')
      .select('id, title, description, mentee_id')
      .in('id', ideaIds);

    if (ideasError) {
      console.error('Error fetching ideas:', ideasError);
      throw ideasError;
    }

    // Get user information for all mentees
    const menteeIds = [...new Set(ideas.map(idea => idea.mentee_id))];
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('user_id, first_name, last_name, email')
      .in('user_id', menteeIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    // Create maps for easy lookup
    const ideaMap = new Map(ideas?.map(idea => [idea.id, idea]) || []);
    const userMap = new Map(users?.map(user => [user.user_id, user]) || []);

    // Transform the data to match the expected interface
    return (contacts || []).map(contact => {
      const idea = ideaMap.get(contact.idea_id);
      return {
        ...contact,
        idea: idea ? {
          ...idea,
          mentee: userMap.get(idea.mentee_id) || null
        } : undefined
      };
    });
  }

  // Update contact status
  static async updateContactStatus(contactId: string, status: 'accepted' | 'declined' | 'contacted'): Promise<IdeaContact> {
    const { data, error } = await supabase
      .from('idea_contacts')
      .update({ status })
      .eq('id', contactId)
      .select()
      .single();

    if (error) {
      console.error('Error updating contact status:', error);
      throw error;
    }

    return data;
  }

  // Search ideas by industry or stage
  static async searchIdeas(filters: {
    industry?: string;
    stage?: string;
    minFunding?: number;
    maxFunding?: number;
  }): Promise<Idea[]> {
    let query = supabase
      .from('ideas')
      .select('*')
      .eq('is_active', true);

    if (filters.industry) {
      query = query.eq('industry', filters.industry);
    }

    if (filters.stage) {
      query = query.eq('stage', filters.stage);
    }

    if (filters.minFunding !== undefined) {
      query = query.gte('funding_needed', filters.minFunding);
    }

    if (filters.maxFunding !== undefined) {
      query = query.lte('funding_needed', filters.maxFunding);
    }

    const { data: ideas, error: ideasError } = await query.order('created_at', { ascending: false });

    if (ideasError) {
      console.error('Error searching ideas:', ideasError);
      throw ideasError;
    }

    if (!ideas || ideas.length === 0) {
      return [];
    }

    // Get user information for all mentees
    const menteeIds = [...new Set(ideas.map(idea => idea.mentee_id))];
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('user_id, first_name, last_name, email')
      .in('user_id', menteeIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    // Create a map of user_id to user data
    const userMap = new Map(users?.map(user => [user.user_id, user]) || []);

    // Transform the data to match the expected interface
    return (ideas || []).map(idea => ({
      ...idea,
      mentee: userMap.get(idea.mentee_id) || null
    }));
  }
} 