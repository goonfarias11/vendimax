import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface PasswordResetEmailProps {
  name: string
  resetUrl: string
}

export const PasswordResetEmail = ({
  name = 'Usuario',
  resetUrl = 'https://vendimax.com/reset-password?token=xxx',
}: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Recuperá tu contraseña de VendiMax</Preview>
    <Body style={{ backgroundColor: '#f4f4f5', fontFamily: 'sans-serif' }}>
      <Container style={{ maxWidth: '480px', margin: '40px auto', backgroundColor: '#ffffff', borderRadius: '8px', padding: '40px' }}>
        <Heading style={{ color: '#18181b', fontSize: '22px', marginBottom: '8px' }}>
          Recuperación de contraseña
        </Heading>
        <Text style={{ color: '#52525b', fontSize: '15px', lineHeight: '1.6' }}>
          Hola {name}, recibimos una solicitud para restablecer la contraseña de tu cuenta en VendiMax.
        </Text>
        <Section style={{ textAlign: 'center', margin: '32px 0' }}>
          <Button
            href={resetUrl}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              padding: '12px 28px',
              borderRadius: '6px',
              fontSize: '15px',
              fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            Restablecer contraseña
          </Button>
        </Section>
        <Text style={{ color: '#71717a', fontSize: '13px' }}>
          Este enlace expira en <strong>1 hora</strong>. Si no solicitaste este cambio, podés ignorar este email.
        </Text>
        <Hr style={{ borderColor: '#e4e4e7', margin: '24px 0' }} />
        <Text style={{ color: '#a1a1aa', fontSize: '12px' }}>
          VendiMax · Si el botón no funciona, copiá este link: {resetUrl}
        </Text>
      </Container>
    </Body>
  </Html>
)

export default PasswordResetEmail
