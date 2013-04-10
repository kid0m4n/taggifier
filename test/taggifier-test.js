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

      return htmlPromise.should.become('<html><body><div id="b_0" class="a">This</div><div id="b_1" class="a"> </div><div id="b_2" class="a">is</div><div id="b_3" class="a"> </div><div id="b_4" class="a">so</div><div id="b_5" class="a"> </div><div id="b_6" class="a">cool</div></body></html>')
    })

    it('should traverse elements surrounded by text', function() {
      var htmlPromise = taggifier.process('<html><body>This is <em>so</em> cool</body></html>')

      return htmlPromise.should.become('<html><body><div id="b_0" class="a">This</div><div id="b_1" class="a"> </div><div id="b_2" class="a">is</div><div id="b_3" class="a"> </div><em><div id="b_4" class="a">so</div></em><div id="b_5" class="a"> </div><div id="b_6" class="a"> </div><div id="b_7" class="a">cool</div></body></html>')
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
  })
})