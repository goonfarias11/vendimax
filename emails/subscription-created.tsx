import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
  Link
} from '@react-email/components'

interface SubscriptionCreatedEmailProps {
  businessName: string
  planName: string
  planPrice: number
  cycle: 'monthly' | 'yearly'
  addons: { name: string; price: number }[]
  total: number
  setupFeeAmount: number
}

export function SubscriptionCreatedEmail({
  businessName,
  planName,
  planPrice,
  cycle,
  addons,
  total,
  setupFeeAmount
}: SubscriptionCreatedEmailProps) {
  const cycleText = cycle === 'monthly' ? 'Mensual' : 'Anual'
  
  return (
    <Html>
      <Head />
      <Preview>¡Bienvenido a VendiMax! Tu suscripción al plan {planName} ha sido creada.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>¡Bienvenido a VendiMax! 🎉</Heading>
          
          <Text style={text}>
            Hola <strong>{businessName}</strong>,
          </Text>
          
          <Text style={text}>
            Tu suscripción al plan <strong>{planName}</strong> ha sido creada exitosamente.
          </Text>
          
          <Section style={box}>
            <Text style={boxTitle}>Resumen de tu suscripción</Text>
            
            <Text style={lineItem}>
              Plan: <strong>{planName}</strong> - ${planPrice.toLocaleString('es-AR')} / {cycleText}
            </Text>
            
            {addons.length > 0 && (
              <>
                <Hr style={hr} />
                <Text style={boxTitle}>Addons incluidos:</Text>
                {addons.map((addon, index) => (
                  <Text key={index} style={lineItem}>
                    • {addon.name} - ${addon.price.toLocaleString('es-AR')} / mes
                  </Text>
                ))}
              </>
            )}
            
            <Hr style={hr} />
            
            <Text style={lineItem}>
              <strong>Total {cycleText}:</strong> ${total.toLocaleString('es-AR')}
            </Text>
          </Section>
          
          <Section style={alertBox}>
            <Text style={alertText}>
              ⚠️ <strong>Siguiente paso:</strong> Completá el pago inicial de <strong>${setupFeeAmount.toLocaleString('es-AR')}</strong> para activar tu suscripción.
            </Text>
          </Section>
          
          <Text style={text}>
            Una vez confirmado el pago, tu cuenta será activada y podrás comenzar a usar todas las funcionalidades de tu plan.
          </Text>
          
          <Text style={footer}>
            Si tenés alguna duda, contactanos respondiendo este email.
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
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  margin: '20px 0'
}

const alertBox = {
  padding: '16px',
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  margin: '20px 0',
  border: '1px solid #fbbf24'
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

const boxTitle = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '600',
  marginBottom: '12px'
}

const lineItem = {
  color: '#525252',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '4px 0'
}

const alertText = {
  color: '#78350f',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0'
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '16px 0'
}

const footer = {
  color: '#737373',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '20px 0 0',
  padding: '0 24px'
}
