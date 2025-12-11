import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface AddonActivatedEmailProps {
  businessName: string
  addonName: string
  addonPrice: number
  activationDate: Date
}

export function AddonActivatedEmail({ businessName, addonName, addonPrice, activationDate }: AddonActivatedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`Addon activado: ${addonName} - VendiMax`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>✅ Addon activado exitosamente</Heading>
          <Text style={text}>Hola <strong>{businessName}</strong>,</Text>
          <Text style={text}>El addon <strong>{addonName}</strong> ha sido activado en tu cuenta.</Text>
          <Section style={successBox}>
            <Text style={successTitle}>{addonName}</Text>
            <Text style={successText}>Activo desde {format(activationDate, "d 'de' MMMM", { locale: es })}</Text>
            <Text style={successText}>+${addonPrice.toLocaleString('es-AR')}/mes</Text>
          </Section>
          <Text style={text}>Ya podés comenzar a usar las funcionalidades de este addon. El cargo se sumará a tu próxima factura mensual.</Text>
          <Text style={footer}>Equipo de VendiMax</Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = { backgroundColor: '#f6f9fc', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' }
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 0 48px', marginBottom: '64px' }
const successBox = { padding: '24px', backgroundColor: '#dcfce7', borderRadius: '8px', margin: '20px 24px', border: '1px solid #22c55e', textAlign: 'center' as const }
const h1 = { color: '#1a1a1a', fontSize: '24px', fontWeight: '600', margin: '0 0 20px', padding: '0 24px' }
const text = { color: '#525252', fontSize: '14px', lineHeight: '24px', margin: '0 0 10px', padding: '0 24px' }
const successTitle = { color: '#15803d', fontSize: '18px', fontWeight: '600', margin: '0 0 8px' }
const successText = { color: '#166534', fontSize: '14px', margin: '4px 0' }
const footer = { color: '#737373', fontSize: '12px', lineHeight: '16px', margin: '20px 0 0', padding: '0 24px' }
