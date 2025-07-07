import { createClient } from 'npm:@supabase/supabase-js@2'

interface CreatePolicyRequest {
  family_id: string;
  policy_holder_id: string;
  policy_type: string;
  policy_number?: string;
  insurance_company?: string;
  premium_amount?: number;
  coverage_amount?: number;
  start_date?: string;
  end_date?: string;
  status: 'active' | 'inactive' | 'pending';
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
    console.log('=== CREATE POLICY FUNCTION START ===')

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
    const requestData: CreatePolicyRequest = await req.json()
    const { 
      family_id, 
      policy_holder_id, 
      policy_type, 
      policy_number, 
      insurance_company, 
      premium_amount, 
      coverage_amount, 
      start_date, 
      end_date, 
      status 
    } = requestData

    if (!family_id || !policy_holder_id || !policy_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: family_id, policy_holder_id, and policy_type' }),
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

    console.log('Creating policy for family:', family_id)

    // Create the policy
    const { data: policy, error: policyError } = await supabaseAdmin
      .from('policies')
      .insert({
        family_id,
        policy_holder_id,
        policy_type,
        policy_number: policy_number || null,
        insurance_company: insurance_company || null,
        premium_amount: premium_amount || null,
        coverage_amount: coverage_amount || null,
        start_date: start_date || null,
        end_date: end_date || null,
        status: status || 'active',
      })
      .select()
      .single()

    if (policyError) {
      console.error('Failed to create policy:', policyError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create policy',
          details: policyError.message
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Policy created successfully:', policy.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Policy created successfully',
        policy: {
          id: policy.id,
          policy_type: policy.policy_type,
          policy_number: policy.policy_number,
          insurance_company: policy.insurance_company,
          premium_amount: policy.premium_amount,
          coverage_amount: policy.coverage_amount,
          start_date: policy.start_date,
          end_date: policy.end_date,
          status: policy.status
        }
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