/**
 * Edge Function: support-chat
 * Chat de soporte IA usando Claude
 *
 * Responde preguntas de usuarios sobre:
 * - Pagos y suscripciones
 * - Problemas tecnicos
 * - Uso de la app
 * - Funciones IA
 *
 * @version 1.0.0
 * @created 2025-01-15
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.20.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
});

interface ChatRequest {
  message: string;
  category: string;
  userContext?: string;
  history?: Array<{ role: string; content: string }>;
  conversationId?: string;
}

// Base de conocimiento para el soporte
const KNOWLEDGE_BASE = `
# Coleccion Nuevo Ser - Base de Conocimiento de Soporte

## Planes y Precios
- **Free**: Gratis, 5,000 tokens/mes, acceso basico
- **Premium**: 4.99€/mes, 100,000 tokens/mes, todas las funciones excepto Game Master
- **Pro**: 9.99€/mes, 300,000 tokens/mes, todas las funciones incluyendo Game Master

## Paquetes de Tokens (compra unica, no expiran)
- Basico: 50,000 tokens por 2.99€
- Estandar: 150,000 tokens por 7.99€ (popular)
- Premium: 500,000 tokens por 19.99€
- Pro: 1,500,000 tokens por 49.99€

## Metodos de Pago
- Tarjeta (Visa, Mastercard) via Stripe
- PayPal (paypal.me/codigodespierto)
- Bitcoin (verificacion automatica via blockchain)

## Funciones IA y Costos
- Chat IA: ~500 tokens por consulta
- Tutor IA: ~800 tokens por sesion
- Quizzes: ~600 tokens por quiz
- Game Master: ~1000 tokens (solo Pro)
- Resumen: ~300 tokens
- Voz ElevenLabs: ~200 tokens por 1000 caracteres

## Problemas Comunes y Soluciones
1. **Audio no funciona**: Verificar permisos del navegador, recargar pagina
2. **Sincronizacion fallida**: Verificar conexion a internet, cerrar y abrir sesion
3. **Login no funciona**: Usar "Olvide mi contrasena", verificar email correcto
4. **Tokens no aparecen**: Esperar 1-2 minutos tras compra, recargar pagina
5. **Pago rechazado**: Verificar fondos, probar otro metodo de pago

## Cancelaciones y Reembolsos
- Cancelar suscripcion: Mi Cuenta > Plan > Cancelar
- La suscripcion sigue activa hasta fin del periodo pagado
- Reembolsos: Dentro de 14 dias del pago, contactar irurag@gmail.com

## Contacto
- Email: irurag@gmail.com
- Chat IA: Disponible 24/7 en la app
`;

const SYSTEM_PROMPT = `Eres el asistente de soporte de Coleccion Nuevo Ser, una aplicacion de libros interactivos sobre transformacion personal y filosofia del Nuevo Ser.

Tu rol:
- Responder preguntas de soporte de forma amable, clara y concisa
- Ayudar con problemas tecnicos, pagos, cuentas y uso de la app
- Usar la base de conocimiento proporcionada para dar respuestas precisas
- Si no puedes resolver algo, sugerir contactar irurag@gmail.com

Reglas:
1. Respuestas cortas y directas (max 2-3 parrafos)
2. Usa emojis ocasionalmente para ser amigable pero profesional
3. Si detectas frustacion o problemas graves, sugiere escalar a soporte humano
4. No inventes informacion - si no sabes algo, dilo honestamente
5. Para problemas de pago especificos, siempre recomienda contactar soporte humano

${KNOWLEDGE_BASE}`;

function buildMessages(history: Array<{ role: string; content: string }> | undefined, currentMessage: string, userContext: string) {
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  // Agregar contexto del usuario como primer mensaje si existe
  if (userContext) {
    messages.push({
      role: 'user',
      content: `[Contexto del usuario: ${userContext}]`,
    });
    messages.push({
      role: 'assistant',
      content: 'Entendido, tengo el contexto del usuario.',
    });
  }

  // Agregar historial
  if (history && history.length > 0) {
    for (const msg of history) {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      });
    }
  }

  // Agregar mensaje actual
  messages.push({
    role: 'user',
    content: currentMessage,
  });

  return messages;
}

function detectEscalationNeed(response: string, userMessage: string): boolean {
  const escalationIndicators = [
    'contacta con soporte',
    'soporte humano',
    'irurag@gmail.com',
    'no puedo ayudarte con esto',
    'requiere revision',
  ];

  const userEscalationWords = [
    'demanda',
    'abogado',
    'legal',
    'fraude',
    'estafa',
    'robo',
    'denuncia',
  ];

  const responseLower = response.toLowerCase();
  const userLower = userMessage.toLowerCase();

  return (
    escalationIndicators.some(indicator => responseLower.includes(indicator)) ||
    userEscalationWords.some(word => userLower.includes(word))
  );
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, category, userContext, history, conversationId }: ChatRequest = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'message es requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construir mensajes para Claude
    const messages = buildMessages(history, message, userContext || '');

    // Llamar a Claude
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307', // Usar Haiku para respuestas rapidas y economicas
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages,
    });

    const assistantResponse = response.content[0].type === 'text'
      ? response.content[0].text
      : 'Lo siento, no pude generar una respuesta.';

    // Detectar si necesita escalacion
    const needsEscalation = detectEscalationNeed(assistantResponse, message);

    return new Response(
      JSON.stringify({
        response: assistantResponse,
        needsEscalation,
        reason: needsEscalation ? 'Respuesta sugiere atencion humana' : null,
        conversationId,
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in support chat:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Error interno',
        response: 'Lo siento, hubo un problema tecnico. Por favor intenta de nuevo o contacta irurag@gmail.com',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
