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

interface TrialExpiredEmailProps {
  name: string
  planName: string
  monthlyPrice: number
  subscriptionUrl: string
  freePlanLimits: {
    products: number
    sales: number
    users: number
  }
}

export const TrialExpiredEmail = ({
  name = 'Usuario',
  planName = 'PYME',
  monthlyPrice = 14990,
  subscriptionUrl = 'https://vendimax.com/dashboard/suscripcion',
  freePlanLimits = {
    products: 50,
    sales: 100,
    users: 1,
  },
}: TrialExpiredEmailProps) => (
  <Html>
    <Head />
    <Preview>Tu prueba gratuita ha expirado - Continúa con VendiMax</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Tu prueba gratuita ha finalizado</Heading>
        
        <Text style={text}>Hola {name},</Text>
        
        <Text style={text}>
          Tu prueba gratuita de 7 días del plan <strong>{planName}</strong> ha expirado.
        </Text>

        <Section style={infoBox}>
          <Text style={infoTitle}>📦 Plan FREE Activado</Text>
          <Text style={infoText}>
            Tu cuenta ha sido automáticamente cambiada al <strong>Plan FREE</strong> con
            las siguientes limitaciones:
          </Text>
          <ul style={limitsList}>
            <li>Hasta {freePlanLimits.products} productos</li>
            <li>Máximo {freePlanLimits.sales} ventas por mes</li>
            <li>{freePlanLimits.users} usuario</li>
            <li>Reportes básicos</li>
            <li>Sin soporte prioritario</li>
          </ul>
        </Section>

        <Text style={text}>
          <strong>¿Quieres recuperar todas las funcionalidades?</strong>
        </Text>

        <Text style={text}>
          Suscríbete al plan {planName} y vuelve a disfrutar de:
        </Text>

        <ul style={list}>
          <li>✓ Hasta 5,000 productos</li>
          <li>✓ 10,000 ventas por mes</li>
          <li>✓ Usuarios ilimitados</li>
          <li>✓ Reportes avanzados</li>
          <li>✓ Múltiples cajas</li>
          <li>✓ Soporte prioritario</li>
        </ul>

        <Section style={priceBox}>
          <Text style={priceText}>
            Solo <strong style={price}>${monthlyPrice.toLocaleString('es-AR')}/mes</strong>
          </Text>
          <Text style={savingsText}>
            ¡Primera semana con 50% de descuento!
          </Text>
        </Section>

        <Section style={buttonContainer}>
          <Button style={button} href={subscriptionUrl}>
            Suscribirme al Plan {planName}
          </Button>
        </Section>

        <Hr style={hr} />

        <Text style={footer}>
          Si prefieres seguir usando el plan FREE, no necesitas hacer nada.
        </Text>

        <Text style={footer}>
          ¿Tienes preguntas? Contáctanos en{' '}
          <Link href="mailto:soporte@vendimax.com" style={link}>
            soporte@vendimax.com
          </Link>
        </Text>

        <Text style={footer}>
          VendiMax - Sistema de Gestión para Tu Negocio
        </Text>
      </Container>
    </Body>
  </Html>
)

export default TrialExpiredEmail

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

const infoBox = {
  backgroundColor: '#f3f4f6',
  borderLeft: '4px solid #6b7280',
  margin: '20px 40px',
  padding: '16px',
}

const infoTitle = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
}

const infoText = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 8px 0',
}

const limitsList = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '8px 0 0 0',
  paddingLeft: '20px',
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

const savingsText = {
  color: '#059669',
  fontSize: '14px',
  fontWeight: 'bold',
  marginTop: '8px',
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
