'use client'

import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { groupWidgetsByColumn } from './widgetDefinitions'
import {
  DynamicModuleFeedWidget,
  DynamicModuleCategoriesWidget,
  DynamicModuleDetailWidget,
} from './DynamicModuleWidgets'
import {
  HeroWidget,
  HeadingWidget,
  TextWidget,
  ButtonWidget,
  IconListWidget,
  DividerWidget,
  LegacyFieldRenderer,
} from './widgets/BasicWidgets'
import {
  ImageWidget,
  VideoWidget,
  GalleryWidget,
  LogoGridWidget,
} from './widgets/MediaWidgets'
import {
  StatsWidget,
  FeaturesWidget,
  PricingWidget,
  TestimonialsWidget,
  TeamWidget,
  CtaWidget,
} from './widgets/MarketingWidgets'
import {
  TabsWidget,
  ProgressWidget,
  FaqWidget,
  NewsletterWidget,
  ContactFormWidget,
  CustomHtmlWidget,
} from './widgets/InteractiveWidgets'

export function getSectionStyleAndClasses(section) {
  const settings = section?.settings || {}
  const bgType = settings.bgType || 'light'
  const bgColor = settings.bgColor || 'transparent'
  const bgImage = settings.bgImage || ''
  const padding = settings.padding || 'normal'
  const containerWidth = settings.containerWidth || 'boxed'
  const gap = settings.gap || 'normal'
  const verticalAlign = settings.verticalAlign || 'center'
  const columnRatio = settings.columnRatio || 'equal'
  const columns = Math.max(1, parseInt(section?.columns || 1, 10))

  const paddingClasses = {
    none: 'py-2 px-4',
    small: 'py-8 px-4 sm:px-6',
    normal: 'py-16 px-4 sm:px-6 lg:px-8',
    large: 'py-24 px-4 sm:px-6 lg:px-8',
    xl: 'py-32 px-4 sm:px-6 lg:px-8',
  }[padding] || 'py-16 px-4 sm:px-6 lg:px-8'

  const containerClasses = {
    narrow: 'max-w-4xl mx-auto',
    boxed: 'max-w-7xl mx-auto',
    full: 'w-full px-2 sm:px-6',
  }[containerWidth] || 'max-w-7xl mx-auto'

  const gapClasses = {
    none: 'gap-0',
    small: 'gap-4',
    normal: 'gap-8',
    large: 'gap-12',
  }[gap] || 'gap-8'

  const alignClasses = {
    top: 'items-start',
    center: 'items-center',
    bottom: 'items-end',
    stretch: 'items-stretch',
  }[verticalAlign] || 'items-center'

  let gridColsClass = 'grid-cols-1'
  if (columns === 2) {
    if (columnRatio === '66-33' || columnRatio === '33-66') {
      gridColsClass = 'grid-cols-1 md:grid-cols-3'
    } else {
      gridColsClass = 'grid-cols-1 md:grid-cols-2'
    }
  } else if (columns === 3) {
    if (columnRatio === '25-50-25') {
      gridColsClass = 'grid-cols-1 md:grid-cols-4'
    } else {
      gridColsClass = 'grid-cols-1 md:grid-cols-3'
    }
  } else if (columns >= 4) {
    gridColsClass = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  }

  const sectionBgClass = cn(
    'relative w-full transition-colors',
    bgType === 'gradient' && 'bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white',
    bgType === 'dark' && 'bg-slate-900 text-white',
    bgType === 'light' && 'text-slate-900',
    paddingClasses
  )

  const sectionInlineStyle = {
    backgroundColor:
      bgType === 'light' || bgType === 'custom'
        ? bgColor !== 'transparent'
          ? bgColor
          : undefined
        : undefined,
    backgroundImage: bgImage ? `url(${bgImage})` : undefined,
    backgroundSize: bgImage ? 'cover' : undefined,
    backgroundPosition: bgImage ? 'center' : undefined,
  }

  function getColumnSpanClass(colIdx) {
    if (columns === 2 && columnRatio === '66-33') {
      return colIdx === 0 ? 'md:col-span-2' : 'md:col-span-1'
    }
    if (columns === 2 && columnRatio === '33-66') {
      return colIdx === 0 ? 'md:col-span-1' : 'md:col-span-2'
    }
    if (columns === 3 && columnRatio === '25-50-25') {
      return colIdx === 1 ? 'md:col-span-2' : 'md:col-span-1'
    }
    return 'col-span-1'
  }

  return {
    columns,
    settings,
    containerClasses,
    gapClasses,
    alignClasses,
    gridColsClass,
    sectionBgClass,
    sectionInlineStyle,
    getColumnSpanClass,
  }
}

export function LivePageRenderer({ sections = [], className, dynamicContext = null }) {
  if (!Array.isArray(sections) || sections.length === 0) {
    return (
      <div className="py-24 px-6 text-center bg-white">
        <div className="max-w-md mx-auto">
          <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-800">Empty Page Layout</h2>
          <p className="text-sm text-slate-500 mt-1">
            This page does not have any content sections yet. Add sections in the Page Builder.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('w-full space-y-0', className)}>
      {sections.map((section, idx) => (
        <SectionView key={section.id || idx} section={section} dynamicContext={dynamicContext} />
      ))}
    </div>
  )
}

