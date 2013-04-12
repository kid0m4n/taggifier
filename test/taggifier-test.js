var helper = require('./test-helper')
  , Taggifier = helper.Taggifier

describe('Taggifier', function() {
  describe('#process', function() {
    var taggifier

    beforeEach(function() {
      taggifier = new Taggifier({ className: 'a', idPrefix: 'b', tag: 'div' })
    })

    afterEach(function() {
      taggifier.end()
    })

    it('should surround text and white space with tags', function() {
      var htmlPromise = taggifier.process('<html><body>This is so cool</body></html>')

      return htmlPromise.should.become('<html><body><div id="b_0" class="a">This</div><div id="b_1" class="a">&nbsp;</div><div id="b_2" class="a">is</div><div id="b_3" class="a">&nbsp;</div><div id="b_4" class="a">so</div><div id="b_5" class="a">&nbsp;</div><div id="b_6" class="a">cool</div></body></html>')
    })

    it('should traverse elements surrounded by text', function() {
      var htmlPromise = taggifier.process('<html><body>This is <em>so</em> cool</body></html>')

      return htmlPromise.should.become('<html><body><div id="b_0" class="a">This</div><div id="b_1" class="a">&nbsp;</div><div id="b_2" class="a">is</div><div id="b_3" class="a">&nbsp;</div><em><div id="b_4" class="a">so</div></em><div id="b_5" class="a">&nbsp;</div><div id="b_6" class="a">cool</div></body></html>')
    })

    it('should not mess with non body nodes', function() {
      var htmlPromise = taggifier.process('<html><head><title>Hello</title></head><body></body></html>')

      return htmlPromise.should.become("<html><head><title>Hello</title></head><body></body></html>")
    })

    it('should process inner tags with class names', function() {
      var htmlPromise = taggifier.process('<html><body><p class="omg">42</p></body></html>')

      return htmlPromise.should.become('<html><body><p class="omg"><div id="b_0" class="a">42</div></p></body></html>')
    })

    it('should allow the index to be overridden to 1', function() {
      var htmlPromise = new Taggifier({ className: 'a', idPrefix: 'b', tag: 'div', start: 1 }).process('<html><body>Hi</body></html>')

      return htmlPromise.should.become('<html><body><div id="b_1" class="a">Hi</div></body></html>')
    })

    it('should retain the order of elements', function() {
      var htmlPromise = taggifier.process('<html><body><p>Hi</p><div>There</div><article>God</article></body></html>')

      return htmlPromise.should.become('<html><body><p><div id="b_0" class="a">Hi</div></p><div><div id="b_1" class="a">There</div></div><article><div id="b_2" class="a">God</div></article></body></html>')
    })

    it('should retain the order of elements under other elements', function() {
      var htmlPromise = taggifier.process('<html><body><section><p>Hi</p><p>God</p></section></body></html>')

      return htmlPromise.should.become('<html><body><section><p><div id="b_0" class="a">Hi</div></p><p><div id="b_1" class="a">God</div></p></section></body></html>')
    })

    it('should handle non breaking space', function() {
      var htmlPromise = taggifier.process('<html><body>&nbsp;42</body></html>')

      return htmlPromise.should.become('<html><body><div id="b_0" class="a">&nbsp;</div><div id="b_1" class="a">42</div></body></html>')
    })

    it('should handle new lines', function() {
      var htmlPromise = taggifier.process('<html><body>42\r\n42</body></html>')

      return htmlPromise.should.become('<html><body><div id="b_0" class="a">42</div><div id="b_1" class="a">&nbsp;</div><div id="b_2" class="a">42</div></body></html>')
    })

    it('should handle multiple spaces at the start', function() {
      var htmlPromise = taggifier.process('<html><body>  42</body></html>')

      return htmlPromise.should.become('<html><body><div id="b_0" class="a">&nbsp;</div><div id="b_1" class="a">42</div></body></html>')
    })

    it('should handle multiple spaces between words', function() {
      var htmlPromise = taggifier.process('<html><body>42  42</body></html>')

      return htmlPromise.should.become('<html><body><div id="b_0" class="a">42</div><div id="b_1" class="a">&nbsp;</div><div id="b_2" class="a">42</div></body></html>')
    })

    it('should handle multiple spaces at the end', function() {
      var htmlPromise = taggifier.process('<html><body>42  </body></html>')

      return htmlPromise.should.become('<html><body><div id="b_0" class="a">42</div><div id="b_1" class="a">&nbsp;</div></body></html>')
    })

    it('should handle html escape sequences', function() {
      var htmlPromise = taggifier.process('<html><body>This &lt; and that &gt;</body></html>')

      return htmlPromise.should.become('<html><body><div id="b_0" class="a">This</div><div id="b_1" class="a">&nbsp;</div><div id="b_2" class="a">&lt;</div><div id="b_3" class="a">&nbsp;</div><div id="b_4" class="a">and</div><div id="b_5" class="a">&nbsp;</div><div id="b_6" class="a">that</div><div id="b_7" class="a">&nbsp;</div><div id="b_8" class="a">&gt;</div></body></html>')
    })
  })
})