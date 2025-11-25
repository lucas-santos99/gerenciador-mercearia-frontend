// ATENÇÃO: Hardcoded (como definimos no teste anterior)
const supabaseUrl = "https://mrdfbujijgiaqutkpuch.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yZGZidWppamdpYXF1dGtwdWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MzEzODQsImV4cCI6MjA3NzIwNzM4NH0.zfKHSMP9ugSUaiYadky-830rRjEL6gPTmeDXLE9b-jo";

// Exporta uma FUNÇÃO que cria o cliente QUANDO CHAMADA
export const createSupabaseClient = () => {
    // Acessa o objeto global 'supabase' que a CDN deve ter criado
    const supabaseGlobal = window.supabase || window['supabase'];

    if (!supabaseGlobal || typeof supabaseGlobal.createClient !== 'function') {
        console.error("ERRO FATAL: A biblioteca Supabase (CDN) ainda não foi carregada quando createSupabaseClient foi chamado.");
        return null; // Retorna nulo se a biblioteca não estiver pronta
    }

    // Cria e retorna o cliente
    return supabaseGlobal.createClient(supabaseUrl, supabaseAnonKey);
};