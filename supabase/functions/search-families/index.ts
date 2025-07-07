import { createClient } from 'npm:@supabase/supabase-js@2'

interface SearchFamiliesRequest {
  searchTerm: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== SEARCH FAMILIES FUNCTION START ===')

    // Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify authorization
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const requestData: SearchFamiliesRequest = await req.json()
    const { searchTerm } = requestData

    if (!searchTerm || !searchTerm.trim()) {
      return new Response(
        JSON.stringify({ error: 'Search term is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verify the requesting user is an admin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      console.error('Authentication failed:', userError)
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is an admin
    const adminEmails = ['haley@admin.com', 'jigar@admin.com', 'priyal@admin.com']
    if (!adminEmails.includes(user.email || '')) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Searching families with term:', searchTerm)

    // Search families by name or primary email
    const { data: familiesData, error: familiesError } = await supabaseAdmin
      .from('families')
      .select(`
        id,
        family_name,
        primary_contact_email,
        created_at
      `)
      .or(`family_name.ilike.%${searchTerm}%,primary_contact_email.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })

    if (familiesError) {
      console.error('Error searching families:', familiesError)
      return new Response(
        JSON.stringify({ error: 'Failed to search families', details: familiesError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Search by member names
    const { data: profilesData, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        email
      `)
      .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)

    if (profilesError) {
      console.error('Error searching profiles:', profilesError)
      return new Response(
        JSON.stringify({ error: 'Failed to search profiles', details: profilesError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get family IDs from matching profiles
    const profileIds = profilesData?.map(p => p.id) || []
    let familiesFromProfiles: any[] = []

    if (profileIds.length > 0) {
      const { data: memberData, error: memberError } = await supabaseAdmin
        .from('family_members')
        .select(`
          family_id,
          families!family_members_family_id_fkey (
            id,
            family_name,
            primary_contact_email,
            created_at
          )
        `)
        .in('user_id', profileIds)

      if (memberError) {
        console.error('Error getting families from members:', memberError)
      } else {
        familiesFromProfiles = memberData?.map(m => m.families).filter(Boolean) || []
      }
    }

    // Combine and deduplicate results
    const allFamilies = [...(familiesData || [])]
    familiesFromProfiles.forEach(family => {
      if (!allFamilies.find(f => f.id === family.id)) {
        allFamilies.push(family)
      }
    })

    // Get family members for each family
    const familyIds = allFamilies.map(f => f.id)
    let familyMembersData: any[] = []

    if (familyIds.length > 0) {
      const { data: membersData, error: membersError } = await supabaseAdmin
        .from('family_members')
        .select(`
          id,
          family_id,
          user_id,
          relationship,
          is_primary,
          profiles!family_members_user_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .in('family_id', familyIds)

      if (membersError) {
        console.error('Error getting family members:', membersError)
      } else {
        familyMembersData = membersData || []
      }
    }

    // Attach members to families
    const familiesWithMembers = allFamilies.map(family => ({
      ...family,
      family_members: familyMembersData.filter(member => member.family_id === family.id)
    }))

    // Sort by created_at
    familiesWithMembers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    console.log(`Found ${familiesWithMembers.length} families`)

    return new Response(
      JSON.stringify({ 
        success: true,
        families: familiesWithMembers
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})