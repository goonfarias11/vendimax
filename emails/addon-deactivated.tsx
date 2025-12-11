import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface AddonDeactivatedEmailProps {
  businessName: string
  addonName: string
  deactivationDate: Date
}

export function AddonDeactivatedEmail({ businessName, addonName, deactivationDate }: AddonDeactivatedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`Addon desactivado: ${addonName} - VendiMax`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Addon desactivado</Heading>
          <Text style={text}>Hola <strong>{businessName}</strong>,</Text>
          <Text style={text}>El addon <strong>{addonName}</strong> ha sido desactivado de tu cuenta.</Text>
          <Section style={box}>
            <Text style={boxTitle}>{addonName}</Text>
            <Text style={boxText}>Desactivado el {format(deactivationDate, "d 'de' MMMM 'de' yyyy", { locale: es })}</Text>
          </Section>
          <Text style={text}>Ya no tendrás acceso a las funcionalidades de este addon. Dejará de cobrarse en tu próxima factura.</Text>
          <Text style={text}>Si desactivaste por error, podés reactivarlo desde tu panel de suscripción.</Text>
          <Text style={footer}>Equipo de VendiMax</Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = { backgroundColor: '#f6f9fc', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' }
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 0 48px', marginBottom: '64px' }
const box = { padding: '24px', backgroundColor: '#f3f4f6', borderRadius: '8px', margin: '20px 24px', textAlign: 'center' as const }
const h1 = { color: '#1a1a1a', fontSize: '24px', fontWeight: '600', margin: '0 0 20px', padding: '0 24px' }
const text = { color: '#525252', fontSize: '14px', lineHeight: '24px', margin: '0 0 10px', padding: '0 24px' }
const boxTitle = { color: '#374151', fontSize: '18px', fontWeight: '600', margin: '0 0 8px' }
const boxText = { color: '#6b7280', fontSize: '14px', margin: '0' }
const footer = { color: '#737373', fontSize: '12px', lineHeight: '16px', margin: '20px 0 0', padding: '0 24px' }
