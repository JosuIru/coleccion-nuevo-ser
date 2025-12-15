/**
 * Email Templates for Coleccion Nuevo Ser
 * Simple, compatible HTML email templates with inline styles
 */

export interface TemplateData {
    userName?: string;
    userEmail?: string;
    tier?: string;
    credits?: number;
    daysRemaining?: number;
    appUrl?: string;
    [key: string]: unknown;
}

// Base template wrapper - Email compatible with inline styles
function baseTemplate(content: string, preheader: string = ''): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Colección Nuevo Ser</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f5;">
    <!-- Preheader -->
    <div style="display: none; max-height: 0; overflow: hidden;">${preheader}</div>

    <!-- Main container -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #1e293b; padding: 30px; text-align: center;">
                            <h1 style="margin: 0; color: #f59e0b; font-size: 24px;">✨ Colección Nuevo Ser</h1>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px; color: #334155; font-size: 16px; line-height: 1.6;">
                            ${content}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0; color: #64748b; font-size: 14px;">
                                Este email fue enviado por Colección Nuevo Ser
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
}

// Welcome email template
export function welcomeTemplate(data: TemplateData): { subject: string; html: string } {
    const content = `
        <h2 style="margin: 0 0 20px 0; color: #1e293b; font-size: 22px;">¡Bienvenido${data.userName ? `, ${data.userName}` : ''}! 🎉</h2>

        <p style="margin: 0 0 16px 0; color: #475569;">
            Gracias por unirte a nuestra comunidad de exploradores de la consciencia.
            Tu cuenta ha sido creada exitosamente.
        </p>

        <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0 0 12px 0; color: #1e40af; font-weight: bold;">¿Qué puedes hacer ahora?</p>
            <ul style="margin: 0; padding-left: 20px; color: #334155;">
                <li style="margin-bottom: 8px;">📚 Explorar nuestra colección de libros</li>
                <li style="margin-bottom: 8px;">🧘 Acceder a ejercicios y meditaciones</li>
                <li style="margin-bottom: 8px;">🎮 Descubrir el Laboratorio Frankenstein</li>
                <li style="margin-bottom: 0;">✨ Usar características de IA (Premium)</li>
            </ul>
        </div>

        <p style="text-align: center; margin: 30px 0;">
            <a href="${data.appUrl || 'https://nuevosser.com'}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                Comenzar a Explorar
            </a>
        </p>

        <p style="margin: 0; color: #475569;">
            ¡Estamos aquí para ayudarte en tu viaje de despertar!
        </p>

        <p style="margin: 24px 0 0 0; color: #64748b;">
            Con amor y luz,<br>
            <strong style="color: #334155;">El equipo de Nuevo Ser</strong>
        </p>
    `;

    return {
        subject: '¡Bienvenido a Colección Nuevo Ser! ✨',
        html: baseTemplate(content, 'Tu cuenta ha sido creada exitosamente')
    };
}

// Payment success template
export function paymentSuccessTemplate(data: TemplateData): { subject: string; html: string } {
    const tierName = data.tier === 'pro' ? 'Pro' : 'Premium';
    const credits = data.tier === 'pro' ? 2000 : 500;

    const content = `
        <h2 style="margin: 0 0 20px 0; color: #1e293b; font-size: 22px;">¡Pago Confirmado! 🎉</h2>

        <p style="margin: 0 0 16px 0; color: #475569;">
            Hola${data.userName ? ` ${data.userName}` : ''},
        </p>

        <p style="margin: 0 0 16px 0; color: #475569;">
            Tu suscripción <strong style="color: #1e293b;">${tierName}</strong> ha sido activada exitosamente.
            ¡Gracias por apoyar nuestro proyecto!
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
            <tr>
                <td width="50%" style="text-align: center; padding: 20px; background-color: #f0fdf4; border-radius: 8px 0 0 8px;">
                    <div style="font-size: 28px; font-weight: bold; color: #16a34a;">${tierName}</div>
                    <div style="font-size: 14px; color: #64748b; margin-top: 4px;">Tu Plan</div>
                </td>
                <td width="50%" style="text-align: center; padding: 20px; background-color: #fef3c7; border-radius: 0 8px 8px 0;">
                    <div style="font-size: 28px; font-weight: bold; color: #d97706;">${credits}</div>
                    <div style="font-size: 14px; color: #64748b; margin-top: 4px;">Créditos IA/mes</div>
                </td>
            </tr>
        </table>

        <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0 0 12px 0; color: #1e40af; font-weight: bold;">Características incluidas:</p>
            <ul style="margin: 0; padding-left: 20px; color: #334155;">
                <li style="margin-bottom: 8px;">💬 Chat IA contextual sobre libros</li>
                <li style="margin-bottom: 8px;">📝 Quiz personalizados</li>
                <li style="margin-bottom: 8px;">📖 Resúmenes de capítulos</li>
                <li style="margin-bottom: ${data.tier === 'pro' ? '8px' : '0'};">💪 Ejercicios personalizados</li>
                ${data.tier === 'pro' ? `
                <li style="margin-bottom: 8px;">🎮 Game Master IA</li>
                <li style="margin-bottom: 8px;">🗺️ Misiones dinámicas</li>
                <li style="margin-bottom: 0;">📖 Narrativa adaptativa</li>
                ` : ''}
            </ul>
        </div>

        <p style="text-align: center; margin: 30px 0;">
            <a href="${data.appUrl || 'https://nuevosser.com'}" style="display: inline-block; background-color: #16a34a; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                Usar Mis Créditos IA
            </a>
        </p>

        <p style="margin: 0; color: #64748b; font-size: 14px;">
            Tus créditos se renuevan automáticamente cada mes.
        </p>
    `;

    return {
        subject: `✅ Suscripción ${tierName} Activada`,
        html: baseTemplate(content, `Tu plan ${tierName} está listo`)
    };
}

