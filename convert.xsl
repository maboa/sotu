<xsl:stylesheet>
<xsl:template match="/">
<xsl:apply-templates select="segmentation/segment/label-seq/label"/>
</xsl:template>

<xsl:template match="segmentation/segment/label-seq/label">


<span>

<xsl:attribute name="data-ms"><xsl:value-of select="start"/></xsl:attribute>

<xsl:value-of select="value"/>
</span>


</xsl:template>
</xsl:stylesheet>