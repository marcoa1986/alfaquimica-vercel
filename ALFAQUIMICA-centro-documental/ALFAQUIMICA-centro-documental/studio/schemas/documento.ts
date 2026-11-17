import {defineField, defineType} from 'sanity'

export const documentoTecnico = defineType({
  name: 'documentoTecnico',
  title: 'Documento técnico',
  type: 'document',
  fields: [
    defineField({
      name: 'titulo',
      title: 'Título del documento',
      type: 'string',
      validation: (Rule) => Rule.required().max(120),
    }),
    defineField({
      name: 'codigoDocumento',
      title: 'Código de agrupación',
      description: 'Usa el mismo código para todas las versiones del mismo documento. Ejemplo: IPA-FT-001.',
      type: 'string',
      validation: (Rule) => Rule.required().max(40),
    }),
    defineField({
      name: 'producto',
      title: 'Producto relacionado',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'categoria',
      title: 'Tipo de documento',
      type: 'string',
      options: {
        list: [
          {title: 'Ficha técnica', value: 'ficha-tecnica'},
          {title: 'Hoja de seguridad (SDS)', value: 'hoja-seguridad'},
          {title: 'Hoja de ayuda', value: 'hoja-ayuda'},
          {title: 'Manual', value: 'manual'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'descripcion',
      title: 'Descripción',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.max(400),
    }),
    defineField({
      name: 'archivo',
      title: 'Archivo PDF',
      type: 'file',
      options: {accept: 'application/pdf'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'version',
      title: 'Versión',
      description: 'Ejemplo: 1.0, 1.1, 2.0.',
      type: 'string',
      validation: (Rule) => Rule.required().max(20),
    }),
    defineField({
      name: 'fechaEmision',
      title: 'Fecha de emisión',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'palabrasClave',
      title: 'Palabras clave',
      description: 'Ayudan al buscador. Agrega términos separados.',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'destacado',
      title: 'Destacar en el catálogo',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'publicado',
      title: 'Publicar en la página web',
      description: 'Si está desactivado, el documento no aparecerá en el sitio público.',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'titulo',
      subtitle: 'producto',
      version: 'version',
      media: 'archivo',
    },
    prepare({title, subtitle, version, media}) {
      return {
        title: title || 'Documento sin título',
        subtitle: `${subtitle || 'Sin producto'} · ${version || 'Sin versión'}`,
        media,
      }
    },
  },
})
