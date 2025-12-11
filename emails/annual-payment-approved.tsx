import { Body, Container, Head, Heading, Html, Preview, Section, Text, Button } from '@react-email/components'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface AnnualPaymentApprovedEmailProps {
  businessName: string
  planName: string
  amount: number
  paymentDate: Date
  nextPaymentDate: Date
  discount: number
  invoiceUrl?: string
}

export function AnnualPaymentApprovedEmail({ businessName, planName, amount, paymentDate, nextPaymentDate, discount, invoiceUrl }: AnnualPaymentApprovedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Pago anual procesado - VendiMax</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>✅ Pago anual confirmado - ¡Gracias! 🎉</Heading>
          <Text style={text}>Hola <strong>{businessName}</strong>,</Text>
          <Text style={text}>Tu pago anual de <strong>${amount.toLocaleString('es-AR')}</strong> ha sido confirmado.</Text>
          <Section style={successBox}>
            <Text style={successText}>¡Ahorraste ${discount.toLocaleString('es-AR')} con el plan anual!</Text>
          </Section>
          <Section style={box}>
            <Text style={lineItem}>Plan: <strong>{planName} - Anual</strong></Text>
            <Text style={lineItem}>Monto: ${amount.toLocaleString('es-AR')}</Text>
            <Text style={lineItem}>Ahorro: ${discount.toLocaleString('es-AR')} (20% OFF)</Text>
            <Text style={lineItem}>Fecha de pago: {format(paymentDate, "d 'de' MMMM", { locale: es })}</Text>
            <Text style={lineItem}>Próxima renovación: {format(nextPaymentDate, "d 'de' MMMM 'de' yyyy", { locale: es })}</Text>
          </Section>
          {invoiceUrl && (
            <Section style={buttonContainer}>
              <Button style={button} href={invoiceUrl}>Descargar Factura</Button>
            </Section>
          )}
          <Text style={text}>Tu precio está congelado por 12 meses. No se aplicarán ajustes por IPC durante este período.</Text>
          <Text style={footer}>Gracias por confiar en VendiMax<br />Equipo de VendiMax</Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = { backgroundColor: '#f6f9fc', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' }
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 0 48px', marginBottom: '64px' }
const box = { padding: '24px', backgroundColor: '#f9fafb', borderRadius: '8px', margin: '20px 24px' }
const successBox = { padding: '16px', backgroundColor: '#dcfce7', borderRadius: '8px', margin: '20px 24px', border: '1px solid #22c55e', textAlign: 'center' as const }
const h1 = { color: '#1a1a1a', fontSize: '24px', fontWeight: '600', margin: '0 0 20px', padding: '0 24px' }
const text = { color: '#525252', fontSize: '14px', lineHeight: '24px', margin: '0 0 10px', padding: '0 24px' }
const successText = { color: '#15803d', fontSize: '16px', fontWeight: '600', margin: '0' }
const lineItem = { color: '#525252', fontSize: '14px', lineHeight: '24px', margin: '4px 0' }
const buttonContainer = { textAlign: 'center' as const, margin: '32px 0' }
const button = { backgroundColor: '#3b82f6', borderRadius: '8px', color: '#fff', fontSize: '16px', fontWeight: '600', textDecoration: 'none', textAlign: 'center' as const, display: 'inline-block', padding: '14px 32px' }
const footer = { color: '#737373', fontSize: '12px', lineHeight: '16px', margin: '20px 0 0', padding: '0 24px' }
