
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

    console.log('Fetching dashboard stats for user:', user.id)

    // Get user sessions count
    const { count: sessionsCount } = await supabaseClient
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`)

    // Get user roles to determine what stats to show
    const { data: userRoles } = await supabaseClient
      .from('user_roles')
      .select('role_type')
      .eq('user_id', user.id)

    const isMentor = userRoles?.some(role => role.role_type === 'mentor')
    const isMentee = userRoles?.some(role => role.role_type === 'mentee')

    let mentorStats = null
    if (isMentor) {
      // Get mentor-specific stats
      const { data: mentorData } = await supabaseClient
        .from('mentors')
        .select('rating, total_earnings, total_sessions_completed')
        .eq('mentor_id', user.id)
        .single()

      mentorStats = mentorData
    }

    const stats = {
      totalSessions: sessionsCount || 0,
      activeConnections: 12, // This would need to be calculated based on actual connections
      isMentor,
      isMentee,
      mentorStats
    }

    console.log('Dashboard stats:', stats)

    return new Response(
      JSON.stringify(stats),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
