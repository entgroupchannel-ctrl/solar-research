import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_PASSWORD = "4497542";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, password, payload } = await req.json();

    if (password !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let result;

    switch (action) {
      case "get_responses": {
        const { data, error } = await supabase
          .from("survey_responses")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        result = data;
        break;
      }

      case "get_sources": {
        const { data, error } = await supabase
          .from("survey_sources")
          .select("*")
          .order("created_at", { ascending: true });
        if (error) throw error;
        result = data;
        break;
      }

      case "add_source": {
        const { code, name, region, target } = payload;
        const { data, error } = await supabase
          .from("survey_sources")
          .insert({ code, name, region: region || null, target: target || 0 })
          .select();
        if (error) throw error;
        result = data;
        break;
      }

      case "add_sources_batch": {
        const { rows } = payload;
        const { data, error } = await supabase
          .from("survey_sources")
          .insert(rows)
          .select();
        if (error) throw error;
        result = data;
        break;
      }

      case "toggle_source": {
        const { id, is_active } = payload;
        const { data, error } = await supabase
          .from("survey_sources")
          .update({ is_active })
          .eq("id", id)
          .select();
        if (error) throw error;
        result = data;
        break;
      }

      case "delete_source": {
        const { id } = payload;
        const { error } = await supabase
          .from("survey_sources")
          .delete()
          .eq("id", id);
        if (error) throw error;
        result = { success: true };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
