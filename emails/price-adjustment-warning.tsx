import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface PriceAdjustmentWarningEmailProps {
  businessName: string
  planName: string
  currentPrice: number
  newPrice: number
  increasePercentage: number
  effectiveDate: Date
  reason: string
}

export function PriceAdjustmentWarningEmail({ businessName, planName, currentPrice, newPrice, increasePercentage, effectiveDate, reason }: PriceAdjustmentWarningEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Aviso: Ajuste de precio por IPC - VendiMax</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>📊 Aviso de ajuste de precio</Heading>
          <Text style={text}>Hola <strong>{businessName}</strong>,</Text>
          <Text style={text}>Te informamos que se aplicará un ajuste de precio en tu plan <strong>{planName}</strong>.</Text>
          <Section style={warningBox}>
            <Text style={warningTitle}>Nuevo precio desde {format(effectiveDate, "d 'de' MMMM", { locale: es })}</Text>
            <Text style={warningText}>Precio actual: ${currentPrice.toLocaleString('es-AR')}/mes</Text>
            <Text style={warningText}>Nuevo precio: ${newPrice.toLocaleString('es-AR')}/mes</Text>
            <Text style={warningText}>Aumento: {increasePercentage.toFixed(1)}%</Text>
          </Section>
          <Section style={box}>
            <Text style={boxTitle}>Motivo del ajuste:</Text>
            <Text style={boxText}>{reason}</Text>
          </Section>
          <Text style={text}>Este ajuste se aplicará automáticamente a partir de la fecha indicada. Si tenés un plan anual, este ajuste no te afecta hasta tu próxima renovación.</Text>
          <Text style={footer}>Si tenés consultas, contactanos respondiendo este email.<br />Equipo de VendiMax</Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = { backgroundColor: '#f6f9fc', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' }
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 0 48px', marginBottom: '64px' }
const box = { padding: '24px', backgroundColor: '#f9fafb', borderRadius: '8px', margin: '20px 24px' }
const warningBox = { padding: '24px', backgroundColor: '#fef3c7', borderRadius: '8px', margin: '20px 24px', border: '1px solid #fbbf24' }
const h1 = { color: '#1a1a1a', fontSize: '24px', fontWeight: '600', margin: '0 0 20px', padding: '0 24px' }
const text = { color: '#525252', fontSize: '14px', lineHeight: '24px', margin: '0 0 10px', padding: '0 24px' }
const warningTitle = { color: '#92400e', fontSize: '16px', fontWeight: '600', margin: '0 0 12px' }
const warningText = { color: '#78350f', fontSize: '14px', margin: '4px 0' }
const boxTitle = { color: '#1a1a1a', fontSize: '14px', fontWeight: '600', margin: '0 0 8px' }
const boxText = { color: '#525252', fontSize: '14px', margin: '0' }
const footer = { color: '#737373', fontSize: '12px', lineHeight: '16px', margin: '20px 0 0', padding: '0 24px' }
