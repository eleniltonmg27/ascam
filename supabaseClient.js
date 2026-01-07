(function () {
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    console.warn("⚠️ Configure SUPABASE_URL e SUPABASE_ANON_KEY no config.js");
    return;
  }
  window.sb = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
})();

