import type { CheatSheetData } from "@/components/CheatSheet";

export const cheatSheets: Record<string, CheatSheetData> = {
  html: {
    skillId: 'html',
    title: 'HTML Essentials Cheat Sheet',
    description: 'Quick reference for the most common HTML tags and attributes',
    sections: [
      {
        title: 'Document Structure',
        items: [
          { syntax: '<!DOCTYPE html>', description: 'Declares HTML5 document type', example: '<!DOCTYPE html>\n<html>\n  <head>...</head>\n  <body>...</body>\n</html>' },
          { syntax: '<html>', description: 'Root element of HTML page', example: '<html lang="en">...</html>' },
          { syntax: '<head>', description: 'Contains metadata and links', example: '<head>\n  <title>Page Title</title>\n</head>' },
          { syntax: '<body>', description: 'Contains visible page content', example: '<body>\n  <h1>Hello World</h1>\n</body>' },
        ]
      },
      {
        title: 'Text Elements',
        items: [
          { syntax: '<h1> to <h6>', description: 'Heading levels (h1 is largest)', example: '<h1>Main Title</h1>\n<h2>Subtitle</h2>' },
          { syntax: '<p>', description: 'Paragraph of text', example: '<p>This is a paragraph.</p>' },
          { syntax: '<a>', description: 'Hyperlink', example: '<a href="https://example.com">Link</a>' },
          { syntax: '<strong>', description: 'Bold/important text', example: '<strong>Important!</strong>' },
          { syntax: '<em>', description: 'Emphasized/italic text', example: '<em>Emphasis</em>' },
        ]
      },
      {
        title: 'Lists',
        items: [
          { syntax: '<ul>', description: 'Unordered (bulleted) list', example: '<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>' },
          { syntax: '<ol>', description: 'Ordered (numbered) list', example: '<ol>\n  <li>First</li>\n  <li>Second</li>\n</ol>' },
          { syntax: '<li>', description: 'List item', example: '<li>List item content</li>' },
        ]
      },
      {
        title: 'Media & Forms',
        items: [
          { syntax: '<img>', description: 'Image element', example: '<img src="image.jpg" alt="Description">' },
          { syntax: '<form>', description: 'Form container', example: '<form action="/submit">\n  ...\n</form>' },
          { syntax: '<input>', description: 'Input field', example: '<input type="text" name="username">' },
          { syntax: '<button>', description: 'Clickable button', example: '<button>Click me</button>' },
        ]
      }
    ]
  },
  css: {
    skillId: 'css',
    title: 'CSS Essentials Cheat Sheet',
    description: 'Quick reference for common CSS selectors and properties',
    sections: [
      {
        title: 'Selectors',
        items: [
          { syntax: 'element', description: 'Selects all elements of that type', example: 'p { color: blue; }' },
          { syntax: '.class', description: 'Selects elements with class', example: '.button { background: red; }' },
          { syntax: '#id', description: 'Selects element with ID', example: '#header { font-size: 24px; }' },
          { syntax: 'element.class', description: 'Selects specific element with class', example: 'div.container { width: 100%; }' },
        ]
      },
      {
        title: 'Layout',
        items: [
          { syntax: 'display', description: 'Sets element display type', example: 'display: flex;\ndisplay: grid;\ndisplay: block;' },
          { syntax: 'flex', description: 'Flexbox layout', example: 'display: flex;\njustify-content: center;\nalign-items: center;' },
          { syntax: 'grid', description: 'Grid layout', example: 'display: grid;\ngrid-template-columns: 1fr 1fr;' },
          { syntax: 'position', description: 'Element positioning', example: 'position: relative;\nposition: absolute;\nposition: fixed;' },
        ]
      },
      {
        title: 'Styling',
        items: [
          { syntax: 'color', description: 'Text color', example: 'color: #333;\ncolor: rgb(255, 0, 0);' },
          { syntax: 'background', description: 'Background color/image', example: 'background: linear-gradient(blue, red);' },
          { syntax: 'font-size', description: 'Text size', example: 'font-size: 16px;\nfont-size: 1.5rem;' },
          { syntax: 'margin/padding', description: 'Spacing outside/inside', example: 'margin: 20px;\npadding: 10px 20px;' },
        ]
      }
    ]
  },
  javascript: {
    skillId: 'javascript',
    title: 'JavaScript Essentials Cheat Sheet',
    description: 'Quick reference for JavaScript syntax and concepts',
    sections: [
      {
        title: 'Variables',
        items: [
          { syntax: 'let', description: 'Block-scoped variable (can change)', example: 'let name = "Alice";\nname = "Bob";' },
          { syntax: 'const', description: 'Block-scoped constant (cannot change)', example: 'const PI = 3.14159;' },
          { syntax: 'var', description: 'Function-scoped variable (legacy)', example: 'var count = 0;' },
        ]
      },
      {
        title: 'Data Types',
        items: [
          { syntax: 'string', description: 'Text data', example: 'let text = "Hello";\nlet text2 = \'World\';' },
          { syntax: 'number', description: 'Numeric data', example: 'let age = 25;\nlet price = 19.99;' },
          { syntax: 'boolean', description: 'True or false', example: 'let isActive = true;\nlet isComplete = false;' },
          { syntax: 'array', description: 'Ordered list', example: 'let items = [1, 2, 3];\nlet names = ["Alice", "Bob"];' },
        ]
      },
      {
        title: 'Functions',
        items: [
          { syntax: 'function', description: 'Function declaration', example: 'function greet(name) {\n  return "Hello " + name;\n}' },
          { syntax: 'arrow function', description: 'Concise function syntax', example: 'const add = (a, b) => a + b;' },
          { syntax: 'return', description: 'Returns a value from function', example: 'function sum(a, b) {\n  return a + b;\n}' },
        ]
      },
      {
        title: 'Control Flow',
        items: [
          { syntax: 'if/else', description: 'Conditional execution', example: 'if (age >= 18) {\n  console.log("Adult");\n} else {\n  console.log("Minor");\n}' },
          { syntax: 'for loop', description: 'Iterate a number of times', example: 'for (let i = 0; i < 5; i++) {\n  console.log(i);\n}' },
          { syntax: 'while loop', description: 'Loop while condition is true', example: 'while (count < 10) {\n  count++;\n}' },
        ]
      }
    ]
  }
};