// Low credits warning template
export function lowCreditsTemplate(data: TemplateData): { subject: string; html: string } {
    const content = `
        <h2 style="margin: 0 0 20px 0; color: #1e293b; font-size: 22px;">⚠️ Créditos IA Bajos</h2>

        <p style="margin: 0 0 16px 0; color: #475569;">
            Hola${data.userName ? ` ${data.userName}` : ''},
        </p>

        <p style="margin: 0 0 16px 0; color: #475569;">
            Te escribimos para informarte que tus créditos de IA están por agotarse.
        </p>

        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0 0 12px 0; color: #92400e; font-weight: bold;">Estado de tu cuenta:</p>
            <ul style="margin: 0; padding-left: 20px; color: #78350f;">
                <li style="margin-bottom: 8px;">Créditos restantes: <strong>${data.credits || 0}</strong></li>
                <li style="margin-bottom: 0;">Se renuevan en: <strong>${data.daysRemaining || 0} días</strong></li>
            </ul>
        </div>

        <p style="margin: 0 0 16px 0; color: #475569;">
            Puedes seguir usando la aplicación normalmente. Tus créditos se renovarán
            automáticamente al inicio del próximo período de facturación.
        </p>

        <p style="text-align: center; margin: 30px 0;">
            <a href="${data.appUrl || 'https://nuevosser.com'}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                Ver Mi Cuenta
            </a>
        </p>
    `;

    return {
        subject: '⚠️ Tus créditos IA están bajos',
        html: baseTemplate(content, 'Tus créditos de IA están por agotarse')
    };
}

// Renewal reminder template
export function renewalReminderTemplate(data: TemplateData): { subject: string; html: string } {
    const content = `
        <h2 style="margin: 0 0 20px 0; color: #1e293b; font-size: 22px;">📅 Recordatorio de Renovación</h2>

        <p style="margin: 0 0 16px 0; color: #475569;">
            Hola${data.userName ? ` ${data.userName}` : ''},
        </p>

        <p style="margin: 0 0 16px 0; color: #475569;">
            Te recordamos que tu suscripción se renovará pronto.
        </p>

        <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0 0 12px 0; color: #1e40af; font-weight: bold;">Detalles de tu suscripción:</p>
            <ul style="margin: 0; padding-left: 20px; color: #334155;">
                <li style="margin-bottom: 8px;">Plan actual: <strong>${data.tier === 'pro' ? 'Pro' : 'Premium'}</strong></li>
                <li style="margin-bottom: 0;">Se renueva en: <strong>${data.daysRemaining || 0} días</strong></li>
            </ul>
        </div>

        <p style="margin: 0 0 16px 0; color: #475569;">
            No necesitas hacer nada. Tu suscripción se renovará automáticamente
            y tus créditos serán recargados.
        </p>

        <p style="text-align: center; margin: 30px 0;">
            <a href="${data.appUrl || 'https://nuevosser.com'}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                Administrar Suscripción
            </a>
        </p>
    `;

    return {
        subject: '📅 Tu suscripción se renueva pronto',
        html: baseTemplate(content, 'Recordatorio de renovación de suscripción')
    };
}

// Get template by name
export function getTemplate(
    templateName: string,
    data: TemplateData
): { subject: string; html: string } | null {
    const templates: Record<string, (data: TemplateData) => { subject: string; html: string }> = {
        'welcome': welcomeTemplate,
        'payment-success': paymentSuccessTemplate,
        'low-credits': lowCreditsTemplate,
        'renewal-reminder': renewalReminderTemplate
    };

    const templateFn = templates[templateName];
    if (!templateFn) return null;

    return templateFn(data);
}
