declare module "next/dist/compiled/node-html-parser" {
  interface HtmlElement {
    text: string;
    getAttribute(key: string): string | undefined;
    tagName: string;
    nextElementSibling: HtmlElement | null;
    querySelectorAll(selector: string): HtmlElement[];
  }
  export function parse(html: string): HtmlElement;
}
