import { Body, Container, Head, Heading, Html, Preview, Section, Text, Button } from '@react-email/components'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface SubscriptionExpirationEmailProps {
  businessName: string
  planName: string
  expirationDate: Date
  renewalAmount: number
  daysRemaining: number
}

export function SubscriptionExpirationEmail({ businessName, planName, expirationDate, renewalAmount, daysRemaining }: SubscriptionExpirationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`Tu suscripción vence en ${daysRemaining} días - VendiMax`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>⏰ Tu suscripción está próxima a vencer</Heading>
          <Text style={text}>Hola <strong>{businessName}</strong>,</Text>
          <Text style={text}>Tu plan <strong>{planName}</strong> vence en <strong>{daysRemaining} días</strong>.</Text>
          <Section style={alertBox}>
            <Text style={alertTitle}>Fecha de vencimiento</Text>
            <Text style={alertText}>{format(expirationDate, "d 'de' MMMM 'de' yyyy", { locale: es })}</Text>
          </Section>
          <Section style={box}>
            <Text style={boxText}>Para renovar tu suscripción, el monto a abonar es:</Text>
            <Text style={priceText}>${renewalAmount.toLocaleString('es-AR')}</Text>
          </Section>
          <Section style={buttonContainer}>
            <Button style={button} href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/suscripcion`}>Renovar Ahora</Button>
          </Section>
          <Text style={text}>Si no renovás antes del vencimiento, tu cuenta será suspendida y perderás acceso a todas las funcionalidades.</Text>
          <Text style={footer}>Si tenés dudas, contactanos.<br />Equipo de VendiMax</Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = { backgroundColor: '#f6f9fc', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' }
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 0 48px', marginBottom: '64px' }
const box = { padding: '24px', backgroundColor: '#f9fafb', borderRadius: '8px', margin: '20px 24px', textAlign: 'center' as const }
const alertBox = { padding: '24px', backgroundColor: '#fee2e2', borderRadius: '8px', margin: '20px 24px', border: '1px solid #ef4444', textAlign: 'center' as const }
const h1 = { color: '#1a1a1a', fontSize: '24px', fontWeight: '600', margin: '0 0 20px', padding: '0 24px' }
const text = { color: '#525252', fontSize: '14px', lineHeight: '24px', margin: '0 0 10px', padding: '0 24px' }
const alertTitle = { color: '#991b1b', fontSize: '14px', fontWeight: '600', margin: '0 0 8px' }
const alertText = { color: '#dc2626', fontSize: '18px', fontWeight: '600', margin: '0' }
const boxText = { color: '#525252', fontSize: '14px', margin: '0 0 12px' }
const priceText = { color: '#1a1a1a', fontSize: '32px', fontWeight: '700', margin: '0' }
const buttonContainer = { textAlign: 'center' as const, margin: '32px 0' }
const button = { backgroundColor: '#ef4444', borderRadius: '8px', color: '#fff', fontSize: '16px', fontWeight: '600', textDecoration: 'none', textAlign: 'center' as const, display: 'inline-block', padding: '14px 32px' }
const footer = { color: '#737373', fontSize: '12px', lineHeight: '16px', margin: '20px 0 0', padding: '0 24px' }
