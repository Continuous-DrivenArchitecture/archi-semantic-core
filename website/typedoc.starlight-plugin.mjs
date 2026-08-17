import { MarkdownPageEvent } from 'typedoc-plugin-markdown';

export function load(app) {
  app.renderer.on(MarkdownPageEvent.BEGIN, (page) => {
    const title = page.model?.name ? String(page.model.name) : undefined;
    page.frontmatter = { ...(page.frontmatter || {}), ...(title ? { title } : {}) };
  });
}
