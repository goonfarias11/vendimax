import { Body, Container, Head, Heading, Html, Preview, Section, Text, Button } from '@react-email/components'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface MonthlyPaymentApprovedEmailProps {
  businessName: string
  planName: string
  amount: number
  paymentDate: Date
  nextPaymentDate: Date
  invoiceUrl?: string
}

export function MonthlyPaymentApprovedEmail({ businessName, planName, amount, paymentDate, nextPaymentDate, invoiceUrl }: MonthlyPaymentApprovedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Pago mensual procesado - VendiMax</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>✅ Pago procesado exitosamente</Heading>
          <Text style={text}>Hola <strong>{businessName}</strong>,</Text>
          <Text style={text}>Tu pago mensual de <strong>${amount.toLocaleString('es-AR')}</strong> ha sido procesado.</Text>
          <Section style={box}>
            <Text style={lineItem}>Plan: <strong>{planName}</strong></Text>
            <Text style={lineItem}>Monto: ${amount.toLocaleString('es-AR')}</Text>
            <Text style={lineItem}>Fecha de pago: {format(paymentDate, "d 'de' MMMM", { locale: es })}</Text>
            <Text style={lineItem}>Próximo pago: {format(nextPaymentDate, "d 'de' MMMM 'de' yyyy", { locale: es })}</Text>
          </Section>
          {invoiceUrl && (
            <Section style={buttonContainer}>
              <Button style={button} href={invoiceUrl}>Descargar Factura</Button>
            </Section>
          )}
          <Text style={footer}>Gracias por confiar en VendiMax<br />Equipo de VendiMax</Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = { backgroundColor: '#f6f9fc', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' }
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 0 48px', marginBottom: '64px' }
const box = { padding: '24px', backgroundColor: '#f9fafb', borderRadius: '8px', margin: '20px 24px' }
const h1 = { color: '#1a1a1a', fontSize: '24px', fontWeight: '600', margin: '0 0 20px', padding: '0 24px' }
const text = { color: '#525252', fontSize: '14px', lineHeight: '24px', margin: '0 0 10px', padding: '0 24px' }
const lineItem = { color: '#525252', fontSize: '14px', lineHeight: '24px', margin: '4px 0' }
const buttonContainer = { textAlign: 'center' as const, margin: '32px 0' }
const button = { backgroundColor: '#3b82f6', borderRadius: '8px', color: '#fff', fontSize: '16px', fontWeight: '600', textDecoration: 'none', textAlign: 'center' as const, display: 'inline-block', padding: '14px 32px' }
const footer = { color: '#737373', fontSize: '12px', lineHeight: '16px', margin: '20px 0 0', padding: '0 24px' }
