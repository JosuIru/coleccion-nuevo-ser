/**
 * Edge Function: verify-btc-payment
 * Verifica pagos Bitcoin automáticamente via blockchain API
 *
 * Flujo:
 * 1. Usuario envía pago BTC y notifica TX ID
 * 2. Esta función consulta blockstream.info API
 * 3. Si la TX está confirmada con el monto correcto, acredita tokens
 * 4. Notifica al admin y al usuario
 *
 * @version 1.0.0
 * @created 2025-01-15
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// Blockstream API para verificar transacciones
const BLOCKSTREAM_API = 'https://blockstream.info/api';

// Direcciones BTC del admin (sincronizar con plans-config.js)
const BTC_ADDRESSES = [
  'bc1qjnva46wy92ldhsv4w0j26jmu8c5wm5cxvgdfd7',     // SegWit
  'bc1p29l9vjelerljlwhg6dhr0uldldus4zgn8vjaecer0spj7273d7rss4gnyk', // Taproot
];

// Mínimo de confirmaciones requeridas
const MIN_CONFIRMATIONS = 1;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BlockstreamTx {
  txid: string;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_time?: number;
  };
  vout: Array<{
    scriptpubkey_address: string;
    value: number; // en satoshis
  }>;
}

/**
 * Obtener información de una transacción desde Blockstream
 */
async function getTxInfo(txId: string): Promise<BlockstreamTx | null> {
  try {
    const response = await fetch(`${BLOCKSTREAM_API}/tx/${txId}`);
    if (!response.ok) {
      console.error(`Blockstream API error: ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching TX info:', error);
    return null;
  }
}

/**
 * Obtener altura actual del blockchain
 */
async function getBlockHeight(): Promise<number> {
  try {
    const response = await fetch(`${BLOCKSTREAM_API}/blocks/tip/height`);
    if (!response.ok) return 0;
    return parseInt(await response.text(), 10);
  } catch {
    return 0;
  }
}

/**
 * Verificar si una TX paga a nuestras direcciones el monto esperado
 */
function verifyPayment(
  tx: BlockstreamTx,
  expectedSatoshis: number,
  tolerance: number = 0.02 // 2% tolerancia por fluctuaciones
): { valid: boolean; receivedSatoshis: number; address: string } {
  let totalReceived = 0;
  let receivingAddress = '';

  for (const output of tx.vout) {
    if (BTC_ADDRESSES.includes(output.scriptpubkey_address)) {
      totalReceived += output.value;
      receivingAddress = output.scriptpubkey_address;
    }
  }

  // Verificar monto con tolerancia
  const minAmount = expectedSatoshis * (1 - tolerance);
  const valid = totalReceived >= minAmount;

  return {
    valid,
    receivedSatoshis: totalReceived,
    address: receivingAddress,
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { requestId } = await req.json();

    if (!requestId) {
      return new Response(
        JSON.stringify({ error: 'requestId requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener la solicitud de pago
    const { data: request, error: fetchError } = await supabase
      .from('btc_payment_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !request) {
      return new Response(
        JSON.stringify({ error: 'Solicitud no encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar estado
    if (!['submitted', 'verifying'].includes(request.status)) {
      return new Response(
        JSON.stringify({
          error: 'Estado inválido',
          status: request.status,
          message: request.status === 'verified' ? 'Ya verificado' : 'No se puede verificar',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que tiene TX ID
    if (!request.tx_id) {
      return new Response(
        JSON.stringify({ error: 'TX ID no proporcionado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Consultar blockchain
    const txInfo = await getTxInfo(request.tx_id);

    if (!txInfo) {
      // Actualizar estado a verifying si aún no existe la TX
      await supabase
        .from('btc_payment_requests')
        .update({ status: 'verifying' })
        .eq('id', requestId);

      return new Response(
        JSON.stringify({
          verified: false,
          status: 'verifying',
          message: 'Transacción no encontrada aún. Reintentando...',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar confirmaciones
    if (!txInfo.status.confirmed) {
      await supabase
        .from('btc_payment_requests')
        .update({ status: 'verifying' })
        .eq('id', requestId);

      return new Response(
        JSON.stringify({
          verified: false,
          status: 'verifying',
          message: 'Transacción pendiente de confirmación',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar número de confirmaciones
    const currentHeight = await getBlockHeight();
    const confirmations = currentHeight - (txInfo.status.block_height || currentHeight) + 1;

    if (confirmations < MIN_CONFIRMATIONS) {
      return new Response(
        JSON.stringify({
          verified: false,
          status: 'verifying',
          confirmations,
          required: MIN_CONFIRMATIONS,
          message: `Esperando confirmaciones (${confirmations}/${MIN_CONFIRMATIONS})`,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calcular monto esperado en satoshis
    const expectedSatoshis = Math.round(parseFloat(request.btc_amount) * 100000000);

    // Verificar pago
    const paymentCheck = verifyPayment(txInfo, expectedSatoshis);

    if (!paymentCheck.valid) {
      // Monto insuficiente
      await supabase
        .from('btc_payment_requests')
        .update({
          status: 'rejected',
          admin_notes: `Monto insuficiente. Esperado: ${expectedSatoshis} sat, Recibido: ${paymentCheck.receivedSatoshis} sat`,
        })
        .eq('id', requestId);

      return new Response(
        JSON.stringify({
          verified: false,
          status: 'rejected',
          error: 'Monto insuficiente',
          expected: expectedSatoshis,
          received: paymentCheck.receivedSatoshis,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Pago verificado - Acreditar tokens
    const { data: addResult, error: addError } = await supabase.rpc('add_purchased_tokens', {
      p_user_id: request.user_id,
      p_tokens: request.tokens_amount,
      p_payment_method: 'btc',
      p_payment_id: request.tx_id,
      p_package_id: request.package_id,
    });

    if (addError) {
      console.error('Error adding tokens:', addError);
      return new Response(
        JSON.stringify({ error: 'Error acreditando tokens', details: addError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Actualizar estado de la solicitud
    await supabase
      .from('btc_payment_requests')
      .update({
        status: 'verified',
        verified_at: new Date().toISOString(),
        admin_notes: `Verificado automáticamente. Confirmaciones: ${confirmations}. Recibido: ${paymentCheck.receivedSatoshis} sat`,
      })
      .eq('id', requestId);

    // Notificar al admin (opcional - via email o notificación interna)
    console.log(`BTC Payment Verified: ${request.tx_id} - ${request.tokens_amount} tokens for user ${request.user_id}`);

    return new Response(
      JSON.stringify({
        verified: true,
        status: 'verified',
        tokens_added: request.tokens_amount,
        confirmations,
        tx_id: request.tx_id,
        received_satoshis: paymentCheck.receivedSatoshis,
        new_balance: addResult?.new_balance,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error verifying BTC payment:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Error interno',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
