/**
 * Edge Function: direct-btc-donation
 * Sistema de donaciones BTC DESCENTRALIZADAS
 *
 * Flujo P2P (Peer-to-Peer):
 * 1. Donador ve dirección BTC de la entidad
 * 2. Donador envía BTC directamente a la entidad
 * 3. Sistema verifica transacción en blockchain
 * 4. Entidad recibe fondos automáticamente (ya están en su wallet)
 *
 * No hay intermediario - 100% descentralizado
 *
 * @version 1.0.0
 * @created 2025-01-15
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BLOCKSTREAM_API = 'https://blockstream.info/api';
const MIN_CONFIRMATIONS = 1; // Mínimo confirmaciones para considerar válido

interface DirectDonationRequest {
  action: 'create' | 'verify' | 'get-address';
  entityId: string;
  amount?: number;
  currency?: string;
  txId?: string;
  donorId?: string;
  donorName?: string;
  donorEmail?: string;
  donorMessage?: string;
}

/**
 * Obtener precio actual de BTC en EUR
 */
async function getBtcPrice(): Promise<number> {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur');
    const data = await response.json();
    return data.bitcoin.eur;
  } catch {
    // Fallback price
    return 95000;
  }
}

/**
 * Verificar transacción BTC usando Blockstream API
 */
