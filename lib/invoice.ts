// lib/invoice.ts
import PDFDocument from 'pdfkit'
import QRCode from 'qrcode'
import { prisma } from './prisma'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface InvoiceData {
  paymentId: string
  businessName: string
  businessTaxId?: string
  businessAddress?: string
  businessEmail?: string
  planName: string
  amount: number
  tax: number
  subtotal: number
  paymentDate: Date
  invoiceNumber: string
  items: {
    description: string
    quantity: number
    unitPrice: number
    total: number
  }[]
}

export async function generateInvoicePDF(paymentId: string): Promise<Buffer> {
  try {
    // Obtener datos del pago
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        subscription: {
          include: {
            plan: true,
            business: true,
            subscriptionAddons: {
              include: {
                addon: true
              }
            }
          }
        }
      }
    })

    if (!payment) {
      throw new Error('Pago no encontrado')
    }

    const { subscription } = payment
    const { business, plan, subscriptionAddons } = subscription

    // Calcular montos
    const subtotal = Number(payment.amount) / 1.21 // Sin IVA
    const tax = Number(payment.amount) - subtotal // IVA 21%

    // Construir items de la factura
    const items: InvoiceData['items'] = []

    // Item del plan
    const planPrice = subscription.billingCycle === 'yearly' 
      ? Number(subscription.priceYearly) 
      : Number(subscription.priceMonthly)
    
    items.push({
      description: `Plan ${plan.name} - ${subscription.billingCycle === 'yearly' ? 'Anual' : 'Mensual'}`,
      quantity: 1,
      unitPrice: planPrice,
      total: planPrice
    })

    // Items de addons
    subscriptionAddons.forEach(addonSub => {
      items.push({
        description: `Addon: ${addonSub.addon.name}`,
        quantity: 1,
        unitPrice: Number(addonSub.price),
        total: Number(addonSub.price)
      })
    })

    // Generar número de factura si no existe
    const invoiceNumber = payment.invoiceNumber || `VDM-${Date.now()}-${payment.id.slice(0, 8).toUpperCase()}`

    // Actualizar número de factura en el pago
    if (!payment.invoiceNumber) {
      await prisma.payment.update({
        where: { id: paymentId },
        data: { invoiceNumber }
      })
    }

    const invoiceData: InvoiceData = {
      paymentId: payment.id,
      businessName: business.name,
      businessTaxId: business.taxId || undefined,
      businessAddress: business.address || undefined,
      businessEmail: business.email,
      planName: plan.name,
      amount: Number(payment.amount),
      tax,
      subtotal,
      paymentDate: payment.paidAt || payment.createdAt,
      invoiceNumber,
      items
    }

    // Generar PDF
    return await createPDFBuffer(invoiceData)

  } catch (error) {
    console.error('Error generando factura PDF:', error)
    throw error
  }
}

async function createPDFBuffer(data: InvoiceData): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' })
      const chunks: Buffer[] = []

      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // Header
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('FACTURA', 50, 50)
        .fontSize(10)
        .font('Helvetica')
        .text(`Nº ${data.invoiceNumber}`, 50, 75)

      // Info de VendiMax (emisor)
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('VendiMax', 400, 50)
        .fontSize(9)
        .font('Helvetica')
        .text('Sistema de Gestión POS', 400, 68)
        .text('CUIT: 00-00000000-0', 400, 82)
        .text('vendimax.com', 400, 96)
        .text('info@vendimax.com', 400, 110)

      // Línea separadora
      doc
        .moveTo(50, 130)
        .lineTo(550, 130)
        .stroke()

      // Info del cliente
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('CLIENTE', 50, 150)
        .fontSize(9)
        .font('Helvetica')
        .text(data.businessName, 50, 170)

      if (data.businessTaxId) {
        doc.text(`CUIT: ${data.businessTaxId}`, 50, 185)
      }

      if (data.businessAddress) {
        doc.text(data.businessAddress, 50, 200)
      }

      if (data.businessEmail) {
        doc.text(data.businessEmail, 50, 215)
      }

      // Fecha
      doc
        .fontSize(9)
        .text(`Fecha: ${format(data.paymentDate, "d 'de' MMMM 'de' yyyy", { locale: es })}`, 400, 150)
        .text(`Tipo: Factura C`, 400, 165)

      // Tabla de items
      const tableTop = 260
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('DETALLE', 50, tableTop)

      // Headers de tabla
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('Descripción', 50, tableTop + 25)
        .text('Cant.', 340, tableTop + 25)
        .text('Precio Unit.', 390, tableTop + 25)
        .text('Total', 490, tableTop + 25)

      // Línea bajo headers
      doc
        .moveTo(50, tableTop + 40)
        .lineTo(550, tableTop + 40)
        .stroke()

      // Items
      let yPosition = tableTop + 50
      doc.font('Helvetica')

      data.items.forEach((item, index) => {
        if (yPosition > 700) {
          doc.addPage()
          yPosition = 50
        }

        doc
          .fontSize(9)
          .text(item.description, 50, yPosition, { width: 280 })
          .text(item.quantity.toString(), 340, yPosition)
          .text(`$${item.unitPrice.toLocaleString('es-AR')}`, 390, yPosition)
          .text(`$${item.total.toLocaleString('es-AR')}`, 490, yPosition)

        yPosition += 25
      })

      // Línea antes de totales
      yPosition += 10
      doc
        .moveTo(340, yPosition)
        .lineTo(550, yPosition)
        .stroke()

      // Totales
      yPosition += 15
      doc
        .fontSize(9)
        .font('Helvetica')
        .text('Subtotal:', 390, yPosition)
        .text(`$${data.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 490, yPosition)

      yPosition += 20
      doc
        .text('IVA (21%):', 390, yPosition)
        .text(`$${data.tax.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 490, yPosition)

      yPosition += 20
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('TOTAL:', 390, yPosition)
        .text(`$${data.amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 490, yPosition)

      // QR Code (placeholder AFIP)
      yPosition += 40
      try {
        const qrData = `https://vendimax.com/factura/${data.invoiceNumber}`
        const qrImage = await QRCode.toDataURL(qrData, { width: 100 })
        
        doc
          .fontSize(8)
          .font('Helvetica')
          .text('Código QR AFIP', 50, yPosition)
        
        doc.image(qrImage, 50, yPosition + 15, { width: 100 })

        doc
          .fontSize(7)
          .text('(Placeholder - Integrar con AFIP en producción)', 50, yPosition + 120, { width: 150 })

      } catch (qrError) {
        console.error('Error generando QR:', qrError)
      }

      // Footer
      doc
        .fontSize(7)
        .font('Helvetica')
        .text(
          'Este comprobante es válido como factura. Conservelo para sus registros contables.',
          50,
          750,
          { align: 'center', width: 500 }
        )

      doc.end()

    } catch (error) {
      reject(error)
    }
  })
}
