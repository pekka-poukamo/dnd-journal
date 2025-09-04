import { expect } from 'chai';
import './setup.js';
import * as Utils from '../js/utils.js';

describe('Markdown sanitization', function() {
  it('escapes raw HTML tags so they render inert', function() {
    const input = '<b>hello</b> & <i>world</i>';
    const html = Utils.parseMarkdown(input);
    expect(html).to.include('&lt;b&gt;hello&lt;/b&gt;');
    expect(html).to.include('&lt;i&gt;world&lt;/i&gt;');
    expect(html).to.not.match(/<\s*b\s*>/i);
    expect(html).to.not.match(/<\s*i\s*>/i);
  });

  it('neutralizes script tags and event handler attributes', function() {
    const input = 'Click <img src=x onerror="alert(1)"> then <script>alert(1)</script>';
    const html = Utils.parseMarkdown(input);
    expect(html).to.include('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
    expect(html).to.include('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).to.not.match(/<\s*script/i);
    expect(html).to.not.match(/<\s*img/i);
  });

  it('keeps sanitization inside formatted markdown (e.g., strong/em/code)', function() {
    const input = '**bold <img onerror=1>** and *italic <script>x</script>* with `code <b>x</b>`';
    const html = Utils.parseMarkdown(input);
    expect(html).to.include('<strong>bold &lt;img onerror=1&gt;</strong>');
    expect(html).to.include('<em>italic &lt;script&gt;x&lt;/script&gt;</em>');
    expect(html).to.include('<code>code &lt;b&gt;x&lt;/b&gt;</code>');
    expect(html).to.not.match(/<\s*img/i);
    expect(html).to.not.match(/<\s*script/i);
  });
});

