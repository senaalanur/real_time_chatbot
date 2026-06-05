import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ verified: false }), { status: 200 });
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error } = await userClient.auth.getUser();
    if (error || !user) {
      return new Response(JSON.stringify({ verified: false }), { status: 200 });
    }

    // Query auth.users table directly via raw SQL — bypasses all caching
    const { data, error: rpcError } = await adminClient.rpc('check_email_confirmed', {
      p_user_id: user.id
    });

    console.log('DB check for', user.email, ':', JSON.stringify(data), JSON.stringify(rpcError));

    if (rpcError) {
      console.log('RPC error, falling back to false:', rpcError.message);
      return new Response(JSON.stringify({ verified: false }), { status: 200 });
    }

    return new Response(JSON.stringify({ verified: data === true }), { status: 200 });

  } catch (err) {
    return new Response(JSON.stringify({ verified: false, error: err.message }), { status: 200 });
  }
});
