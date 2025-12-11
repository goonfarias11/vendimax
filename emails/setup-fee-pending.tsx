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

interface SetupFeePendingEmailProps {
  businessName: string
  setupFeeAmount: number
  paymentLink: string
}

export function SetupFeePendingEmail({
  businessName,
  setupFeeAmount,
  paymentLink
}: SetupFeePendingEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Completá tu suscripción a VendiMax - Pago inicial pendiente</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>¡Último paso para activar tu cuenta! 🚀</Heading>
          
          <Text style={text}>
            Hola <strong>{businessName}</strong>,
          </Text>
          
          <Text style={text}>
            Para activar tu suscripción, completá el pago inicial de <strong>${setupFeeAmount.toLocaleString('es-AR')}</strong>.
          </Text>
          
          <Section style={box}>
            <Text style={boxText}>
              Este pago único cubre los costos de configuración inicial y onboarding de tu cuenta.
            </Text>
          </Section>
          
          <Section style={buttonContainer}>
            <Button style={button} href={paymentLink}>
              Pagar ahora ${setupFeeAmount.toLocaleString('es-AR')}
            </Button>
          </Section>
          
          <Text style={text}>
            Una vez confirmado el pago, tu cuenta será activada automáticamente y podrás comenzar a usar VendiMax.
          </Text>
          
          <Text style={footer}>
            Si tenés problemas con el pago, contactanos respondiendo este email.
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

const box = {
  padding: '24px',
  backgroundColor: '#eff6ff',
  borderRadius: '8px',
  margin: '20px 24px',
  border: '1px solid #3b82f6'
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

const boxText = {
  color: '#1e40af',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0'
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0'
}

const button = {
  backgroundColor: '#3b82f6',
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
