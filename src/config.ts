import { statSync } from "fs"
import postHtml from "posthtml"
import merge from 'deepmerge'

export type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>
}

export type PartialExcept<T, K extends keyof T> = RecursivePartial<T> & Pick<T, K>

export interface Config {
  input: {
    /** The directory to page files. */
    pages: string
    /** The directory to component files. */
    components: string
    /** The directory to layout files. */
    layouts: string
  }
  output: {
    /** The directory to output files. */
    dir: string
    /** Clean output directory before building. */
    clean: boolean
    /** Specify the output format. */
    format: boolean
  }
  devServer: {
    /** Server host. */
    host: string,
    /** Server port. */
    port: string | number
    /** Open the dev server in your browser when building succeeded. */
    open: boolean
    /** Observed path whose change triggers recompilation. */
    watch: string | string[]
  }
  /** Configure options for postHtml. */
  postHtmlPlugins: postHtml.Plugin<unknown>[]
}

export type ConfigSerializableField = 'input'|'output'|'devServer'

export const defaultConfig = () => ({
  input: {
    pages: 'src/pages',
    components: 'src/components',
    layouts: 'src/layouts'
  },
  output: {
    dir: 'dist',
    clean: true,
    format: true
  },
  devServer: {
    host: '0.0.0.0',
    port: '4000',
    open: true,
    watch: []
  },
  postHtmlPlugins: []
} as Config)

export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

export type PickAndFlatten<T, K extends keyof T> = UnionToIntersection<T[K]>

/**
 * Merge config objects.
 */
const mergeConfig = (...args: RecursivePartial<Config>[]) => merge.all(args) as Config

/**
 * Newx will search newx.config.{ts,js} .newxrc.json
 * or newx property in package.json from your project. 
 */
export const readConfig = (): Config => {
  const configContents: RecursivePartial<Config>[] = [defaultConfig()];
  ['newx.config.ts', 'newx.config.js', '.newxrc.json', '.newxrc'].forEach(filename => {
    try {
      if (statSync(filename).isFile()) {
        configContents.push(require(`${process.cwd()}/${filename}`))
      }
    } catch (e) {}
  })
  return mergeConfig(...configContents)
}

export type CliConfig = PickAndFlatten<Config, ConfigSerializableField>

const deleteEmptyProp = (obj: any) => {
  for (const propName in obj)
    if (obj[propName] === null || obj[propName] === undefined)
      delete obj[propName]
    else if (typeof obj[propName] === 'object')
      deleteEmptyProp(obj[propName])
}

export const mergeCliConfig = (config: Config, cliConfig: CliConfig) => {
  const {
    pages, components, layouts, dir, clean, format, host, port, open, watch
  } = cliConfig
  const _config: PartialExcept<Config, ConfigSerializableField> = {
    input: { pages, components, layouts },
    output: { dir, clean, format },
    devServer: { host, port, open, watch }
  }
  deleteEmptyProp(_config)
  return mergeConfig(config, _config)
}
