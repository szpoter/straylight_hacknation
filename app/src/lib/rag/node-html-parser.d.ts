declare module "next/dist/compiled/node-html-parser" {
  interface HtmlElement {
    text: string;
    tagName: string;
    nextElementSibling: HtmlElement | null;
    querySelectorAll(selector: string): HtmlElement[];
  }
  export function parse(html: string): HtmlElement;
}
