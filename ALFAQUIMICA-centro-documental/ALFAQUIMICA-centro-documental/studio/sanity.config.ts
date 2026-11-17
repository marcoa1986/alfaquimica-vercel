import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {schemaTypes} from './schemas'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'

if (!projectId) {
  throw new Error('Configura SANITY_STUDIO_PROJECT_ID en el archivo .env de studio.')
}

export default defineConfig({
  name: 'alfa-quimica',
  title: 'ALFA QUÍMICA | Centro documental',
  projectId,
  dataset,
  plugins: [structureTool()],
  schema: {types: schemaTypes},
})
