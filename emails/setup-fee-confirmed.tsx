import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Button
} from '@react-email/components'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface SetupFeeConfirmedEmailProps {
  businessName: string
  planName: string
  setupFeeAmount: number
  activationDate: Date
}

export function SetupFeeConfirmedEmail({
  businessName,
  planName,
  setupFeeAmount,
  activationDate
}: SetupFeeConfirmedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>¡Tu suscripción a VendiMax está activa!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>✅ ¡Tu cuenta está activa!</Heading>
          
          <Text style={text}>
            Hola <strong>{businessName}</strong>,
          </Text>
          
          <Text style={text}>
            Confirmamos que recibimos tu pago de <strong>${setupFeeAmount.toLocaleString('es-AR')}</strong>.
          </Text>
          
          <Section style={successBox}>
            <Text style={successTitle}>Tu plan {planName} ya está activo</Text>
            <Text style={successText}>
              Fecha de activación: {format(activationDate, "d 'de' MMMM 'de' yyyy", { locale: es })}
            </Text>
          </Section>
          
          <Text style={text}>
            Ya podés ingresar a tu panel de control y comenzar a usar todas las funcionalidades de VendiMax.
          </Text>
          
          <Section style={buttonContainer}>
            <Button style={button} href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`}>
              Ir al Dashboard
            </Button>
          </Section>
          
          <Text style={footer}>
            Si necesitás ayuda para comenzar, consultá nuestra documentación o contactanos.
            <br />
            Equipo de VendiMax
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif'
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px'
}

const successBox = {
  padding: '24px',
  backgroundColor: '#dcfce7',
  borderRadius: '8px',
  margin: '20px 24px',
  border: '1px solid #22c55e',
  textAlign: 'center' as const
}

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '40px',
  margin: '0 0 20px',
  padding: '0 24px'
}

const text = {
  color: '#525252',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 10px',
  padding: '0 24px'
}

const successTitle = {
  color: '#15803d',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 8px'
}

const successText = {
  color: '#166534',
  fontSize: '14px',
  margin: '0'
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0'
}

const button = {
  backgroundColor: '#22c55e',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px'
}

const footer = {
  color: '#737373',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '20px 0 0',
  padding: '0 24px'
}
