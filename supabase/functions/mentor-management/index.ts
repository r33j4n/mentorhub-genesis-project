
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const method = req.method

    if (method === 'GET') {
      // Get all mentors with user information
      const { data: mentors, error } = await supabaseClient
        .from('mentors')
        .select(`
          *,
          users (
            first_name,
            last_name,
            email,
            profile_image
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching mentors:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch mentors' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify(mentors),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'PUT') {
      // Update mentor
      const { mentorId, ...updateData } = await req.json()
      
      if (!mentorId) {
        return new Response(
          JSON.stringify({ error: 'Mentor ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await supabaseClient
        .from('mentors')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('mentor_id', mentorId)
        .select()

      if (error) {
        console.error('Error updating mentor:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to update mentor' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify(data[0]),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'PATCH') {
      // Approve/unapprove mentor
      const { mentorId, isApproved } = await req.json()
      
      if (!mentorId || typeof isApproved !== 'boolean') {
        return new Response(
          JSON.stringify({ error: 'Mentor ID and approval status are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await supabaseClient
        .from('mentors')
        .update({
          is_approved: isApproved,
          approval_date: isApproved ? new Date().toISOString() : null,
          approved_by: isApproved ? user.id : null,
          updated_at: new Date().toISOString()
        })
        .eq('mentor_id', mentorId)
        .select()

      if (error) {
        console.error('Error updating mentor approval:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to update mentor approval' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify(data[0]),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in mentor-management endpoint:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
