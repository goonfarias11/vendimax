import { Resend } from 'resend'
import { 
  SubscriptionCreatedEmail,
  SetupFeePendingEmail,
  SetupFeeConfirmedEmail,
  MonthlyPaymentApprovedEmail,
  AnnualPaymentApprovedEmail,
  PriceAdjustmentWarningEmail,
  SubscriptionExpirationEmail,
  AddonActivatedEmail,
  AddonDeactivatedEmail
} from '@/emails'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailOptions {
  to: string
  subject: string
  react: React.ReactElement
}

async function sendEmail({ to, subject, react }: EmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY no configurado. Email no enviado:', { to, subject })
    return { success: false, error: 'API key not configured' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'VendiMax <notificaciones@vendimax.com>',
      to,
      subject,
      react
    })

    if (error) {
      console.error('❌ Error enviando email:', error)
      return { success: false, error }
    }

    console.log('✅ Email enviado exitosamente:', data)
    return { success: true, data }
  } catch (error) {
    console.error('❌ Error crítico enviando email:', error)
    return { success: false, error }
  }
}

// 1. Email de suscripción creada
export async function sendSubscriptionCreatedEmail(data: {
  to: string
  businessName: string
  planName: string
  planPrice: number
  cycle: 'monthly' | 'yearly'
  addons: { name: string; price: number }[]
  total: number
  setupFeeAmount: number
}) {
  return sendEmail({
    to: data.to,
    subject: `¡Bienvenido a VendiMax! - Plan ${data.planName}`,
    react: SubscriptionCreatedEmail(data)
  })
}

// 2. Email de Setup Fee pendiente
export async function sendSetupFeePendingEmail(data: {
  to: string
  businessName: string
  setupFeeAmount: number
  paymentLink: string
}) {
  return sendEmail({
    to: data.to,
    subject: 'Completá tu suscripción - Pago inicial pendiente',
    react: SetupFeePendingEmail(data)
  })
}

// 3. Email de Setup Fee confirmado
export async function sendSetupFeeConfirmedEmail(data: {
  to: string
  businessName: string
  planName: string
  setupFeeAmount: number
  activationDate: Date
}) {
  return sendEmail({
    to: data.to,
    subject: '✅ ¡Tu suscripción está activa!',
    react: SetupFeeConfirmedEmail(data)
  })
}

// 4. Email de pago mensual aprobado
export async function sendMonthlyPaymentApprovedEmail(data: {
  to: string
  businessName: string
  planName: string
  amount: number
  paymentDate: Date
  nextPaymentDate: Date
  invoiceUrl?: string
}) {
  return sendEmail({
    to: data.to,
    subject: 'Pago mensual procesado exitosamente',
    react: MonthlyPaymentApprovedEmail(data)
  })
}

// 5. Email de pago anual aprobado
export async function sendAnnualPaymentApprovedEmail(data: {
  to: string
  businessName: string
  planName: string
  amount: number
  paymentDate: Date
  nextPaymentDate: Date
  discount: number
  invoiceUrl?: string
}) {
  return sendEmail({
    to: data.to,
    subject: 'Pago anual procesado - ¡Gracias por tu confianza!',
    react: AnnualPaymentApprovedEmail(data)
  })
}

// 6. Email de aviso de ajuste de precio (7 días antes)
export async function sendPriceAdjustmentWarningEmail(data: {
  to: string
  businessName: string
  planName: string
  currentPrice: number
  newPrice: number
  increasePercentage: number
  effectiveDate: Date
  reason: string
}) {
  return sendEmail({
    to: data.to,
    subject: 'Aviso: Ajuste de precio por IPC',
    react: PriceAdjustmentWarningEmail(data)
  })
}

// 7. Email de suscripción próxima a vencer
export async function sendSubscriptionExpirationEmail(data: {
  to: string
  businessName: string
  planName: string
  expirationDate: Date
  renewalAmount: number
  daysRemaining: number
}) {
  return sendEmail({
    to: data.to,
    subject: `Tu suscripción vence en ${data.daysRemaining} días`,
    react: SubscriptionExpirationEmail(data)
  })
}

// 8. Email de addon activado
export async function sendAddonActivatedEmail(data: {
  to: string
  businessName: string
  addonName: string
  addonPrice: number
  activationDate: Date
}) {
  return sendEmail({
    to: data.to,
    subject: `Addon activado: ${data.addonName}`,
    react: AddonActivatedEmail(data)
  })
}

// 9. Email de addon desactivado
export async function sendAddonDeactivatedEmail(data: {
  to: string
  businessName: string
  addonName: string
  deactivationDate: Date
}) {
  return sendEmail({
    to: data.to,
    subject: `Addon desactivado: ${data.addonName}`,
    react: AddonDeactivatedEmail(data)
  })
}
