<?xml version="1.0" encoding="UTF-8"?>
<!-- Human-readable view of the sitemaps in a browser. Search engines ignore this stylesheet. -->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="en-GB">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta name="robots" content="noindex"/>
        <title>Sitemap | The Pilates Programme</title>
        <style>
          body { margin: 0; padding: 40px 16px; background: #FAF8F5; color: #111111; font: 16px/1.6 Helvetica, Arial, sans-serif; }
          main { max-width: 960px; margin: 0 auto; }
          h1 { font-weight: 400; font-size: 32px; margin: 0 0 8px; }
          p { color: #4A4744; margin: 0 0 24px; }
          table { width: 100%; border-collapse: collapse; background: #FFFFFF; }
          th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #D9D3CA; }
          th { font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: #7A5C43; font-weight: 500; }
          a { color: #111111; word-break: break-all; }
        </style>
      </head>
      <body>
        <main>
          <h1>Sitemap</h1>
          <xsl:choose>
            <xsl:when test="s:sitemapindex">
              <p>This index lists <xsl:value-of select="count(s:sitemapindex/s:sitemap)"/> sitemap file(s).</p>
              <table><tr><th>Sitemap</th></tr>
                <xsl:for-each select="s:sitemapindex/s:sitemap"><tr><td><a href="{s:loc}"><xsl:value-of select="s:loc"/></a></td></tr></xsl:for-each>
              </table>
            </xsl:when>
            <xsl:otherwise>
              <p><xsl:value-of select="count(s:urlset/s:url)"/> pages.</p>
              <table><tr><th>Page</th></tr>
                <xsl:for-each select="s:urlset/s:url"><tr><td><a href="{s:loc}"><xsl:value-of select="s:loc"/></a></td></tr></xsl:for-each>
              </table>
            </xsl:otherwise>
          </xsl:choose>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
