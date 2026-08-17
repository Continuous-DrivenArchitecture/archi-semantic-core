import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
import { readFileSync } from 'node:fs';

const rootPkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

// GitHub Pages hosts the repository under a path, not the org root.
// `site` + `base` keep every generated asset and link repository-path aware.
export default defineConfig({
  site: 'https://continuous-drivenarchitecture.github.io',
  base: '/archi-semantic-core/',
  integrations: [
    starlight({
      title: 'archi-semantic-core',
      description:
        'A faithful, typed TypeScript semantic core for native Archi .archimate models.',
      logo: {
        src: './src/assets/cda-mark.svg',
        alt: 'CDA',
        replacesTitle: false,
      },
      favicon: 'favicon.svg',
      editLink: {
        baseUrl:
          'https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/edit/develop/website/',
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/Continuous-DrivenArchitecture/archi-semantic-core',
        },
      ],
      head: [
        {
          tag: 'meta',
          attrs: {
            property: 'og:site_name',
            content: 'archi-semantic-core · CDA Developer Documentation',
          },
        },
        {
          tag: 'meta',
          attrs: { property: 'og:type', content: 'website' },
        },
        {
          tag: 'meta',
          attrs: { name: 'twitter:card', content: 'summary' },
        },
      ],
      // Starlight's `footer` config was removed in v0.41; the footer links are
      // rendered by the custom Footer override (see src/components/Footer.astro).
      components: {
        Footer: './src/components/Footer.astro',
      },
      // Canonical locale is English. The remaining locales are declared up
      // front so the architecture is translation-ready: content dirs can be
      // added per locale without touching the configuration.
      defaultLocale: 'en',
      locales: {
        en: { label: 'English', lang: 'en' },
        es: { label: 'Español', lang: 'es' },
        de: { label: 'Deutsch', lang: 'de' },
        fr: { label: 'Français', lang: 'fr' },
        nl: { label: 'Nederlands', lang: 'nl' },
        pt: { label: 'Português', lang: 'pt' },
        zh: { label: '中文', lang: 'zh' },
      },
      customCss: ['./src/styles/cda.css'],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', link: '/getting-started/introduction/' },
            { label: 'Installation', link: '/getting-started/installation/' },
            { label: 'Parse your first model', link: '/getting-started/parse-first-model/' },
            { label: 'Working with .archimate archives', link: '/getting-started/archives/' },
            { label: 'Validate a model', link: '/getting-started/validate-model/' },
          ],
        },
        {
          label: 'Core Concepts',
          items: [
            { label: 'ArchiModel', link: '/core-concepts/archi-model/' },
            { label: 'Elements', link: '/core-concepts/elements/' },
            { label: 'Relationships', link: '/core-concepts/relationships/' },
            { label: 'Views', link: '/core-concepts/views/' },
            { label: 'Diagram objects and connections', link: '/core-concepts/diagram-objects-connections/' },
            { label: 'IDs and references', link: '/core-concepts/ids-references/' },
            { label: 'Geometry and nested coordinates', link: '/core-concepts/geometry/' },
          ],
        },
        {
          label: 'Native Archi Semantics',
          items: [
            { label: 'Junctions', link: '/semantics/junctions/' },
            { label: 'Access relationships', link: '/semantics/access-relationships/' },
            { label: 'Influence relationships', link: '/semantics/influence-relationships/' },
            { label: 'Association relationships', link: '/semantics/association-relationships/' },
            { label: 'Profiles and Specializations', link: '/semantics/profiles-specializations/' },
            { label: 'Visual styling', link: '/semantics/visual-styling/' },
            { label: 'Label Expressions', link: '/semantics/label-expressions/' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'Build lookup indexes', link: '/guides/lookup-indexes/' },
            { label: 'Impact analysis', link: '/guides/impact-analysis/' },
            { label: 'Structural validation in CI', link: '/guides/validation-in-ci/' },
            { label: 'Working with large models', link: '/guides/large-models/' },
            { label: 'Node archive handling', link: '/guides/node-archive-handling/' },
          ],
        },
        {
          label: 'Compatibility',
          items: [
            { label: 'Compatibility philosophy', link: '/compatibility/philosophy/' },
            { label: 'Compatibility matrix', link: '/compatibility/matrix/' },
            { label: 'Known limitations', link: '/compatibility/known-limitations/' },
          ],
        },
        {
          label: 'API Reference',
          items: [
            { label: 'Overview', link: '/reference/overview/' },
            {
              label: 'Functions',
              items: [
                { label: 'parseArchiModel', link: '/reference/generated/index/functions/parseArchiModel/' },
                { label: 'validateArchiModel', link: '/reference/generated/index/functions/validateArchiModel/' },
                { label: 'getLabelExpression', link: '/reference/generated/index/functions/getLabelExpression/' },
                { label: 'resolveLabelExpression', link: '/reference/generated/index/functions/resolveLabelExpression/' },
                {
                  label: 'extractArchiModelXml',
                  link: '/reference/generated/archive/functions/extractArchiModelXml/',
                  badge: { text: 'Node-only', variant: 'note' },
                },
              ],
            },
            {
              label: 'Types and interfaces',
              items: [
                { label: 'ArchiModel', link: '/reference/generated/index/interfaces/ArchiModel/' },
                { label: 'ArchiModelMetadata', link: '/reference/generated/index/interfaces/ArchiModelMetadata/' },
                { label: 'ArchiFolder', link: '/reference/generated/index/interfaces/ArchiFolder/' },
                { label: 'ArchiElement', link: '/reference/generated/index/interfaces/ArchiElement/' },
                { label: 'ArchiRelationship', link: '/reference/generated/index/interfaces/ArchiRelationship/' },
                { label: 'ArchiView', link: '/reference/generated/index/interfaces/ArchiView/' },
                { label: 'ArchiDiagramObject', link: '/reference/generated/index/interfaces/ArchiDiagramObject/' },
                { label: 'ArchiDiagramConnection', link: '/reference/generated/index/interfaces/ArchiDiagramConnection/' },
                { label: 'ArchiNote', link: '/reference/generated/index/interfaces/ArchiNote/' },
                { label: 'ArchiBounds', link: '/reference/generated/index/interfaces/ArchiBounds/' },
                { label: 'ArchiBendpoint', link: '/reference/generated/index/interfaces/ArchiBendpoint/' },
                { label: 'ArchiStyle', link: '/reference/generated/index/interfaces/ArchiStyle/' },
                { label: 'ArchiFontStyle', link: '/reference/generated/index/interfaces/ArchiFontStyle/' },
                { label: 'ArchiFeature', link: '/reference/generated/index/interfaces/ArchiFeature/' },
                { label: 'ArchiProfile', link: '/reference/generated/index/interfaces/ArchiProfile/' },
                { label: 'ArchiProperty', link: '/reference/generated/index/interfaces/ArchiProperty/' },
                { label: 'ArchiValidationResult', link: '/reference/generated/index/interfaces/ArchiValidationResult/' },
                { label: 'ArchiValidationIssue', link: '/reference/generated/index/interfaces/ArchiValidationIssue/' },
                { label: 'ArchiJunctionType', link: '/reference/generated/index/type-aliases/ArchiJunctionType/' },
                { label: 'ArchiAccessType', link: '/reference/generated/index/type-aliases/ArchiAccessType/' },
              ],
            },
          ],
        },
        {
          label: 'Project',
          items: [
            { label: 'Design principles', link: '/project/design-principles/' },
            { label: 'Contributing', link: '/project/contributing/' },
            { label: 'Changelog', link: '/project/changelog/' },
            { label: 'License', link: '/project/license/' },
          ],
        },
      ],
    }),
    sitemap({
      // Repository-page links: the sitemap must cover the external pages the
      // site references, not just generated routes.
      customPages: [
        'https://github.com/Continuous-DrivenArchitecture/archi-semantic-core',
        'https://www.npmjs.com/package/@cda/archi-semantic-core',
      ],
    }),
  ],
});