async function verifyBtcTransaction(
  txId: string,
  expectedAddress: string,
  expectedAmount: number
): Promise<{ valid: boolean; confirmations: number; actualAmount: number; error?: string }> {
  try {
    // Obtener detalles de la transacción
    const txResponse = await fetch(`${BLOCKSTREAM_API}/tx/${txId}`);
    if (!txResponse.ok) {
      return { valid: false, confirmations: 0, actualAmount: 0, error: 'Transacción no encontrada' };
    }

    const tx = await txResponse.json();

    // Buscar el output que va a la dirección de la entidad
    let actualAmount = 0;
    for (const vout of tx.vout) {
      if (vout.scriptpubkey_address === expectedAddress) {
        actualAmount += vout.value / 100000000; // Convertir satoshis a BTC
      }
    }

    if (actualAmount === 0) {
      return { valid: false, confirmations: 0, actualAmount: 0, error: 'La transacción no envía fondos a la dirección correcta' };
    }

    // Verificar monto (permitir 5% de diferencia por fluctuación)
    const tolerance = expectedAmount * 0.05;
    if (actualAmount < expectedAmount - tolerance) {
      return {
        valid: false,
        confirmations: tx.status.confirmed ? 1 : 0,
        actualAmount,
        error: `Monto insuficiente. Esperado: ${expectedAmount} BTC, Recibido: ${actualAmount} BTC`
      };
    }

    // Verificar confirmaciones
    let confirmations = 0;
    if (tx.status.confirmed) {
      // Obtener altura actual
      const heightResponse = await fetch(`${BLOCKSTREAM_API}/blocks/tip/height`);
      const currentHeight = await heightResponse.json();
      confirmations = currentHeight - tx.status.block_height + 1;
    }

    return {
      valid: true,
      confirmations,
      actualAmount
    };
  } catch (error) {
    console.error('Error verifying BTC transaction:', error);
    return { valid: false, confirmations: 0, actualAmount: 0, error: 'Error al verificar transacción' };
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: DirectDonationRequest = await req.json();
    const { action, entityId } = body;

    if (!entityId) {
      return new Response(
        JSON.stringify({ error: 'entityId requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Inicializar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener entidad
    const { data: entity, error: entityError } = await supabase
      .from('map_entities')
      .select('*')
      .eq('id', entityId)
      .single();

    if (entityError || !entity) {
      return new Response(
        JSON.stringify({ error: 'Entidad no encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'get-address': {
        // Devolver dirección BTC de la entidad para donación directa
        if (!entity.btc_address) {
          return new Response(
            JSON.stringify({
              error: 'Esta entidad no tiene dirección BTC configurada',
              hint: 'La entidad debe añadir su dirección BTC en su perfil'
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!entity.is_verified) {
          return new Response(
            JSON.stringify({
              error: 'Esta entidad no está verificada',
              hint: 'Por seguridad, solo puedes donar a entidades verificadas'
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Obtener precio BTC
        const btcPrice = await getBtcPrice();

        return new Response(
          JSON.stringify({
            success: true,
            entity: {
              id: entity.id,
              name: entity.name,
              category: entity.category,
              isVerified: entity.is_verified
            },
            btcAddress: entity.btc_address,
            btcPrice,
            message: 'Envía BTC directamente a esta dirección. La transacción será verificada automáticamente.'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create': {
        // Crear registro de donación P2P
        const { amount, currency = 'EUR', donorId, donorName, donorEmail, donorMessage } = body;

        if (!amount || amount <= 0) {
          return new Response(
            JSON.stringify({ error: 'Monto inválido' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!entity.btc_address) {
          return new Response(
            JSON.stringify({ error: 'Entidad sin dirección BTC' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Calcular BTC equivalente
        const btcPrice = await getBtcPrice();
        const btcAmount = amount / btcPrice;

        // Crear donación con tipo 'p2p' (peer-to-peer, descentralizada)
        const { data: donation, error: donationError } = await supabase
          .from('entity_donations')
          .insert({
            entity_id: entityId,
            donor_id: donorId,
            donor_name: donorName,
            donor_email: donorEmail,
            donor_message: donorMessage,
            amount,
            currency,
            btc_amount: btcAmount,
            payment_method: 'btc',
            status: 'pending',
            release_address: entity.btc_address, // La dirección de destino es la de la entidad
            metadata: {
              type: 'p2p', // Marca como donación P2P descentralizada
              btc_price_at_creation: btcPrice,
              entity_btc_address: entity.btc_address
            }
          })
          .select()
          .single();

        if (donationError) {
          return new Response(
            JSON.stringify({ error: 'Error al crear donación' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            donationId: donation.id,
            btcAddress: entity.btc_address,
            btcAmount: btcAmount.toFixed(8),
            eurAmount: amount,
            btcPrice,
            entityName: entity.name,
            instructions: [
              '1. Copia la dirección BTC',
              '2. Envía el monto desde tu wallet',
              '3. Copia el TX ID de la transacción',
              '4. Vuelve aquí para verificar'
            ],
            message: `Envía ${btcAmount.toFixed(8)} BTC directamente a ${entity.name}. Los fondos llegarán directamente a su wallet.`
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'verify': {
        // Verificar transacción BTC
        const { txId } = body;

        if (!txId) {
          return new Response(
            JSON.stringify({ error: 'txId requerido' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Buscar donación pendiente para esta entidad y este TX
        const { data: donation, error: donationError } = await supabase
          .from('entity_donations')
          .select('*')
          .eq('entity_id', entityId)
          .eq('status', 'pending')
          .is('tx_id', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (donationError || !donation) {
          // Puede que ya esté verificada - buscar por TX ID
          const { data: existingDonation } = await supabase
            .from('entity_donations')
            .select('*')
            .eq('tx_id', txId)
            .single();

          if (existingDonation) {
            return new Response(
              JSON.stringify({
                success: true,
                alreadyVerified: true,
                status: existingDonation.status,
                message: 'Esta transacción ya ha sido verificada'
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ error: 'No hay donación pendiente para verificar' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Verificar transacción en blockchain
        const verification = await verifyBtcTransaction(
          txId,
          entity.btc_address,
          donation.btc_amount
        );

        if (!verification.valid) {
          return new Response(
            JSON.stringify({
              success: false,
              error: verification.error,
              confirmations: verification.confirmations,
              actualAmount: verification.actualAmount
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Para donaciones P2P: marcar directamente como 'released' (ya están en la wallet de la entidad)
        await supabase
          .from('entity_donations')
          .update({
            status: 'released', // Directo a released porque es P2P
            tx_id: txId,
            paid_at: new Date().toISOString(),
            released_at: new Date().toISOString(),
            metadata: {
              ...donation.metadata,
              verification: {
                confirmations: verification.confirmations,
                actualAmount: verification.actualAmount,
                verifiedAt: new Date().toISOString()
              }
            }
          })
          .eq('id', donation.id);

        // Actualizar stats de la entidad
        await supabase
          .from('map_entities')
          .update({
            total_donations_received: (entity.total_donations_received || 0) + donation.amount,
            donation_count: (entity.donation_count || 0) + 1
          })
          .eq('id', entityId);

        // Notificar a la entidad
        await supabase.from('entity_notifications').insert({
          entity_id: entityId,
          type: 'btc_donation_received',
          title: '¡Nueva donación BTC recibida!',
          message: `Has recibido ${verification.actualAmount.toFixed(8)} BTC (~${donation.amount}€) de ${donation.donor_name || 'Anónimo'}. Los fondos ya están en tu wallet.`,
          data: {
            donationId: donation.id,
            btcAmount: verification.actualAmount,
            eurAmount: donation.amount,
            txId,
            message: donation.donor_message
          }
        });

        return new Response(
          JSON.stringify({
            success: true,
            status: 'released',
            confirmations: verification.confirmations,
            btcAmount: verification.actualAmount,
            message: `¡Donación verificada! ${entity.name} ha recibido ${verification.actualAmount.toFixed(8)} BTC directamente en su wallet.`,
            txUrl: `https://blockstream.info/tx/${txId}`
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Acción no válida' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Error in direct-btc-donation:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
