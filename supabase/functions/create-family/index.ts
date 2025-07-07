import { createClient } from 'npm:@supabase/supabase-js@2'

interface CreateFamilyRequest {
  familyName: string;
  primaryEmail: string;
  members: Array<{
    name: string;
    email: string;
    relationship: string;
  }>;
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
    console.log('=== CREATE FAMILY FUNCTION START ===')

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
    const requestData: CreateFamilyRequest = await req.json()
    const { familyName, primaryEmail, members } = requestData

    if (!familyName || !primaryEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: familyName and primaryEmail' }),
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

    console.log('Creating family:', familyName)

    // Create the family
    const { data: family, error: familyError } = await supabaseAdmin
      .from('families')
      .insert({
        family_name: familyName,
        primary_contact_email: primaryEmail,
        created_by: user.id,
      })
      .select()
      .single()

    if (familyError) {
      console.error('Failed to create family:', familyError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create family',
          details: familyError.message
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Family created successfully:', family.id)

    // Add family members
    const validMembers = members.filter(m => m.name.trim() || m.email.trim())
    const addedMembers = []
    const skippedMembers = []

    for (const member of validMembers) {
      if (member.email.trim()) {
        // Check if user exists by email
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', member.email)
          .single()

        if (profile) {
          const { error: memberError } = await supabaseAdmin
            .from('family_members')
            .insert({
              family_id: family.id,
              user_id: profile.id,
              relationship: member.relationship || null,
              is_primary: member.email === primaryEmail,
            })

          if (memberError) {
            console.error('Error adding family member:', memberError)
            skippedMembers.push({
              ...member,
              reason: memberError.message
            })
          } else {
            addedMembers.push(member)
            console.log('Added family member:', member.email)
          }
        } else {
          skippedMembers.push({
            ...member,
            reason: 'User account not found'
          })
          console.log('No profile found for email:', member.email)
        }
      } else {
        // Member without email - just record the name and relationship
        // This could be handled differently based on requirements
        skippedMembers.push({
          ...member,
          reason: 'No email provided - cannot link to user account'
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Family created successfully',
        family: {
          id: family.id,
          name: family.family_name,
          primaryEmail: family.primary_contact_email
        },
        addedMembers,
        skippedMembers
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