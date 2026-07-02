import type PptxGenJS from 'pptxgenjs'
import type { PptTemplate, WidgetType } from '@/types'

export type TabExportConfig = {
  dashboardName: string
  tabName: string
  surveyName: string
  selectedWidgets: {
    type: WidgetType
    title: string
  }[]
  activeFilters: string[]
  exportedAt: string
  template: PptTemplate
}

const W = 13.33
const H = 7.5
const NAVY = '1F3864'
const WHITE = 'FFFFFF'
const LIGHT_GREY = 'F2F2F2'

type Slide = PptxGenJS.Slide

function addRect(pptx: PptxGenJS, slide: Slide, x: number, y: number, w: number, h: number, color: string) {
  slide.addShape(pptx.ShapeType.rect, { x, y, w, h, fill: { color }, line: { color } })
}

function addText(slide: Slide, text: string, x: number, y: number, w: number, h: number, options = {}) {
  slide.addText(text, { x, y, w, h, margin: 0.04, fit: 'shrink', ...options })
}

function logoX(alignment: 'left' | 'center' | 'right', width: number) {
  if (alignment === 'center') return (W - width) / 2
  if (alignment === 'right') return W - width - 0.5
  return 0.5
}

function addLogo(pptx: PptxGenJS, slide: Slide, x: number, y: number, size: number) {
  addRect(pptx, slide, x, y, size, size, NAVY)
  addText(slide, 'P', x, y + size * 0.24, size, size * 0.55, {
    fontSize: size > 1 ? 32 : 14,
    bold: true,
    color: WHITE,
    align: 'center',
  })
}

function addCoverSlide(pptx: PptxGenJS, config: TabExportConfig) {
  const slide = pptx.addSlide()
  slide.background = { color: config.template.themeColor }
  addLogo(pptx, slide, logoX(config.template.firstSlide.logoAlignment, 1.5), 0.5, 1.5)

  if (config.template.confidentialityEnabled) {
    addText(slide, config.template.confidentialityText, W - 6, 0.2, 5.8, 0.3, {
      fontSize: 9,
      color: 'CCCCCC',
      italic: true,
      align: 'right',
    })
  }

  addText(slide, config.template.firstSlide.title, 0.8, 2.4, W - 1.6, 1.8, {
    fontFace: config.template.firstSlide.titleFont.family,
    fontSize: config.template.firstSlide.titleFont.size,
    bold: config.template.firstSlide.titleFont.bold,
    color: config.template.firstSlide.titleFont.color,
    align: config.template.firstSlide.titleFont.alignment,
  })

  if (config.template.firstSlide.description) {
    addText(slide, config.template.firstSlide.description, 0.8, 4.4, W - 1.6, 0.6, {
      fontFace: config.template.firstSlide.descriptionFont.family,
      fontSize: config.template.firstSlide.descriptionFont.size,
      bold: config.template.firstSlide.descriptionFont.bold,
      color: config.template.firstSlide.descriptionFont.color,
      align: config.template.firstSlide.descriptionFont.alignment,
    })
  }

  if (config.activeFilters.length > 0) {
    addText(slide, 'Filters applied:', 0.8, 5.45, 3, 0.3, { fontSize: 10, color: 'AACCEE' })
    addText(slide, config.activeFilters.join(' · '), 0.8, 5.8, W - 1.6, 0.3, { fontSize: 10, color: WHITE })
  }

  addText(slide, `${config.dashboardName} · ${config.tabName} tab · ${config.selectedWidgets.length} widgets exported`, 0.8, H - 1.1, W - 1.6, 0.4, {
    fontSize: 12,
    color: 'BDD7EE',
  })
  addText(slide, config.exportedAt, W - 4.5, H - 0.65, 4.3, 0.35, {
    fontSize: 10,
    color: '8BB5D4',
    align: 'right',
  })
}

