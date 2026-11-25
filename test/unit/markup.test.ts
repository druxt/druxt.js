// cspell:ignore avascript (an encoded `j` before it, as an attack spells javascript)
import { describe, expect, it } from 'vitest'
import { FIELD_MARKUP_TAGS, filterFieldMarkup } from '../../packages/core/src/markup'

describe('filterFieldMarkup()', () => {
  it('keeps Drupal\'s field markup tags and their allowed attributes', () => {
    expect(FIELD_MARKUP_TAGS).toEqual(['a', 'abbr', 'b', 'big', 'code', 'del', 'em', 'i', 'ins', 'pre', 'q', 'small', 'span', 'strong', 'sub', 'sup', 'tt', 'ol', 'ul', 'li', 'p', 'br', 'img'])
    expect(filterFieldMarkup('Use <em>one</em> word, see <a href="/help" title="Help" class="x">help</a>.<br>'))
      .toBe('Use <em>one</em> word, see <a href="/help" title="Help" class="x">help</a>.<br>')
    expect(filterFieldMarkup('<img src="https://example.com/a.png" alt="A" width="2">')).toBe('<img src="https://example.com/a.png" alt="A">')
    expect(filterFieldMarkup('<A HREF=\'mailto:a@example.com\'>Mail</A>')).toBe('<a href="mailto:a@example.com">Mail</a>')
    expect(filterFieldMarkup(undefined)).toBe('')
  })

  it('drops a script with its content, and any other tag Drupal does not allow, keeping its text', () => {
    expect(filterFieldMarkup('Hi<script>alert(1)</script> there')).toBe('Hi there')
    expect(filterFieldMarkup('<style>p{}</style><div><iframe src="/x"></iframe>Text</div>')).toBe('Text')
    expect(filterFieldMarkup('<h1 onclick="x()">Title</h1><!-- note -->')).toBe('Title')
  })

  it('strips every handler and any attribute it does not list', () => {
    expect(filterFieldMarkup('<img src="x.png" onerror="alert(1)">')).toBe('<img src="x.png">')
    expect(filterFieldMarkup('<img src=x onerror=alert(1)//>')).toBe('<img src="x">')
    expect(filterFieldMarkup('<span style="color:red" onmouseover=\'x()\' data-x="1">a</span>')).toBe('<span>a</span>')
  })

  it('drops a URL whose scheme is not http, https or mailto, however it is spelled', () => {
    for (const href of ['javascript:alert(1)', ' JaVaScRiPt:alert(1)', 'java\tscript:alert(1)', '&#106;avascript:alert(1)', '&#x6A;avascript:alert(1)', 'javascript&colon;alert(1)', 'data:text/html,<b>', 'vbscript:x']) {
      expect(filterFieldMarkup(`<a href="${href}">x</a>`), href).toBe('<a>x</a>')
    }
    expect(filterFieldMarkup('<img src="javascript:alert(1)" alt="a">')).toBe('<img alt="a">')
    expect(filterFieldMarkup('<a href="page?x=1#a:b">x</a>')).toBe('<a href="page?x=1#a:b">x</a>')
  })

  it('drops a protocol-relative URL, which names another host, and keeps a site-relative path', () => {
    for (const href of ['//evil.com', '/\\evil.com', '\\\\evil.com', '\\/evil.com', ' //evil.com', '&#47;/evil.com', '/\t/evil.com']) {
      expect(filterFieldMarkup(`<a href="${href}">x</a>`), href).toBe('<a>x</a>')
    }
    expect(filterFieldMarkup('<img src="//evil.com/x" alt="a">')).toBe('<img alt="a">')
    expect(filterFieldMarkup('<a href="/relative">x</a>')).toBe('<a href="/relative">x</a>')
    expect(filterFieldMarkup('<img src="/files/x.png" alt="a">')).toBe('<img src="/files/x.png" alt="a">')
  })

  it('drops a tag whose quote never closes, with what follows it, as a browser reads it', () => {
    expect(filterFieldMarkup('before <a title="x>y</a> after')).toBe('before ')
    expect(filterFieldMarkup('before <a title=\'x>y</a> after')).toBe('before ')
    expect(filterFieldMarkup('before <a title="x">y</a> after')).toBe('before <a title="x">y</a> after')
  })

  // Each character is read once, however the markup is built.
  it.each(['<a', '<a"', '<a\'', '<!--', '<!', '</'])('reads %s repeated many times in good time', (piece) => {
    const started = Date.now()
    filterFieldMarkup(piece.repeat(40_000))
    expect(Date.now() - started).toBeLessThan(1000)
  })

  it('escapes what nested, malformed or encoded markup leaves', () => {
    expect(filterFieldMarkup('<<script>script>alert(1)<</script>/script>')).toBe('&lt;/script&gt;')
    expect(filterFieldMarkup('<a href="/x>y" title=\'a>b\'>t</a>')).toBe('<a href="/x&gt;y" title="a&gt;b">t</a>')
    expect(filterFieldMarkup('a < b > c & d &amp; e')).toBe('a &lt; b &gt; c &amp; d &amp; e')
    expect(filterFieldMarkup('<b>open <i>unclosed')).toBe('<b>open <i>unclosed')
    expect(filterFieldMarkup('text <a href="/x"')).toBe('text ')
    expect(filterFieldMarkup('&lt;script&gt;alert(1)&lt;/script&gt;')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(filterFieldMarkup('<a title="&quot;><script>x</script>">t</a>')).toBe('<a title="&quot;&gt;&lt;script&gt;x&lt;/script&gt;">t</a>')
    expect(filterFieldMarkup('<a title=\'say "hi"\'>t</a>')).toBe('<a title="say &quot;hi&quot;">t</a>')
  })
})