function SectionView({ section, dynamicContext = null }) {
  const {
    columns,
    settings,
    containerClasses,
    gapClasses,
    alignClasses,
    gridColsClass,
    sectionBgClass,
    sectionInlineStyle,
    getColumnSpanClass,
  } = getSectionStyleAndClasses(section)

  if (Array.isArray(section.widgets) && section.widgets.length > 0) {
    const columnGroups = groupWidgetsByColumn(section)

    return (
      <section
        id={section.slug || undefined}
        style={sectionInlineStyle}
        className={sectionBgClass}
      >
        {settings.bgImage && settings.bgOverlay && (
          <div className="absolute inset-0 bg-slate-950/60 pointer-events-none" />
        )}
        <div className={cn('relative z-10', containerClasses)}>
          {columns > 1 ? (
            <div className={cn('grid', gridColsClass, gapClasses, alignClasses)}>
              {columnGroups.map((colItems, colIdx) => (
                <div
                  key={colIdx}
                  className={cn('w-full space-y-6', getColumnSpanClass(colIdx))}
                >
                  {colItems.map(({ widget, widx }) => (
                    <WidgetRenderer
                      key={widget.id || widx}
                      widget={widget}
                      dynamicContext={dynamicContext}
                    />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {section.widgets.map((widget, widx) => (
                <WidgetRenderer
                  key={widget.id || widx}
                  widget={widget}
                  dynamicContext={dynamicContext}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    )
  }

  if (Array.isArray(section.fields) && section.fields.length > 0) {
    return (
      <section id={section.slug || undefined} className={cn('w-full bg-white border-b border-slate-100', sectionBgClass)}>
        <div className={containerClasses}>
          {section.name && (
            <h2 className="text-2xl font-bold text-slate-900 mb-6">{section.name}</h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {section.fields.map((f, i) => (
              <LegacyFieldRenderer key={f.id || i} field={f} />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return null
}

export function WidgetRenderer({ widget, dynamicContext = null }) {
  if (!widget) return null
  const { type, props = {} } = widget

  const boxStyle = {
    backgroundColor: props._boxBg || undefined,
    padding: props._boxPadding ? `${props._boxPadding}px` : undefined,
    borderRadius: props._boxRounded ? `${props._boxRounded}px` : undefined,
    border: props._boxBorder ? `1px solid ${props._boxBorderColor || '#e2e8f0'}` : undefined,
  }

  const hasBoxWrapper =
    props._boxBg || props._boxPadding || props._boxRounded || props._boxBorder || props._boxShadow

  const inner = renderWidgetByType(type, props, dynamicContext)
  if (!hasBoxWrapper) return inner

  return (
    <div
      style={boxStyle}
      className={cn(
        'transition-all',
        props._boxShadow === 'sm' && 'shadow-sm',
        props._boxShadow === 'lg' && 'shadow-lg',
        props._boxShadow === '2xl' && 'shadow-2xl'
      )}
    >
      {inner}
    </div>
  )
}

function renderWidgetByType(type, props, dynamicContext = null) {
  switch (type) {
    case 'module_grid':
      return <DynamicModuleFeedWidget props={props} />
    case 'module_categories':
      return <DynamicModuleCategoriesWidget props={props} />
    case 'module_detail':
      return <DynamicModuleDetailWidget props={props} dynamicContext={dynamicContext} />
    case 'hero':
      return <HeroWidget props={props} />
    case 'heading':
      return <HeadingWidget props={props} />
    case 'text':
      return <TextWidget props={props} />
    case 'button':
      return <ButtonWidget props={props} />
    case 'icon_list':
      return <IconListWidget props={props} />
    case 'divider':
      return <DividerWidget props={props} />
    case 'image':
      return <ImageWidget props={props} />
    case 'video':
      return <VideoWidget props={props} />
    case 'gallery':
      return <GalleryWidget props={props} />
    case 'logo_grid':
      return <LogoGridWidget props={props} />
    case 'stats':
      return <StatsWidget props={props} />
    case 'features':
      return <FeaturesWidget props={props} />
    case 'cta':
      return <CtaWidget props={props} />
    case 'pricing':
      return <PricingWidget props={props} />
    case 'testimonials':
      return <TestimonialsWidget props={props} />
    case 'team':
      return <TeamWidget props={props} />
    case 'tabs':
      return <TabsWidget props={props} />
    case 'progress':
      return <ProgressWidget props={props} />
    case 'faq':
      return <FaqWidget props={props} />
    case 'newsletter':
      return <NewsletterWidget props={props} />
    case 'contact_form':
      return <ContactFormWidget props={props} />
    case 'custom_html':
      return <CustomHtmlWidget props={props} />
    default:
      return null
  }
}
