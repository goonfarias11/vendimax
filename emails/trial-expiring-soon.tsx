import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface TrialExpiringSoonEmailProps {
  name: string
  daysRemaining: number
  planName: string
  monthlyPrice: number
  subscriptionUrl: string
}

export const TrialExpiringSoonEmail = ({
  name = 'Usuario',
  daysRemaining = 3,
  planName = 'PYME',
  monthlyPrice = 14990,
  subscriptionUrl = 'https://vendimax.com/dashboard/suscripcion',
}: TrialExpiringSoonEmailProps) => (
  <Html>
    <Head />
    <Preview>{`Tu prueba gratuita expira en ${daysRemaining} días`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>⏰ Tu prueba gratuita está por expirar</Heading>
        
        <Text style={text}>Hola {name},</Text>
        
        <Text style={text}>
          Tu prueba gratuita de <strong>7 días del plan {planName}</strong> expira en{' '}
          <strong style={highlight}>{daysRemaining} días</strong>.
        </Text>

        <Section style={warningBox}>
          <Text style={warningText}>
            📅 Después de que expire tu prueba, tu cuenta será degradada al plan FREE
            con funcionalidades limitadas.
          </Text>
        </Section>

        <Text style={text}>
          Para continuar disfrutando de todas las funcionalidades del plan {planName}:
        </Text>

        <ul style={list}>
          <li>✓ Hasta 5,000 productos</li>
          <li>✓ 10,000 ventas por mes</li>
          <li>✓ Reportes avanzados</li>
          <li>✓ Múltiples usuarios</li>
          <li>✓ Soporte prioritario</li>
        </ul>

        <Section style={priceBox}>
          <Text style={priceText}>
            Solo <strong style={price}>${monthlyPrice.toLocaleString('es-AR')}/mes</strong>
          </Text>
        </Section>

        <Section style={buttonContainer}>
          <Button style={button} href={subscriptionUrl}>
            Suscribirme Ahora
          </Button>
        </Section>

        <Hr style={hr} />

        <Text style={footer}>
          ¿Tienes preguntas? Contáctanos en{' '}
          <Link href="mailto:soportevendimax@gmail.com" style={link}>
            soportevendimax@gmail.com
          </Link>
        </Text>

        <Text style={footer}>
          VendiMax - Sistema de Gestión para Tu Negocio
        </Text>
      </Container>
    </Body>
  </Html>
)

export default TrialExpiringSoonEmail

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '30px 0',
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 40px',
}

const highlight = {
  color: '#f59e0b',
  fontWeight: 'bold',
}

const warningBox = {
  backgroundColor: '#fef3c7',
  borderLeft: '4px solid #f59e0b',
  margin: '20px 40px',
  padding: '16px',
}

const warningText = {
  color: '#92400e',
  fontSize: '14px',
  lineHeight: '24px',
  margin: 0,
}

const list = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 40px',
}

const priceBox = {
  backgroundColor: '#dbeafe',
  borderRadius: '8px',
  margin: '20px 40px',
  padding: '20px',
  textAlign: 'center' as const,
}

const priceText = {
  fontSize: '18px',
  margin: 0,
  color: '#333',
}

const price = {
  color: '#2563eb',
  fontSize: '32px',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '40px 40px',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
  margin: '8px 0',
}

const link = {
  color: '#2563eb',
  textDecoration: 'underline',
}
