import { createClient } from 'npm:@supabase/supabase-js@2'

interface GetFamilyDetailsRequest {
  familyId: string;
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
    console.log('=== GET FAMILY DETAILS FUNCTION START ===')

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
    const requestData: GetFamilyDetailsRequest = await req.json()
    const { familyId } = requestData

    if (!familyId) {
      return new Response(
        JSON.stringify({ error: 'Family ID is required' }),
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

    console.log('Getting family details for:', familyId)

    // Get family details
    const { data: family, error: familyError } = await supabaseAdmin
      .from('families')
      .select(`
        id,
        family_name,
        primary_contact_email,
        created_at,
        updated_at
      `)
      .eq('id', familyId)
      .single()

    if (familyError) {
      console.error('Error getting family:', familyError)
      return new Response(
        JSON.stringify({ error: 'Family not found', details: familyError.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get family members with their profile information
    const { data: familyMembers, error: membersError } = await supabaseAdmin
      .from('family_members')
      .select(`
        id,
        user_id,
        relationship,
        is_primary,
        joined_at
      `)
      .eq('family_id', familyId)
      .order('is_primary', { ascending: false })

    if (membersError) {
      console.error('Error getting family members:', membersError)
      return new Response(
        JSON.stringify({ error: 'Failed to get family members', details: membersError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get profile information for each family member
    const memberUserIds = familyMembers?.map(m => m.user_id) || []
    let profiles: any[] = []

    if (memberUserIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email
        `)
        .in('id', memberUserIds)

      if (profilesError) {
        console.error('Error getting profiles:', profilesError)
      } else {
        profiles = profilesData || []
      }
    }

    // Combine family members with their profile data
    const membersWithProfiles = familyMembers?.map(member => {
      const profile = profiles.find(p => p.id === member.user_id)
      return {
        ...member,
        profiles: profile || {
          first_name: 'Unknown',
          last_name: 'User',
          email: 'No email'
        }
      }
    }) || []

    // Get policies for this family
    const { data: policies, error: policiesError } = await supabaseAdmin
      .from('policies')
      .select(`
        id,
        policy_type,
        policy_number,
        insurance_company,
        premium_amount,
        coverage_amount,
        start_date,
        end_date,
        status,
        policy_holder_id,
        created_at
      `)
      .eq('family_id', familyId)
      .order('created_at', { ascending: false })

    if (policiesError) {
      console.error('Error getting policies:', policiesError)
    }

    // Get profile information for policy holders
    const policyHolderIds = policies?.map(p => p.policy_holder_id).filter(Boolean) || []
    let policyHolderProfiles: any[] = []

    if (policyHolderIds.length > 0) {
      const { data: holderProfilesData, error: holderProfilesError } = await supabaseAdmin
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name
        `)
        .in('id', policyHolderIds)

      if (holderProfilesError) {
        console.error('Error getting policy holder profiles:', holderProfilesError)
      } else {
        policyHolderProfiles = holderProfilesData || []
      }
    }

    // Combine policies with policy holder profile data
    const policiesWithHolders = policies?.map(policy => {
      const holderProfile = policyHolderProfiles.find(p => p.id === policy.policy_holder_id)
      return {
        ...policy,
        profiles: holderProfile || {
          first_name: 'Unknown',
          last_name: 'User'
        }
      }
    }) || []

    const familyWithDetails = {
      ...family,
      family_members: membersWithProfiles,
      policies: policiesWithHolders
    }

    console.log(`Found family with ${membersWithProfiles.length} members and ${policiesWithHolders.length} policies`)

    return new Response(
      JSON.stringify({ 
        success: true,
        family: familyWithDetails
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