function addWidgetSlide(pptx: PptxGenJS, config: TabExportConfig, widget: TabExportConfig['selectedWidgets'][number]) {
  const slide = pptx.addSlide()
  addRect(pptx, slide, 0, 0, W, 0.75, config.template.themeColor)
  addLogo(pptx, slide, logoX(config.template.widgetSlide.logoAlignment, 0.55), 0.1, 0.55)
  addText(slide, widget.title, config.template.widgetSlide.logoAlignment === 'left' ? 0.9 : 0.2, 0.15, 9, 0.45, {
    fontFace: config.template.widgetSlide.headingFont.family,
    fontSize: config.template.widgetSlide.headingFont.size,
    bold: config.template.widgetSlide.headingFont.bold,
    color: config.template.widgetSlide.headingFont.color,
    align: config.template.widgetSlide.headingFont.alignment,
  })

  if (config.template.confidentialityEnabled) {
    addText(slide, config.template.confidentialityText, W - 5.5, 0.15, 5.3, 0.25, {
      fontSize: 8,
      color: 'CCCCCC',
      italic: true,
      align: 'right',
    })
  }

  addRect(pptx, slide, 0, 0.75, 0.08, H - 1.35, NAVY)
  addRect(pptx, slide, 0, H - 0.55, W, 0.55, LIGHT_GREY)
  addText(slide, `${config.surveyName} · ${config.tabName}`, 5, H - 0.45, 3.5, 0.35, {
    fontSize: 8,
    color: '888888',
    align: 'center',
  })
  addText(slide, config.exportedAt, W - 4.2, H - 0.45, 4, 0.35, {
    fontSize: 8,
    color: '666666',
    align: 'right',
  })

  addText(slide, widget.type.replace(/_/g, ' ').toUpperCase(), 0.55, 1.1, 3.8, 0.35, {
    fontSize: 12,
    bold: true,
    color: NAVY,
  })
  addRect(pptx, slide, 0.55, 1.65, 12.2, 3.8, 'FAFAFA')
  addText(slide, `Exported widget: ${widget.title}`, 0.85, 2.1, 11.4, 0.5, {
    fontSize: 20,
    bold: true,
    color: NAVY,
    align: 'center',
  })
  addText(slide, 'Detailed visualization and data table are available in the EX Portal mock prototype.', 0.85, 2.8, 11.4, 0.4, {
    fontSize: 12,
    color: '666666',
    align: 'center',
  })
}

function addClosingSlide(pptx: PptxGenJS, config: TabExportConfig) {
  const slide = pptx.addSlide()
  slide.background = { color: WHITE }
  const x =
    config.template.lastSlide.closingImageAlignment === 'left'
      ? 0.5
      : config.template.lastSlide.closingImageAlignment === 'right'
        ? W - 5.5
        : (W - 5) / 2
  addRect(pptx, slide, x, 1, 5, 3.5, LIGHT_GREY)
  addText(slide, config.template.lastSlide.closingText || 'Thank you!', 1, 5.2, W - 2, 1.5, {
    fontFace: config.template.lastSlide.closingTextFont.family,
    fontSize: config.template.lastSlide.closingTextFont.size,
    bold: config.template.lastSlide.closingTextFont.bold,
    color: config.template.lastSlide.closingTextFont.color,
    align: config.template.lastSlide.closingTextFont.alignment,
  })
}

export async function exportTabToPptx(config: TabExportConfig): Promise<void> {
  const PptxGen = (await import('pptxgenjs')).default
  const pptx = new PptxGen()
  pptx.layout = 'LAYOUT_WIDE'
  pptx.author = 'QuestionPro EX'
  pptx.company = config.template.name
  pptx.title = `${config.dashboardName} - ${config.tabName}`

  addCoverSlide(pptx, config)
  config.selectedWidgets.forEach((widget) => addWidgetSlide(pptx, config, widget))
  addClosingSlide(pptx, config)

  const safeName = `${config.dashboardName}_${config.tabName}_${config.exportedAt}`.replace(/\s/g, '_')
  await pptx.writeFile({ fileName: `${safeName}.pptx` })
}
