/**
 * Servicio de exportación a Excel
 * Genera reportes profesionales con formato
 */

import ExcelJS from 'exceljs'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

type DecimalLike = number | string | { toString(): string }

type ExportBusiness = {
  name: string
}

type ExportClient = {
  name?: string | null
} | null | undefined

type ExportSale = {
  id: string
  createdAt: Date | string
  client?: ExportClient
  paymentMethod: string
  subtotal: DecimalLike
  discount: DecimalLike
  total: DecimalLike
  status: string
  ticketNumber?: string | number | null
  tax?: DecimalLike | null
}

type ExportCategory = {
  name?: string | null
} | null | undefined

type ExportProduct = {
  sku: string
  name: string
  category?: ExportCategory
  price: DecimalLike
  cost: DecimalLike
  stock?: number | null
  minStock: number
  isActive: boolean
}

export class ExcelExportService {
  /**
   * Exporta ventas a Excel
   */
  async exportSales(sales: ExportSale[], business: ExportBusiness): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Ventas')

    // Configurar propiedades del documento
    workbook.creator = business.name
    workbook.created = new Date()

    // Título
    worksheet.mergeCells('A1:H1')
    const titleCell = worksheet.getCell('A1')
    titleCell.value = `Reporte de Ventas - ${business.name}`
    titleCell.font = { size: 16, bold: true }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }

    // Fecha de generación
    worksheet.mergeCells('A2:H2')
    const dateCell = worksheet.getCell('A2')
    dateCell.value = `Generado: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}`
    dateCell.alignment = { horizontal: 'center' }

    // Encabezados
    worksheet.addRow([])
    const headerRow = worksheet.addRow([
      'ID',
      'Fecha',
      'Cliente',
      'Método de Pago',
      'Subtotal',
      'Descuento',
      'Total',
      'Estado',
    ])

    // Estilo de encabezados
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      }
    })

    // Datos
    let totalGeneral = 0
    sales.forEach((sale) => {
      const row = worksheet.addRow([
        sale.id,
        format(new Date(sale.createdAt), 'dd/MM/yyyy HH:mm', { locale: es }),
        sale.client?.name || 'N/A',
        sale.paymentMethod,
        Number(sale.subtotal),
        Number(sale.discount),
        Number(sale.total),
        sale.status,
      ])

      // Formato de moneda
      row.getCell(5).numFmt = '"$"#,##0.00'
      row.getCell(6).numFmt = '"$"#,##0.00'
      row.getCell(7).numFmt = '"$"#,##0.00'

      // Bordes
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        }
      })

      totalGeneral += Number(sale.total)
    })

    // Fila de totales
    worksheet.addRow([])
    const totalRow = worksheet.addRow([
      '',
      '',
      '',
      '',
      '',
      'TOTAL:',
      totalGeneral,
      '',
    ])
    totalRow.getCell(6).font = { bold: true }
    totalRow.getCell(7).font = { bold: true }
    totalRow.getCell(7).numFmt = '"$"#,##0.00'
    totalRow.getCell(7).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2EFDA' },
    }

    // Ajustar ancho de columnas
    worksheet.columns = [
      { width: 25 },
      { width: 18 },
      { width: 25 },
      { width: 18 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
    ]

    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(buffer)
  }

  /**
   * Exporta productos a Excel
   */
  async exportProducts(products: ExportProduct[], business: ExportBusiness): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Productos')

    workbook.creator = business.name
    workbook.created = new Date()

    // Título
    worksheet.mergeCells('A1:H1')
    const titleCell = worksheet.getCell('A1')
    titleCell.value = `Listado de Productos - ${business.name}`
    titleCell.font = { size: 16, bold: true }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }

    worksheet.mergeCells('A2:H2')
    const dateCell = worksheet.getCell('A2')
    dateCell.value = `Generado: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}`
    dateCell.alignment = { horizontal: 'center' }

    // Encabezados
    worksheet.addRow([])
    const headerRow = worksheet.addRow([
      'SKU',
      'Nombre',
      'Categoría',
      'Precio',
      'Costo',
      'Stock',
      'Stock Mínimo',
      'Estado',
    ])

    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF70AD47' },
      }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      }
    })

    // Datos
    products.forEach((product) => {
      const row = worksheet.addRow([
        product.sku,
        product.name,
        product.category?.name || 'N/A',
        Number(product.price),
        Number(product.cost),
        product.stock || 0,
        product.minStock,
        product.isActive ? 'Activo' : 'Inactivo',
      ])

      // Formato de moneda
      row.getCell(4).numFmt = '"$"#,##0.00'
      row.getCell(5).numFmt = '"$"#,##0.00'

      // Alerta de stock bajo
      const stock = product.stock ?? 0
      if (stock <= product.minStock) {
        row.getCell(6).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFF0000' },
        }
        row.getCell(6).font = { color: { argb: 'FFFFFFFF' }, bold: true }
      }

      // Bordes
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        }
      })
    })

    // Ajustar ancho de columnas
    worksheet.columns = [
      { width: 15 },
      { width: 30 },
      { width: 20 },
      { width: 12 },
      { width: 12 },
      { width: 10 },
      { width: 15 },
      { width: 12 },
    ]

    const buffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(buffer)
  }

  /**
   * Exporta reporte de IVA
   */
  async exportIVA(sales: ExportSale[], business: ExportBusiness, period: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('IVA')

    workbook.creator = business.name
    workbook.created = new Date()

    // Título
    worksheet.mergeCells('A1:F1')
    const titleCell = worksheet.getCell('A1')
    titleCell.value = `Reporte de IVA - ${business.name}`
    titleCell.font = { size: 16, bold: true }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }

    worksheet.mergeCells('A2:F2')
    const periodCell = worksheet.getCell('A2')
    periodCell.value = `Periodo: ${period}`
    periodCell.alignment = { horizontal: 'center' }
    periodCell.font = { bold: true }

    // Encabezados
    worksheet.addRow([])
    const headerRow = worksheet.addRow([
      'Fecha',
      'Comprobante',
      'Cliente',
      'Neto',
      'IVA',
      'Total',
    ])

    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      }
    })

    // Datos
    let totalNeto = 0
    let totalIVA = 0
    let totalGeneral = 0

    sales.forEach((sale) => {
      const neto = Number(sale.subtotal)
      const iva = Number(sale.tax)
      const total = Number(sale.total)

      const row = worksheet.addRow([
        format(new Date(sale.createdAt), 'dd/MM/yyyy', { locale: es }),
        sale.ticketNumber || sale.id,
        sale.client?.name || 'Consumidor Final',
        neto,
        iva,
        total,
      ])

      row.getCell(4).numFmt = '"$"#,##0.00'
      row.getCell(5).numFmt = '"$"#,##0.00'
      row.getCell(6).numFmt = '"$"#,##0.00'

      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        }
      })

      totalNeto += neto
      totalIVA += iva
      totalGeneral += total
    })

    // Totales
    worksheet.addRow([])
    const totalRow = worksheet.addRow([
      '',
      '',
      'TOTALES:',
      totalNeto,
      totalIVA,
      totalGeneral,
    ])
    totalRow.getCell(3).font = { bold: true }
    totalRow.getCell(4).font = { bold: true }
    totalRow.getCell(5).font = { bold: true }
    totalRow.getCell(6).font = { bold: true }
    totalRow.getCell(4).numFmt = '"$"#,##0.00'
    totalRow.getCell(5).numFmt = '"$"#,##0.00'
    totalRow.getCell(6).numFmt = '"$"#,##0.00'

    totalRow.eachCell((cell, colNumber) => {
      if (colNumber >= 3) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE2EFDA' },
        }
      }
    })

    // Ajustar ancho de columnas
    worksheet.columns = [
      { width: 12 },
      { width: 20 },
      { width: 25 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
    ]

    const buffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(buffer)
  }
} 

export const excelExportService = new ExcelExportService()
