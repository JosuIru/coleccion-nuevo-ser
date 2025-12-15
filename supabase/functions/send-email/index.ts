/**
 * Send Email Edge Function
 * Sends transactional emails using Resend API
 *
 * Environment variables required:
 * - RESEND_API_KEY: API key from Resend
 * - EMAIL_FROM: Sender email address
 *
 * @version 1.0.0
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { getTemplate, TemplateData } from './templates.ts';

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
    to: string;
    template: string;
    data?: TemplateData;
    // For custom emails
    subject?: string;
    html?: string;
}

interface ResendResponse {
    id?: string;
    error?: {
        message: string;
        name: string;
    };
}

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Get environment variables
        const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
        const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'Colección Nuevo Ser <noreply@nuevosser.com>';
        const APP_URL = Deno.env.get('APP_URL') || 'https://nuevosser.com';

        if (!RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY not configured');
        }

        // Parse request body
        const body: EmailRequest = await req.json();
        const { to, template, data = {}, subject: customSubject, html: customHtml } = body;

        // Validate required fields
        if (!to) {
            throw new Error('Missing required field: to');
        }

        if (!template && !customHtml) {
            throw new Error('Either template or html must be provided');
        }

        // Prepare email content
        let subject: string;
        let html: string;

        if (template) {
            // Use template
            const templateResult = getTemplate(template, { ...data, appUrl: APP_URL });

            if (!templateResult) {
                throw new Error(`Template not found: ${template}`);
            }

            subject = templateResult.subject;
            html = templateResult.html;
        } else {
            // Use custom content
            if (!customSubject) {
                throw new Error('Subject required for custom emails');
            }
            subject = customSubject;
            html = customHtml!;
        }

        // Send email via Resend
        console.log(`Sending email to ${to} with template: ${template || 'custom'}`);

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: EMAIL_FROM,
                to: [to],
                subject: subject,
                html: html,
            }),
        });

        const result: ResendResponse = await response.json();

        if (!response.ok) {
            console.error('Resend API error:', result);
            throw new Error(result.error?.message || 'Failed to send email');
        }

        console.log(`Email sent successfully. ID: ${result.id}`);

        return new Response(
            JSON.stringify({
                success: true,
                messageId: result.id,
            }),
            {
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json',
                },
                status: 200,
            }
        );
    } catch (error) {
        console.error('Send email error:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            }),
            {
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json',
                },
                status: 400,
            }
        );
    }
});
